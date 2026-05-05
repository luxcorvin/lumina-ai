import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useChatStore } from "@/lib/chat-store";
import { uid } from "@/lib/chat-types";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function ChatWindow() {
  const { chats, activeChatId, createChat, appendMessage, updateLastAssistant } = useChatStore();
  const chat = chats.find((c) => c.id === activeChatId) ?? null;
  const [streaming, setStreaming] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, streaming]);

  const send = async (text: string) => {
    let id = activeChatId;
    if (!id) id = createChat();

    const userMsg = { id: uid(), role: "user" as const, content: text, createdAt: Date.now() };
    appendMessage(id, userMsg);

    const assistantMsg = {
      id: uid(),
      role: "assistant" as const,
      content: "",
      createdAt: Date.now(),
    };
    appendMessage(id, assistantMsg);

    const history = [
      ...(chats.find((c) => c.id === id)?.messages ?? []),
      userMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

    setStreaming(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
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

  const isEmpty = !chat || chat.messages.length === 0;

  return (
    <div className="bg-grain relative flex h-full flex-col bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState greeting={getGreeting()} onPick={(t) => setPrefill(t)} />
        ) : (
          <div
            className="mx-auto w-full max-w-3xl px-6 py-10"
            style={{ transform: "translateX(calc(var(--sidebar-w, 0px) / -2))" }}
          >
            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {chat!.messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <InputBar onSend={send} disabled={streaming} initialValue={prefill} />
    </div>
  );
}
