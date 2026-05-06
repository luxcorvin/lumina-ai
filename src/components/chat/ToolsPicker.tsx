import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, Globe, Telescope, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolMode = "web_search" | "deep_research" | null;

interface Props {
  value: ToolMode;
  onChange: (v: ToolMode) => void;
}

const TOOLS = [
  {
    id: "web_search" as const,
    icon: Globe,
    label: "Web search",
    desc: "Browse the live web for fresh info.",
  },
  {
    id: "deep_research" as const,
    icon: Telescope,
    label: "Deep research",
    desc: "Multi-step research with sources.",
    badge: "Beta",
  },
];

export function ToolsPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const active = TOOLS.find((t) => t.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
          active
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-transparent text-text-secondary hover:border-border hover:bg-surface-3 hover:text-text-primary",
        )}
        aria-label="Tools"
      >
        {active ? <active.icon size={13} /> : <Wrench size={13} />}
        <span className="truncate">{active ? active.label : "Tools"}</span>
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
              className="glass absolute bottom-full left-0 z-40 mb-2 w-[300px] overflow-hidden rounded-2xl border border-border shadow-2xl"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                  Tools
                </div>
                <div className="mt-0.5 text-xs text-text-secondary">
                  Augment Aether with live capabilities.
                </div>
              </div>
              <div className="p-1">
                {TOOLS.map((t) => {
                  const isActive = value === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChange(isActive ? null : t.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-3",
                        isActive && "bg-surface-3",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border",
                          isActive
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-surface-2 text-text-secondary",
                        )}
                      >
                        <t.icon size={13} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{t.label}</span>
                          {t.badge && (
                            <span className="rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-text-secondary uppercase">
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-[11px] text-text-muted">{t.desc}</div>
                      </div>
                      {isActive && <Check size={14} className="mt-2 text-primary" />}
                    </button>
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
