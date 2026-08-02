# Notey

A Goodnotes/Procreate-inspired note-taking and sketching app for iPad, built with React, TypeScript, Vite, and Firebase.

## Status: Phase 3 of 6

This repo is being built in the phased order below. Phases 1–3 are implemented — everything described as "done" is real, verified code (`tsc -b`, `npm run build`, `oxlint` all pass), not scaffolding.

- [x] **Phase 1** — Vite/React/TS setup, routing, theme system, Firebase integration, authentication, dashboard shell
- [x] **Phase 2** — Notebook system, Sketch system, Document library
- [x] **Phase 3** — Drawing engine: canvas, pens, eraser, layers, shapes, color picker, undo/redo
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

**Phase 3 — Drawing engine**

Opening a notebook or sketch now opens a real, full-screen canvas editor (its own route, outside the sidebar/topbar shell — the same way Goodnotes' editor is its own mode).

- **Input**: Pointer Events with pointer capture, `getCoalescedEvents()` for high-frequency sampling, real pressure from `event.pressure` (Apple Pencil / pressure-sensitive stylus; falls back to a fixed value for mouse/finger, which have none).
- **5 pens** (Ballpoint, Fountain Pen, Marker, Highlighter, Soft Pencil) sharing one stroke renderer with different opacity/pressure-sensitivity/texture parameters — documented in `types.ts` as a deliberate scope decision, not a hidden shortcut. Technical Pen, Brush Pen and Mechanical Pencil are **not implemented** rather than shipped as cosmetic renames of the same curve.
- **Real stroke stabilization**: a documented weighted moving-average smoothing algorithm (`engine/stabilizer.ts`) with 5 real levels (off/low/medium/high/maximum), plus quadratic-curve path smoothing in the renderer — two independent, complementary smoothing passes, not a fake slider.
- **Two erasers**: stroke eraser (hit-tests and removes whole strokes) and pixel eraser (real `destination-out` compositing per layer, replayable and undoable — not a bitmap hack).
- **Lasso select**: freeform polygon selection (point-in-polygon test against each object's bounding-box center), drag to move, delete.
- **Manual shapes**: line, rectangle, ellipse via drag. **Not implemented**: automatic shape *recognition* from a rough freehand stroke — that's a real heuristic/ML feature deserving its own pass, not something to fake with an arbitrary closeness threshold.
- **Text tool**: click to place, inline textarea, commits as a canvas text object.
- **Layers**: add/delete/rename/reorder/opacity/visibility/lock, each layer is its own offscreen canvas composited with real alpha blending.
- **Undo/redo**: genuine command pattern (`engine/commands.ts`, `engine/UndoManager.ts`) — every action is a `{ do, undo }` pair operating on a plain reducer, not bitmap snapshots. Keyboard shortcuts: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y, Delete/Backspace for selection.
- **Zoom/pan**: ctrl+scroll or two-finger pinch (tracked via simultaneous Pointer Events) to zoom, trackpad/wheel to pan, reset-view button.
- **Pen-only mode**: when enabled, `pointerType === 'touch'` never draws — only pans/pinches. This is the practical web equivalent of Goodnotes' "draw with Apple Pencil only": browsers expose `pointerType` (mouse/pen/touch) but not OS-level palm rejection, so a genuinely reliable "ignore my palm but not my finger" isn't available to a web app. This toggle is the closest honest approximation.

### Known limitations of the drawing engine

- **Nothing is saved yet.** Every stroke lives only in React state for the current tab. Reload, and it's gone. Cloud/offline persistence for drawings is explicitly Phase 4 — the editor says this in a banner rather than silently losing work without telling you.
- Notebooks currently render a single fixed page (~A4 at 150dpi) — multi-page management (add/reorder/delete pages, thumbnails, bookmarks) is deferred; it's a substantial feature in its own right and is noted as remaining work rather than half-built.
- No Apple Pencil tilt/azimuth-driven brush effects (e.g. calligraphy shading) yet — `tiltX`/`tiltY` are available on the pointer event but not yet wired into the renderer.
- No dedicated Procreate-style brush library (airbrush, watercolor, chalk, texture brushes) — those need real texture/particle rendering, not a renamed stroke, and are left for later polish.
- Very large canvases with thousands of strokes will eventually need viewport culling (only redrawing visible regions) instead of full-layer recomposite every frame — that's Phase 6 performance work; current approach is correct but not yet optimized for extreme stroke counts.
- Erasing/deleting a group of objects and then undoing it restores them appended to the layer (not spliced back to their exact original stacking position) — documented in `engine/commands.ts` as a known simplification.


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
    library/      # Library grid, DocumentCard, Create Notebook/Sketch modals, useDocuments hook
    canvas/        # CanvasEditor, Toolbar, LayersPanel, ColorPicker, useCanvasEngine
      engine/       # stabilizer, renderer, reducer, commands, UndoManager — the pure logic,
                     # deliberately separated from the React/DOM layer above it
  services/       # documentsService.ts — the only module that touches the
                   # documents/ Realtime Database path directly
  types/          # document.ts — NotebookDocument / SketchDocument / shared types
  firebase/       # single Firebase app/auth/database/storage init
  stores/         # zustand stores (theme)
  styles/         # design tokens (theme.css) + global resets
```

## Known limitations (through Phase 3)

- Notebook cover only supports flat color for now; gradient/image/pattern covers are deferred until Storage rules and the image-upload path exist (Phase 4) — implementing "Image" cover today would mean either faking it or writing to Storage with no rules protecting it, so it's left out rather than half-built.
- No folders yet, so there's no "Move to folder" action in the document menu — only what's real is in the menu.
- No offline support, no PWA manifest yet.
- Bundle is unsplit (~540KB JS, mostly Firebase) — code-splitting is a Phase 6 task.
- See "Known limitations of the drawing engine" above for Phase 3-specific gaps (no save/persistence yet, single-page notebooks, no brush library, etc).


