import { motion, AnimatePresence } from "motion/react";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import type { Attachment } from "@/lib/chat-types";

export function AttachmentChips({
  items,
  onRemove,
}: {
  items: Attachment[];
  onRemove?: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      <AnimatePresence initial={false}>
        {items.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative flex items-center gap-2 rounded-xl border border-border bg-surface-3 py-1.5 pr-2 pl-1.5"
          >
            {a.kind === "image" && a.dataUrl ? (
              <img
                src={a.dataUrl}
                alt={a.name}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-4 text-text-secondary">
                {a.kind === "image" ? <ImageIcon size={14} /> : <FileText size={14} />}
              </div>
            )}
            <div className="min-w-0 max-w-[160px]">
              <div className="truncate text-xs font-medium text-text-primary">
                {a.name}
              </div>
              <div className="text-[10px] text-text-muted">
                {(a.size / 1024).toFixed(1)} KB
              </div>
            </div>
            {onRemove && (
              <button
                onClick={() => onRemove(a.id)}
                className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-surface-4 text-text-secondary opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
                aria-label="Remove attachment"
              >
                <X size={11} />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
