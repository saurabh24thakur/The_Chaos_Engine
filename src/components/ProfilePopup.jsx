"use client";

import { motion } from "framer-motion";
import {
  User,
  CreditCard,
  Cpu,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ProfilePopup({ onClose, onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-20 right-4 md:right-16 z-55 w-80 rounded-2xl glass p-5 shadow-2xl border border-border shadow-black/20 dark:shadow-white/5"
    >
      {/* Header Profile info */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-border/50">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
          alt="Sarah Connor Profile"
          className="h-12 w-12 rounded-full object-cover border border-brand-blue"
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground truncate">Sarah Connor</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-blue/10 text-brand-blue dark:text-brand-cyan border border-brand-blue/20">
              PRO
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            s.connor@cyberdyne.io
          </span>
        </div>
      </div>

      {/* Stats list */}
      <div className="py-4 border-b border-border/50 flex flex-col gap-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Credits Remaining
          </span>
          <span className="font-mono font-bold text-foreground">84,200 / 100k</span>
        </div>
        {/* Credits progress bar */}
        <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-brand-blue to-brand-cyan h-full rounded-full"
            style={{ width: "84.2%" }}
          />
        </div>

        <div className="flex justify-between items-center text-xs mt-1.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-brand-purple" />
            Agent Executions
          </span>
          <span className="font-mono font-bold text-foreground">1,429,500</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Active Agents
          </span>
          <span className="font-mono font-semibold text-emerald-500">8 Running</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            Active Workspace
          </span>
          <span className="font-sans font-medium text-foreground truncate max-w-[120px]">
            cyberdyne-core
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-brand-blue" />
            Billing Status
          </span>
          <span className="font-semibold text-brand-blue dark:text-brand-cyan">
            Active
          </span>
        </div>
      </div>

      {/* Action links */}
      <div className="pt-3 flex flex-col gap-1">
        <button
          onClick={() => alert("Redirecting to Workspace Dashboard...")}
          className="flex w-full items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 transition-all shadow-md cursor-pointer"
        >
          <span>Upgrade to Enterprise</span>
          <ExternalLink className="h-3 w-3" />
        </button>

        <button
          onClick={() => alert("Opening account settings...")}
          className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-left cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Account Settings</span>
        </button>

        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all text-left cursor-pointer font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </motion.div>
  );
}
