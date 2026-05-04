import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ rotate: -10, scale: 0.9 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative grid place-items-center rounded-xl"
        style={{
          width: size,
          height: size,
          background: "var(--gradient-brand)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        <Sparkles className="text-primary-foreground" size={size * 0.55} strokeWidth={2.5} />
      </motion.div>
      <span className="font-display text-lg font-semibold tracking-tight">Aether</span>
    </div>
  );
}
