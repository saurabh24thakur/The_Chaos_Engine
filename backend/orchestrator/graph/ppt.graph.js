import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { pptNode } from "./agent/ppt.agent.js";

const builder = new StateGraph(AgentState);

builder.addNode("ppt", pptNode);

builder.addEdge(START, "ppt");

builder.addEdge("ppt", END);

const pptGraph = builder.compile();

export default pptGraph;