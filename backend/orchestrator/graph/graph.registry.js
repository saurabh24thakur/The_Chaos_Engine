import chatGraph from "./chat.graph.js";

class GraphRegistry {

    constructor() {

        this.graphs = {

            chat: chatGraph,

        };

    }

    getGraph(workspace) {

        const graph = this.graphs[workspace];

        if (!graph) {

            throw new Error(

                `Graph '${workspace}' not found.`

            );

        }

        return graph;

    }

}

export default new GraphRegistry();