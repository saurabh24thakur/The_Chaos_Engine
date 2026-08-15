import ProviderManager from "../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../services/chat.client.js";

import {
    createPresentationArtifact,
} from "../services/ppt.service.js";

const PPT_SYSTEM_PROMPT =
    `You are a presentation planner.

Return ONLY valid JSON with this exact shape:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": [
        "Bullet one",
        "Bullet two",
        "Bullet three"
      ]
    }
  ]
}

Rules:
- Output JSON only.
- No markdown fences.
- No extra commentary.
- Keep slides concise, clear, and presentation-ready.
- Every slide must have a title and a non-empty content array.`;

function extractJson(text) {
    if (typeof text !== "string") {
        return null;
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1] || text;

    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }
}

function normalizePresentation(payload, fallbackTitle) {
    const title = String(payload?.title || fallbackTitle || "Presentation").trim();

    const slides = Array.isArray(payload?.slides)
        ? payload.slides
            .map((slide) => ({
                title: String(slide?.title || "").trim(),
                content: Array.isArray(slide?.content)
                    ? slide.content
                        .map((item) => String(item || "").trim())
                        .filter(Boolean)
                    : [],
            }))
            .filter((slide) => slide.title && slide.content.length > 0)
        : [];

    return {
        title,
        slides,
    };
}

export async function pptAgent(state, config) {

    try {

        const {
            chatId,
            prompt,
            workspace,
        } = state;

        if (!chatId) {
            throw new Error("chatId is required.");
        }

        if (!prompt) {
            throw new Error("prompt is required.");
        }

        await saveMessage(chatId, "user", prompt);

        const history =
            await getMessages(chatId);

        const conversation =
            Array.isArray(history) && history.length > 0
                ? history
                : [{
                    role: "user",
                    content: prompt,
                }];

        const {
            provider,
            model,
        } = await ProviderManager.getProvider({
            workspace,
            provider: state.provider,
            model: state.model,
            apiKey: state.apiKey,
        });

        const messages = [
            {
                role: "system",
                content: PPT_SYSTEM_PROMPT,
            },
            ...conversation,
        ];

        if (config?.writer) {
            config.writer({
                type: "status",
                phase: "planning",
                message: "Planning presentation structure...",
            });
        }

        const responseText = await provider.generate({
            model,
            messages,
        });

        const parsed = extractJson(responseText);

        if (!parsed) {
            throw new Error("The PPT model returned invalid JSON.");
        }

        const presentation = normalizePresentation(parsed, prompt);

        if (presentation.slides.length === 0) {
            throw new Error("The presentation must contain at least one valid slide.");
        }

        if (config?.writer) {
            config.writer({
                type: "status",
                phase: "rendering",
                message: "Building the PowerPoint file...",
            });
        }

        const artifact =
            await createPresentationArtifact(presentation);

        const assistantSummary =
            `Presentation ready: ${artifact.fileName}`;

        await saveMessage(
            chatId,
            "assistant",
            assistantSummary,
            {
                type: "pptx",
                title: presentation.title,
                fileName: artifact.fileName,
                downloadUrl: artifact.downloadUrl,
                slideCount: artifact.slideCount,
            }
        );

        if (config?.writer) {
            config.writer({
                type: "artifact",
                artifact: {
                    type: "pptx",
                    title: presentation.title,
                    fileName: artifact.fileName,
                    downloadUrl: artifact.downloadUrl,
                    slideCount: artifact.slideCount,
                },
            });
        }

        const {
            apiKey,
            provider: providerName,
            model: selectedModel,
            ...safeState
        } = state;

        return {
            ...safeState,
            response: assistantSummary,
            artifact: {
                type: "pptx",
                title: presentation.title,
                fileName: artifact.fileName,
                downloadUrl: artifact.downloadUrl,
                slideCount: artifact.slideCount,
            },
        };

    } catch (error) {

        console.error(
            "PPT Agent Error:",
            error
        );

        const {
            apiKey,
            provider,
            model,
            ...safeState
        } = state;

        return {
            ...safeState,
            error: error.message,
        };

    }

}
