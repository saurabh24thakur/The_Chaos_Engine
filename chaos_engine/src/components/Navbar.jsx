"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar({
  isLoggedIn,
  setIsLoggedIn,
  setShowProfile,
  showProfile,
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleAvatarClick = () => {
    setShowProfile(!showProfile);
  };

  const isDark = !mounted || resolvedTheme === "dark";

  // Inverted theme values: White in dark mode, Black in light mode
  const headerClass = isDark
    ? "bg-white/95 text-black border border-black/10 shadow-lg backdrop-blur-md"
    : "bg-black/95 text-white border border-white/10 shadow-lg backdrop-blur-md";

  const linkColorClass = isDark
    ? "text-zinc-600 hover:text-black"
    : "text-zinc-400 hover:text-white";

  const logoColorClass = isDark ? "text-black" : "text-white";
  
  const themeButtonClass = isDark
    ? "hover:bg-zinc-150 text-black border-zinc-200"
    : "hover:bg-zinc-800 text-white border-zinc-700";

  const loginButtonClass = isDark
    ? "bg-black text-white hover:bg-zinc-800"
    : "bg-white text-black hover:bg-zinc-200";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 transition-all duration-300">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex w-full max-w-7xl items-center justify-between px-6 py-3 rounded-full transition-all duration-300 ${headerClass}`}
        >
          {/* Left: Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            
             
            <span className={`font-sans text-2xl tracking-tight transition-colors duration-300 ${logoColorClass}`}>
              Chaos Engine
            </span>
          </a>

          {/* Center: Links (Desktop) */}
          

          {/* Right: Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Switcher */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer border ${themeButtonClass}`}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4.5 w-4.5" />
                ) : (
                  <Moon className="h-4.5 w-4.5" />
                )}
              </button>
            )}

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-blue to-brand-purple p-[1.5px] cursor-pointer hover:scale-105 transition-transform"
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="User Profile"
                    className="h-full w-full rounded-full object-cover border border-background"
                  />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogin}
                  className={`font-sans text-sm font-semibold transition-all rounded-full px-5 py-2 cursor-pointer shadow-md hover:shadow-lg ${loginButtonClass}`}
                >
                  Login
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <div className="flex md:hidden items-center gap-3">
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${themeButtonClass}`}
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-full cursor-pointer border ${themeButtonClass}`}
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-[76px] left-4 right-4 z-40 md:hidden rounded-3xl p-6 shadow-xl border flex flex-col gap-5 ${
              isDark
                ? "bg-white text-black border-black/10"
                : "bg-black text-white border-white/10"
            }`}
          >


            <div className="h-[1px] bg-border/55 my-1" />

            <div className="flex flex-col gap-3">
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfile(true);
                  }}
                  className="flex items-center gap-3 w-full p-2 rounded-2xl bg-muted/40 border border-border/30 text-left"
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="User Profile"
                    className="h-10 w-10 rounded-full object-cover border"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">Sarah Connor</span>
                    <span className="text-xs text-muted-foreground">Open Profile Panel</span>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsLoggedIn(true);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full font-sans text-sm font-semibold transition-all rounded-full py-2.5 cursor-pointer text-center ${
                      isDark
                        ? "bg-black text-white hover:bg-zinc-800"
                        : "bg-white text-black hover:bg-zinc-200"
                    }`}
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
