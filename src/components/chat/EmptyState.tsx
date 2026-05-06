import { motion } from "motion/react";
import { Sparkles, Code2, BookOpen, Lightbulb, PenLine } from "lucide-react";

const SUGGESTIONS = [
  { icon: Lightbulb, title: "Brainstorm ideas", subtitle: "for a weekend side project" },
  { icon: PenLine, title: "Draft a message", subtitle: "to reschedule a meeting" },
  { icon: Code2, title: "Explain this code", subtitle: "and suggest improvements" },
  { icon: BookOpen, title: "Summarize an article", subtitle: "in three short bullets" },
];

interface Props {
  greeting: string;
  onPick: (text: string) => void;
}

export function EmptyState({ greeting, onPick }: Props) {
  return (
    <div className="ambient-glow relative flex h-full flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mb-10 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3 py-1 text-xs text-text-secondary backdrop-blur">
          <Sparkles size={12} className="text-primary" />
          Aether · Gemini 3 Flash
        </div>
        <h1 className="text-balance font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {greeting || "Hello"}
        </h1>
        <p className="mt-3 text-text-secondary">What would you like to think about today?</p>
      </motion.div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } } }}
        className="relative z-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.title}
            variants={{
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0 },
            }}
            whileHover={{ y: -2 }}
            onClick={() => onPick(`${s.title} ${s.subtitle}`)}
            className="group rounded-2xl border border-border bg-surface-2/60 p-4 text-left backdrop-blur transition-all hover:border-border-hover hover:bg-surface-2 hover:shadow-lg"
          >
            <s.icon
              size={18}
              className="text-primary transition-transform group-hover:scale-110"
            />
            <div className="mt-3 text-sm font-medium">{s.title}</div>
            <div className="text-xs text-text-secondary">{s.subtitle}</div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
