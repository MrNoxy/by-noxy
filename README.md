# Purrfect Blocks

A little block-clearing puzzle where every piece is dressed as a tiny character —
and every character is a fully hand-drawn picture, never built from stitched-
together parts.

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

## How the skin system works

A skin is **nine fully hand-drawn images** — nothing is glued together from
smaller parts:

- `run-1` through `run-5`: one complete picture for each straight-run length,
  from a single cell up to 5 cells long (the longest any placed piece can
  ever produce). Authored lying flat, facing right; the game rotates the same
  picture 90° for a vertical placement.
- `fat-2`, `fat-3`, `fat-wide`, `fat-tall`: one whole character each, for a
  solid 2×2, 3×3, 3×2 or 2×3 block.

Every time the board is drawn, the game looks at whichever cells are
**currently** alive for each placed piece, and:

- if it's a solid block shape (square/rectangle) **and every one of its
  cells is still there**, it's drawn as one whole fat character;
- otherwise — a bent shape like L/T/S/Z/a corner, or a block that's lost any
  cells to a clear — it's split into the longest straight runs it can find,
  plus any leftover single cells, and each run is drawn with the matching
  `run-N` picture.

So a T-shaped piece, for instance, gets no art of its own: it's just your
`run-3` picture plus your `run-1` picture, positioned correctly, from the
moment it's placed. A fat 3×3 block shows as one big character right up
until a line clears through it, at which point it's instantly redrawn as
clean runs (clearing the middle row of a 3×3 turns it into two separate
`run-3` pictures on the spot). Nothing about a piece's appearance is
decided and locked in at placement time — it's re-derived from the current
board every render, so a placed character can never end up half-drawn.

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

1. Upload a PNG for any of the nine part slots (you don't need all of them —
   missing parts fall back to plain tiles in-game).
2. Drag directly on a part's canvas to nudge the art, and use the slider to
   resize it. There's no seam to match against another part anymore — each
   length is a finished picture — but "Show guide" still gives you light
   cell-boundary lines while you draw.
3. Check the three **live preview** sections: your five run lengths side by
   side (for a quick consistency check), a handful of real bent game pieces
   (L, T, S, corners) assembled live from your art, and the fat blocks with
   working "Clear row/column" buttons so you can watch a block transform into
   runs exactly like it will in-game.
4. Give it a name. If it's a holiday/limited-time skin, tick the box and set
   a start and end date.
5. Click **Export skin** — downloads one `.json` file with every image baked
   in as base64 data, so the whole skin is one portable file.

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

All three share the same gray, chubby cat — real Pusheen holiday variants
don't dye the fur, they just add a hat, so that's what these do (a witch hat
for Halloween, a santa hat for Christmas). These are still simple placeholder
art, made to prove the pipeline and give the game some personality out of the
box — replace them with your own any time using the Studio for something
closer to hand-illustrated official artwork.

## Skin file format (for reference)

```jsonc
{
  "format": "purrfect-skin-v5",
  "id": "classic-pusheen",
  "name": "Classic Pusheen",
  "holiday": false,
  "startDate": null,        // "DD.MM.YYYY" when holiday is true
  "endDate": null,
  "parts": {
    "run-1":    { "image": "data:image/png;base64,...", "x": 0, "y": 0, "scale": 1 },
    "run-2":    { "...": "..." },
    "run-3":    { "...": "..." },
    "run-4":    { "...": "..." },
    "run-5":    { "...": "..." },
    "fat-2":    { "...": "..." },
    "fat-3":    { "...": "..." },
    "fat-wide": { "...": "..." },
    "fat-tall": { "...": "..." }
  }
}
```

`x`/`y`/`scale` are the alignment values from the Studio, already baked into
the stored image — they're kept around only so re-opening the skin in the
Studio has something sensible to start from.

Skins from earlier formats (`purrfect-skin-v3`: head/tail/straight/single;
`purrfect-skin-v4`: worm-head/worm-middle/worm-tail/solo) still load, but only
partially: those tiles were authored to be glued together, not as a complete
run of any length, so only the single-cell art and the four fat blocks carry
over as `run-1` and `fat-*`. `run-2` through `run-5` come back empty and need
drawing fresh in the Studio.
