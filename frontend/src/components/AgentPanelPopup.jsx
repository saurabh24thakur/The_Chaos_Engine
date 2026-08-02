"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Code,
  FileText,
  Presentation,
  Image as ImageIcon,
  Search,
} from "lucide-react";

const agents = [
  {
    id: "chat",
    name: "chat",
    icon: MessageSquare,
    color: "text-blue-400 border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]",
  },
  {
    id: "coding",
    name: "coding",
    icon: Code,
    color: "text-purple-400 border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  },
  {
    id: "pdf",
    name: "pdf",
    icon: FileText,
    color: "text-amber-400 border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]",
  },
  {
    id: "ppt",
    name: "ppt",
    icon: Presentation,
    color: "text-emerald-400 border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
  },
  {
    id: "image",
    name: "image",
    icon: ImageIcon,
    color: "text-pink-400 border-pink-500/30 hover:border-pink-400 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]",
  },
];

const searchAgent = {
  id: "search",
  name: "search",
  icon: Search,
  color: "text-teal-400 border-teal-500/30 hover:border-teal-400 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)]",
};

export default function AgentPanelPopup({ panelRef, onSelectAgent }) {
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[600px] h-[130px] bg-zinc-950/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-2xl flex flex-col justify-end select-none z-30"
    >
      {/* SVG drawing lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 600 130"
      >
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Hub node */}
        <circle cx="225" cy="25" r="4" className="fill-white/80" />
        <circle
          cx="225"
          cy="25"
          r="8"
          className="stroke-white/20 fill-none animate-pulse"
        />

        {/* Connecting lines from hub to the 5 left buttons */}
        <line x1="225" y1="25" x2="45" y2="80" stroke="url(#line-grad)" strokeWidth="1.5" />
        <line x1="225" y1="25" x2="135" y2="80" stroke="url(#line-grad)" strokeWidth="1.5" />
        <line x1="225" y1="25" x2="225" y2="80" stroke="url(#line-grad)" strokeWidth="1.5" />
        <line x1="225" y1="25" x2="315" y2="80" stroke="url(#line-grad)" strokeWidth="1.5" />
        <line x1="225" y1="25" x2="405" y2="80" stroke="url(#line-grad)" strokeWidth="1.5" />
      </svg>

      {/* Buttons row */}
      <div className="flex w-full z-10 items-center justify-between">
        {/* 5 buttons on the left */}
        <div className="flex w-[450px] justify-between">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div key={agent.id} className="w-[90px] flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectAgent(agent.id);
                  }}
                  className={`w-[80px] h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl border bg-black/60 transition-all duration-200 cursor-pointer ${agent.color}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[9px] font-mono tracking-wider font-medium">
                    {agent.name}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>

        {/* search button on the right */}
        <div className="w-[150px] flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              onSelectAgent(searchAgent.id);
            }}
            className={`w-[80px] h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl border bg-black/60 transition-all duration-200 cursor-pointer ${searchAgent.color}`}
          >
            <searchAgent.icon className="h-4 w-4" />
            <span className="text-[9px] font-mono tracking-wider font-medium">
              {searchAgent.name}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
