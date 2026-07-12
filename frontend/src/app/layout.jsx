import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

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

export default async function RootLayout({ children }) {
  const { userId } = await auth();

  if (userId) {
    try {
      const user = await currentUser();
      if (user) {
        const primaryEmail =
          user.emailAddresses?.find(
            (email) => email.id === user.primaryEmailAddressId
          )?.emailAddress || user.emailAddresses?.[0]?.emailAddress;

        if (primaryEmail) {
          await fetch("http://localhost:8001/api/users/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerkId: user.id,
              email: primaryEmail,
              firstName: user.firstName ?? "",
              lastName: user.lastName ?? "",
              username: user.username ?? "",
              imageUrl: user.imageUrl ?? "",
            }),
          }).catch((err) => console.error("Error syncing user:", err));
        }
      }
    } catch (err) {
      console.error("Failed to fetch current user or sync:", err);
    }
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col selection:bg-brand-blue/30 selection:text-brand-blue-500"
        data-clerk-user={userId ? "signed-in" : "signed-out"}
      >
        <ClerkProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
