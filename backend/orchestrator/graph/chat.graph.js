import {
    START,
    END,
    StateGraph
} from "@langchain/langgraph";

import { ChatState } from "./state.js";

import { chatNode } from "../agent/chat.agent.js";

const builder = new StateGraph(ChatState);

builder.addNode("chat", chatNode);

builder.addEdge(START, "chat");

builder.addEdge("chat", END);

const graph = builder.compile();

export default graph;