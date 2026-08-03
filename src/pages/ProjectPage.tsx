import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePanels } from "../lib/usePanels";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ProjectPage() {
  const { id } = useParams();
  const { panels, loading } = usePanels();
  const panel = panels.find((p) => p.id === id);

  if (loading) {
    return <div className="min-h-screen" />;
  }

  if (!panel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-mono text-sm text-muted">this project doesn't exist</p>
        <Link to="/" className="font-mono text-xs uppercase tracking-wider text-accent">
          back home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent"
        >
          ← back
        </Link>

        <motion.h1
          className="mt-8 font-display font-semibold tracking-tight text-text"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        >
          {panel.title}
        </motion.h1>

        <motion.div
          className="mt-8 overflow-hidden rounded-xl border border-border"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          <img
            src={panel.imageUrl || "/default-panel.svg"}
            alt={panel.title}
            className="w-full object-cover"
          />
        </motion.div>

        <motion.p
          className="mt-8 max-w-2xl text-base leading-relaxed text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        >
          {panel.description}
        </motion.p>
      </div>
    </motion.div>
  );
}
