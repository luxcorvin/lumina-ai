import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, Paperclip, Globe } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  initialValue?: string;
}

export function InputBar({ onSend, disabled, initialValue }: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue !== undefined) setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-6">
      {/* gradient fade above */}
      <div
        className="pointer-events-none absolute -top-12 right-0 left-0 h-12"
        style={{
          background:
            "linear-gradient(to top, var(--surface-0) 0%, color-mix(in oklab, var(--surface-0) 80%, transparent) 50%, transparent 100%)",
        }}
      />
      <motion.div
        layout
        className="relative rounded-3xl border border-border bg-surface-2 shadow-xl transition-colors focus-within:border-border-hover"
      >
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Aether…"
          className="block max-h-[220px] w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 placeholder:text-text-muted focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 pt-1 pb-3">
          <div className="flex items-center gap-1">
            <ToolbarButton title="Attach file">
              <Paperclip size={15} />
            </ToolbarButton>
            <ToolbarButton title="Web search">
              <Globe size={15} />
            </ToolbarButton>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={submit}
            disabled={!value.trim() || disabled}
            className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground transition-all disabled:opacity-30"
            style={{
              background: value.trim() && !disabled ? "var(--gradient-brand)" : "var(--surface-4)",
              boxShadow: value.trim() && !disabled ? "var(--shadow-elegant)" : "none",
            }}
            aria-label="Send"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>
      <div className="mt-2 text-center text-[11px] text-text-muted">
        Aether can make mistakes. Verify important info.
      </div>
    </div>
  );
}

function ToolbarButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
    >
      {children}
    </button>
  );
}
