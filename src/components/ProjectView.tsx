import { useState } from "react";
import { motion } from "motion/react";
import { Plus, MessageSquare, Pencil, Trash2, FolderOpen, Sparkles } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

export function ProjectView({ projectId }: { projectId: string }) {
  const {
    projects,
    chats,
    createChat,
    setActiveChat,
    updateProject,
    deleteProject,
    deleteChat,
  } = useChatStore();

  const project = projects.find((p) => p.id === projectId);
  const projectChats = chats.filter((c) => c.projectId === projectId);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [instructions, setInstructions] = useState(project?.instructions ?? "");

  if (!project) return null;

  const save = () => {
    updateProject(project.id, { name: name.trim() || project.name, description, instructions });
    setEditing(false);
  };

  return (
    <div className="bg-grain relative h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-3xl px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-lg"
            style={{
              background: `color-mix(in oklab, ${project.color} 18%, var(--surface-2))`,
              border: `1px solid color-mix(in oklab, ${project.color} 30%, var(--border))`,
            }}
          >
            {project.emoji}
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 font-display text-2xl font-semibold focus:border-primary focus:outline-none"
              />
            ) : (
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
              <FolderOpen size={12} />
              <span>{projectChats.length} {projectChats.length === 1 ? "chat" : "chats"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={save}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-surface-3"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-3 hover:text-text-primary"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete project "${project.name}"? Chats will be unfiled.`)) {
                      deleteProject(project.id);
                    }
                  }}
                  className="rounded-lg border border-border p-1.5 text-text-secondary hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete project"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Description */}
        <div className="mt-6">
          {editing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-text-muted focus:border-border-hover focus:outline-none"
            />
          ) : (
            project.description && (
              <p className="text-text-secondary">{project.description}</p>
            )
          )}
        </div>

        {/* Custom instructions */}
        <div className="mt-8 rounded-2xl border border-border bg-surface-2/60 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <h3 className="font-display text-sm font-semibold">Custom instructions</h3>
          </div>
          <p className="mb-3 text-xs text-text-muted">
            Add context that Aether should remember for every chat in this project — tone, audience, source documents, goals.
          </p>
          {editing ? (
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              placeholder="e.g. You are helping me with my PhD thesis on quantum biology…"
              className="w-full resize-none rounded-xl border border-border bg-surface-1 px-3 py-2 text-sm placeholder:text-text-muted focus:border-border-hover focus:outline-none"
            />
          ) : (
            <div
              className={cn(
                "min-h-[80px] rounded-xl border border-dashed border-border bg-surface-1/50 px-3 py-2 text-sm whitespace-pre-wrap",
                !project.instructions && "text-text-muted italic",
              )}
            >
              {project.instructions || "No custom instructions yet. Click Edit to add some."}
            </div>
          )}
        </div>

        {/* Chats */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold tracking-wide">Chats in this project</h3>
            <button
              onClick={() => createChat(project.id)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Plus size={12} /> New chat
            </button>
          </div>
          {projectChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-1/40 px-6 py-12 text-center">
              <MessageSquare size={20} className="mx-auto mb-2 text-text-muted" />
              <p className="text-sm text-text-secondary">No chats yet.</p>
              <p className="mt-1 text-xs text-text-muted">Start a conversation in this project.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {projectChats.map((c) => (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-4 py-3 transition-colors hover:border-border-hover hover:bg-surface-2"
                >
                  <button
                    onClick={() => setActiveChat(c.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <MessageSquare size={14} className="shrink-0 text-text-muted" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.title}</div>
                      <div className="text-[11px] text-text-muted">
                        {c.messages.length} {c.messages.length === 1 ? "message" : "messages"} · {timeAgo(c.updatedAt)}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteChat(c.id)}
                    className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
