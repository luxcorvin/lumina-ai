import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Settings as SettingsIcon, Check, Smile, Lightbulb } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import type { MemoryScope } from "@/lib/chat-types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

const EMOJI_POOL = ["📁", "🚀", "✍️", "🔬", "🎨", "💼", "🧠", "🎬", "📚", "🌍", "🛠️", "💡", "🎯", "📊", "🧩", "🪐"];

export function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const createProject = useChatStore((s) => s.createProject);
  const setActiveProject = useChatStore((s) => s.setActiveProject);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [memoryScope, setMemoryScope] = useState<MemoryScope>("default");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setEmoji(EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]);
      setMemoryScope("default");
      setShowSettings(false);
      setEmojiOpen(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    const id = createProject(n, { emoji, memoryScope });
    setActiveProject(id);
    onCreated?.(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="glass pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {showSettings ? "Project settings" : "Create project"}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings((s) => !s)}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                      showSettings
                        ? "bg-surface-3 text-text-primary"
                        : "text-text-muted hover:bg-surface-3 hover:text-text-primary",
                    )}
                    aria-label="Settings"
                  >
                    <SettingsIcon size={15} />
                  </button>
                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showSettings ? (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="px-5 pb-5"
                  >
                    <label className="mb-2 block text-xs font-medium text-text-secondary">
                      Project name
                    </label>
                    <div className="relative flex items-center rounded-xl border border-border bg-surface-2 focus-within:border-primary/60">
                      <button
                        type="button"
                        onClick={() => setEmojiOpen((o) => !o)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-l-xl text-xl hover:bg-surface-3"
                        aria-label="Pick emoji"
                      >
                        <span className="relative">
                          {emoji}
                          <Smile
                            size={9}
                            className="absolute -right-1 -bottom-0.5 text-text-muted"
                          />
                        </span>
                      </button>
                      <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submit()}
                        placeholder="Copenhagen Trip"
                        className="h-11 flex-1 bg-transparent pr-3 text-sm placeholder:text-text-muted focus:outline-none"
                      />
                    </div>

                    <AnimatePresence>
                      {emojiOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 grid grid-cols-8 gap-1 rounded-xl border border-border bg-surface-2 p-2">
                            {EMOJI_POOL.map((e) => (
                              <button
                                key={e}
                                onClick={() => {
                                  setEmoji(e);
                                  setEmojiOpen(false);
                                }}
                                className={cn(
                                  "grid h-8 w-8 place-items-center rounded-lg text-lg transition-colors hover:bg-surface-3",
                                  emoji === e && "bg-surface-3 ring-1 ring-primary/50",
                                )}
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-2/60 px-3 py-2.5 text-xs text-text-secondary">
                      <Lightbulb size={13} className="mt-0.5 shrink-0 text-warning" />
                      <p>
                        Projects keep chats, files, and custom instructions in one place. Use them
                        for ongoing work, or just to keep things tidy.
                      </p>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        onClick={onClose}
                        className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={submit}
                        disabled={!name.trim()}
                        className="rounded-lg px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ background: "var(--gradient-brand)" }}
                      >
                        Create project
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                    className="px-5 pb-5"
                  >
                    <div className="mb-2">
                      <h3 className="text-xs font-semibold tracking-wider text-text-muted uppercase">
                        Memory
                      </h3>
                      <p className="mt-1 text-[11px] text-text-muted">
                        Note that this setting can't be changed later.
                      </p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <ScopeOption
                        label="Default"
                        desc="Project can access memories from outside chats, and vice versa."
                        active={memoryScope === "default"}
                        onClick={() => setMemoryScope("default")}
                      />
                      <ScopeOption
                        label="Project-only"
                        desc="Project can only access its own memories. Its memories are hidden from outside chats."
                        active={memoryScope === "project_only"}
                        onClick={() => setMemoryScope("project_only")}
                      />
                    </div>
                    <div className="mt-5 flex justify-end">
                      <button
                        onClick={() => setShowSettings(false)}
                        className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-surface-3"
                      >
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ScopeOption({
  label,
  desc,
  active,
  onClick,
}: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
        active
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-surface-2/60 hover:bg-surface-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-text-muted">{desc}</div>
      </div>
      {active && <Check size={14} className="mt-0.5 shrink-0 text-primary" />}
    </button>
  );
}
