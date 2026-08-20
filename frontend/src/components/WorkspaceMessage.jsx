"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function formatLanguage(language) {
  const value = String(language || "text").trim().toLowerCase();

  if (value === "js") return "JavaScript";
  if (value === "jsx") return "JSX";
  if (value === "ts") return "TypeScript";
  if (value === "tsx") return "TSX";
  if (value === "sh" || value === "bash") return "Shell";
  if (value === "py") return "Python";

  return language ? String(language) : "Text";
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
        <span>{formatLanguage(language)}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[10px] leading-relaxed text-zinc-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ArtifactCard({ artifact }) {
  const status = artifact?.status || "ready";
  const isReady = status === "ready";
  const isError = status === "error";
  const isLoading = status === "generating" || status === "planning" || status === "rendering";
  const downloadHref =
    artifact?.downloadUrl && artifact.downloadUrl.startsWith("http")
      ? artifact.downloadUrl
      : artifact?.downloadUrl
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}${artifact.downloadUrl}`
        : "";

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-[#0a0a0a] p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">
          <FileText className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">
              {isError ? "Presentation failed" : "Presentation ready"}
            </span>
            {isLoading ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {artifact?.fileName || artifact?.title || "Presentation.pptx"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            {isError
              ? artifact?.message || "The presentation could not be generated."
              : artifact?.slideCount
                ? `${artifact.slideCount} slides`
                : "Your downloadable PowerPoint file is ready."}
          </p>
        </div>
      </div>

      {isReady && downloadHref ? (
        <a
          href={downloadHref}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
          download
        >
          <Download className="h-4 w-4" />
          Download PPT
        </a>
      ) : null}
    </div>
  );
}

function splitSegments(content) {
  const segments = [];
  const fence = /```([\w+-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = fence.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: "code",
      language: match[1],
      value: match[2].replace(/\s+$/, ""),
    });

    lastIndex = fence.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({
      type: "text",
      value: content.slice(lastIndex),
    });
  }

  return segments;
}

export default function WorkspaceMessage({ message }) {
  const content = String(message?.content || "");
  const hasPptArtifact = message?.artifact?.type === "pptx";

  if (hasPptArtifact) {
    return <ArtifactCard artifact={message.artifact} />;
  }

  return (
    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!inline && match) {
              return (
                <CodeBlock
                  language={match[1]}
                  code={String(children).replace(/\n$/, "")}
                />
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
