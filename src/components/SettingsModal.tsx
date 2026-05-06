import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Palette, Cpu, MessageSquare, Shield, Bell, Database } from "lucide-react";
import { toast } from "sonner";
import {
  useSettings,
  ACCENTS,
  type AccentColor,
  type Theme,
  type Density,
  type FontScale,
  type ModelId,
} from "@/lib/settings-store";
import { MODELS } from "@/lib/models";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "model", label: "Model & AI", icon: Cpu },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="glass relative flex h-[640px] max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
          >
            {/* Sidebar */}
            <aside className="w-56 shrink-0 border-r border-border bg-surface-1/60 p-3">
              <div className="px-2 pt-1 pb-3">
                <h2 className="font-display text-sm font-semibold tracking-wide">Settings</h2>
              </div>
              <nav className="space-y-0.5">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      tab === t.id
                        ? "bg-surface-3 text-text-primary"
                        : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
                    )}
                  >
                    <t.icon size={14} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="relative flex-1 overflow-y-auto">
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="absolute top-4 right-4 z-10 grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
              >
                <X size={15} />
              </button>
              <div className="px-8 py-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === "profile" && <ProfileTab />}
                    {tab === "appearance" && <AppearanceTab />}
                    {tab === "model" && <ModelTab />}
                    {tab === "chat" && <ChatTab />}
                    {tab === "privacy" && <PrivacyTab />}
                    {tab === "notifications" && <NotificationsTab />}
                    {tab === "data" && <DataTab onClose={onClose} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================ Tabs ============================ */

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {desc && <p className="mt-0.5 text-xs text-text-muted">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-surface-4",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-64 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/30",
        props.className,
      )}
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-64 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary focus:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface-2">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex w-64 items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-12 text-right font-mono text-xs text-text-secondary">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

/* ----- Profile ----- */
function ProfileTab() {
  const { displayName, email, bio, avatarLetter, set } = useSettings();
  return (
    <div>
      <Section title="Profile" desc="How you appear inside Aether.">
        <div className="flex items-center gap-4">
          <div
            className="grid h-16 w-16 place-items-center rounded-2xl text-2xl font-semibold text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-brand)" }}
          >
            {avatarLetter || displayName.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="text-xs text-text-muted">Avatar uses your initial.</div>
        </div>
        <Row label="Display name">
          <TextInput
            value={displayName}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder="Your name"
          />
        </Row>
        <Row label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </Row>
        <Row label="Bio" hint="Optional — shown nowhere yet.">
          <TextInput
            value={bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="A short description"
          />
        </Row>
      </Section>
    </div>
  );
}

/* ----- Appearance ----- */
function AppearanceTab() {
  const { theme, accent, density, fontScale, reduceMotion, showGrain, set } = useSettings();
  return (
    <div>
      <Section title="Appearance" desc="Tune the look and feel.">
        <Row label="Theme">
          <Select<Theme>
            value={theme}
            onChange={(v) => set("theme", v)}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
              { value: "system", label: "System" },
            ]}
          />
        </Row>
        <Row label="Accent color" hint="Drives buttons, highlights and rings.">
          <div className="flex w-64 flex-wrap gap-2">
            {(Object.keys(ACCENTS) as AccentColor[]).map((k) => (
              <button
                key={k}
                onClick={() => set("accent", k)}
                aria-label={ACCENTS[k].label}
                className={cn(
                  "h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-surface-1 transition-all",
                  accent === k ? "ring-text-primary" : "ring-transparent",
                )}
                style={{
                  background: `linear-gradient(135deg, ${ACCENTS[k].primary}, ${ACCENTS[k].glow})`,
                }}
              />
            ))}
          </div>
        </Row>
        <Row label="Density">
          <Select<Density>
            value={density}
            onChange={(v) => set("density", v)}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </Row>
        <Row label="Font size">
          <Select<FontScale>
            value={fontScale}
            onChange={(v) => set("fontScale", v)}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Row>
        <Row label="Reduce motion" hint="Minimize animation throughout the app.">
          <Toggle checked={reduceMotion} onChange={(v) => set("reduceMotion", v)} />
        </Row>
        <Row label="Grain texture">
          <Toggle checked={showGrain} onChange={(v) => set("showGrain", v)} />
        </Row>
      </Section>
    </div>
  );
}

/* ----- Model ----- */
function ModelTab() {
  const { model, temperature, maxTokens, systemPrompt, streaming, set } = useSettings();
  return (
    <div>
      <Section title="Model" desc="Configure how Aether thinks.">
        <Row label="Default model">
          <Select<ModelId>
            value={model}
            onChange={(v) => set("model", v)}
            options={MODELS.map((m) => ({
              value: m.id,
              label: `${m.label}${m.badge ? ` · ${m.badge}` : ""} — ${m.provider}`,
            }))}
          />
        </Row>
        <Row label="Temperature" hint="Lower = focused, higher = creative.">
          <Slider
            value={temperature}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => set("temperature", v)}
            format={(v) => v.toFixed(2)}
          />
        </Row>
        <Row label="Max tokens">
          <Slider
            value={maxTokens}
            min={256}
            max={8192}
            step={128}
            onChange={(v) => set("maxTokens", v)}
          />
        </Row>
        <Row label="Streaming responses">
          <Toggle checked={streaming} onChange={(v) => set("streaming", v)} />
        </Row>
      </Section>

      <Section title="System prompt" desc="Sent before every conversation.">
        <textarea
          value={systemPrompt}
          onChange={(e) => set("systemPrompt", e.target.value)}
          placeholder="You are Aether, a thoughtful and concise assistant…"
          rows={5}
          className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Section>
    </div>
  );
}

/* ----- Chat ----- */
function ChatTab() {
  const { sendOnEnter, showTimestamps, autoScroll, codeWrap, set } = useSettings();
  return (
    <Section title="Chat behavior">
      <Row label="Send on Enter" hint="Shift+Enter inserts a newline.">
        <Toggle checked={sendOnEnter} onChange={(v) => set("sendOnEnter", v)} />
      </Row>
      <Row label="Show timestamps">
        <Toggle checked={showTimestamps} onChange={(v) => set("showTimestamps", v)} />
      </Row>
      <Row label="Auto-scroll to latest">
        <Toggle checked={autoScroll} onChange={(v) => set("autoScroll", v)} />
      </Row>
      <Row label="Wrap long code lines">
        <Toggle checked={codeWrap} onChange={(v) => set("codeWrap", v)} />
      </Row>
    </Section>
  );
}

/* ----- Privacy ----- */
function PrivacyTab() {
  const { saveHistory, shareAnalytics, set } = useSettings();
  return (
    <Section title="Privacy" desc="Your data, your choices.">
      <Row label="Save chat history" hint="Disable to keep conversations only in this session.">
        <Toggle checked={saveHistory} onChange={(v) => set("saveHistory", v)} />
      </Row>
      <Row label="Share anonymous analytics" hint="Helps us improve. No content is ever shared.">
        <Toggle checked={shareAnalytics} onChange={(v) => set("shareAnalytics", v)} />
      </Row>
    </Section>
  );
}

/* ----- Notifications ----- */
function NotificationsTab() {
  const { soundOnReply, desktopNotify, set } = useSettings();
  return (
    <Section title="Notifications">
      <Row label="Sound on reply">
        <Toggle checked={soundOnReply} onChange={(v) => set("soundOnReply", v)} />
      </Row>
      <Row label="Desktop notifications" hint="Permission must be granted by your browser.">
        <Toggle
          checked={desktopNotify}
          onChange={async (v) => {
            if (v && typeof Notification !== "undefined" && Notification.permission !== "granted") {
              const r = await Notification.requestPermission();
              if (r !== "granted") {
                toast.error("Notifications were denied by the browser");
                return;
              }
            }
            set("desktopNotify", v);
          }}
        />
      </Row>
    </Section>
  );
}

/* ----- Data ----- */
function DataTab({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const chats = useChatStore((s) => s.chats);

  const exportAll = () => {
    const blob = new Blob(
      [JSON.stringify({ settings: JSON.parse(settings.exportData()), chats }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aether-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  const clearChats = () => {
    if (!confirm("Delete all chats? This cannot be undone.")) return;
    useChatStore.setState({ chats: [], activeChatId: null });
    toast.success("All chats deleted");
  };

  const resetSettings = () => {
    if (!confirm("Reset all settings to defaults?")) return;
    settings.reset();
    toast.success("Settings reset");
  };

  return (
    <div>
      <Section title="Your data" desc="Export or wipe what's stored locally.">
        <Row label="Export everything" hint="Settings + chats as JSON.">
          <button
            onClick={exportAll}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-3"
          >
            Download
          </button>
        </Row>
        <Row label="Clear all chats" hint="Permanently delete every conversation.">
          <button
            onClick={clearChats}
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            Delete chats
          </button>
        </Row>
        <Row label="Reset settings" hint="Return everything to defaults.">
          <button
            onClick={resetSettings}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-3"
          >
            Reset
          </button>
        </Row>
      </Section>

      <div className="mt-2 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg"
          style={{ background: "var(--gradient-brand)" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
