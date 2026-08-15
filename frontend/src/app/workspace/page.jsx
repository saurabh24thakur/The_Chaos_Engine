"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Send,
  Plus,
  ArrowLeft,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { UserButton, useAuth } from "@clerk/nextjs";
import WorkspaceMessage from "@/components/WorkspaceMessage";

export default function Workspace() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [inputText, setInputText] = useState("");

  // New features state
  const [selectedWorkspace, setSelectedWorkspace] = useState("chat");
  const [catalog, setCatalog] = useState([]);
  const [providerKeys, setProviderKeys] = useState([]);
  const [activeChatConfig, setActiveChatConfig] = useState(null);

  // Modals / Dropdowns visibility
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Selected provider and model for model config flow
  const [tempProvider, setTempProvider] = useState("");
  const [tempModel, setTempModel] = useState("");

  const messagesEndRef = useRef(null);

  // 1. Fetch chats on load
  useEffect(() => {
    if (isLoaded && userId) {
      fetchChats();
      fetchProviderKeys();
      fetchModelsCatalog();
    }
  }, [isLoaded, userId]);

  // 2. Fetch messages when activeChatId changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      fetchChatConfig(activeChatId);
    } else {
      setMessages([]);
      setActiveChatConfig(null);
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

  const fetchChatConfig = async (chatId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/chat/chat/config/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveChatConfig(data);
        if (data?.provider && data?.model) {
          setTempProvider(data.provider);
          setTempModel(data.model);
        } else {
          setTempProvider("");
          setTempModel("");
        }
      }
    } catch (err) {
      console.error("Error fetching chat config:", err);
    }
  };

  const fetchProviderKeys = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/auth/api/settings/providers?clerkId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProviderKeys(data.providers || []);
      }
    } catch (err) {
      console.error("Error fetching provider keys:", err);
    }
  };

  const fetchModelsCatalog = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/orchestrator/models`);
      if (res.ok) {
        const data = await res.json();
        setCatalog(data || []);
      }
    } catch (err) {
      console.error("Error fetching models catalog:", err);
    }
  };

  const handleSaveConfig = async (provider, model) => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`http://localhost:8000/api/chat/chat/config/${activeChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveChatConfig(data);
      }
    } catch (err) {
      console.error("Error saving chat config:", err);
    }
  };

  const handleSaveKey = async (provider, apiKey) => {
    if (!apiKey.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/auth/api/settings/providers/${provider}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, clerkId: userId }),
      });
      if (res.ok) {
        setEditingProvider(null);
        await fetchProviderKeys();
        const input = document.getElementById(`key-${provider}`);
        if (input) input.value = "";
      }
    } catch (err) {
      console.error("Error saving key:", err);
    }
  };

  const handleDeleteKey = async (provider) => {
    if (!confirm(`Are you sure you want to delete the key for ${provider}?`)) return;
    try {
      const res = await fetch(`http://localhost:8000/api/auth/api/settings/providers/${provider}?clerkId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProviderKeys();
      }
    } catch (err) {
      console.error("Error deleting key:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || isStreaming) return;

    const userPrompt = inputText;
    setInputText("");
    setIsStreaming(true);

    // Add user message optimistically
    const tempUserMsg = { _id: `temp-user-${Date.now()}`, role: "user", content: userPrompt };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Add empty assistant message optimistically
    const tempAssistantMsg = {
      _id: `temp-assistant-${Date.now()}`,
      role: "assistant",
      content: selectedWorkspace === "ppt" ? "Generating presentation..." : "",
      artifact: selectedWorkspace === "ppt"
        ? {
            type: "pptx",
            status: "generating",
            fileName: "Preparing presentation.pptx",
            downloadUrl: "",
          }
        : null,
    };
    setMessages((prev) => [...prev, tempAssistantMsg]);

    try {
      const res = await fetch("http://localhost:8000/api/orchestrator/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace: selectedWorkspace,
          chatId: activeChatId,
          prompt: userPrompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to start stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "done") {
              break;
            } else if (data.type === "error") {
              throw new Error(data.message || "Streaming error");
            }

            // Extract custom langchain payload or direct payload
            let payload = data;
            if (Array.isArray(data)) {
              if (data[0] === "custom") {
                payload = data[1];
              } else {
                payload = null;
              }
            }

            if (payload && payload.type === "token" && payload.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last._id === tempAssistantMsg._id) {
                  last.content += payload.content;
                }
                return updated;
              });
            } else if (payload && payload.type === "status" && selectedWorkspace === "ppt") {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last._id === tempAssistantMsg._id) {
                  last.content = payload.message || last.content;
                  last.artifact = {
                    ...(last.artifact || {}),
                    type: "pptx",
                    status: payload.phase || "generating",
                  };
                }
                return updated;
              });
            } else if (payload && payload.type === "artifact" && payload.artifact) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last._id === tempAssistantMsg._id) {
                  last.content = "Presentation ready.";
                  last.artifact = {
                    ...payload.artifact,
                    status: "ready",
                  };
                }
                return updated;
              });
            }
          } catch (err) {
            console.error("Error parsing stream line:", err);
          }
        }
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last._id === tempAssistantMsg._id) {
          last.content = `Error: ${err.message || "Failed to generate response."}`;
          if (last.artifact) {
            last.artifact = {
              ...last.artifact,
              status: "error",
              message: err.message || "Failed to generate response.",
            };
          }
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      await fetchMessages(activeChatId);
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

  const showModelSelectionCard = activeChatId && activeChatConfig && (!activeChatConfig.provider || !activeChatConfig.model);

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

            {/* Model Selector next to title */}
            {activeChatConfig?.provider && activeChatConfig?.model && (
              <div className="relative">
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 bg-zinc-900/30 hover:bg-white/5 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="capitalize">{activeChatConfig.provider === "google" ? "Gemini" : activeChatConfig.provider} — {activeChatConfig.model}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showModelDropdown && (
                  <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-white/10 bg-[#0a0a0a] p-2 shadow-2xl z-30">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 border-b border-white/5 mb-1.5">
                      Switch Model
                    </div>
                    <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                      {catalog
                        .filter(cat => providerKeys.find(k => k.provider === cat.provider)?.configured)
                        .map(cat => (
                          <div key={cat.provider} className="flex flex-col gap-0.5">
                            <div className="text-[9px] uppercase font-bold text-zinc-400 px-2 py-0.5">
                              {cat.label}
                            </div>
                            {cat.models.map(m => (
                              <button
                                key={m}
                                onClick={() => {
                                  handleSaveConfig(cat.provider, m);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  activeChatConfig.provider === cat.provider && activeChatConfig.model === m
                                    ? "bg-white text-black font-semibold"
                                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <span>{m}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Settings Gear & Profile Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer text-zinc-400 hover:text-white transition-colors"
              aria-label="Open Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>

        {/* Message Feed / Model Selector Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          {showModelSelectionCard ? (
            // Model Selection Flow Card
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-900/30 border border-white/10 rounded-3xl p-6 text-white shadow- premium flex flex-col gap-6"
              >
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Workspace Init</span>
                  <h3 className="text-xl font-extrabold text-foreground mt-1">Configure Chat Workspace</h3>
                  <p className="text-xs text-zinc-400 mt-1 select-none">Select the provider and model to initialize this workspace swarm.</p>
                </div>

                {catalog.filter(cat => providerKeys.find(k => k.provider === cat.provider)?.configured).length === 0 ? (
                  <div className="text-center py-6 flex flex-col gap-4.5 select-none">
                    <p className="text-xs text-zinc-400">No AI providers configured. Add an API key in Settings to continue.</p>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer active:scale-95 transition-all"
                    >
                      Go to Settings
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase">AI Provider</label>
                      <select
                        value={tempProvider}
                        onChange={(e) => {
                          setTempProvider(e.target.value);
                          const cat = catalog.find(c => c.provider === e.target.value);
                          setTempModel(cat ? cat.models[0] : "");
                        }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 select-none cursor-pointer"
                      >
                        <option value="" disabled>Select Provider...</option>
                        {catalog
                          .filter(cat => providerKeys.find(k => k.provider === cat.provider)?.configured)
                          .map(cat => (
                            <option key={cat.provider} value={cat.provider}>{cat.label}</option>
                          ))}
                      </select>
                    </div>

                    {tempProvider && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Model</label>
                        <select
                          value={tempModel}
                          onChange={(e) => setTempModel(e.target.value)}
                          className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 select-none cursor-pointer"
                        >
                          {catalog
                            .find(c => c.provider === tempProvider)
                            ?.models.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                      </div>
                    )}

                    <button
                      disabled={!tempProvider || !tempModel}
                      onClick={() => handleSaveConfig(tempProvider, tempModel)}
                      className="w-full py-2.5 mt-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            // Normal Message List
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => {
                const isAgent = msg.role !== "user";
                return (
                  <motion.div
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex w-full"
                  >
                    <WorkspaceMessage message={msg} isAgent={isAgent} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div className="p-6 md:p-8 max-w-4xl mx-auto w-full border-t border-white/5 bg-[#050505]">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            
            {/* Workspace dropdown selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="flex items-center gap-1.5 bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-4 py-4.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer select-none"
              >
                <span className="capitalize">{selectedWorkspace}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showWorkspaceDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-40 rounded-xl border border-white/10 bg-[#0a0a0a] p-1.5 shadow-2xl z-30">
                  {["chat", "search", "coding", "ppt"].map((ws) => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => {
                        setSelectedWorkspace(ws);
                        setShowWorkspaceDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs capitalize transition-colors cursor-pointer ${
                        selectedWorkspace === ws
                          ? "bg-white text-black font-semibold"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {ws}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input & Send button */}
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isStreaming ? "Generating response..." : "Send message..."}
                disabled={isStreaming || showModelSelectionCard}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4.5 pr-14 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors shadow-lg"
              />
              <button
                type="submit"
                disabled={isStreaming || !inputText.trim() || showModelSelectionCard}
                className="absolute right-3.5 h-10 w-10 flex items-center justify-center rounded-xl bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-white shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Settings</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Configure your AI Provider API Keys</p>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
                {catalog.map((cat) => {
                  const keyState = providerKeys.find((k) => k.provider === cat.provider) || {
                    configured: false,
                    maskedKey: "",
                  };

                  return (
                    <div key={cat.provider} className="p-4 rounded-xl border border-white/5 bg-zinc-900/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold capitalize">{cat.label}</span>
                        {keyState.configured ? (
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Saved
                          </span>
                        ) : (
                          <span className="text-[9px] font-extrabold uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded">
                            Not Set
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <input
                          type="password"
                          placeholder={keyState.configured ? keyState.maskedKey || "••••••••••••" : "Enter API Key..."}
                          disabled={keyState.configured && editingProvider !== cat.provider}
                          id={`key-${cat.provider}`}
                          className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono placeholder-zinc-500 text-white focus:outline-none focus:border-white/20 disabled:opacity-50"
                        />

                        {keyState.configured && editingProvider !== cat.provider ? (
                          <>
                            <button
                              onClick={() => setEditingProvider(cat.provider)}
                              className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => handleDeleteKey(cat.provider)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-[10px] font-bold text-red-400 hover:text-red-500 cursor-pointer transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const input = document.getElementById(`key-${cat.provider}`);
                                handleSaveKey(cat.provider, input ? input.value : "");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                            {editingProvider === cat.provider && (
                              <button
                                onClick={() => setEditingProvider(null)}
                                className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors animate-pulse"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
