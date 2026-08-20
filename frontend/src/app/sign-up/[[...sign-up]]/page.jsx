"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { ArrowRight, KeyRound, Mail, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await register(username, email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050505] overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10 my-10"
      >
        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
          
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-500 to-brand-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-bold tracking-tight text-white mb-2">
              Create an account
            </h2>
            <p className="text-center text-sm text-zinc-400">
              Join Chaos Engine to build autonomous swarms
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-medium"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 focus:bg-white/10 transition-all text-sm outline-none"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 focus:bg-white/10 transition-all text-sm outline-none"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:border-brand-blue-500 focus:ring-1 focus:ring-brand-blue-500 focus:bg-white/10 transition-all text-sm outline-none"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-black hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-6"
            >
              <span>{isLoading ? "Creating account..." : "Continue"}</span>
              {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
            
            <div className="text-center text-sm text-zinc-400 pt-2">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-bold text-white hover:text-brand-blue-400 transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
