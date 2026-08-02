import { StateGraph, START, END } from "@langchain/langgraph";

import { ChatState } from "./state.js";
import { chatAgent } from "./agent/chat.agent.js";

const builder = new StateGraph(ChatState);

builder.addNode("chatAgent", chatAgent);

builder.addEdge(START, "chatAgent");

builder.addEdge("chatAgent", END);

const chatGraph = builder.compile();

export default chatGraph;