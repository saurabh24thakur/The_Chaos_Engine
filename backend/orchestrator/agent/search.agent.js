import ProviderManager from "../provider/provider.manager.js";
import {
    saveMessage,
} from "../services/chat.client.js";
import searchClient from "../services/search.client.js";

function formatSearchResults(results) {
    if (!Array.isArray(results) || results.length === 0) {
        return "No search results were found.";
    }

    return results
        .map((result, index) => {
            const title = result.title || `Result ${index + 1}`;
            const url = result.url ? `URL: ${result.url}` : "";
            const content = result.content || "";

            return [
                `${index + 1}. ${title}`,
                url,
                content,
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\n\n");
}

export async function searchAgent(state, config) {
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

        await saveMessage(
            chatId,
            "user",
            prompt
        );

        const { results } = await searchClient.search(prompt, {
            maxResults: 5,
            searchDepth: "advanced",
        });

        const searchResultsText = formatSearchResults(results);

        const {
            provider,
            model,
        } = ProviderManager.getProvider(
            workspace === "search" ? "search" : workspace
        );

        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful AI assistant. Answer the user's question using the provided web search results. Do not invent information. If the results are insufficient, say so.",
            },
            {
                role: "user",
                content: `${prompt}\n\nSearch Results:\n${searchResultsText}`,
            },
        ];

        let answer = "";
        const writer = config?.writer;

        if (writer) {
            const stream = provider.stream({
                model,
                messages,
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
                messages,
            });
        }

        await saveMessage(
            chatId,
            "assistant",
            answer
        );

        return {
            ...state,
            response: answer,
            searchResults: results,
        };
    } catch (error) {
        console.error("Search Agent Error:", error);
        throw error;
    }
}

