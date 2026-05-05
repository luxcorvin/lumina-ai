import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Sparkles, Zap, Cpu } from "lucide-react";
import { MODELS, getModel, type ModelOption } from "@/lib/models";
import { useSettings } from "@/lib/settings-store";
import { cn } from "@/lib/utils";

const FAMILY_META: Record<ModelOption["family"], { label: string; icon: typeof Sparkles }> = {
  frontier: { label: "Frontier", icon: Sparkles },
  fast: { label: "Fast & efficient", icon: Zap },
  open: { label: "Open source", icon: Cpu },
};

export function ModelPicker({ compact = false }: { compact?: boolean }) {
  const { model, set } = useSettings();
  const [open, setOpen] = useState(false);
  const current = getModel(model);

  const grouped = MODELS.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.family] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-border hover:bg-surface-3 hover:text-text-primary",
          compact && "px-2",
        )}
      >
        <Sparkles size={13} className="text-primary" />
        <span className="truncate">{current.label}</span>
        <ChevronDown
          size={12}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="glass absolute bottom-full left-0 z-40 mb-2 w-[340px] overflow-hidden rounded-2xl border border-border shadow-2xl"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                  Choose model
                </div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  Pick what fits your task.
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto py-1">
                {(["frontier", "fast", "open"] as const).map((fam) => {
                  const items = grouped[fam];
                  if (!items?.length) return null;
                  const Meta = FAMILY_META[fam];
                  return (
                    <div key={fam} className="px-1 py-1">
                      <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
                        <Meta.icon size={10} />
                        {Meta.label}
                      </div>
                      {items.map((m) => {
                        const active = m.id === model;
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              set("model", m.id);
                              setOpen(false);
                            }}
                            className={cn(
                              "group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-3",
                              active && "bg-surface-3",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-text-primary">
                                  {m.label}
                                </span>
                                {m.badge && (
                                  <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-text-secondary uppercase">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 truncate text-[11px] text-text-muted">
                                {m.provider} · {m.description}
                              </div>
                            </div>
                            {active && (
                              <Check size={14} className="mt-1 shrink-0 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
