# gbs-TallTextPlugin

**Version 4.3.0 — Requires GB Studio ≥ 4.3.0**

A GB Studio engine plugin that renders **16px-tall (8×16) text** using the technique from *Dragon Warrior III* (GBC): every character is a double-height glyph made of two vertically stacked 8×8 tiles, streamed into VRAM as it is printed.

![Font](font/dw3-tall.png)

https://github.com/user-attachments/assets/7ceef128-eb02-4d69-bc6a-6ef856e2f34e

---

## Table of Contents

1. [Concepts](#concepts)
2. [Project Setup](#project-setup)
3. [Engine Settings](#engine-settings)
4. [Size Limits and Restrictions](#size-limits-and-restrictions)
5. [Events Reference](#events-reference)
6. [Memory Footprint](#memory-footprint)

---

## Concepts

### Double-height characters

Each character is two 8×8 tiles stacked vertically, so a line of tall text occupies **two tilemap rows**. `\n` moves down a full two-row line; `\r` scrolls the text area by two rows.

### The character tile cache

Tall glyphs are uploaded to a reserved range of VRAM tiles as they are printed, and kept in a **cache keyed by character** — each cache entry owns one tile pair. Repeated characters reuse their pair instead of consuming new tiles; when the range is full, the least recently used character's pair is evicted.

### The reserved tile range

The plugin needs a block of background tile indices it can own. Scene background tilesets occupy tiles from 0 upward and GB Studio's UI/dialogue tiles occupy 192–255, so the default reserved range is **112–191** (80 tiles = 40 cached characters). A full two-line dialogue can show up to 36 distinct characters at once, so keep at least ~72 tiles reserved.

### Tile placement on Game Boy Color

On CGB, each tilemap cell can read its tile data from either VRAM bank, and the plugin sets that per character cell:

- **Bank 0 only** — the default, and the only mode on DMG hardware.
- **Bank 1 only (Color)** — every glyph pair lives in bank 1, so the reserved indices stop competing with bank-0 scene tiles entirely.
- **Alternate bank 0/1 (Color)** — entries are spread across both banks, doubling the characters the range can hold.

The two Color modes are meant for Color Only projects, and also work in mixed color modes on GBC hardware. On DMG the plugin falls back to bank 0 automatically. In Color Only mode your scene backgrounds may themselves use bank-1 tiles, so pick a range whose bank-1 indices are free too.

---

## Project Setup

### 1. Install the plugin and the font

Copy `src/TallTextPlugin` into your project's `plugins/` folder, and `font/dw3-tall.png` into `assets/fonts/`. That is a ready-made tall font extracted from Dragon Warrior III; you can also make your own (see below).

### 2. Set the font before drawing

The plugin renders glyphs from the **current** font, so use the stock **Set Font** event (or a `\002` in-text switch) to select the tall font before any tall-text draw.

### 3. Reset the cache in every scene

Add **Tall Text: Reset Tile Cache** to each scene's **On Init**. Loading a scene overwrites VRAM, and there is no automatic hook for scene loads.

### 4. Draw

Use the draw events for instant text, typed-out text, or a full dialogue box.

### Making a tall font

A tall font is a standard GB Studio font asset (`assets/fonts/name.png`, no `.json` needed):

- **128px wide, 16 characters per row, 8×16 pixel cells**, in ASCII order starting at space (0x20).
- **A non-transparent white background, RGB (240,240,240)** — pure white counts as transparent and makes the font compiler trim and left-shift the glyphs, destroying the layout.
- At most **120 characters** (15 tile rows); a 96-character ASCII font at 128×96px is the normal case.

`tools/extract_dw3_font.js` regenerates `font/dw3-tall.png` from the Dragon Warrior III disassembly's font sheet. 76 ASCII characters have DW3 glyphs; the rest are blank.

---

## Engine Settings

Found under **Settings → Tall Text**.

| Setting | Default | Description |
|---|---|---|
| **First VRAM tile reserved for tall text** | 112 | First background tile index reserved for glyph pairs. |
| **Last VRAM tile reserved for tall text** | 191 | Last reserved tile index, inclusive. |
| **Tile placement (VRAM bank)** | Bank 0 only | Which VRAM tile data bank glyph pairs are uploaded to: Bank 0 only, Bank 1 only (Color), or Alternate bank 0/1 (Color). |
| **Character cache capacity (entries)** | 64 | How many characters the cache can track, 4–128. Each entry costs 3 bytes of WRAM, so lowering it reclaims WRAM. Raising it only helps together with a larger reserved tile range. |

Usable cache entries are `min(cache capacity, range size / 2)` — or `min(cache capacity, range size)` with *Alternate bank 0/1*.

---

## Size Limits and Restrictions

- **The reserved range must not collide** with your scene background tiles (0 upward) or GB Studio's UI/dialogue tiles (192–255). The cache uses at most 2 × the cache capacity in tiles.
- **The cache can overflow.** When it is full, the least recently used character's pair is reused, so text drawn long ago can visually corrupt if it is still on screen while a lot of new text is drawn.
- **Reset the cache on every scene load** — there is no automatic hook for it.
- **Switching fonts resets the cache** (via the Set Font event or a `\002` in-text switch).
- Text coordinates are in tiles, and each line of tall text occupies **two** tile rows. **18 characters** fit per framed dialogue line; a dialogue defaults to min height 6, max height 8, scroll height 4 — two visible lines.
- **Avatars and the `\007` text colour code are not supported.** The full control-code set of the stock renderer is otherwise handled (speed, font switch, gotoxy, wait-for-input, palette); `\010` direction is skipped.
- Compatible variants are included for use alongside **ContinuousScenePlugin** and **ScreenScrollPlugin**, and are selected automatically.

---

## Events Reference

All events appear under the **Tall Text** group in the script editor.

| Event | Description |
|---|---|
| **Tall Text: Display Dialogue** | A stock-style dialogue window where every line is two tiles tall. |
| **Tall Text: Draw To Background** | Instantly draws text at an X/Y tile position on the background layer. |
| **Tall Text: Draw To Overlay** | The same, on the overlay (window) layer. |
| **Tall Text: Draw At Text Speed** | Types the text out at the current text speed on either layer. Blocks until done. |
| **Tall Text: Reset Tile Cache** | Forgets all cached glyph pairs. Call this in each scene's On Init. |
| **Tall Text: Set Tile Range** | Changes the reserved VRAM tile range and tile placement at runtime. |

---

## Media

Two example projects are included:

- `tallTextPluginExample/` — background draw, typewriter and a scrolling dialogue, in mono mode.
- `tallTextPluginColorExample/` — a Color Only build demonstrating tile placement: *Bank 1 only*, then *Alternate bank 0/1* via the Set Tile Range event.

---

## Memory Footprint

Measured against the stock GB Studio **4.3.0-e1** engine (per-file SDCC compile with GB Studio's build flags, default engine settings). Values are the plugin's *delta* versus the stock engine; DMG build, with CGB noted where it differs. ROM cost lands in banked ROM (GB Studio's autobanker spreads it across switchable banks); using the plugin's events additionally compiles a few bytes of GBVM script per call into your project's script banks.

| | Cost |
|---|---|
| WRAM | +211 bytes |
| ROM | +2,128 bytes (DMG) / +2,309 bytes (CGB) |

- **WRAM:** 211 bytes — the tile-pair cache arrays (3 × 64 = 192 bytes) plus renderer and engine-field state. Scales with the **Character cache capacity** engine setting at 3 bytes per entry (default 64 entries; e.g. 32 entries saves 96 bytes).
- **ROM:** the figure above is the renderer code only — the tall font asset you add to the project compiles its own data on top (~2 KB for the 96-character DW3 font after tile deduplication).
- **Engine WRAM headroom:** the stock GB Studio 4.3.0 engine leaves about **854 bytes** of WRAM free (usable engine WRAM is 7,776 bytes at 0xC0A0–0xDF00; the stock engine uses 6,922 bytes). With this plugin installed roughly **643 bytes** remain. This figure does not depend on how many global variables your project defines: the script memory array has a fixed size of VM_HEAP_SIZE + (VM_MAX_CONTEXTS × VM_CONTEXT_STACK_SIZE) words — 768 + 16 × 64 = 1,792 words (3,584 bytes) with stock engine settings.
- **SRAM:** not used.

---

<!-- BANK0:BEGIN -->
## Bank 0 (HOME) Usage

Bank 0 is the 16 KB non-switchable ROM bank that the GB Studio engine core,
the interrupt handlers and the GBDK runtime all share. Banked ROM is cheap
(add another bank), bank 0 is not, so it is usually the first thing a project
runs out of.

| | Bytes |
|---|---|
| Bank 0 used by this plugin | **0** |
| Bank 0 free with this plugin installed | **1,451** of 16,384 (91% used) |

**This plugin costs nothing in bank 0.** All of its code lives in a switchable
ROM bank; nothing it adds is resident in bank 0.

<details><summary>How this was measured</summary>

GB Studio 4.3.2, DMG target, default engine settings. Each module's bank 0
contribution is the `A _HOME size` record that SDCC writes into its `.rel`
object, summed over the engine sources this plugin provides. Stock sizes come
from building projects whose only plugin ships no engine C, so every module in
them is the untouched engine; two such builds were compared and agreed on all
73 shared modules.

The "free" figure is a stock project with this plugin and nothing else. Your
own number will differ: other plugins, and any engine settings that change what
the core compiles, move it independently of this plugin.

</details>
<!-- BANK0:END -->
