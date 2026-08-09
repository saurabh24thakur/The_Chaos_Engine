import axios from "axios";

import env from "../config/env.js";

class SearchClient {

    constructor() {
        this.apiUrl = "https://api.tavily.com/search";
    }

    async search(query, options = {}) {
        if (!env.SEARCH_API_KEY) {
            throw new Error(
                "SEARCH_API_KEY is missing. Add it to backend/orchestrator/.env"
            );
        }

        if (!query || typeof query !== "string") {
            throw new Error("Search query is required.");
        }

        const response = await axios.post(
            this.apiUrl,
            {
                api_key: env.SEARCH_API_KEY,
                query,
                max_results: options.maxResults ?? 5,
                search_depth: options.searchDepth ?? "advanced",
                include_answer: false,
                include_raw_content: false,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            }
        );

        const results = Array.isArray(response.data?.results)
            ? response.data.results.map((item) => ({
                title: item.title || "",
                url: item.url || "",
                content: item.content || item.snippet || "",
                score: item.score,
            }))
            : [];

        return {
            query,
            results,
        };
    }

}

export default new SearchClient();
