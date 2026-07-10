"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Code,
  FileText,
  Presentation,
  Image as ImageIcon,
  Globe,
  Cpu,
  Send,
  User,
  Sparkles,
  ArrowRight,
  Workflow,
  Download,
  Search,
  Clock,
  Coins,
} from "lucide-react";

export default function Container() {
  const [activeAgent, setActiveAgent] = useState("qtpi");
  const [inputText, setInputText] = useState("");
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestratorStep, setOrchestratorStep] = useState(0);

  // Define the 7 agents from the architecture diagram
  const agents = [
    {
      id: "qtpi",
      name: "QTPI",
      subtitle: "Chief Intelligence Agent",
      icon: Cpu,
      color: "text-brand-cyan",
      bgGlow: "rgba(6, 182, 212, 0.08)",
      desc: "Orchestrates multi-agent pipelines and delegates sub-tasks.",
    },
    {
      id: "chat",
      name: "Chat",
      subtitle: "Conversational Agent",
      icon: MessageSquare,
      color: "text-blue-500",
      bgGlow: "rgba(59, 130, 246, 0.08)",
      desc: "Converses in natural language, gathers requirements, and refines ideas.",
    },
    {
      id: "coding",
      name: "Coding",
      subtitle: "Software Engineering",
      icon: Code,
      color: "text-purple-500",
      bgGlow: "rgba(168, 85, 247, 0.08)",
      desc: "Writes clean code, designs routers, and executes container diagnostics.",
    },
    {
      id: "pdf",
      name: "PDF",
      subtitle: "Document Ingestion",
      icon: FileText,
      color: "text-amber-500",
      bgGlow: "rgba(245, 158, 11, 0.08)",
      desc: "Parses complex documents, splits chunks, and indexes semantic embeddings.",
    },
    {
      id: "ppt",
      name: "PPT",
      subtitle: "Presentation builder",
      icon: Presentation,
      color: "text-emerald-500",
      bgGlow: "rgba(16, 185, 129, 0.08)",
      desc: "Structures slide designs, selects layouts, and outputs visual decks.",
    },
    {
      id: "image",
      name: "Image",
      subtitle: "Creative Swarm",
      icon: ImageIcon,
      color: "text-pink-500",
      bgGlow: "rgba(236, 72, 153, 0.08)",
      desc: "Generates high-fidelity UI templates, graphical layouts, and assets.",
    },
    {
      id: "search",
      name: "Search",
      subtitle: "Web Intelligence",
      icon: Globe,
      color: "text-teal-500",
      bgGlow: "rgba(20, 184, 166, 0.08)",
      desc: "Crawls web sources, parses documents, and checks API availability.",
    },
  ];

  // Specific message histories for each agent mode
  const initialMessages = {
    qtpi: [
      {
        sender: "user",
        text: "I need to build a SaaS dashboard app with user authentication and show a slide pitch to investors.",
      },
      {
        sender: "qtpi",
        text: "Understood. Initiating multi-agent orchestration tree. I will coordinate Coding, Search, and PPT agents to fulfill this request.",
        isOrchestrationLog: true,
      },
    ],
    chat: [
      {
        sender: "user",
        text: "Tell me the best strategies to scale a multi-agent system.",
      },
      {
        sender: "agent",
        text: "Scaling multi-agent architectures requires: 1. Loose coupling (event-driven messaging). 2. Shared semantic memory. 3. Decoupled compute sandboxes so agent runtimes do not block each other.",
      },
    ],
    coding: [
      {
        sender: "user",
        text: "Write a quick express server route for verifying user session tokens.",
      },
      {
        sender: "agent",
        text: `\`\`\`javascript\nconst express = require('express');\nconst router = express.Router();\n\nrouter.post('/verify', (req, res) => {\n  const token = req.headers.authorization;\n  if (!token) return res.status(401).json({ error: 'No token' });\n  // Token validation logic\n  res.json({ valid: true, user: 'admin' });\n});\n\`\`\``,
      },
    ],
    pdf: [
      {
        sender: "user",
        text: "Scan the attached user_agreement.pdf for privacy concerns.",
      },
      {
        sender: "agent",
        text: "PDF Loaded: user_agreement.pdf (12 Pages). Analysis shows: 1. Clause 4.2 details data retention. 2. Cookies are stored up to 365 days. Recommendation: Shorten session retention flags.",
      },
    ],
    ppt: [
      {
        sender: "user",
        text: "Generate a pitch deck structure for Chaos Engine.",
      },
      {
        sender: "agent",
        text: "Slide 1: Title (Chaos Engine - AI Agent OS)\nSlide 2: Problem (Orchestration is complex)\nSlide 3: Solution (Decoupled swarms)\nSlide 4: Architecture (User -> QTPI -> Specialized Subagents)\nSlide 5: Pricing Plan",
      },
    ],
    image: [
      {
        sender: "user",
        text: "Generate a modern landing page mock layout for Chaos Engine.",
      },
      {
        sender: "agent",
        text: "Generating visual layout coordinates. Grid background loaded. High contrast dark/light themes matched.",
        imageSrc: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
      },
    ],
    search: [
      {
        sender: "user",
        text: "Find the latest release version of next-themes package.",
      },
      {
        sender: "agent",
        text: "Query dispatched. Web search returned: next-themes is currently stable. Found 12 matching references. Embed cached.",
      },
    ],
  };

  const [chatHistory, setChatHistory] = useState(initialMessages);

  // Trigger orchestration simulation when in QTPI mode
  const startOrchestration = () => {
    if (isOrchestrating) return;
    setIsOrchestrating(true);
    setOrchestratorStep(0);

    // Sequence of steps representing user diagram architecture
    // User -> QTPI -> Subagents
  };

  useEffect(() => {
    if (isOrchestrating) {
      const interval = setInterval(() => {
        setOrchestratorStep((prev) => {
          if (prev >= 4) {
            clearInterval(interval);
            setIsOrchestrating(false);
            // Append final result message to QTPI history
            setChatHistory((curr) => ({
              ...curr,
              qtpi: [
                ...curr.qtpi,
                {
                  sender: "agent",
                  text: "All agent tasks resolved. Sandbox code generated in Coding Agent, documents indexed in Search Agent, and slides composed in PPT Agent. Your workspace is ready.",
                },
              ],
            }));
            return 4;
          }
          return prev + 1;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOrchestrating]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const userMsg = { sender: "user", text: inputText };
    setChatHistory((curr) => ({
      ...curr,
      [activeAgent]: [...curr[activeAgent], userMsg],
    }));

    setInputText("");

    // Simulate Agent response trigger
    setTimeout(() => {
      let replyText = `[${agents.find((a) => a.id === activeAgent).name} Agent] Processing your request: "${inputText}"...`;
      if (activeAgent === "coding") {
        replyText = `\`\`\`javascript\n// Solution for "${inputText}"\nexport function resolveTask() {\n  console.log("Processing...");\n}\n\`\`\``;
      }
      
      setChatHistory((curr) => ({
        ...curr,
        [activeAgent]: [
          ...curr[activeAgent],
          { sender: "agent", text: replyText },
        ],
      }));
    }, 1000);
  };

  const activeAgentDetails = agents.find((a) => a.id === activeAgent);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col gap-12">
      
      {/* Visual Title Header matching Diagram layout */}
      <div className="text-center max-w-3xl mx-auto mb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-brand-blue dark:text-brand-cyan">
          Interactive Agent Workspace
        </span>
        <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mt-3 mb-4 select-none">
          Multi-Agent Operating Chat Mode.
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Interact with **QTPI** (Chief Intelligence Agent) to orchestrate complex jobs, or direct subagents for coding, research, documents, slides, and search tasks.
        </p>
      </div>

      {/* Main Multi-Agent Chat Console */}
      <div className="w-full rounded-[32px] border border-border bg-card/40 backdrop-blur-md shadow-premium overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] items-stretch">
        
        {/* Left column: 7 Agents list */}
        <div className="lg:col-span-4 border-r border-border flex flex-col bg-muted/10">
          <div className="p-5 border-b border-border/80 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground tracking-wider uppercase">
              Agent Registry
            </span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {agents.map((agent) => {
              const Icon = agent.icon;
              const isSelected = activeAgent === agent.id;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    setActiveAgent(agent.id);
                    if (agent.id !== "qtpi") setIsOrchestrating(false);
                  }}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background shadow-lg scale-[1.01]"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className={`p-2 rounded-xl ${
                    isSelected ? "bg-background text-foreground" : "bg-card border border-border/60 text-foreground"
                  }`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold block truncate">{agent.name}</span>
                      {agent.id === "qtpi" && (
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          isSelected ? "bg-background/25 text-white" : "bg-brand-cyan/10 text-brand-cyan"
                        }`}>
                          Chief
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-75 truncate block mt-0.5 font-medium">
                      {agent.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Connected state badge */}
          <div className="p-4.5 border-t border-border bg-muted/20 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between select-none">
            <span className="flex items-center gap-1.5 font-medium">
              <Workflow className="h-3.5 w-3.5" /> Multi-Agent Linked
            </span>
            <span className="font-mono">Nodes: 7/7 Online</span>
          </div>
        </div>

        {/* Right column: Chat Console Window */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-card/10">
          
          {/* Console Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-muted/40 text-foreground`}>
                {(() => {
                  const Icon = activeAgentDetails.icon;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{activeAgentDetails.name} Agent</h4>
                <p className="text-[10px] text-muted-foreground font-mono">{activeAgentDetails.subtitle}</p>
              </div>
            </div>

            {/* Simulated SLA latency status */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground select-none">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {activeAgentDetails.latency}</span>
              <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> {activeAgentDetails.tokens} load</span>
            </div>
          </div>

          {/* Messages Streams */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5 min-h-[380px] bg-background/10">
            {chatHistory[activeAgent].map((msg, index) => {
              const isUser = msg.sender === "user";

              if (msg.isOrchestrationLog) {
                return (
                  <div key={index} className="flex flex-col gap-3.5 my-2">
                    {/* QTPI Orchestration bubble */}
                    <div className="p-5 rounded-3xl border border-brand-cyan/20 bg-brand-cyan/5 text-zinc-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4.5 w-4.5 text-brand-cyan animate-pulse" />
                        <span className="text-xs font-bold text-foreground">QTPI Orchestrator Command</span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground select-text">{msg.text}</p>
                      
                      {/* Dispatch Trigger action */}
                      {!isOrchestrating && orchestratorStep === 0 && (
                        <button
                          onClick={startOrchestration}
                          className="mt-3.5 inline-flex items-center gap-2 bg-foreground text-background text-[10px] font-bold px-4 py-2 rounded-full cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                        >
                          <span>Execute Agent Sub-Tasks</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Animated Step-by-Step Sub-Agent dispatch timeline */}
                    {(isOrchestrating || orchestratorStep > 0) && (
                      <div className="pl-4 border-l border-brand-cyan/30 flex flex-col gap-3 text-[11px] font-mono select-none">
                        {/* Step 1: Search */}
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${orchestratorStep >= 1 ? "opacity-100" : "opacity-40"}`}>
                          {orchestratorStep > 1 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Loader2 className="h-3.5 w-3.5 text-brand-cyan animate-spin" />
                          )}
                          <span className="text-foreground font-semibold">[Search Agent] Dispatched. Scraped Next.js cookies API specs.</span>
                        </div>

                        {/* Step 2: Coding */}
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${orchestratorStep >= 2 ? "opacity-100" : "opacity-40"}`}>
                          {orchestratorStep > 2 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : orchestratorStep === 2 ? (
                            <Loader2 className="h-3.5 w-3.5 text-brand-purple animate-spin" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 ml-1" />
                          )}
                          <span className="text-foreground font-semibold">[Coding Agent] Dispatched. Generated secured JWT middleware.js.</span>
                        </div>

                        {/* Step 3: PPT */}
                        <div className={`flex items-center gap-2 transition-opacity duration-300 ${orchestratorStep >= 3 ? "opacity-100" : "opacity-40"}`}>
                          {orchestratorStep > 3 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : orchestratorStep === 3 ? (
                            <Loader2 className="h-3.5 w-3.5 text-emerald-500 animate-spin" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 ml-1" />
                          )}
                          <span className="text-foreground font-semibold">[PPT Agent] Dispatched. Structure pitch deck slides.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? "self-end flex-row-reverse" : "self-start"
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isUser ? "bg-foreground border-foreground text-background" : "bg-muted border-border text-foreground"
                  }`}>
                    {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "bg-muted/40 border border-border text-foreground select-text"
                  }`}>
                    {/* Render standard code text wraps */}
                    {msg.text.startsWith("```") ? (
                      <pre className="font-mono text-[10px] leading-relaxed bg-[#050505] p-3 rounded-lg border border-border text-zinc-300 overflow-x-auto select-text mt-1.5">
                        <code>{msg.text.replace(/```javascript|```/g, "")}</code>
                      </pre>
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}

                    {/* Render Image triggers */}
                    {msg.imageSrc && (
                      <div className="mt-3.5 rounded-xl overflow-hidden border border-border max-w-sm">
                        <img src={msg.imageSrc} alt="Swarm graphic design output" className="w-full object-cover" />
                        <div className="p-2 border-t border-border/80 flex justify-between items-center bg-muted/45 select-none">
                          <span className="text-[9px] font-mono text-muted-foreground">chaos-mockup.png</span>
                          <button className="flex items-center gap-1 text-[9px] font-bold text-foreground cursor-pointer">
                            <Download className="h-3 w-3" /> Save Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Controls */}
          <form onSubmit={handleSend} className="p-4 border-t border-border flex items-center gap-3 bg-muted/10">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send instructions to ${activeAgentDetails.name} Swarm...`}
              className="flex-1 bg-muted/40 border border-border rounded-full px-5 py-3 text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-foreground/50 transition-colors"
            />
            <button
              type="submit"
              className="h-10 w-10 flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 active:scale-95 transition-transform cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

      {/* SECTION: Diagrammatic visual of the workflow matching the user diagram */}
      <section className="flex flex-col gap-8 mt-12 bg-muted/10 border border-border/60 rounded-[32px] p-8">
        <h4 className="text-xl font-extrabold tracking-tight text-foreground select-none">
          Swarm Ingestion Pipeline Diagram
        </h4>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border border-border p-6 rounded-2xl bg-card/45 select-none relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
          
          <div className="flex flex-col items-center p-4 border border-border rounded-xl bg-background/50 z-10 w-full md:w-auto">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ingestion Root</span>
            <span className="text-sm font-extrabold text-foreground mt-1">Multi-Agent Chat Interface</span>
          </div>

          <div className="text-zinc-400 font-bold hidden md:block">➔</div>

          <div className="flex flex-col items-center p-4 border border-brand-cyan/20 rounded-xl bg-brand-cyan/5 z-10 w-full md:w-auto">
            <span className="text-[9px] font-bold text-brand-cyan uppercase tracking-widest">Router Controller</span>
            <span className="text-sm font-extrabold text-brand-cyan mt-1">QTPI Coordinator</span>
          </div>

          <div className="text-zinc-400 font-bold hidden md:block">➔</div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full md:w-auto z-10">
            {agents.filter((a) => a.id !== "qtpi").map((agent) => {
              const Icon = agent.icon;
              return (
                <div key={agent.id} className="p-2 border border-border/80 rounded-lg flex flex-col items-center bg-background/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[8px] font-bold text-foreground mt-1 capitalize">{agent.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}