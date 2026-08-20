import ProviderManager from "../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../services/chat.client.js";

import {
    createPresentationArtifact,
} from "../services/ppt.service.js";

const PPT_SYSTEM_PROMPT =
    `You are a presentation planner and content architect for a professional PowerPoint generator.

Your task is to plan and generate a presentation based on the user's request.
Before generating the slides, you must create a presentation plan. The plan determines the title, overall theme, slide count, and for each slide, its type, purpose, key content, and appropriate visual representation.

MANDATORY LAYOUT SELECTION RULES (VISUAL INTELLIGENCE):
- Opening slide → title layout (visualType: hero)
- Processes, steps, workflows → process layout (visualType: process)
- Sequential workflows, pipelines → flowchart layout (visualType: flowchart)
- Software/system architecture, integrations, components → architecture layout (visualType: architecture)
- Comparing two concepts, pros/cons, A vs B → comparison layout (visualType: comparison)
- Multiple independent concepts, tools, ecosystem, features → cards layout (visualType: cards)
- Chronological timeline, history, milestones, journey → timeline layout (visualType: timeline)
- Metrics, statistics, percentages, ROI, numbers → statistics layout (visualType: statistics)
- Hierarchical or generic relational concepts → diagram layout (visualType: diagram)
- Simple bullet list or explanation (only if others do not apply) → bullets layout (visualType: bullets)
- Final slide → conclusion layout (visualType: conclusion)

Do NOT use bullets for every slide. Intentionally vary layouts across slides based on the content meaning.

Supported layouts and their specific visualData structure:

1. title (visualType: "hero" or "title")
   - visualData: { "subtitle": "...", "highlights": ["Highlight 1", "Highlight 2"] }
2. bullets (visualType: "bullets")
   - visualData: { "bullets": ["...", "..."] }
3. two_column (visualType: "two_column")
   - visualData: { "leftTitle": "...", "leftBullets": ["..."], "rightTitle": "...", "rightBullets": ["..."] }
4. comparison (visualType: "comparison")
   - List comparison visualData: { "leftTitle": "...", "leftPoints": ["..."], "rightTitle": "...", "rightPoints": ["..."], "summary": "..." }
   - Grid/Table comparison visualData: { "columns": ["Column 1", "Column 2"], "rows": [["Row 1 Cell 1", "Row 1 Cell 2"]], "summary": "..." }
5. process (visualType: "process")
   - visualData: { "steps": [{ "title": "Step 1", "description": "Description" }] }
6. timeline (visualType: "timeline")
   - visualData: { "items": [{ "year": "2026", "title": "Event Title", "description": "Description" }] }
7. flowchart (visualType: "flowchart")
   - visualData: { "components": [{ "id": "c1", "label": "Step 1", "type": "box", "x": 1.5, "y": 5.0 }], "connections": [{ "from": "c1", "to": "c2", "label": "next" }] }
8. architecture (visualType: "architecture")
   - visualData: { "components": [{ "id": "client", "label": "Client App", "type": "client", "x": 1.5, "y": 5.0 }], "connections": [{ "from": "client", "to": "api", "label": "HTTP" }] }
9. cards (visualType: "cards")
   - visualData: { "cards": [{ "title": "Card Title", "description": "Description" }] }
10. statistics (visualType: "statistics")
    - visualData: { "stats": [{ "value": "99.9%", "label": "Uptime SLA", "detail": "Guaranteed" }] }
11. diagram (visualType: "diagram")
    - visualData: { "components": [{ "id": "n1", "label": "Node", "type": "box", "x": 5.0, "y": 5.0 }], "connections": [] }
12. conclusion (visualType: "conclusion")
    - visualData: { "keyTakeaways": ["Takeaway 1", "Takeaway 2"] }

IMPORTANT rules for text formatting:
- Do NOT output any markdown tags (like **, *, #) inside the JSON string values. Clean plain text only. For example, use "Jenkins" instead of "**Jenkins**".
- For diagrams, flowcharts, or architecture: specify actual components (with id, label, type, and coordinates x/y from 0 to 10) and connections (with from, to, and optional label). Types of components: client, server, gateway, database, cloud, browser, box.
- Do NOT generate fake statistics. If there is no real numerical data, use another visual layout.

Return ONLY a valid JSON object in this shape:
{
  "plan": {
    "title": "Presentation Title",
    "theme": "modern",
    "slideCount": 6,
    "outline": [
      {
        "slideNumber": 1,
        "layout": "title",
        "visualType": "hero",
        "purpose": "Introduce the topic and key highlights"
      }
    ]
  },
  "presentation": {
    "title": "Presentation Title",
    "theme": "modern",
    "slides": [
      {
        "slideNumber": 1,
        "title": "Presentation Title",
        "layout": "title",
        "content": [],
        "visualType": "hero",
        "visualData": {
          "subtitle": "Subtitle text describing the topic",
          "highlights": ["Highlight 1", "Highlight 2"]
        }
      }
    ]
  }
}`;

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

function cleanText(value) {
    return String(value || "")
        .replace(/\uFEFF/g, "")
        .trim();
}

function stripFormatting(value) {
    return cleanText(value)
        .replace(/^\*\*(.*)\*\*$/, "$1")
        .replace(/^["'`]+|["'`]+$/g, "")
        .trim();
}

function getSlideType(layout, visualType) {
    const type = cleanText(layout || "").toLowerCase();
    const vType = cleanText(visualType || "").toLowerCase();

    // Map layout/visualType to internal types
    if (type === "title" || type === "hero" || vType === "hero" || vType === "title") return "title";
    if (type === "conclusion" || type === "summary" || vType === "conclusion" || vType === "summary") return "summary";
    if (type === "statistics" || type === "stats" || vType === "statistics" || vType === "stats") return "stats";

    const validTypes = [
        "title",
        "section",
        "bullets",
        "two_column",
        "cards",
        "comparison",
        "process",
        "timeline",
        "architecture",
        "flowchart",
        "diagram",
        "chart",
        "quote",
        "summary",
        "imagetext",
    ];

    if (validTypes.includes(type)) return type;
    if (validTypes.includes(vType)) return vType;

    return "";
}

function normalizeList(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => cleanText(item))
        .filter(Boolean);
}

function normalizeCards(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((card, index) => ({
            title: cleanText(card?.title || card?.label || `Card ${index + 1}`),
            description: cleanText(card?.description || card?.text || card?.body || ""),
        }))
        .filter((card) => card.title || card.description);
}

function normalizeStats(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((stat, index) => ({
            value: cleanText(stat?.value || stat?.number || ""),
            label: cleanText(stat?.label || stat?.title || `Metric ${index + 1}`),
            detail: cleanText(stat?.detail || stat?.description || ""),
        }))
        .filter((stat) => stat.value || stat.label || stat.detail);
}

function normalizeTimeline(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item, index) => ({
            year: cleanText(item?.year || item?.label || item?.step || `Step ${index + 1}`),
            title: cleanText(item?.title || item?.heading || ""),
            description: cleanText(item?.description || item?.text || ""),
        }))
        .filter((item) => item.year || item.title || item.description);
}

function normalizeStructuredSlide(slide, index, fallbackTitle) {
    // Merge visualData if present
    const data = {
        ...slide,
        ...(slide?.visualData || {})
    };

    const type = getSlideType(data.layout || data.type, data.visualType) || (index === 0 ? "title" : "bullets");
    const title = cleanText(data.title || data.heading || data.name || fallbackTitle || "");
    const subtitle = cleanText(data.subtitle || data.subTitle || data.description || "");
    const bullets = normalizeList(data.bullets || data.content || data.points || data.items || []);

    switch (type) {
        case "title":
            return {
                type: "title",
                title: title || fallbackTitle,
                subtitle: subtitle || bullets[0] || "",
                highlights: normalizeList(data.highlights || data.callouts || bullets.slice(0, 3)).slice(0, 3),
            };
        case "section":
            return {
                type: "section",
                title: title || fallbackTitle,
                subtitle: subtitle || bullets[0] || "",
            };
        case "two_column":
            return {
                type: "two_column",
                title: title || fallbackTitle,
                subtitle,
                leftTitle: cleanText(data.leftTitle || "Option A"),
                leftBullets: normalizeList(data.leftBullets || data.leftPoints || []),
                rightTitle: cleanText(data.rightTitle || "Option B"),
                rightBullets: normalizeList(data.rightBullets || data.rightPoints || []),
            };
        case "cards":
            return {
                type: "cards",
                title: title || fallbackTitle,
                subtitle,
                cards: normalizeCards(data.cards || data.items || data.blocks || bullets),
                bullets,
            };
        case "comparison":
            return {
                type: "comparison",
                title: title || fallbackTitle,
                subtitle,
                leftTitle: cleanText(data.leftTitle || data.left?.title || "Option A"),
                rightTitle: cleanText(data.rightTitle || data.right?.title || "Option B"),
                leftPoints: normalizeList(data.leftPoints || data.left?.points),
                rightPoints: normalizeList(data.rightPoints || data.right?.points),
                columns: normalizeList(data.columns || []),
                rows: Array.isArray(data.rows) ? data.rows.map(row => normalizeList(row)) : [],
                summary: cleanText(data.summary || data.verdict || ""),
                bullets,
            };
        case "process":
            return {
                type: "process",
                title: title || fallbackTitle,
                subtitle,
                steps: Array.isArray(data.steps || data.items)
                    ? (data.steps || data.items).map((step, idx) => ({
                        title: cleanText(step?.title || step?.label || `Step ${idx + 1}`),
                        description: cleanText(step?.description || step?.text || ""),
                    }))
                    : bullets.map((b, idx) => {
                        const parts = b.split(/[:\-–—]\s*/);
                        return {
                            title: cleanText(parts.shift() || `Step ${idx + 1}`),
                            description: cleanText(parts.join(": ") || b),
                        };
                    }),
            };
        case "timeline":
            return {
                type: "timeline",
                title: title || fallbackTitle,
                subtitle,
                items: normalizeTimeline(data.timeline || data.items || data.milestones || bullets),
                bullets,
            };
        case "architecture":
        case "flowchart":
        case "diagram":
            return {
                type,
                title: title || fallbackTitle,
                subtitle,
                components: Array.isArray(data.components)
                    ? data.components.map((comp, idx) => ({
                        id: cleanText(comp?.id || `comp-${idx}`),
                        label: cleanText(comp?.label || comp?.name || ""),
                        type: cleanText(comp?.type || "box"),
                        x: comp?.x !== undefined ? parseFloat(comp.x) : undefined,
                        y: comp?.y !== undefined ? parseFloat(comp.y) : undefined,
                    }))
                    : [],
                connections: Array.isArray(data.connections)
                    ? data.connections.map((conn) => ({
                        from: cleanText(conn?.from || ""),
                        to: cleanText(conn?.to || ""),
                        label: cleanText(conn?.label || ""),
                    }))
                    : [],
            };
        case "chart":
            return {
                type: "chart",
                title: title || fallbackTitle,
                subtitle,
                chartType: cleanText(data.chartType || "bar"),
                categories: normalizeList(data.categories || []),
                data: Array.isArray(data.data) ? data.data.map(Number) : [],
                metricName: cleanText(data.metricName || "Value"),
            };
        case "quote":
            return {
                type: "quote",
                title: title || fallbackTitle,
                quote: cleanText(data.quote || data.text || ""),
                author: cleanText(data.author || data.by || "Unknown"),
            };
        case "summary":
            return {
                type: "summary",
                title: title || fallbackTitle,
                subtitle,
                keyTakeaways: normalizeList(data.keyTakeaways || data.takeaways || bullets),
            };
        case "imagetext":
            return {
                type: "imageText",
                title: title || fallbackTitle,
                subtitle,
                text: cleanText(data.text || data.summary || bullets[0] || ""),
                bullets,
                imageUrl: cleanText(data.imageUrl || data.image || data.imagePath || ""),
                imageAlt: cleanText(data.imageAlt || data.alt || data.imagePrompt || ""),
            };
        case "bullets":
        default:
            return {
                type: "bullets",
                title: title || fallbackTitle,
                subtitle,
                bullets,
            };
    }
}

function parseBulletLine(line) {
    return cleanText(line)
        .replace(/^[*-+]\s+/, "")
        .replace(/^\d+[\.\)]\s+/, "")
        .trim();
}

function parseOutlinePresentation(text, fallbackTitle) {
    const lines = String(text || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return null;
    }

    let title = "";
    const slides = [];
    let currentSlide = null;
    let inContent = false;

    const pushSlide = () => {
        if (currentSlide && currentSlide.title) {
            slides.push(currentSlide);
        }
        currentSlide = null;
        inContent = false;
    };

    for (const rawLine of lines) {
        const line = stripFormatting(rawLine);

        const titleMatch = line.match(/^title:\s*(.+)$/i);
        if (titleMatch && !title) {
            title = stripFormatting(titleMatch[1]);
            continue;
        }

        const slideMatch = line.match(/^slide\s*\d*\s*:\s*(.*)$/i);
        if (slideMatch) {
            pushSlide();
            currentSlide = {
                title: stripFormatting(slideMatch[1]),
                content: [],
            };
            continue;
        }

        const slideTitleMatch = line.match(/^slide\s*title:\s*(.+)$/i);
        if (slideTitleMatch && currentSlide) {
            currentSlide.title = stripFormatting(slideTitleMatch[1]);
            continue;
        }

        if (/^content:$/i.test(line)) {
            inContent = true;
            continue;
        }

        if (/^bullet points?:$/i.test(line)) {
            inContent = true;
            continue;
        }

        if (!title && !currentSlide) {
            title = stripFormatting(line);
            continue;
        }

        if (currentSlide) {
            if (inContent) {
                const bullet = parseBulletLine(line);
                if (bullet) {
                    currentSlide.content.push(bullet);
                    continue;
                }
            }

            if (!currentSlide.title) {
                currentSlide.title = stripFormatting(line);
                continue;
            }

            const bullet = parseBulletLine(line);
            if (bullet) {
                currentSlide.content.push(bullet);
            }
        }
    }

    pushSlide();

    if (!title) {
        title = fallbackTitle;
    }

    if (slides.length === 0) {
        return null;
    }

    return normalizePresentation({ title, slides }, fallbackTitle);
}

function normalizePresentation(payload, fallbackTitle) {
    const title = cleanText(payload?.title || fallbackTitle || "Presentation");
    const theme = cleanText(payload?.theme || "modern").toLowerCase() || "modern";
    const slides = Array.isArray(payload?.slides)
        ? payload.slides.map((slide, index) => normalizeStructuredSlide(slide, index, title))
        : [];

    return {
        title,
        theme,
        slides,
    };
}

function parsePresentationResponse(text, fallbackTitle) {
    let jsonPayload = extractJson(text);

    if (jsonPayload) {
        // If two-level JSON with planning is returned, extract the presentation part
        const extracted = jsonPayload.presentation ? jsonPayload.presentation : jsonPayload;
        const normalized = normalizePresentation(extracted, fallbackTitle);
        if (normalized.slides.length > 0) {
            // Attach the plan if present so pptAgent can use/log it
            if (jsonPayload.plan) {
                normalized.plan = jsonPayload.plan;
            }
            return normalized;
        }
    }

    const outlinePayload = parseOutlinePresentation(text, fallbackTitle);
    if (outlinePayload) {
        return outlinePayload;
    }

    return null;
}

async function repairPresentationResponse(provider, model, rawText, prompt) {
    const repairMessages = [
        {
            role: "system",
            content:
                "Convert the provided presentation draft into the exact JSON schema. Return JSON only. No markdown.",
        },
        {
            role: "user",
            content:
                `User prompt:\n${prompt}\n\nDraft response:\n${rawText}\n\nReturn valid JSON with title and slides only.`,
        },
    ];

    return await provider.generate({
        model,
        messages: repairMessages,
    });
}

function sanitizeConversation(history, fallbackPrompt) {
    if (!Array.isArray(history) || history.length === 0) {
        return [{
            role: "user",
            content: fallbackPrompt,
        }];
    }

    return history
        .map((message) => ({
            role: String(message?.role || "").trim(),
            content: String(message?.content || "").trim(),
        }))
        .filter((message) => message.role && message.content);
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

        const history = await getMessages(chatId);
        const conversation = sanitizeConversation(history, prompt);

        const { provider, model } = await ProviderManager.getProvider({
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

        let parsed = parsePresentationResponse(responseText, prompt);

        if (!parsed) {
            const repairedText =
                await repairPresentationResponse(provider, model, responseText, prompt);

            parsed = parsePresentationResponse(repairedText, prompt);
        }

        if (!parsed) {
            throw new Error("The PPT model returned invalid presentation data.");
        }

        const presentation = parsed;

        if (presentation.slides.length === 0) {
            throw new Error("The presentation must contain at least one valid slide.");
        }

        if (config?.writer) {
            let msg = "Building the PowerPoint file...";
            if (presentation.plan) {
                const planTitle = presentation.plan.title || presentation.title;
                const count = presentation.plan.slideCount || presentation.slides.length;
                msg = `Generated Plan: "${planTitle}" with ${count} slides. Building PowerPoint file...`;
            }
            config.writer({
                type: "status",
                phase: "rendering",
                message: msg,
            });
        }

        const artifact = await createPresentationArtifact(presentation);

        const assistantText = `Presentation ready: ${artifact.fileName}`;
        const assistantArtifact = {
            type: "pptx",
            title: presentation.title,
            fileName: artifact.fileName,
            downloadUrl: artifact.downloadUrl,
            slideCount: artifact.slideCount,
        };

        await saveMessage(
            chatId,
            "assistant",
            assistantText,
            assistantArtifact
        );

        if (config?.writer) {
            config.writer({
                type: "artifact",
                artifact: assistantArtifact,
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
            response: assistantText,
            artifact: assistantArtifact,
        };
    } catch (error) {
        console.error("PPT Agent Error:", error);
        if (state.chatId) {
            try {
                await saveMessage(state.chatId, "assistant", `Error: ${error.message}`);
            } catch (e) {}
        }
        throw error;
    }
}
