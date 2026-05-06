import { motion } from "motion/react";
import { FolderOpen, Plus, Settings2, Trash2 } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";
import { timeAgo } from "@/lib/utils";

export function ProjectsList() {
  const { projects, chats, createProject, setActiveProject, deleteProject } = useChatStore();

  const handleCreate = () => {
    const name = prompt("Enter project name:");
    if (name) {
      const id = createProject(name);
      setActiveProject(id);
    }
  };

  return (
    <div className="bg-grain relative h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-text-muted">
              Organize your conversations, set custom instructions, and manage knowledge.
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Plus size={16} strokeWidth={2.5} /> Create Project
          </button>
        </motion.div>

        {projects.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface-1/40 px-6 py-16 text-center">
            <FolderOpen size={32} className="mx-auto mb-3 text-text-muted" />
            <h3 className="font-display text-lg font-medium text-text-primary">No projects yet</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Create your first project to start organizing your work.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {projects.map((p) => {
              const projectChats = chats.filter((c) => c.projectId === p.id);
              return (
                <motion.div
                  key={p.id}
                  layoutId={`proj-${p.id}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface-1/50 p-5 shadow-sm backdrop-blur transition-colors hover:border-border-hover hover:bg-surface-2"
                  onClick={() => setActiveProject(p.id)}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg shadow-inner"
                        style={{
                          background: `color-mix(in oklab, ${p.color} 15%, var(--surface-2))`,
                          border: `1px solid color-mix(in oklab, ${p.color} 30%, var(--border))`,
                        }}
                      >
                        {p.emoji}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-text-primary group-hover:text-primary">
                          {p.name}
                        </h3>
                        <div className="text-xs text-text-muted">
                          {projectChats.length} {projectChats.length === 1 ? "chat" : "chats"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
                      }}
                      className="rounded-lg p-1.5 text-text-muted opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {p.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-text-secondary">{p.description}</p>
                  )}

                  <div className="mt-auto border-t border-border/50 pt-3">
                    {projectChats.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Recent chats
                        </div>
                        {projectChats.slice(0, 2).map((c) => (
                          <div key={c.id} className="truncate text-xs text-text-secondary">
                            <span className="mr-1 text-text-muted opacity-50">•</span>
                            {c.title}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs italic text-text-muted">No chats in this project</div>
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
