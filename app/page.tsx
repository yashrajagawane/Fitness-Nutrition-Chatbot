"use client";

import React, { useState, useRef, useEffect, useMemo, memo } from "react";
import {
  Send,
  User,
  Dumbbell,
  Apple,
  Activity,
  Sparkles,
  PlusCircle,
  Loader2,
  Info,
  Menu,
  X,
  MessageSquare,
  Trash2,
  History,
  Clock,
  Settings,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

import ReactMarkdown from "react-markdown";

/*
  VITALIS AI - DARK PREMIUM INTERFACE
  Features:
  - Multi chat sessions
  - Conversation memory
  - Local persistence
  - Streaming responses
  - Responsive sidebar
*/

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

/* ---------------- SIDEBAR ---------------- */

const Sidebar = memo(
  ({
    sessions,
    activeSessionId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    isOpen,
    onClose
  }: {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    const sorted = [...sessions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
            onClick={onClose}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72
          bg-[#0a0a0a] border-r border-zinc-800
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          {/* Brand */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Activity size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Vitalis AI</p>
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest">
                  Fitness Coach
                </p>
              </div>
            </div>

            <button
              className="lg:hidden text-zinc-400"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          {/* New chat */}
          <div className="p-4">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2
              bg-emerald-600 hover:bg-emerald-700
              py-3 rounded-xl font-semibold text-sm"
            >
              <PlusCircle size={18} />
              New Session
            </button>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 px-2 mb-2">
              Sessions
            </p>

            {sorted.length === 0 ? (
              <div className="text-center text-xs text-zinc-500 py-10">
                No sessions yet
              </div>
            ) : (
              sorted.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectChat(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
                  ${
                    activeSessionId === s.id
                      ? "bg-emerald-900/20 text-emerald-400"
                      : "hover:bg-zinc-900 text-zinc-400"
                  }`}
                >
                  <MessageSquare size={14} />

                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate">
                      {s.title}
                    </p>
                    <p className="text-[9px] opacity-50">
                      {s.messages.length} msgs
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                <User size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold">Guest Athlete</p>
                <p className="text-[9px] text-emerald-400 uppercase">
                  Active
                </p>
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }
);

Sidebar.displayName = "Sidebar";

/* ---------------- MAIN APP ---------------- */

const SUGGESTIONS = [
  { label: "High Protein Meal Plan", icon: <Apple size={14} /> },
  { label: "5-Day Workout Split", icon: <Dumbbell size={14} /> },
  { label: "Calculate My Macros", icon: <Activity size={14} /> }
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = useMemo(
    () => sessions.find((s) => s.id === currentSessionId),
    [sessions, currentSessionId]
  );

  const messages = currentSession?.messages || [];

  /* ---------- LOAD HISTORY ---------- */

  useEffect(() => {
    const saved = localStorage.getItem("vitalis_sessions");

    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      setCurrentSessionId(parsed[0]?.id || null);
    } else {
      createSession();
    }
  }, []);

  /* ---------- SAVE HISTORY ---------- */

  useEffect(() => {
    if (sessions.length)
      localStorage.setItem("vitalis_sessions", JSON.stringify(sessions));

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, messages]);

  /* ---------- SESSION MANAGEMENT ---------- */

  const createSession = () => {
    const id = Date.now().toString();

    const session: ChatSession = {
      id,
      title: "New Consultation",
      createdAt: new Date(),
      messages: [
        {
          id: "1",
          role: "assistant",
          content:
            "Welcome to **Vitalis AI**. I'm your personal fitness and nutrition coach. How can I help you today?",
          timestamp: new Date()
        }
      ]
    };

    setSessions((prev) => [session, ...prev]);
    setCurrentSessionId(id);
  };

  const deleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    setCurrentSessionId(filtered[0]?.id || null);
  };

  /* ---------- STREAM RESPONSE ---------- */

  const streamText = async (text: string) => {
    let current = "";

    for (let i = 0; i < text.length; i += 4) {
      current += text.slice(i, i + 4);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages.slice(0, -1),
                  {
                    ...s.messages[s.messages.length - 1],
                    content: current
                  }
                ]
              }
            : s
        )
      );

      await new Promise((r) => setTimeout(r, 8));
    }
  };

  /* ---------- SEND MESSAGE ---------- */

  const sendMessage = async (text?: string) => {
    const message = text || input;

    if (!message.trim() || loading || !currentSessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date()
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      )
    );

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
        timestamp: new Date()
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, aiMsg] }
            : s
        )
      );

      await streamText(data.reply);
    } catch {
      console.error("AI error");
    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100">

      <Sidebar
        sessions={sessions}
        activeSessionId={currentSessionId}
        onNewChat={createSession}
        onSelectChat={setCurrentSessionId}
        onDeleteChat={deleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>

          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Vitalis AI Coach
          </p>

          <Info size={18} />
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="max-w-3xl mx-auto space-y-8">

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 ${
                  m.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                  {m.role === "user" ? <User size={18} /> : <Dumbbell size={18} />}
                </div>

                <div
                  className={`px-5 py-4 rounded-2xl max-w-[80%] text-sm ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-zinc-900 border border-zinc-800"
                  }`}
                >
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Coach thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input */}
        <footer className="p-6 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">

            <div className="flex gap-2 mb-3 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.label)}
                  className="text-xs bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full hover:border-emerald-500"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach..."
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none"
              />

              <button
                onClick={() => sendMessage()}
                className="bg-emerald-600 px-4 rounded-xl"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}