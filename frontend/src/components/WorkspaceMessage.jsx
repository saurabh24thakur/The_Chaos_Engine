"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";

const CODE_FENCE_RE = /```([\w+-]*)\n([\s\S]*?)```/g;

function formatLanguage(language) {
  return String(language || "text")
    .trim()
    .replace(/^js$/i, "JavaScript")
    .replace(/^ts$/i, "TypeScript")
    .replace(/^jsx$/i, "JSX")
    .replace(/^tsx$/i, "TSX")
    .replace(/^sh$/i, "Shell")
    .replace(/^bash$/i, "Shell")
    .replace(/^py$/i, "Python");
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setCopied(false);
    }, 1600);

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
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
        <span>{formatLanguage(language)}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
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
  const status = String(artifact?.status || "ready");
  const isReady = status === "ready";
  const isError = status === "error";
  const isLoading = !isReady && !isError;
  const downloadHref =
    artifact?.downloadUrl && artifact.downloadUrl.startsWith("http")
      ? artifact.downloadUrl
      : artifact?.downloadUrl
        ? `http://localhost:8000${artifact.downloadUrl}`
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
            {isLoading && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating
              </span>
            )}
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

      {isReady && artifact?.downloadUrl ? (
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

function renderTextSegments(text) {
  const segments = [];
  let lastIndex = 0;
  let match;

  CODE_FENCE_RE.lastIndex = 0;

  while ((match = CODE_FENCE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }

    segments.push({
      type: "code",
      language: match[1],
      value: match[2].replace(/\s+$/, ""),
    });

    lastIndex = CODE_FENCE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

export default function WorkspaceMessage({ message, isAgent }) {
  const segments = useMemo(() => {
    const content = String(message?.content || "");
    return content ? renderTextSegments(content) : [];
  }, [message?.content]);

  const hasArtifact = Boolean(message?.artifact?.type === "pptx");

  return (
    <div
      className={`flex items-start gap-3.5 max-w-[85%] ${
        isAgent ? "self-start" : "self-end flex-row-reverse"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isAgent ? "bg-zinc-900 border-white/10 text-white" : "bg-white border-white text-black"
        }`}
      >
        {isAgent ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div
        className={`p-5 rounded-2xl border text-xs leading-relaxed ${
          isAgent
            ? "bg-zinc-900/40 border-white/10 text-zinc-200 select-text"
            : "bg-white text-black font-semibold select-text"
        }`}
      >
        {segments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {segments.map((segment, index) => {
              if (segment.type === "code") {
                return (
                  <CodeBlock
                    key={`${index}-${segment.language}`}
                    language={segment.language}
                    code={segment.value}
                  />
                );
              }

              const text = segment.value.trim();
              if (!text) {
                return null;
              }

              return (
                <p key={index} className="whitespace-pre-line">
                  {text}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="whitespace-pre-line">{message?.content || ""}</p>
        )}

        {hasArtifact ? <ArtifactCard artifact={message.artifact} /> : null}
      </div>
    </div>
  );
}
