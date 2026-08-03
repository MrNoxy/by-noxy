# by-noxy

Portfolio site with an animated intro, a dynamic project-panel grid, and an
admin dashboard that acts as a simplified site builder — backed by the
Firebase project you already have wired into Cloudflare Pages.

## How it's built

- **Vite + React + TypeScript**
- **Tailwind CSS** — theme colors are CSS variables so the whole site can
  reskin instantly (`src/lib/themes.ts`)
- **Framer Motion** — the intro sequence and all page/hover animations
- **React Router** — `/`, `/project/:id`, `/login`, `/admin`
- **Firebase Auth + Realtime Database** — same project you're already using

## Folder structure

```
src/
  components/       IntroAnimation, PanelCard, PanelGrid, AdminPanelRow
  lib/               firebase.ts, useAuth, usePanels, useSiteConfig, themes, types
  pages/             Home, ProjectPage, Login, Admin, NotFound
database.rules.json  Realtime Database security rules — deploy this
public/_redirects    Cloudflare Pages SPA fallback (so /admin doesn't 404 on refresh)
```

## 1. Merge this into your repo

Copy everything in this folder into your `by-noxy` repo (it replaces
`router.tsx` / `ComingSoon.tsx` etc. with the new structure). Your existing
`VITE_FIREBASE_*` variables on Cloudflare Pages don't need to change — the
app reads the exact same variable names.

```bash
npm install
npm run dev      # local dev
npm run build    # production build, outputs to dist/
```

## 2. Deploy the database rules

This is the part that actually secures your admin panel. In the Firebase
console: **Realtime Database → Rules**, paste in `database.rules.json`, and
publish. Or with the CLI:

```bash
firebase deploy --only database
```

**What the rules do:**
- `siteConfig` and `panels` are publicly *readable* (so the site works for
  visitors) but only *writable* by a signed-in user whose UID appears under
  `/admins` with a value of `true`.
- `/admins` itself can never be written from the client — only from the
  Firebase console. So even if a stranger creates their own account using
  your public API key (which anyone technically can — that key isn't a
  secret, it just identifies your project), they still can't write anything,
  because they're not in `/admins`.
- Nothing else in the database is readable or writable by default (the rules
  deny everything not explicitly listed).

## 3. Create your admin account

1. Firebase console → **Authentication → Users → Add user**. Use your real
   email and a strong password. Make sure **Sign-in method → Email/Password**
   is enabled (and leave "Email link" off — you don't need it).
2. Copy the new user's **UID**.
3. Firebase console → **Realtime Database → Data**, and manually add:
   ```
   admins
     <your-uid>: true
   ```
4. That's it. Go to `by-noxy.com/login` and sign in. There's no sign-up page
   anywhere in the app on purpose — accounts only get created by you, in the
   console.

If you ever want a second admin, repeat steps 1–3 for that person.

## 4. Using the admin panel

`/admin` has two tabs:

- **Projects** — add/edit/delete panels, set an image URL, description,
  link (internal like `/project/my-app`, or a full `https://` URL for an
  external site), mark one as "featured" to make it span 2×2 in the grid,
  and drag the `⠿` handle to reorder. The grid on the homepage
  auto-reflows (`auto-fit` CSS grid) no matter how many panels you add —
  nothing needs to be resized by hand.
- **Site** — your display name (also what appears in the intro animation),
  tagline, profile picture URL, social links, and the color theme. Six
  themes are built in (`src/lib/themes.ts`) — add more by copying the
  pattern in that file if you want further combinations.

If a panel has no image set, it falls back to a generated placeholder
(`public/default-panel.svg`) instead of a broken image.

## 5. Deploying

Push to your `main` branch as usual — Cloudflare Pages will pick it up with
the same build settings you already have (Node 20, build command
`npm run build`, output directory `dist`).

## Notes / things you might want to change later

- Image storage: right now panel images and your profile picture are plain
  URLs (host them anywhere — Firebase Storage, Imgur, GitHub, etc.). If you'd
  rather upload files directly from `/admin`, that's a natural next step
  using Firebase Storage — happy to wire that in if you want it.
- The intro animation runs once per browser session (via `sessionStorage`),
  so repeat visits during the same session skip straight to the site.
