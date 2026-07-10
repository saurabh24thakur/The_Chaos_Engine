"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Plus,
  ArrowLeft,
  Sparkles,
  User,
  Trash2,
} from "lucide-react";

export default function Workspace() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(1);
  const [inputText, setInputText] = useState("");

  // Simulated conversations
  const [chats, setChats] = useState([
    {
      id: 1,
      title: "chat 1: Authentication Router Setup",
      messages: [
        { sender: "user", text: "Create an HTTPOnly cookie login router" },
        { sender: "agent", text: "I have configured the JWT authentication route in src/app/api/auth/route.js. Active tests verified: 4 passed." },
      ],
    },
    {
      id: 2,
      title: "chat 2: Vector Embeddings Indexing",
      messages: [
        { sender: "user", text: "How is the memory data indexed?" },
        { sender: "agent", text: "Context vectors are embedded using 1536-dimensional models and cached in Pinespace memory clusters." },
      ],
    },
    {
      id: 3,
      title: "chat 3: Investor PPT Generation",
      messages: [
        { sender: "user", text: "Design a pitch slide outlining our agent nodes" },
        { sender: "agent", text: "Investor deck completed. Slide structure: Root Ingestion -> QTPI Router -> 6 Execution sub-agents." },
      ],
    },
    {
      id: 4,
      title: "chat 4: System Observability SLA",
      messages: [
        { sender: "user", text: "Show current pipeline performance stats" },
        { sender: "agent", text: "Average telemetry latency: 120ms. Sandbox CPU usage: 48%. Memory load: 62%." },
      ],
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats, activeChatId]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { sender: "user", text: inputText };
    const userPrompt = inputText;

    // Append user message to active chat
    setChats((prevChats) =>
      prevChats.map((c) =>
        c.id === activeChatId
          ? { ...c, messages: [...c.messages, userMessage] }
          : c
      )
    );

    setInputText("");

    // Simulate Agent response
    setTimeout(() => {
      const agentMessage = {
        sender: "agent",
        text: `[Chaos Engine OS] Received prompt: "${userPrompt}". Dispatching pipeline parameters to sub-agent swarms. Resolution complete.`,
      };

      setChats((prevChats) =>
        prevChats.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [...c.messages, agentMessage] }
            : c
        )
      );
    }, 1000);
  };

  const createNewChat = () => {
    const newId = chats.length > 0 ? Math.max(...chats.map((c) => c.id)) + 1 : 1;
    const newChat = {
      id: newId,
      title: `chat ${newId}: New Swarm Workspace`,
      messages: [
        { sender: "agent", text: "Ready. Tell me what agent swarms we should spin up today." },
      ],
    };
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newId);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    const remaining = chats.filter((c) => c.id !== id);
    setChats(remaining);
    if (activeChatId === id && remaining.length > 0) {
      setActiveChatId(remaining[0].id);
    }
  };

  const currentChat = chats.find((c) => c.id === activeChatId) || {
    title: "No Chat Selected",
    messages: [],
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* 1. Left Collapsible Sidebar */}
      <motion.div
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-[#0a0a0a] border-r border-white/10 flex flex-col z-20 relative overflow-hidden"
      >
        {/* Sidebar Header */}
        <div className="p-4.5 border-b border-white/10 flex items-center justify-between min-w-[280px]">
          <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
            Workspaces
          </span>
          {/* Close Sidebar button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-400" />
          </button>
        </div>

        {/* Add New Chat Button */}
        <div className="p-4 min-w-[280px]">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat Workspace</span>
          </button>
        </div>

        {/* Chats History List */}
        <div className="flex-1 overflow-y-auto p-2 min-w-[280px] flex flex-col gap-1.5">
          {chats.map((c) => (
            <div
              key={c.id}
              onClick={() => setActiveChatId(c.id)}
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                activeChatId === c.id
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs truncate flex-1 pr-2 select-none">
                {c.title.split(":")[0]}
              </span>
              <button
                onClick={(e) => deleteChat(c.id, e)}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 ${
                  activeChatId === c.id ? "text-zinc-600 hover:text-red-600" : "text-zinc-500"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="text-center text-xs text-zinc-600 mt-8">
              No active workspaces.
            </div>
          )}
        </div>
      </motion.div>

      {/* 2. Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Header Bar */}
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            {/* Back to Home Button */}
            <button
              onClick={() => router.push("/")}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer text-zinc-400 hover:text-white"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Sidebar toggle if collapsed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer text-zinc-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Header Chat Title */}
            <div className="px-4 py-1.5 rounded-lg border border-white/10 bg-zinc-900/30 text-xs font-mono font-semibold max-w-xs sm:max-w-md truncate">
              {currentChat.title}
            </div>
          </div>

          {/* Right side: Profile Avatar */}
          <div className="relative">
            <div className="h-8 w-8 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center cursor-pointer">
              <span className="text-[10px] font-bold text-zinc-400">CE</span>
            </div>
          </div>
        </div>

        {/* Message Feed Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="popLayout">
            {currentChat.messages.map((msg, index) => {
              const isAgent = msg.sender === "agent";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-start gap-3.5 max-w-[85%] ${
                    isAgent ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isAgent ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-white text-black"
                  }`}>
                    {isAgent ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div className={`p-5 rounded-2xl border text-xs leading-relaxed ${
                    isAgent
                      ? "bg-zinc-900/40 border-white/10 text-zinc-200 select-text"
                      : "bg-white text-black font-semibold select-text"
                  }`}>
                    {/* Syntax highlight wrap */}
                    {msg.text.includes("```") ? (
                      <div className="flex flex-col gap-2">
                        <p>{msg.text.split("```")[0]}</p>
                        <pre className="font-mono text-[10px] leading-relaxed bg-[#050505] p-3 rounded-lg border border-white/10 text-zinc-300 overflow-x-auto select-text">
                          <code>{msg.text.split("```")[1].replace("javascript\n", "")}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full border-t border-white/5 bg-[#050505]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message..."
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4.5 pr-14 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-3.5 h-10 w-10 flex items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-95 transition-transform"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}