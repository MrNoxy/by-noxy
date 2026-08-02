# Notey

A Goodnotes/Procreate-inspired note-taking and sketching app for iPad, built with React, TypeScript, Vite, and Firebase.

## Status: Phase 1 of 6

This repo is being built in the phased order below. Only Phase 1 is implemented so far — everything in it is real, working code (verified with `tsc --noEmit`, `npm run build`, and `oxlint`), not scaffolding or stubs.

- [x] **Phase 1** — Vite/React/TS setup, routing, theme system, Firebase integration, authentication, dashboard shell
- [ ] Phase 2 — Notebook system, Sketch system, Document library
- [ ] Phase 3 — Drawing engine: canvas, pens, eraser, layers, shapes, color picker, undo/redo
- [ ] Phase 4 — Autosave, IndexedDB, offline support, cloud sync, export
- [ ] Phase 5 — Settings, PWA, animations, keyboard shortcuts
- [ ] Phase 6 — Performance optimization, bug fixes, documentation

## What works right now

- **Authentication**: register (+ verification email), login, Google sign-in (popup with automatic redirect fallback for iPad Safari/PWA contexts), forgot password, resend verification, logout. "Remember me" sets real Firebase Auth persistence (local vs session).
- **Theming**: light / dark / system, 7 accent colors, persisted across reloads, live-updates if the OS theme changes.
- **Dashboard shell**: sidebar navigation, top bar with search/theme/accent controls, gradient "Create Notebook" / "New Sketch" CTAs, empty-state document grid.
- **Routing**: protected routes redirect unauthenticated users to `/login`; a loading screen covers the brief window while Firebase resolves auth state on load.

"Create Notebook" and "New Sketch" currently route to clearly labeled placeholder screens ("scheduled for Phase 2") rather than pretending to work — nothing in this codebase fakes functionality it doesn't have.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase project config
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

### Firebase setup

You need, in your Firebase project:

1. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
2. **Authentication** → Settings → **Authorized domains** → add `localhost` and your deployed domain (e.g. `your-app.vercel.app`). Google Sign-In fails with `auth/unauthorized-domain` until you do this.
3. **Realtime Database** → create a database (region should match `VITE_FIREBASE_DATABASE_URL`).
4. **Storage** → enable default bucket.

Security rules for Database/Storage are **not yet generated** — that's part of Phase 2/4, once there's real data being written that the rules need to protect. Until then, treat this as a local-development-only setup; do not deploy Phase 1 publicly with default/open rules.

### Build

```bash
npm run build    # tsc -b && vite build, output in dist/
npm run lint     # oxlint
```

## Project structure

```
src/
  app/            # router, route guards
  components/     # shared UI: Button, Card, LoadingScreen, ComingSoon
  features/
    auth/         # Login, Register, ForgotPassword, VerifyEmail, useAuth, AuthContext
    dashboard/    # Dashboard shell
  firebase/        # single Firebase app/auth/database/storage init
  stores/          # zustand stores (theme)
  styles/          # design tokens (theme.css) + global resets
```

## Known limitations (Phase 1)

- No notebook/sketch creation yet — placeholders link out honestly rather than faking the flow.
- No Firestore/Realtime Database security rules yet (nothing writes user data yet, so there's nothing to protect — this lands in Phase 2).
- No offline support, no PWA manifest yet — both are later phases.
- Bundle is unsplit (~480KB JS, mostly the Firebase SDK) — code-splitting is a Phase 6 performance task, premature to do before there's more app to split.
