"use client";

import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-[100vh] flex-col">
      <h2 className="text-8xl mb-10">
        Welcome to Chaos Engine
      </h2>

      <p className="text-4xl mb-10 text-center max-w-4xl text-muted-foreground leading-normal">
        Chaos Engine is a platform that helps you coordinate specialized AI agents to automate complex developer workflows.
      </p>

      <button
        className="bg-white text-2xl text-black px-6 py-4 rounded-full cursor-pointer hover:bg-zinc-700 hover:text-white"
        onClick={() => router.push("/workspace")}
      >
        Get Started
      </button>
    </div>
  );
}