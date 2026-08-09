import {
    StateGraph,
    START,
    END,
} from "@langchain/langgraph";

import { ChatState } from "./state.js";
import { searchAgent } from "../agent/search.agent.js";


const builder =
    new StateGraph(ChatState);


builder.addNode(
    "searchAgent",
    searchAgent
);

builder.addEdge(
    START,
    "searchAgent"
);

builder.addEdge(
    "searchAgent",
    END
);


const searchGraph =
    builder.compile();


export default searchGraph;
