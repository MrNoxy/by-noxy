import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-2xl text-text">Page not found</p>
      <Link to="/" className="font-mono text-xs uppercase tracking-wider text-accent">
        back home
      </Link>
    </div>
  );
}
