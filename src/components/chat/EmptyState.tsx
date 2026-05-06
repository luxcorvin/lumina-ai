import { motion } from "motion/react";
import { PenLine, GraduationCap, Code2, Coffee, Sparkles } from "lucide-react";

const PILLS = [
  { icon: PenLine, label: "Write", prompt: "Help me write " },
  { icon: GraduationCap, label: "Learn", prompt: "Teach me about " },
  { icon: Code2, label: "Code", prompt: "Write code that " },
  { icon: Coffee, label: "Life stuff", prompt: "I need advice on " },
  { icon: Sparkles, label: "Surprise me", prompt: "Surprise me with something interesting" },
];

interface Props {
  greeting: string;
  onPick: (text: string) => void;
  inputSlot?: React.ReactNode;
}

export function EmptyState({ greeting, onPick, inputSlot }: Props) {
  return (
    <div className="ambient-glow relative flex h-full w-full flex-col items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-center justify-center gap-3"
        >
          <span
            aria-hidden
            className="inline-block h-7 w-7 shrink-0 rounded-full"
            style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-elegant)" }}
          />
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight md:text-[40px]">
            {greeting || "Hello"}, ready when you are.
          </h1>
        </motion.div>

        {inputSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {inputSlot}
          </motion.div>
        )}

        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.04, delayChildren: 0.25 } } }}
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
        >
          {PILLS.map((p) => (
            <motion.button
              key={p.label}
              variants={{
                initial: { opacity: 0, y: 6 },
                animate: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPick(p.prompt)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 px-3.5 py-1.5 text-xs font-medium text-text-secondary backdrop-blur transition-all hover:border-border-hover hover:bg-surface-2 hover:text-text-primary"
            >
              <p.icon size={13} className="text-primary" />
              {p.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
