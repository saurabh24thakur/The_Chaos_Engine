import { searchAgent } from "../../agent/search.agent.js";

export async function searchTool(state, config) {
    return searchAgent(state, config);
}

