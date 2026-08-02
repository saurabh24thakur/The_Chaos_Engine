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

  const feedRef = useRef(null);

  const renderInlineStyles = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMessageContent = (content = "") => {
    if (!content) return null;

    // Split by code blocks first
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        let language = "";
        let code = lines.join("\n");
        
        // If the first line is just a language (like javascript, html, python)
        if (lines.length > 0 && /^[a-zA-Z0-9_-]+$/.test(lines[0].trim())) {
          language = lines[0].trim();
          code = lines.slice(1).join("\n");
        }

        return (
          <div key={index} className="my-3 flex flex-col gap-1.5">
            {language && (
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block ml-1 select-none">
                {language}
              </span>
            )}
            <pre className="font-mono text-[10px] leading-relaxed bg-[#050505] p-3 rounded-lg border border-white/10 text-zinc-300 overflow-x-auto select-text">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Render standard markdown for normal text (split by newlines)
      const lines = part.split("\n");
      return (
        <div key={index} className="flex flex-col gap-1">
          {lines.map((line, lineIdx) => {
            // Check for headings: # Heading
            if (line.startsWith("# ")) {
              return <h3 key={lineIdx} className="text-sm font-bold text-white mt-2 mb-1">{line.slice(2)}</h3>;
            }
            if (line.startsWith("## ")) {
              return <h4 key={lineIdx} className="text-xs font-bold text-white mt-2 mb-1">{line.slice(3)}</h4>;
            }

            // Check for bullet lists: - Item
            if (line.startsWith("- ")) {
              return (
                <ul key={lineIdx} className="list-disc pl-4 text-xs">
                  <li>{renderInlineStyles(line.slice(2))}</li>
                </ul>
              );
            }

            // Standard paragraph
            return (
              <p key={lineIdx} className="whitespace-pre-line min-h-[1em]">
                {renderInlineStyles(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

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
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: "smooth"
      });
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

    // 1. Resolve workspace agent and cleaned prompt from slash command
    let workspace = "chat";
    let cleanedPrompt = userPrompt;
    
    const match = userPrompt.match(/^\/([a-zA-Z0-9_-]+)\s(.*)/s);
    if (match) {
      workspace = match[1];
      cleanedPrompt = match[2];
    } else if (userPrompt.startsWith("/")) {
      workspace = userPrompt.slice(1).trim();
      cleanedPrompt = "";
    }

    // 2. Add temporary assistant message
    const tempAgentMsgId = Date.now().toString() + "-agent";
    const tempAgentMsg = { _id: tempAgentMsgId, role: "assistant", content: "" };
    setMessages((prev) => [...prev, tempAgentMsg]);

    try {
      // 3. Request streaming response from orchestrator service
      const res = await fetch(`http://localhost:8000/api/orchestrator/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace,
          chatId: activeChatId,
          prompt: cleanedPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === tempAgentMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              } else if (parsed.error) {
                console.error("Stream error:", parsed.error);
                accumulatedText += `\n[Error: ${parsed.error}]`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m._id === tempAgentMsgId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }

      // 4. Refetch messages from DB to get the official message ID and final content
      await fetchMessages(activeChatId);

    } catch (err) {
      console.error("Error streaming agent response:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempAgentMsgId
            ? { ...m, content: "Error: Failed to fetch streaming response from orchestrator." }
            : m
        )
      );
    }
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
        <div ref={feedRef} className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
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
                    {renderMessageContent(msg.content)}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {/* Scroll bottom target handled by feedRef */}
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