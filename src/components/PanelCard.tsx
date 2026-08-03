import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Panel } from "../lib/types";

function isExternal(link: string) {
  return /^https?:\/\//i.test(link);
}

export default function PanelCard({ panel, index }: { panel: Panel; index: number }) {
  const image = panel.imageUrl || "/default-panel.svg";
  const external = isExternal(panel.link);

  const inner = (
    <motion.div
      className="group relative h-full w-full overflow-hidden rounded-xl border border-border bg-surface"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      <motion.img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        variants={{ rest: { scale: 1 }, hover: { scale: 1.05 } }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <h3 className="font-display text-lg font-medium text-white text-balance">
          {panel.title}
        </h3>

        <motion.p
          className="mt-1.5 overflow-hidden text-sm leading-snug text-white/75"
          variants={{
            rest: { height: 0, opacity: 0, marginTop: 0 },
            hover: { height: "auto", opacity: 1, marginTop: 6 },
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {panel.description}
        </motion.p>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-accent/0"
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
        style={{ boxShadow: "inset 0 0 0 1px rgb(var(--c-accent) / 0.5)" }}
      />
    </motion.div>
  );

  const spanClass = panel.featured ? "sm:col-span-2 sm:row-span-2" : "";

  const motionWrapProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.5, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] as const },
  };

  if (external) {
    return (
      <motion.a
        href={panel.link}
        target="_blank"
        rel="noopener noreferrer"
        className={`block aspect-[4/3] sm:aspect-auto ${spanClass}`}
        {...motionWrapProps}
      >
        {inner}
      </motion.a>
    );
  }

  return (
    <motion.div className={`aspect-[4/3] sm:aspect-auto ${spanClass}`} {...motionWrapProps}>
      <Link to={panel.link || `/project/${panel.id}`} className="block h-full w-full">
        {inner}
      </Link>
    </motion.div>
  );
}
