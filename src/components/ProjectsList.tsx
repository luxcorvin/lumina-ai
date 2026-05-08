import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderOpen, Plus, Trash2, Pencil, MessageSquare } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";
import { useUIStore } from "@/lib/ui-store";
import { timeAgo } from "@/lib/utils";

export function ProjectsList() {
  const { projects, chats, setActiveProject, deleteProject, renameProject } = useChatStore();
  const openCreateProject = useUIStore((s) => s.openCreateProject);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div className="bg-grain relative h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-text-muted">
              Keep chats, files, and custom instructions in one place.
            </p>
          </div>
          <button
            onClick={openCreateProject}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Plus size={15} strokeWidth={2.5} /> New project
          </button>
        </motion.div>

        {projects.length === 0 ? (
          <button
            onClick={openCreateProject}
            className="mt-12 block w-full rounded-2xl border border-dashed border-border bg-surface-1/40 px-6 py-16 text-center transition-colors hover:border-border-hover hover:bg-surface-2/40"
          >
            <FolderOpen size={32} className="mx-auto mb-3 text-text-muted" />
            <h3 className="font-display text-lg font-medium text-text-primary">No projects yet</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Create your first project to start organizing your work.
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnimatePresence>
              {/* placeholder to make AnimatePresence happy */}
            </AnimatePresence>
            {projects.map((p) => {
              const projectChats = chats.filter((c) => c.projectId === p.id);
              const lastUpdated = projectChats[0]?.updatedAt;
              const isEditing = editingId === p.id;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface-1/50 p-5 shadow-sm backdrop-blur transition-colors hover:border-border-hover hover:bg-surface-2"
                  onClick={() => !isEditing && setActiveProject(p.id)}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg shadow-inner"
                        style={{
                          background: `color-mix(in oklab, ${p.color} 15%, var(--surface-2))`,
                          border: `1px solid color-mix(in oklab, ${p.color} 30%, var(--border))`,
                        }}
                      >
                        {p.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <form
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={(e) => {
                              e.preventDefault();
                              const v = editName.trim();
                              if (v) renameProject(p.id, v);
                              setEditingId(null);
                            }}
                          >
                            <input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                              className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 font-display text-base font-semibold focus:border-primary focus:outline-none"
                            />
                          </form>
                        ) : (
                          <h3 className="truncate font-display text-base font-semibold text-text-primary">
                            {p.name}
                          </h3>
                        )}
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted">
                          <span>
                            {projectChats.length} {projectChats.length === 1 ? "chat" : "chats"}
                          </span>
                          {lastUpdated && (
                            <>
                              <span>·</span>
                              <span>Updated {timeAgo(lastUpdated)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setEditName(p.name);
                        }}
                        className="rounded-md p-1.5 text-text-muted hover:bg-surface-3 hover:text-text-primary"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
                        }}
                        className="rounded-md p-1.5 text-text-muted hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-text-secondary">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-auto border-t border-border/50 pt-3">
                    {projectChats.length > 0 ? (
                      <div className="space-y-1.5">
                        {projectChats.slice(0, 3).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 truncate text-xs text-text-secondary"
                          >
                            <MessageSquare
                              size={11}
                              className="shrink-0 text-text-muted opacity-60"
                            />
                            <span className="truncate">{c.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs italic text-text-muted">
                        No chats in this project yet
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
