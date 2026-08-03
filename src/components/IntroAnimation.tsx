import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "draw" | "hold" | "split" | "done";

const EASE = [0.76, 0, 0.24, 1] as const;

export default function IntroAnimation({
  name,
  onComplete,
}: {
  name: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("draw");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 1250); // line finishes drawing the name
    const t2 = setTimeout(() => setPhase("split"), 2350); // underline has settled, curtains begin opening
    const t3 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done") return null;

  const splitting = phase === "split";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* curtains */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            "radial-gradient(160% 260% at 50% 100%, rgb(var(--c-bg-end)) 0%, rgb(var(--c-bg)) 65%)",
        }}
        animate={splitting ? { y: "-100%" } : { y: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(160% 260% at 50% 0%, rgb(var(--c-bg-end)) 0%, rgb(var(--c-bg)) 65%)",
        }}
        animate={splitting ? { y: "100%" } : { y: 0 }}
        transition={{ duration: 0.85, ease: EASE }}
      />

      {/* name + line, centered, sits on top of the curtains and fades as they open */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={splitting ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="relative">
          <motion.h1
            className="font-display font-semibold tracking-tight text-text select-none"
            style={{ fontSize: "clamp(3rem, 12vw, 8rem)" }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            {name}
          </motion.h1>

          {/* traveling line that "draws" the name in */}
          <motion.div
            className="absolute top-0 h-full w-[2px] bg-accent"
            initial={{ left: "0%", opacity: 1 }}
            animate={{ left: "100%", opacity: phase === "draw" ? 1 : 0 }}
            transition={{
              left: { duration: 1.1, ease: EASE },
              opacity: { duration: 0.3, delay: 1.0 },
            }}
          />

          {/* underline that settles once the name is fully drawn */}
          <motion.div
            className="absolute -bottom-3 left-0 right-0 h-px bg-accent origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              phase === "hold" || phase === "split"
                ? { scaleX: 1, opacity: 0.7 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>

        <AnimatePresence>
          {(phase === "hold" || phase === "split") && (
            <motion.p
              className="mt-6 font-mono text-xs tracking-[0.3em] text-muted uppercase"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              portfolio
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
