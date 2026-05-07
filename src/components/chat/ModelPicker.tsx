import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react";
import { MODELS, getModel, type ModelOption } from "@/lib/models";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

// Curated flagship picks shown in the primary view.
const FLAGSHIP_IDS = [
  "google/gemini-3.1-pro-preview",
  "openai/gpt-5",
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-pro",
];

const FAMILY_META: Record<ModelOption["family"], { label: string; icon: typeof Sparkles }> = {
  frontier: { label: "Frontier", icon: Sparkles },
  fast: { label: "Fast & efficient", icon: Zap },
  reasoning: { label: "Reasoning", icon: Brain },
};

export function ModelPicker({ compact = false }: { compact?: boolean }) {
  const { model, set, extendedThinking } = useSettings();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"primary" | "all">("primary");
  const [query, setQuery] = useState("");
  const current = getModel(model);

  const flagships = useMemo(
    () => FLAGSHIP_IDS.map((id) => MODELS.find((m) => m.id === id)).filter(Boolean) as ModelOption[],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? MODELS.filter(
          (m) =>
            m.label.toLowerCase().includes(q) ||
            m.provider.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q),
        )
      : MODELS;
    return list.reduce<Record<string, ModelOption[]>>((acc, m) => {
      (acc[m.family] ||= []).push(m);
      return acc;
    }, {});
  }, [query]);

  const close = () => {
    setOpen(false);
    // reset view next tick after close animation
    setTimeout(() => {
      setView("primary");
      setQuery("");
    }, 180);
  };

  const pick = (id: string) => {
    set("model", id);
    close();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex h-7 items-center gap-1 rounded-md border border-transparent px-1.5 text-[11px] font-medium text-text-secondary transition-all hover:border-border hover:bg-surface-3 hover:text-text-primary",
          compact && "px-1",
        )}
      >
        <Sparkles size={11} className="text-primary" />
        <span className="max-w-[120px] truncate">{current.label}</span>
        <ChevronDown size={10} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={close} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="glass absolute bottom-full left-0 z-40 mb-2 w-[300px] overflow-hidden rounded-xl border border-border shadow-2xl"
            >
              <AnimatePresence mode="wait" initial={false}>
                {view === "primary" ? (
                  <motion.div
                    key="primary"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="border-b border-border px-3 py-2">
                      <div className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                        Choose model
                      </div>
                    </div>

                    <div className="p-1">
                      {flagships.map((m) => (
                        <ModelRow
                          key={m.id}
                          m={m}
                          active={m.id === model}
                          onClick={() => pick(m.id)}
                        />
                      ))}
                    </div>

                    <div className="mx-2 border-t border-border" />

                    {/* Extended thinking toggle */}
                    <button
                      type="button"
                      onClick={() => set("extendedThinking", !extendedThinking)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3"
                    >
                      <div className="flex items-center gap-2">
                        <Brain size={13} className="text-primary" />
                        <div>
                          <div className="text-[12px] font-medium text-text-primary">
                            Extended thinking
                          </div>
                          <div className="text-[10px] text-text-muted">
                            Deeper reasoning for hard prompts
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "relative h-4 w-7 rounded-full transition-colors",
                          extendedThinking ? "bg-primary" : "bg-surface-4",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all",
                            extendedThinking ? "left-3.5" : "left-0.5",
                          )}
                        />
                      </span>
                    </button>

                    <div className="mx-2 border-t border-border" />

                    <button
                      type="button"
                      onClick={() => setView("all")}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={13} className="text-text-secondary" />
                        <div className="text-[12px] font-medium text-text-primary">More models</div>
                      </div>
                      <ChevronRight size={12} className="text-text-muted" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-1 border-b border-border px-1.5 py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setView("primary");
                          setQuery("");
                        }}
                        className="grid h-7 w-7 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
                        aria-label="Back"
                      >
                        <ArrowLeft size={13} />
                      </button>
                      <div className="flex flex-1 items-center gap-1.5 rounded-md bg-surface-3 px-2">
                        <Search size={11} className="text-text-muted" />
                        <input
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search models…"
                          className="h-7 w-full bg-transparent text-[12px] placeholder:text-text-muted focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto py-1">
                      {(["frontier", "fast", "reasoning"] as const).map((fam) => {
                        const items = filtered[fam];
                        if (!items?.length) return null;
                        const Meta = FAMILY_META[fam];
                        return (
                          <div key={fam} className="px-1">
                            <div className="flex items-center gap-1 px-2 pt-1.5 pb-0.5 text-[9px] font-semibold tracking-wider text-text-muted uppercase">
                              <Meta.icon size={9} />
                              {Meta.label}
                            </div>
                            {items.map((m) => (
                              <ModelRow
                                key={m.id}
                                m={m}
                                active={m.id === model}
                                onClick={() => pick(m.id)}
                              />
                            ))}
                          </div>
                        );
                      })}
                      {Object.values(filtered).every((v) => !v?.length) && (
                        <div className="px-4 py-8 text-center text-xs text-text-muted">
                          No models match “{query}”.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModelRow({
  m,
  active,
  onClick,
}: {
  m: ModelOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-3",
        active && "bg-surface-3",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[12px] font-medium text-text-primary">{m.label}</span>
          {m.badge && (
            <span className="rounded-full border border-border bg-surface-2 px-1 py-px text-[8px] font-semibold tracking-wide text-text-secondary uppercase">
              {m.badge}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-text-muted">
          {m.provider} · {m.description}
        </div>
      </div>
      {active && <Check size={12} className="mt-1 shrink-0 text-primary" />}
    </button>
  );
}
