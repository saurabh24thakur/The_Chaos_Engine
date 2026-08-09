import chatGraph from "./chat.graph.js";
import codingGraph from "./coding.graph.js";
import pptGraph from "./ppt.graph.js";
import searchGraph from "./search.graph.js";

class GraphRegistry {

    static getGraph(workspace) {

        switch (workspace) {

            case "chat":
                return chatGraph;

            case "search":
                return searchGraph;
            
             case "coding":
                return codingGraph;

            case "ppt":
                return pptGraph;

            default:
                throw new Error(
                    `Workspace '${workspace}' not found.`
                );

        }

    }

}

export default GraphRegistry;
