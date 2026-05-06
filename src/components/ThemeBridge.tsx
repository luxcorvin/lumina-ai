import { useEffect } from "react";
import { useSettings, ACCENTS } from "@/lib/settings-store";

export function ThemeBridge() {
  const { theme, accent, fontScale, reduceMotion } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const apply = (t: "dark" | "light") => {
      root.classList.toggle("dark", t === "dark");
      root.classList.toggle("light", t === "light");
    };
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const onChange = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    apply(theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const a = ACCENTS[accent];
    root.style.setProperty("--primary", a.primary);
    root.style.setProperty("--primary-glow", a.glow);
    root.style.setProperty("--ring", a.primary);
  }, [accent]);

  useEffect(() => {
    const map = { sm: "14.5px", md: "16px", lg: "17.5px" } as const;
    document.documentElement.style.fontSize = map[fontScale];
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.style.setProperty("--motion-scale", reduceMotion ? "0" : "1");
  }, [reduceMotion]);

  return null;
}
