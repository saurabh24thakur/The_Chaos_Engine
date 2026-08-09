import ProviderManager from "../provider/provider.manager.js";

import {
    getMessages,
    saveMessage,
} from "../services/chat.client.js";

import {
    listFiles,
    readFile,
    writeFile,
} from "../graph/tools/coding.tool.js";

const CODING_SYSTEM_PROMPT =
    "You are an expert software engineer. Help the user solve programming problems, debug code, explain concepts, and write clean, production-quality code. When providing code, use appropriate code blocks.";

const CODING_PLANNER_PROMPT = `
Decide whether the user's request needs repository file tools.

Return ONLY valid JSON in one of these forms:
1. {"mode":"answer"}
2. {"mode":"tool","steps":[{"tool":"listFiles","args":{"path":"."}}]}
3. {"mode":"tool","steps":[{"tool":"readFile","args":{"path":"backend/orchestrator/graph/coding.graph.js"}}]}
4. {"mode":"tool","steps":[{"tool":"writeFile","args":{"path":"relative/file.txt","content":"..."}}]}

Rules:
- Use tools only when the user wants to inspect, create, or modify project files.
- Use "answer" for general coding help, algorithms, explanations, and code generation.
- You may include multiple tool steps when needed.
- Do not output markdown or commentary.`;

function extractJson(text) {
    if (typeof text !== "string") {
        return null;
    }

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }
}

function buildCodingMessages(history, extraSystem = CODING_SYSTEM_PROMPT) {
    return [
        {
            role: "system",
            content: extraSystem,
        },
        ...history,
    ];
}

async function runCodingToolStep(step) {
    const toolName = step?.tool || step?.operation;
    const args = step?.args || {};

    switch (toolName) {
        case "readFile":
            return {
                tool: "readFile",
                args,
                result: await readFile(args.path || args.filePath),
            };

        case "writeFile":
            return {
                tool: "writeFile",
                args,
                result: await writeFile(
                    args.path || args.filePath,
                    args.content
                ),
            };

        case "listFiles":
            return {
                tool: "listFiles",
                args,
                result: await listFiles(args.path || args.directory || "."),
            };

        default:
            throw new Error(`Unsupported coding tool: ${toolName}`);
    }
}

function formatToolResults(toolRuns) {
    return toolRuns
        .map((run) => {
            return JSON.stringify(run, null, 2);
        })
        .join("\n\n");
}

export async function codingAgent(state, config) {
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

        const {
            provider,
            model,
        } = ProviderManager.getProvider(workspace);

        const planMessages = buildCodingMessages(
            history,
            CODING_PLANNER_PROMPT
        );

        const planText = await provider.generate({
            model,
            messages: planMessages,
        });

        const plan = extractJson(planText) || {
            mode: "answer",
        };

        let finalMessages = buildCodingMessages(history);

        if (
            plan.mode === "tool" &&
            Array.isArray(plan.steps) &&
            plan.steps.length > 0
        ) {
            const toolRuns = [];

            for (const step of plan.steps) {
                const run = await runCodingToolStep(step);
                toolRuns.push(run);
            }

            finalMessages = [
                {
                    role: "system",
                    content:
                        `${CODING_SYSTEM_PROMPT}\n\n` +
                        `Use the following tool results to answer the user's request.\n\n` +
                        formatToolResults(toolRuns),
                },
                ...history,
            ];
        }

        let answer = "";
        const writer = config?.writer;

        if (writer) {
            const stream = provider.stream({
                model,
                messages: finalMessages,
            });

            for await (const chunk of stream) {
                answer += chunk;
                writer({
                    type: "token",
                    content: chunk,
                });
            }
        } else {
            answer = await provider.generate({
                model,
                messages: finalMessages,
            });
        }

        await saveMessage(chatId, "assistant", answer);

        return {
            ...state,
            response: answer,
        };
    } catch (error) {
        console.error("Coding Agent Error:", error);

        return {
            ...state,
            error: error.message,
        };
    }
}

