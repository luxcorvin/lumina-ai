import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  ArrowLeft,
  Sparkles,
  FileText,
  Upload,
  X,
  ChevronRight,
  Check,
  Lock,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/lib/chat-store";
import { cn, timeAgo } from "@/lib/utils";
import { uid, type Attachment, type ProjectFile } from "@/lib/chat-types";
import { useSettings } from "@/lib/settings-store";
import { InputBar } from "./chat/InputBar";
import type { ToolMode } from "./chat/ToolsPicker";

type Tab = "chats" | "files" | "instructions";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function ProjectView({ projectId }: { projectId: string }) {
  const {
    projects,
    chats,
    createChat,
    setActiveChat,
    setActiveProject,
    appendMessage,
    updateLastAssistant,
    updateProject,
    deleteProject,
    deleteChat,
    addProjectFile,
    removeProjectFile,
  } = useChatStore();
  const { model, systemPrompt, temperature } = useSettings();

  const project = projects.find((p) => p.id === projectId);
  const projectChats = useMemo(
    () =>
      chats
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [chats, projectId],
  );

  const [tab, setTab] = useState<Tab>("chats");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [instr, setInstr] = useState(project?.instructions ?? "");
  const [streaming, setStreaming] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!project) return null;

  const saveName = () => {
    const v = name.trim();
    if (v && v !== project.name) updateProject(project.id, { name: v });
    setEditingName(false);
  };

  const saveInstructions = () => {
    if (instr !== (project.instructions ?? "")) {
      updateProject(project.id, { instructions: instr });
      toast.success("Instructions saved");
    }
  };

  // Send message from project page → creates a new chat in this project, then opens it
  const send = async (text: string, attachments: Attachment[], tool: ToolMode) => {
    const id = createChat(project.id);
    const userMsg = {
      id: uid(),
      role: "user" as const,
      content: text,
      attachments,
      tool,
      createdAt: Date.now(),
    };
    appendMessage(id, userMsg);
    appendMessage(id, {
      id: uid(),
      role: "assistant" as const,
      content: "",
      createdAt: Date.now(),
    });

    const fileContext = project.files.length
      ? "PROJECT FILES (use as background context):\n\n" +
        project.files
          .map((f) => `--- ${f.name} ---\n${(f.text ?? "").slice(0, 8000)}`)
          .join("\n\n")
      : "";
    const finalSystem = [
      systemPrompt?.trim(),
      project.instructions?.trim(),
      fileContext,
      tool === "deep_research"
        ? "Deep research mode: produce a structured report with citations."
        : tool === "web_search"
          ? "Web search mode: cite sources and include URLs."
          : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    setActiveChat(id);
    setStreaming(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: buildContent(text, attachments),
            },
          ],
          model,
          systemPrompt: finalSystem,
          temperature,
          tool,
        }),
      });
      if (!resp.ok || !resp.body) {
        toast.error("Couldn't start chat");
        setStreaming(false);
        return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              updateLastAssistant(id, acc);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setStreaming(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE_BYTES) {
        toast.error(`${f.name} is too large (max 8MB)`);
        continue;
      }
      const text = await f.text().catch(() => "");
      const pf: ProjectFile = {
        id: uid(),
        name: f.name,
        mime: f.type || "text/plain",
        size: f.size,
        text,
        addedAt: Date.now(),
      };
      addProjectFile(project.id, pf);
    }
  };

  return (
    <div className="bg-grain relative flex h-full min-h-0 flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-4">
          {/* Back */}
          <button
            onClick={() => setActiveProject("all")}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <ArrowLeft size={13} /> Projects
          </button>

          {/* Hero header */}
          <div className="flex items-center gap-4">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl shadow-inner"
              style={{
                background: `color-mix(in oklab, ${project.color} 18%, var(--surface-2))`,
                border: `1px solid color-mix(in oklab, ${project.color} 30%, var(--border))`,
              }}
            >
              {project.emoji}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setName(project.name);
                      setEditingName(false);
                    }
                  }}
                  className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 font-display text-2xl font-semibold tracking-tight focus:border-primary focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setName(project.name);
                    setEditingName(true);
                  }}
                  className="group flex items-center gap-2 text-left"
                >
                  <h1 className="font-display text-2xl font-semibold tracking-tight">
                    {project.name}
                  </h1>
                  <Pencil
                    size={13}
                    className="text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              )}
              <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                {project.memoryScope === "project_only" ? (
                  <span className="inline-flex items-center gap-1">
                    <Lock size={10} /> Project-only memory
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Globe2 size={10} /> Default memory
                  </span>
                )}
                <span>·</span>
                <span>Created {timeAgo(project.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(`Delete project "${project.name}"? Chats will be unfiled.`)) {
                  deleteProject(project.id);
                  setActiveProject("all");
                }
              }}
              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete project"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Composer */}
          <div className="mt-6">
            <ProjectComposer onSend={send} disabled={streaming} placeholder={`New chat in ${project.name}`} />
          </div>

          {/* Tabs */}
          <div className="mt-7 flex items-center gap-1 border-b border-border">
            <TabButton active={tab === "chats"} onClick={() => setTab("chats")}>
              Chats
              <span className="ml-1.5 rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] text-text-muted">
                {projectChats.length}
              </span>
            </TabButton>
            <TabButton active={tab === "files"} onClick={() => setTab("files")}>
              Files
              <span className="ml-1.5 rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] text-text-muted">
                {project.files.length}
              </span>
            </TabButton>
            <TabButton active={tab === "instructions"} onClick={() => setTab("instructions")}>
              Instructions
            </TabButton>
          </div>

          {/* Tab content */}
          <div className="mt-5 pb-12">
            <AnimatePresence mode="wait">
              {tab === "chats" && (
                <motion.div
                  key="chats"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-1"
                >
                  {projectChats.length === 0 ? (
                    <EmptyHint
                      icon={<MessageSquare size={18} />}
                      title="No chats yet"
                      hint="Send a message above to start the first chat in this project."
                    />
                  ) : (
                    projectChats.map((c) => {
                      const isRenaming = renamingChatId === c.id;
                      const last = c.messages[c.messages.length - 1];
                      return (
                        <div
                          key={c.id}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2"
                        >
                          <button
                            onClick={() => !isRenaming && setActiveChat(c.id)}
                            className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          >
                            <MessageSquare
                              size={14}
                              className="mt-0.5 shrink-0 text-text-muted"
                            />
                            <div className="min-w-0 flex-1">
                              {isRenaming ? (
                                <form
                                  onClick={(e) => e.stopPropagation()}
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    const v = renameVal.trim();
                                    if (v) {
                                      useChatStore.getState().setChatTitle(c.id, v);
                                    }
                                    setRenamingChatId(null);
                                  }}
                                >
                                  <input
                                    autoFocus
                                    value={renameVal}
                                    onChange={(e) => setRenameVal(e.target.value)}
                                    onBlur={() => setRenamingChatId(null)}
                                    onKeyDown={(e) =>
                                      e.key === "Escape" && setRenamingChatId(null)
                                    }
                                    className="w-full rounded-md border border-border bg-surface-1 px-2 py-1 text-sm focus:border-primary focus:outline-none"
                                  />
                                </form>
                              ) : (
                                <div className="truncate text-sm font-medium text-text-primary">
                                  {c.title}
                                </div>
                              )}
                              {last && (
                                <div className="mt-0.5 line-clamp-1 text-xs text-text-muted">
                                  {typeof last.content === "string"
                                    ? last.content
                                    : "Multimodal message"}
                                </div>
                              )}
                            </div>
                            <div className="shrink-0 self-center text-[11px] text-text-muted">
                              {timeAgo(c.updatedAt)}
                            </div>
                          </button>
                          <div
                            className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setRenamingChatId(c.id);
                                setRenameVal(c.title);
                              }}
                              className="rounded-md p-1.5 text-text-muted hover:bg-surface-3 hover:text-text-primary"
                              aria-label="Rename"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteChat(c.id)}
                              className="rounded-md p-1.5 text-text-muted hover:bg-destructive/10 hover:text-destructive"
                              aria-label="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                            <ChevronRight size={13} className="ml-1 text-text-muted" />
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        const id = createChat(project.id);
                        setActiveChat(id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
                    >
                      <Plus size={12} /> Start new chat
                    </button>
                  </div>
                </motion.div>
              )}

              {tab === "files" && (
                <motion.div
                  key="files"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css,.yaml,.yml,.xml"
                    className="hidden"
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-1/40 px-6 py-8 text-sm text-text-secondary transition-colors hover:border-border-hover hover:bg-surface-2/60 hover:text-text-primary"
                  >
                    <Upload size={14} /> Add files (text · markdown · code)
                  </button>
                  {project.files.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {project.files.map((f) => (
                        <div
                          key={f.id}
                          className="group flex items-center gap-3 rounded-lg border border-border bg-surface-2/50 px-3 py-2"
                        >
                          <FileText size={14} className="shrink-0 text-text-muted" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{f.name}</div>
                            <div className="text-[10px] text-text-muted">
                              {(f.size / 1024).toFixed(1)} KB · added {timeAgo(f.addedAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeProjectFile(project.id, f.id)}
                            className="rounded-md p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            aria-label="Remove file"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === "instructions" && (
                <motion.div
                  key="instr"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
                    <Sparkles size={12} className="text-primary" />
                    Aether will use these instructions in every chat in this project.
                  </div>
                  <textarea
                    value={instr}
                    onChange={(e) => setInstr(e.target.value)}
                    onBlur={saveInstructions}
                    rows={8}
                    placeholder="e.g. You are helping me plan a 5-day trip to Copenhagen. Be concise. Suggest neighborhoods, not tourist traps."
                    className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm leading-relaxed placeholder:text-text-muted focus:border-primary/60 focus:outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted">
                    <span>{instr.length} characters</span>
                    <button
                      onClick={saveInstructions}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface-3 hover:text-text-primary"
                    >
                      <Check size={11} /> Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildContent(text: string, attachments: Attachment[]) {
  const images = attachments.filter((a) => a.kind === "image" && a.dataUrl);
  const fileBlobs = attachments.filter((a) => a.kind === "file" && a.text);
  let composed = text;
  if (fileBlobs.length) {
    composed +=
      "\n\n" + fileBlobs.map((f) => `--- File: ${f.name} ---\n${f.text}`).join("\n\n");
  }
  if (!images.length) return composed;
  return [
    { type: "text", text: composed || "Please analyze the attached image(s)." },
    ...images.map((a) => ({ type: "image_url", image_url: { url: a.dataUrl as string } })),
  ];
}

function ProjectComposer({
  onSend,
  disabled,
  placeholder,
}: {
  onSend: (text: string, atts: Attachment[], tool: ToolMode) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  // Reuse the InputBar component but constrained inside this view
  return (
    <div className="-mx-4">
      <InputBar onSend={onSend} disabled={disabled} placeholder={placeholder} hideFooter compact />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center px-3 py-2 text-xs font-medium transition-colors",
        active ? "text-text-primary" : "text-text-muted hover:text-text-primary",
      )}
    >
      {children}
      {active && (
        <motion.span
          layoutId="project-tab"
          className="absolute right-0 -bottom-px left-0 h-0.5 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

function EmptyHint({
  icon,
  title,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-1/40 px-6 py-12 text-center">
      <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-text-muted">
        {icon}
      </div>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}
