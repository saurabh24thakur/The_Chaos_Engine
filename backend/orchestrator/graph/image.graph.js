import { START, END, StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { imageNode } from "./agent/image.agent.js";

const builder = new StateGraph(AgentState);

builder.addNode("image", imageNode);

builder.addEdge(START, "image");

builder.addEdge("image", END);

const imageGraph = builder.compile();

export default imageGraph;