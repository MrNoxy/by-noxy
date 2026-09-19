# Purrfect Blocks

A little block-clearing puzzle where every piece is dressed as a tiny character —
and every character always looks whole, even after a line clears cuts it apart.

## What's in this folder

```
index.html        ← landing page: what this is, plus an "add to home screen" guide
game.html          ← the actual game (game.css, game.js)
studio.html        ← the Skin Studio — a separate app for making skins
skins/             ← always-available skins, one JSON file per skin
early-skins/       ← holiday / limited-time skins, shown only between their dates
manifest.webmanifest, icon-192.png, icon-512.png  ← home-screen install support
```

The game, the Studio, and the landing page are three independent HTML files —
none of them embed the others. The game only *reads* the `skins/` and
`early-skins/` folders at runtime.

## How the skin system actually works

Earlier versions of this tried to give every piece shape (L, T, S, corners,
squares…) its own fixed head/tail/corner/junction layout, decided once when a
piece was placed. That fell apart the moment a line-clear removed *part* of a
piece: the leftover cells still remembered their old role and rotation, so
they could render as a broken-looking fragment.

The current system is much simpler, and recomputes itself every time the
board changes:

- A skin is just **eight images**: a standalone `solo` character, a
  `worm-head` / `worm-middle` / `worm-tail` set that composes into a straight
  run of *any* length in either orientation, and four whole `fat-2` / `fat-3`
  / `fat-wide` / `fat-tall` characters for solid 2×2, 3×3, 3×2 and 2×3 blocks.
- Every time the board is drawn, the game looks at whichever cells are
  **currently** alive for each placed piece, and:
  - if it's a solid block shape (square/rectangle) **and every one of its
    cells is still there**, it's drawn as one whole fat character;
  - otherwise (a bent shape like L/T/S/Z/corner, or a block that's lost any
    cells to a clear), it's split into the longest straight runs it can find,
    plus any leftover single cells, and each run/single is drawn with the
    worm/solo art.
- This means an L-shaped piece is always shown as a long run *plus* a single
  little cat from the moment it's placed — no bend art needed at all. A fat
  3×3 block shows as one big character right up until a line clears through
  it, at which point it's instantly redrawn as clean runs (e.g. clearing the
  middle row of a 3×3 turns it into two separate 3-long runs on the spot).

Nothing about a piece's appearance is "decided" and locked in at placement
time — it's just re-derived from the current board every render, so a
placed character can never end up half-drawn.

## Playing

Open `index.html` (or `game.html` directly) **through a web server**, not by
double-clicking the file. The game loads skins with `fetch()`, and browsers
block `fetch` on `file://` pages. The easiest options:

- Host the folder on **GitHub Pages** (Settings → Pages → deploy from this
  branch/folder) — this is what `index.html`'s install guide assumes.
- Or, locally: `python3 -m http.server` in this folder, then visit
  `http://localhost:8000/index.html`.

If no skins can be loaded for any reason, the game still works fine — pieces
just render as plain little colored tiles.

## Making a skin

Open `studio.html` (it works standalone, no server needed — you can even open
it straight from disk). One export makes **one complete skin**:

1. Upload a PNG for any of the eight part slots (you don't need all of them —
   missing parts fall back to plain tiles in-game).
2. Drag directly on a part's canvas to nudge the art, and use the slider to
   resize it. Turn on "Show guide" to see the connector band the game expects
   at each edge — keep it consistent between head/middle/tail so a run of any
   length reads as one seamless body.
3. Check the two **live preview** sections: one assembles runs of every
   length plus a few real bent game pieces (L, T, S, corners) from your
   current art; the other lets you click "Clear row/column" on any fat block
   to watch it transform into runs exactly like it will in-game.
4. Give it a name. If it's a holiday/limited-time skin, tick the box and set
   a start and end date.
5. Click **Export skin** — this downloads one `.json` file with every image
   and its alignment baked in (images are stored as base64 data, so the
   whole skin is one portable file).

You can also click **Import skin to edit** on any previously exported skin
file to keep tweaking it later.

### Adding the exported skin to the game

- Regular skin → drop the file in `skins/`, then add its filename to
  `skins/manifest.json`'s `"files"` array.
- Holiday skin → drop the file in `early-skins/`, then add its filename to
  `early-skins/manifest.json`'s `"files"` array. The game shows it
  automatically only between its start and end date (read from inside the
  file itself), and otherwise ignores it.

The manifest files exist because static hosting (like GitHub Pages) can't
list a folder's contents — this is the one manual step needed each time you
add a skin.

> Note: some browsers swap `:` for `_` in a *downloaded filename* (colons
> aren't valid in filenames on Windows). That's harmless — the game reads the
> skin's dates from inside the JSON file, not from its filename — but feel
> free to rename the file back to the `Name:start:end.json` form if you'd
> like it tidy, just make sure `manifest.json` lists whatever the file is
> actually named.

## Included starter skins

- `skins/classic-pusheen.json` — always available.
- `early-skins/PusheenHalloween:10.10.2026:02.11.2026.json`
- `early-skins/PusheenChristmas:01.12.2026:06.01.2027.json`

These three are simple placeholder art made to prove the pipeline end to
end — replace them with your own any time using the Studio.

## Skin file format (for reference)

```jsonc
{
  "format": "purrfect-skin-v4",
  "id": "classic-pusheen",
  "name": "Classic Pusheen",
  "holiday": false,
  "startDate": null,        // "DD.MM.YYYY" when holiday is true
  "endDate": null,
  "parts": {
    "solo":        { "image": "data:image/png;base64,...", "x": 0, "y": 0, "scale": 1 },
    "worm-head":   { "...": "..." },
    "worm-middle": { "...": "..." },
    "worm-tail":   { "...": "..." },
    "fat-2":       { "...": "..." },
    "fat-3":       { "...": "..." },
    "fat-wide":    { "...": "..." },
    "fat-tall":    { "...": "..." }
  }
}
```

`x`/`y`/`scale` are the alignment values from the Studio, already baked into
the stored image — they're kept around only so re-opening the skin in the
Studio has something sensible to start from.

Skins exported by the previous version of the Studio (`purrfect-skin-v3`,
with `head`/`tail`/`straight`/`single`/`corner`/`junction` parts) still load:
both the game and the Studio's importer remap `head → worm-head`,
`tail → worm-tail`, `straight → worm-middle` and `single → solo`
automatically. `corner` and `junction` art has no equivalent anymore (bent
pieces are just split into runs now) and is dropped.
