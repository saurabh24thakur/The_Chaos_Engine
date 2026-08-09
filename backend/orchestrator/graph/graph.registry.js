import chatGraph from "./chat.graph.js";
import searchGraph from "./search.graph.js";

class GraphRegistry {

    static getGraph(workspace) {

        switch (workspace) {

            case "chat":
                return chatGraph;

            case "search":
                return searchGraph;

            default:
                throw new Error(
                    `Workspace '${workspace}' not found.`
                );

        }

    }

}

export default GraphRegistry;
