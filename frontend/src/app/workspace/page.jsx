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
import { UserButton, useAuth } from "@clerk/nextjs";

export default function Workspace() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState("");

  const messagesEndRef = useRef(null);

  // 1. Fetch chats on load
  useEffect(() => {
    if (isLoaded && userId) {
      fetchChats();
    }
  }, [isLoaded, userId]);

  // 2. Fetch messages when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  // 3. Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/chat/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
        if (data.length > 0 && !activeChatId) {
          setActiveChatId(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/messages/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const userPrompt = inputText;
    setInputText("");

    // Optimistically add user message
    const tempUserMsg = { _id: Date.now().toString(), role: "user", content: userPrompt };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`http://localhost:8000/api/chat/messages/${activeChatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: userPrompt }),
      });
      if (res.ok) {
        const userMsg = await res.json();
        // Replace temp message with actual db message
        setMessages((prev) => prev.map((m) => m._id === tempUserMsg._id ? userMsg : m));
      }
    } catch (err) {
      console.error("Error sending user message:", err);
    }

    // Simulate Agent response
    setTimeout(async () => {
      const agentReplyText = `[Chaos Engine OS] Received prompt: "${userPrompt}". Dispatching pipeline parameters to sub-agent swarms. Resolution complete.`;
      try {
        const res = await fetch(`http://localhost:8000/api/chat/messages/${activeChatId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: agentReplyText }),
        });
        if (res.ok) {
          const agentMsg = await res.json();
          setMessages((prev) => [...prev, agentMsg]);
        }
      } catch (err) {
        console.error("Error sending agent response:", err);
      }
    }, 1000);
  };

  const createNewChat = async () => {
    if (!userId) return;
    try {
      const res = await fetch("http://localhost:8000/api/chat/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const newChat = await res.json();
        const defaultTitle = `chat ${chats.length + 1}: New Swarm Workspace`;

        // Rename the chat
        await fetch(`http://localhost:8000/api/chat/chat/${newChat._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: defaultTitle }),
        });
        newChat.title = defaultTitle;

        // Insert welcome message
        const welcomeText = "Ready. Tell me what agent swarms we should spin up today.";
        await fetch(`http://localhost:8000/api/chat/messages/${newChat._id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: welcomeText }),
        });

        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat._id);
      }
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/api/chat/chat/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = chats.filter((c) => c._id !== id);
        setChats(remaining);
        if (activeChatId === id) {
          if (remaining.length > 0) {
            setActiveChatId(remaining[0]._id);
          } else {
            setActiveChatId(null);
          }
        }
      }
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const currentChat = chats.find((c) => c._id === activeChatId) || {
    title: "No Chat Selected",
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
              key={c._id}
              onClick={() => setActiveChatId(c._id)}
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                activeChatId === c._id
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs truncate flex-1 pr-2 select-none">
                {c.title.split(":")[0]}
              </span>
              <button
                onClick={(e) => deleteChat(c._id, e)}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500 ${
                  activeChatId === c._id ? "text-zinc-600 hover:text-red-600" : "text-zinc-500"
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
              {currentChat.title || "No Chat Selected"}
            </div>
          </div>

          {/* Right side: Profile Avatar */}
          <div className="flex items-center justify-center">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Message Feed Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, index) => {
              const isAgent = msg.role !== "user";
              return (
                <motion.div
                  key={msg._id || index}
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
                    {msg.content && msg.content.includes("```") ? (
                      <div className="flex flex-col gap-2">
                        <p>{msg.content.split("```")[0]}</p>
                        <pre className="font-mono text-[10px] leading-relaxed bg-[#050505] p-3 rounded-lg border border-white/10 text-zinc-300 overflow-x-auto select-text">
                          <code>{msg.content.split("```")[1].replace("javascript\n", "")}</code>
                        </pre>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line">{msg.content || ""}</p>
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