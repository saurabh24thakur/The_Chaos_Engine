import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { pdfNode } from "./agent/pdf.agent.js";

const builder = new StateGraph(AgentState);

builder.addNode("pdf", pdfNode);

builder.addEdge(START, "pdf");

builder.addEdge("pdf", END);

const pdfGraph = builder.compile();

export default pdfGraph;