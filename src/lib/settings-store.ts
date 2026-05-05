import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light" | "system";
export type Density = "comfortable" | "compact";
export type AccentColor = "emerald" | "violet" | "rose" | "amber" | "sky";
export type FontScale = "sm" | "md" | "lg";
export type ModelId = "google/gemini-2.5-flash" | "google/gemini-2.5-pro" | "openai/gpt-5" | "openai/gpt-5-mini";

export interface SettingsState {
  // Profile
  displayName: string;
  email: string;
  avatarLetter: string;
  bio: string;

  // Appearance
  theme: Theme;
  accent: AccentColor;
  density: Density;
  fontScale: FontScale;
  reduceMotion: boolean;
  showGrain: boolean;

  // Model & AI
  model: ModelId;
  temperature: number; // 0–1
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;

  // Chat
  sendOnEnter: boolean;
  showTimestamps: boolean;
  autoScroll: boolean;
  codeWrap: boolean;

  // Privacy & data
  saveHistory: boolean;
  shareAnalytics: boolean;

  // Notifications
  soundOnReply: boolean;
  desktopNotify: boolean;

  set: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  reset: () => void;
  exportData: () => string;
}

const DEFAULTS = {
  displayName: "Anonymous",
  email: "guest@aether.app",
  avatarLetter: "A",
  bio: "",

  theme: "dark" as Theme,
  accent: "emerald" as AccentColor,
  density: "comfortable" as Density,
  fontScale: "md" as FontScale,
  reduceMotion: false,
  showGrain: true,

  model: "google/gemini-2.5-flash" as ModelId,
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: "",
  streaming: true,

  sendOnEnter: true,
  showTimestamps: false,
  autoScroll: true,
  codeWrap: false,

  saveHistory: true,
  shareAnalytics: false,

  soundOnReply: false,
  desktopNotify: false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
      reset: () => set({ ...DEFAULTS }),
      exportData: () => {
        const { set: _s, reset: _r, exportData: _e, ...rest } = get();
        return JSON.stringify(rest, null, 2);
      },
    }),
    { name: "aether-settings" },
  ),
);

export const ACCENTS: Record<AccentColor, { primary: string; glow: string; label: string }> = {
  emerald: { primary: "oklch(0.72 0.16 162)", glow: "oklch(0.78 0.14 175)", label: "Emerald" },
  violet: { primary: "oklch(0.7 0.19 295)", glow: "oklch(0.78 0.16 310)", label: "Violet" },
  rose: { primary: "oklch(0.72 0.19 15)", glow: "oklch(0.78 0.17 30)", label: "Rose" },
  amber: { primary: "oklch(0.8 0.17 75)", glow: "oklch(0.86 0.15 90)", label: "Amber" },
  sky: { primary: "oklch(0.72 0.16 230)", glow: "oklch(0.78 0.14 215)", label: "Sky" },
};
