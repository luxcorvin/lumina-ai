import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { ModelPicker } from "./ModelPicker";
import { ToolsPicker, type ToolMode } from "./ToolsPicker";
import { AttachmentChips } from "./AttachmentChips";
import { getModel } from "@/lib/models";
import { useSettings } from "@/lib/settings-store";
import { uid, type Attachment } from "@/lib/chat-types";

interface Props {
  onSend: (text: string, attachments: Attachment[], tool: ToolMode) => void;
  disabled?: boolean;
  initialValue?: string;
}

const MAX_BYTES = 8 * 1024 * 1024; // 8MB per file

export function InputBar({ onSend, disabled, initialValue }: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tool, setTool] = useState<ToolMode>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { model } = useSettings();
  const currentModel = getModel(model);

  useEffect(() => {
    if (initialValue !== undefined) setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [value]);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is too large (max 8MB).`);
        continue;
      }
      const isImage = file.type.startsWith("image/");
      if (isImage && !currentModel.vision) {
        toast.error(`${currentModel.label} can't see images. Switch model.`);
        continue;
      }
      try {
        if (isImage) {
          const dataUrl = await readAsDataURL(file);
          next.push({
            id: uid(),
            name: file.name,
            mime: file.type,
            size: file.size,
            dataUrl,
            kind: "image",
          });
        } else {
          // text-like fallback
          const text = await file.text().catch(() => "");
          next.push({
            id: uid(),
            name: file.name,
            mime: file.type || "text/plain",
            size: file.size,
            text: text.slice(0, 50_000),
            kind: "file",
          });
        }
      } catch {
        toast.error(`Couldn't read ${file.name}`);
      }
    }
    if (next.length) setAttachments((a) => [...a, ...next]);
  };

  const submit = () => {
    const text = value.trim();
    if ((!text && attachments.length === 0) || disabled) return;
    onSend(text, attachments, tool);
    setValue("");
    setAttachments([]);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-3xl px-4 pb-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div
        className="pointer-events-none absolute -top-12 right-0 left-0 h-12"
        style={{
          background:
            "linear-gradient(to top, var(--surface-0) 0%, color-mix(in oklab, var(--surface-0) 80%, transparent) 50%, transparent 100%)",
        }}
      />
      <div className="relative rounded-3xl border border-border bg-surface-2 shadow-xl transition-colors focus-within:border-border-hover">
        <AttachmentChips
          items={attachments}
          onRemove={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
        />
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
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              title="Attach files or images"
              onClick={() => fileRef.current?.click()}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
            >
              <Plus size={16} />
            </button>
            <ToolsPicker value={tool} onChange={setTool} />
            <div className="ml-1">
              <ModelPicker />
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={submit}
            disabled={(!value.trim() && attachments.length === 0) || disabled}
            className="grid h-8 w-8 place-items-center rounded-full text-primary-foreground transition-all disabled:opacity-30"
            style={{
              background:
                (value.trim() || attachments.length) && !disabled
                  ? "var(--gradient-brand)"
                  : "var(--surface-4)",
              boxShadow:
                (value.trim() || attachments.length) && !disabled
                  ? "var(--shadow-elegant)"
                  : "none",
            }}
            aria-label="Send"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
      <div className="mt-2 text-center text-[11px] text-text-muted">
        Aether can make mistakes. Verify important info.
      </div>
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
