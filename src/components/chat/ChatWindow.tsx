import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useChatStore } from "@/lib/chat-store";
import { uid, type Attachment } from "@/lib/chat-types";
import { useSettings } from "@/lib/settings-store";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { ProjectView } from "../ProjectView";
import { ProjectsList } from "../ProjectsList";
import type { ToolMode } from "./ToolsPicker";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Build OpenAI-style content payload (text + image_url parts) for vision models.
function buildContent(text: string, attachments: Attachment[]) {
  const images = attachments.filter((a) => a.kind === "image" && a.dataUrl);
  const fileBlobs = attachments.filter((a) => a.kind === "file" && a.text);

  let composed = text;
  if (fileBlobs.length) {
    composed += "\n\n" + fileBlobs.map((f) => `--- File: ${f.name} ---\n${f.text}`).join("\n\n");
  }

  if (!images.length) return composed;

  return [
    { type: "text", text: composed || "Please analyze the attached image(s)." },
    ...images.map((a) => ({
      type: "image_url",
      image_url: { url: a.dataUrl as string },
    })),
  ];
}

export function ChatWindow() {
  const {
    chats,
    activeChatId,
    activeProjectId,
    projects,
    createChat,
    appendMessage,
    updateLastAssistant,
  } = useChatStore();
  const { model, systemPrompt, temperature } = useSettings();
  const chat = chats.find((c) => c.id === activeChatId) ?? null;
  const [streaming, setStreaming] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [greeting, setGreeting] = useState("Hello");
  const scrollRef = useRef<HTMLDivElement>(null);

  // avoid SSR/CSR mismatch on time-of-day greeting
  useEffect(() => setGreeting(getGreeting()), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat?.messages.length, streaming]);

  const send = async (text: string, attachments: Attachment[], tool: ToolMode) => {
    let id = activeChatId;
    if (!id) id = createChat();

    const userMsg = {
      id: uid(),
      role: "user" as const,
      content: text,
      attachments,
      tool,
      createdAt: Date.now(),
    };
    appendMessage(id, userMsg);

    const assistantMsg = {
      id: uid(),
      role: "assistant" as const,
      content: "",
      createdAt: Date.now(),
    };
    appendMessage(id, assistantMsg);

    const project = projects.find((p) => p.id === chats.find((c) => c.id === id)?.projectId);
    const projectInstr = project?.instructions?.trim();
    const toolInstr =
      tool === "web_search"
        ? "The user enabled WEB SEARCH. When relevant, cite sources by name and include URLs. If you don't have live access, transparently mark facts that may be stale."
        : tool === "deep_research"
          ? "The user enabled DEEP RESEARCH. Produce a structured, multi-section report with: executive summary, key findings, supporting analysis, sources/citations, and open questions. Be thorough."
          : "";
    const finalSystem = [systemPrompt?.trim(), projectInstr, toolInstr]
      .filter(Boolean)
      .join("\n\n");

    const history = [...(chats.find((c) => c.id === id)?.messages ?? []), userMsg].map((m) => ({
      role: m.role,
      content: m.role === "user" ? buildContent(m.content, m.attachments ?? []) : m.content,
    }));

    setStreaming(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model,
          systemPrompt: finalSystem,
          temperature,
          tool,
        }),
      });

      if (!resp.ok || !resp.body) {
        const data = await resp.json().catch(() => ({ error: "Failed to start stream" }));
        toast.error(data.error || "Something went wrong");
        updateLastAssistant(id, "_Sorry, I couldn't generate a response._");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              updateLastAssistant(id, acc);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error");
    } finally {
      setStreaming(false);
    }
  };

  if (!chat && activeProjectId) {
    if (activeProjectId === "all") {
      return <ProjectsList />;
    }
    return <ProjectView projectId={activeProjectId} />;
  }

  const isEmpty = !chat || chat.messages.length === 0;

  const inputBar = <InputBar onSend={send} disabled={streaming} initialValue={prefill} />;

  return (
    <div className="bg-grain relative flex h-full min-h-0 flex-col bg-background">
      {isEmpty ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <EmptyState greeting={greeting} onPick={(t) => setPrefill(t)} inputSlot={inputBar} />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-6 py-10">
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {chat!.messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
          {inputBar}
        </>
      )}
    </div>
  );
}
