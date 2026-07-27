import chatGraph from "./chat.graph.js";

class GraphRegistry {

    static getGraph(workspace) {

        switch (workspace) {

            case "chat":
                return chatGraph;

            default:
                throw new Error(
                    `Workspace '${workspace}' not found.`
                );

        }

    }

}

export default GraphRegistry;