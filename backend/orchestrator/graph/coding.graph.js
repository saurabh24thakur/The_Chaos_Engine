import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { codingNode } from "./agent/coding.agent.js";

const builder = new StateGraph(AgentState);

builder.addNode("coding", codingNode);

builder.addEdge(START, "coding");

builder.addEdge("coding", END);

const codingGraph = builder.compile();

export default codingGraph;