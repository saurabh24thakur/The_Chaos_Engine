import {
    StateGraph,
    START,
    END,
} from "@langchain/langgraph";

import { ChatState } from "./state.js";

import {
    pptAgent,
} from "../agent/ppt.agent.js";

const builder =
    new StateGraph(ChatState);

builder.addNode(
    "pptAgent",
    pptAgent
);

builder.addEdge(
    START,
    "pptAgent"
);

builder.addEdge(
    "pptAgent",
    END
);

const pptGraph =
    builder.compile();

export default pptGraph;