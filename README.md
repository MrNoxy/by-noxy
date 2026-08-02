# Notey

A Goodnotes/Procreate-inspired note-taking and sketching app for iPad, built with React, TypeScript, Vite, and Firebase.

## Status: Phase 2 of 6

This repo is being built in the phased order below. Phases 1–2 are implemented — everything described as "done" is real, verified code (`tsc --noEmit`, `npm run build`, `oxlint` all pass), not scaffolding.

- [x] **Phase 1** — Vite/React/TS setup, routing, theme system, Firebase integration, authentication, dashboard shell
- [x] **Phase 2** — Notebook system, Sketch system, Document library
- [ ] Phase 3 — Drawing engine: canvas, pens, eraser, layers, shapes, color picker, undo/redo
- [ ] Phase 4 — Autosave, IndexedDB, offline support, cloud sync, export
- [ ] Phase 5 — Settings, PWA, animations, keyboard shortcuts
- [ ] Phase 6 — Performance optimization, bug fixes, documentation

## What works right now

**Phase 1 — Auth & shell**
- Register (+ verification email), login, Google sign-in (popup with redirect fallback for iPad Safari/PWA), forgot password, resend verification, logout. "Remember me" sets real Firebase Auth persistence.
- Theming: light/dark/system, 7 accents, persisted, live OS-theme updates.

**Phase 2 — Documents**
- Real CRUD against Firebase Realtime Database: creating a notebook or sketch writes an actual record to `users/{uid}/documents/{docId}` and appears live via a real-time `onValue` subscription — no mock data anywhere.
- **Create Notebook** modal: name, cover color, template (13 real options), paper size, orientation, category, tags.
- **New Sketch** modal: name, 7 real size presets (Square/Portrait/Landscape/iPad Screen/Instagram/A4/Letter) or custom width/height, transparent background toggle, background color.
- Document library with routes for All Documents / Notebooks / Sketches / Favorites / Trash, each filtering the same live data, plus working search across title/category/tags.
- Document cards: favorite toggle, rename (inline, writes to DB), duplicate, move to trash, restore, permanent delete (with confirmation) — every action is a real database write.
- `database.rules.json`: production-style rules — authenticated + per-uid isolation, plus field-level shape/type validation on every document field. Deploy with `firebase deploy --only database`.

"Export" and "Share" are visibly disabled in the document card menu with tooltips explaining they land in Phase 4 and a future release respectively — not hidden, not faked.

Opening a notebook or sketch takes you to a detail screen that fetches and displays the real saved record (title, template, dimensions, etc.) and says plainly that the canvas/editor itself is Phase 3 and isn't built yet.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase project config
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

### Firebase setup

1. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
2. **Authentication** → Settings → **Authorized domains** → add `localhost` and your deployed domain.
3. **Realtime Database** → create a database (region should match `VITE_FIREBASE_DATABASE_URL`), then deploy `database.rules.json`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only database --project notey-71b9a
   ```
   (Or paste the contents of `database.rules.json` into the Realtime Database → Rules tab in the console.)
4. **Storage** → enable default bucket. Storage rules aren't generated yet — nothing uploads files until cover images / exported PNGs exist (Phase 3/4).

### Build

```bash
npm run build    # tsc -b && vite build, output in dist/
npm run lint     # oxlint
```

## Project structure

```
src/
  app/            # router, route guards, AppShell (sidebar/topbar/outlet)
  components/     # shared UI: Button, Card, LoadingScreen, ComingSoon
  features/
    auth/         # Login, Register, ForgotPassword, VerifyEmail, useAuth, AuthContext
    library/      # Library grid, DocumentCard, Create Notebook/Sketch modals,
                   # DocumentDetail placeholder, useDocuments hook
  services/       # documentsService.ts — the only module that touches the
                   # documents/ Realtime Database path directly
  types/          # document.ts — NotebookDocument / SketchDocument / shared types
  firebase/       # single Firebase app/auth/database/storage init
  stores/         # zustand stores (theme)
  styles/         # design tokens (theme.css) + global resets
```

## Known limitations (through Phase 2)

- No canvas/drawing editor yet — opening a document shows its real saved metadata and says so plainly (Phase 3).
- Notebook cover only supports flat color for now; gradient/image/pattern covers are deferred until Storage rules and the image-upload path exist (Phase 3/4) — implementing "Image" cover today would mean either faking it or writing to Storage with no rules protecting it, so it's left out rather than half-built.
- No folders yet, so there's no "Move to folder" action in the document menu — only what's real is in the menu.
- No offline support, no PWA manifest yet.
- Bundle is unsplit (~520KB JS, mostly Firebase) — code-splitting is a Phase 6 task.

