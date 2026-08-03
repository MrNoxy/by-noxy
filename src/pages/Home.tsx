import { motion } from "framer-motion";
import { usePanels } from "../lib/usePanels";
import { useSiteConfig } from "../lib/useSiteConfig";
import PanelGrid from "../components/PanelGrid";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home({ introDone }: { introDone: boolean }) {
  const { config } = useSiteConfig();
  const { panels, loading } = usePanels();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28">
        {/* hero */}
        <motion.section
          className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-end sm:justify-center sm:gap-8 sm:text-left"
          initial={{ opacity: 0, y: 24 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        >
          <div className="order-2 sm:order-1">
            <h1
              className="font-display font-semibold tracking-tight text-text"
              style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}
            >
              {config.name}
            </h1>
            <p className="mt-3 max-w-md font-body text-base text-muted text-balance">
              {config.tagline}
            </p>

            {(config.socials.github || config.socials.twitter || config.socials.linkedin || config.socials.email) && (
              <div className="mt-5 flex justify-center gap-5 sm:justify-start">
                {config.socials.github && (
                  <a href={config.socials.github} target="_blank" rel="noopener noreferrer" className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent">
                    GitHub
                  </a>
                )}
                {config.socials.twitter && (
                  <a href={config.socials.twitter} target="_blank" rel="noopener noreferrer" className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent">
                    Twitter
                  </a>
                )}
                {config.socials.linkedin && (
                  <a href={config.socials.linkedin} target="_blank" rel="noopener noreferrer" className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent">
                    LinkedIn
                  </a>
                )}
                {config.socials.email && (
                  <a href={`mailto:${config.socials.email}`} className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-accent">
                    Email
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="order-1 sm:order-2">
            <div className="h-28 w-28 overflow-hidden rounded-full border border-border bg-surface sm:h-36 sm:w-36">
              {config.pfpUrl ? (
                <img src={config.pfpUrl} alt={config.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted">
                  {config.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* panels */}
        <motion.section
          className="mt-20 sm:mt-28"
          initial={{ opacity: 0, y: 24 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
        >
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
              projects
            </h2>
            <span className="font-mono text-xs text-muted">{panels.length}</span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[220px] animate-pulse rounded-xl bg-surface" />
              ))}
            </div>
          ) : (
            <PanelGrid panels={panels} />
          )}
        </motion.section>
      </div>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 font-mono text-xs text-muted">
          <span>{config.name} — {new Date().getFullYear()}</span>
          <a href="/login" className="transition-colors hover:text-accent">
            admin
          </a>
        </div>
      </footer>
    </div>
  );
}
