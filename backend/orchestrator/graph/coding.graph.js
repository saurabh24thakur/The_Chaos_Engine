import {
    StateGraph,
    START,
    END,
} from "@langchain/langgraph";

import { ChatState } from "./state.js";

import {
    codingAgent,
} from "../agent/coding.agent.js";


const builder =
    new StateGraph(ChatState);


builder.addNode(
    "codingAgent",
    codingAgent
);


builder.addEdge(
    START,
    "codingAgent"
);


builder.addEdge(
    "codingAgent",
    END
);


const codingGraph =
    builder.compile();


export default codingGraph;