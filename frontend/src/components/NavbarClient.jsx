"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NavbarClient({ authDesktop, authMobile }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Avoid a hydration mismatch on theme-dependent buttons.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";

  const headerClass = isDark
    ? "bg-white/95 text-black border border-black/10 shadow-lg backdrop-blur-md"
    : "bg-black/95 text-white border border-white/10 shadow-lg backdrop-blur-md";

  const logoColorClass = isDark ? "text-black" : "text-white";

  const themeButtonClass = isDark
    ? "hover:bg-zinc-150 text-black border-zinc-200"
    : "hover:bg-zinc-800 text-white border-zinc-700";

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4 transition-all duration-300">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex w-full max-w-7xl items-center justify-between rounded-full px-6 py-3 transition-all duration-300 ${headerClass}`}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className={`font-sans text-2xl tracking-tight transition-colors duration-300 ${logoColorClass}`}>
              Chaos Engine
            </span>
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors cursor-pointer ${themeButtonClass}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            )}
            {authDesktop}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            {mounted && (
              <button
                onClick={toggleTheme}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${themeButtonClass}`}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-full cursor-pointer border ${themeButtonClass}`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-[76px] left-4 right-4 z-40 md:hidden rounded-3xl border p-6 shadow-xl flex flex-col gap-5 ${
              isDark
                ? "bg-white text-black border-black/10"
                : "bg-black text-white border-white/10"
            }`}
          >
            <div className="flex flex-col gap-3">{authMobile}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
