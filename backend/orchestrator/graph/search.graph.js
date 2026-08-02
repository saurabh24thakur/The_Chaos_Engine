import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { searchNode } from "./agent/search.agent.js";

const builder = new StateGraph(AgentState);

builder.addNode("search", searchNode);

builder.addEdge(START, "search");

builder.addEdge("search", END);

const searchGraph = builder.compile();

export default searchGraph;