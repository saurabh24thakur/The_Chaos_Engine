import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Chaos Engine | Next-Gen Multi-Agent AI Orchestration Platform",
  description: "Chaos Engine is a premium, enterprise-ready orchestration platform where autonomous AI agents plan, collaborate, reason, and execute complex operations at scale.",
  keywords: ["AI Agents", "Multi-Agent System", "Orchestration", "SaaS", "Next.js", "AI Planning", "Autonomous AI"],
  authors: [{ name: "Chaos Engine Team" }],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col selection:bg-brand-blue/30 selection:text-brand-blue-500">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
