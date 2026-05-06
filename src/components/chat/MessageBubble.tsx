import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Sparkles, Globe, Telescope, FileText } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/chat-types";

export function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    const images = (msg.attachments ?? []).filter((a) => a.kind === "image");
    const files = (msg.attachments ?? []).filter((a) => a.kind === "file");
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="flex max-w-[80%] flex-col items-end gap-2">
          {msg.tool && (
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {msg.tool === "web_search" ? <Globe size={10} /> : <Telescope size={10} />}
              {msg.tool === "web_search" ? "Web search" : "Deep research"}
            </div>
          )}
          {images.length > 0 && (
            <div className="grid max-w-full grid-cols-2 gap-2">
              {images.map((a) => (
                <img
                  key={a.id}
                  src={a.dataUrl}
                  alt={a.name}
                  className="max-h-48 rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-col gap-1">
              {files.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface-3 px-2.5 py-1.5 text-xs"
                >
                  <FileText size={12} className="text-text-secondary" />
                  <span className="truncate">{a.name}</span>
                </div>
              ))}
            </div>
          )}
          {msg.content && (
            <div className="rounded-2xl rounded-tr-md border border-border bg-surface-3 px-4 py-2.5 text-sm text-text-primary">
              {msg.content}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <div
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
        style={{ background: "var(--gradient-brand)" }}
      >
        <Sparkles size={13} className="text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div className="prose-chat min-w-0 flex-1 pt-0.5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          }}
        >
          {msg.content || " "}
        </ReactMarkdown>
        {msg.content === "" && <TypingIndicator />}
      </div>
    </motion.div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = extractText(children);
  return (
    <div className="group relative my-3">
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-md border border-border bg-surface-2 text-text-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-primary"
        aria-label="Copy code"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
      <pre>{children}</pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && typeof node === "object" && "props" in node) {
    // @ts-expect-error react node
    return extractText(node.props.children);
  }
  return "";
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="dot-1 h-1.5 w-1.5 rounded-full bg-text-secondary" />
      <span className="dot-2 h-1.5 w-1.5 rounded-full bg-text-secondary" />
      <span className="dot-3 h-1.5 w-1.5 rounded-full bg-text-secondary" />
    </div>
  );
}
