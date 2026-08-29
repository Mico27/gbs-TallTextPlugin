# gbs-TallTextPlugin

**Version 4.3.1. Requires GB Studio 4.3.0 or newer.**

Draws text at double height, 8 pixels wide by 16 tall, using the technique from Dragon Warrior III on the Game Boy Color. Each character is two tiles stacked one above the other, loaded as the text is printed.

Tall text reads far more comfortably on a small screen, and it gives a game a distinct look. It suits menus, item names, a title screen, or a whole game whose dialogue is set in large type.

![Font](font/dw3-tall.png)

https://github.com/user-attachments/assets/7ceef128-eb02-4d69-bc6a-6ef856e2f34e

---

## Table of Contents

1. [Concepts](#concepts)
2. [Project Setup](#project-setup)
3. [Engine Settings](#engine-settings)
4. [Size Limits and Restrictions](#size-limits-and-restrictions)
5. [The Font Generator](#the-font-generator)
6. [Events Reference](#events-reference)
7. [FAQ](#faq)
8. [Media](#media)
9. [Memory Footprint](#memory-footprint)
10. [Bank 0 (HOME) Usage](#bank-0-home-usage)
11. [Changelog](#changelog)

---

## Concepts

### Double-height characters

Each character is two tiles stacked vertically, so a line of tall text takes **two rows** on the map. A line break moves down a full two rows, and a scrolling line break scrolls by two.

### The character tile cache

Tall characters are loaded into a reserved range of tiles as they are printed, and remembered by character. Each entry owns one pair of tiles, so a repeated character reuses its pair instead of taking new tiles. When the range is full, the character used longest ago gives its pair up.

The **Enable character tile cache** setting turns this off. Its bookkeeping is then left out of the build, giving back 195 bytes of RAM and 348 bytes of ROM, and each character goes into the next pair of the range in turn. Repeated characters no longer share a pair, so the range has to hold every character on screen at once, two tiles each.

### The reserved tile range

The plugin needs a block of background tiles it can own. Scene tiles start at 0, and GB Studio's frame and dialogue tiles sit at 192 to 255, so the range defaults to **112 to 191**, which is 80 tiles and holds 40 characters. A full two-line dialogue can show 36 different characters at once, so keep at least 72 tiles reserved.

### Tile placement on Game Boy Color

On Game Boy Color each cell can take its tile from either of two banks, and the plugin sets that per character:

- **Bank 0 only** is the default, and the only choice on original Game Boy.
- **Bank 1 only (Color)** puts every pair in the second bank, so the reserved range stops competing with scene tiles.
- **Alternate bank 0/1 (Color)** spreads them across both banks, doubling how many characters the range holds.

The two Color choices are for Color Only projects and also work in mixed colour modes on Game Boy Color hardware. On original Game Boy the plugin uses the first bank automatically. In Color Only mode your scene backgrounds may use second-bank tiles themselves, so pick a range free in both.

---

## Project Setup

### 1. Install the plugin and the font

Copy `src/TallTextPlugin` into your project's `plugins` folder, and `font/dw3-tall.png` into `assets/fonts`. That is a ready-made tall font taken from Dragon Warrior III. You can also make your own, see below.

### 2. Set the font before drawing

The plugin draws from whichever font is current, so use the stock **Set Font** event, or an in-text font change, to pick the tall font before drawing.

### 3. Reset the cache in every scene

Add **Tall Text: Reset Tile Cache** to each scene's **On Init**. Loading a scene overwrites the tiles, and nothing does this for you.

### 4. Draw

Use the draw events for instant text, typed-out text, or a full dialogue box.

### Making a tall font

A tall font is a standard GB Studio font asset (`assets/fonts/name.png`, no `.json` needed):

- **128 pixels wide, 16 characters per row, cells of 8 by 16 pixels**, in character order starting at the space.
- **An off-white background, RGB (240,240,240).** Pure white counts as transparent, and GB Studio then trims and shifts the glyphs, which destroys the layout.
- At most **120 characters**, which is 15 rows. A 96-character font at 128 by 96 pixels is the usual case.

---

## Engine Settings

Found under **Settings → Tall Text**.

| Setting | Default | Description |
|---|---|---|
| **First VRAM tile reserved for tall text** | 112 | First background tile index reserved for glyph pairs. |
| **Last VRAM tile reserved for tall text** | 191 | Last reserved tile index, inclusive. |
| **Tile placement (VRAM bank)** | Bank 0 only | Which VRAM tile data bank glyph pairs are uploaded to: Bank 0 only, Bank 1 only (Color), or Alternate bank 0/1 (Color). |
| **Enable character tile cache** | On | Keeps built tile pairs so repeated characters reuse one pair. Turn it off to save 195 bytes of RAM and 348 of ROM, and build every character into the next reserved pair in turn. |
| **Character cache capacity (entries)** | 64 | How many characters the cache remembers, 4 to 128. Each costs 3 bytes of RAM, so lowering it gives RAM back. Raising it helps only with a larger reserved range. Ignored when the cache is off. |
| **Replace stock text rendering** | Off | Leaves GB Studio's own text renderer out of the build and points the stock **Display Dialogue**, **Display Text** and **Menu** events at this plugin. Frees 1,629 bytes of ROM, 1,965 in Color mode, and tiles 204 to 255. See below. |
| **Menu cursor row** | Lower tile of the line | Which of a menu line's two rows the cursor sits on. Lower is level with the baseline, upper reads as slightly raised. |

The cache holds whichever is smaller, the capacity or half the range, and the full range with **Alternate bank 0/1**. With the cache off, the capacity setting drops out and the whole range is used.

---

## Size Limits and Restrictions

- **The reserved range must not overlap** your scene tiles, which start at 0, or GB Studio's frame and dialogue tiles at 192 to 255. The cache uses at most twice its capacity in tiles.
- **The cache can fill up.** When it does, the pair of the character used longest ago is taken, so text drawn earlier can turn into the wrong characters while it is still on screen.
- **Reset the cache on every scene load.** Nothing does it for you. **Reset Tile Cache** also rewinds the position counter when the cache is off, so call it either way.
- **Changing font clears the cache**, whether through the Set Font event or an in-text change. With the cache off there is nothing to clear, so a font change costs nothing.
- **With the cache off, every character is loaded again each time it is used**, which is two tile copies where a cache hit was two map writes. It trades RAM and ROM for that work.
- Coordinates are tile positions, and each line takes **two** rows. **18 characters** fit on a framed dialogue line, and a dialogue defaults to a minimum height of 6, a maximum of 8 and a scroll height of 4, which shows two lines.
- **Avatars and the text colour code are not supported.** Everything else the stock renderer handles works: speed, font change, positioning, wait for input and palette. The direction code is skipped.
- Compatible variants ship for **ContinuousScenePlugin** and **ScreenScrollPlugin** and are selected automatically.

---

### Replacing the stock text renderer

GB Studio's own text renderer normally sits in the ROM alongside this plugin's, even in a
project where every line on screen is drawn by the plugin. **Replace stock text rendering**
removes it.

With the setting on, the engine's own text drawing is left out of the build and this plugin
supplies it instead. Nothing in your project changes. Everything that drew stock text now
draws tall text:

| | |
|---|---|
| **Display Dialogue**, **Display Text** | drawn in tall text, with no change to your scripts |
| **Menu** | drawn in tall text with its cursor rows corrected, see below |

Two things you get back:

- **1,629 bytes of ROM**, or **1,965** in a Color build, plus 5 bytes of RAM.
- **Tiles 204 to 255.** They were the stock renderer's working space, which is why the
  usual advice is to keep clear of them. With that renderer gone, those 52 tiles can go
  straight into the reserved range.

**Menus work with or without the setting.** Two things go wrong with the stock Menu event
once lines are two rows tall. Its cursor steps one row per option, so it falls a row
further behind with each one, and its window is sized for stock rows, so the frame comes
out half as tall as the text inside it.

This plugin carries its own menu loop, a copy of the stock one that knows how tall a line
is. **Menu cursor row** decides which of a line's two rows the cursor sits on: the lower
one is level with the baseline, the upper one reads as slightly raised, and which suits
depends on where your font puts its glyphs in the cell.

| Event | Menu used |
|---|---|
| this plugin's **Menu** event | this plugin's, always |
| stock **Menu** event, setting off | the stock one, unchanged and still right for stock text |
| stock **Menu** event, setting on | this plugin's |

This plugin's Menu event goes straight to its own loop, which is what lets it work either
way. It also means the options are laid out as a single column by the menu itself.

With the setting off, the plugin's copy of the interface file is the engine's own, byte for
byte, so it costs nothing. It does mean the plugin now replaces that file, so it cannot be
combined with another plugin replacing the same one unless a compatibility variant exists.
The ContinuousScene and ScreenScroll variants shipped here already cover those two.

## The Font Generator

`src/*/tools/make_tall_font.js` builds a font asset from a `.ttf`, `.otf` or GNU Unifont
`.hex` file. Double-click **Make Tall Font.bat** for a guided run, or drag a font onto it.

```bash
node src/*/tools/make_tall_font.js --font pixelfont.ttf --project path/to/myGame
```

It writes `assets/fonts/<name>.png`, 8 by 16 cells in a 128 by 96 image, plus its `.gbsres`
file, keeping the id and symbol of any file already there. Regenerating a font therefore
leaves your scene references and your Default Font setting intact.

A font with built-in pixel bitmaps is read straight out, which is what pixel fonts want.
Otherwise the outlines are drawn from the file itself, installed or not. Glyphs are measured
and shifted as a group to fit the cell, and the tool warns when a font is too big rather
than cutting it off quietly.

It needs nothing installed. PNGs are written with node's own compression and font files are
read directly.

The images use GB Studio's own font palette, the four grey shades plus magenta for
transparency, so they open looking like every other font asset in the editor.

---

## Events Reference

All events appear under the **Tall Text** group in the script editor.

| Event | Description |
|---|---|
| **Tall Text: Display Dialogue** | A dialogue box like the stock one, with every line two tiles tall. |
| **Tall Text: Draw To Background** | Instantly draws text at an X/Y tile position on the background layer. |
| **Tall Text: Draw To Overlay** | The same, on the overlay (window) layer. |
| **Tall Text: Draw At Text Speed** | Types the text out at the player's text speed, on either layer. The script waits until it finishes. |
| **Tall Text: Reset Tile Cache** | Forgets all cached glyph pairs. Call this in each scene's On Init. |
| **Tall Text: Set Tile Range** | Changes the reserved VRAM tile range and tile placement at runtime. |
| **Tall Text: Menu** | A menu sized and stepped for two-row lines. Works with or without **Replace stock text rendering**. |

---

## FAQ

**How do I get large, readable text like Dragon Warrior III?**
Install the plugin with the bundled `dw3-tall.png` font, pick that font with **Set Font**, and use
**Tall Text: Display Dialogue** in place of the stock dialogue event.

**How many characters fit on a line?**
18 in a framed dialogue box, and a dialogue shows two lines at a time by default.

**Can I use my own font?**
Yes. A tall font is an ordinary GB Studio font asset with 8 by 16 cells, 16 characters per row.
The generator tool builds one from a `.ttf` or `.otf` file.

**My glyphs came out shifted left or oddly spaced.**
The font image uses pure white as its background. GB Studio treats pure white as transparent and
trims the glyphs. Use an off-white such as RGB (240,240,240).

**Text turns into the wrong characters during a long conversation.**
The tile cache filled up and reused a pair still on screen. Widen the reserved tile range, or raise
the cache capacity, or show less text at once.

**My text is garbled right after a scene loads.**
The cache is out of date. Add **Tall Text: Reset Tile Cache** to every scene's On Init.

**How many tiles should I reserve?**
At least 72. Two lines of dialogue can show 36 different characters, at two tiles each. The default
range of 112 to 191 gives 80.

**My menu cursor drifts down the list, or the frame is too short.**
You are using the stock **Menu** event, which assumes one-row lines. Use **Tall Text: Menu**, or
turn on **Replace stock text rendering** so the stock event uses this plugin's menu.

**Can I make the stock Display Text events draw tall without changing my scripts?**
Yes. Turn on **Replace stock text rendering**. It also frees 1,629 bytes of ROM and tiles 204 to
255.

**Do avatars work in tall dialogue?**
No. Avatars and the text colour code are the two things this renderer does not support.

**How do I get more room for characters on Game Boy Color?**
Set tile placement to **Alternate bank 0/1**. The same range then holds twice as many characters.

**Can I mix tall and normal text?**
Yes, as long as **Replace stock text rendering** is off. Use **Set Font** to switch between the two
fonts, and the stock events for normal text.

**Does it work with the ScreenScroll or ContinuousScene plugins?**
Yes. Compatible variants ship with it and are selected automatically.

---

## Media

Both examples end with a **menu** built from this plugin's Menu event: a window sized for
two-row lines, a cursor that steps to match, and the chosen option left in the `Item_Id`
variable, or zero when B cancelled it.

Two example projects are included:

- `tallTextPluginExample/` shows a background draw, typed-out text and a scrolling dialogue,
  in monochrome.
- `tallTextPluginColorExample/` is a Color Only build showing tile placement: **Bank 1 only**,
  then **Alternate bank 0/1** through the Set Tile Range event.

---

<!-- SETTINGCOST:BEGIN -->
### What each engine setting costs

Each setting changes what gets compiled. Figures are what you **get back by turning
the setting off**. Rows marked *off by default* show what turning it **on** costs, and
sliders show the cost per step. "none" means that budget does not move.

| Setting | Bank 0 | WRAM | Banked ROM |
|---|---|---|---|
| Enable character tile cache | none | **195 B** | **348 B** |
| Character cache capacity (entries) *(slider 4–128, default 64)* | none | 3 B/step | none |
| Replace stock text rendering *(off by default, so this is the cost of turning it on)* | none | -5 B | -1,959 B |
| Menu cursor row → *Upper tile of the line* | none | none | none |

Turning off every on-by-default switch above frees **195 B** of WRAM, **348 B** of banked ROM. That is the
span between the plugin at its fullest and stripped to nothing, so treat it as a
ceiling. You keep whatever your game actually uses.

- **Character cache capacity (entries)**: going from 4 to 128 moves WRAM by +372 B.

<details><summary>How these were measured</summary>

GB Studio 4.3.0-e1. This plugin's engine code was compiled with the toolchain and
flags GB Studio itself uses, and the size of each part of the result was read back and
sorted into the three budgets: the fixed bank 0, work RAM, and switchable ROM banks.

Two caveats. Only this plugin's own engine sources are measured, so a setting that also
changes a shared data structure can move a few more bytes elsewhere. And each setting is
toggled on its own, so a few measure slightly *negative* when enabling their code lets
the compiler drop a fallback path, and a setting that gates other settings shows only
its own contribution.

</details>
<!-- SETTINGCOST:END -->

## Memory Footprint

Measured against the stock GB Studio **4.3.0-e1** engine at default engine settings, report of 2026-08-13. Figures are the difference against a stock project: a file that replaces a stock engine file counts only the change, which is why a plugin can come out negative. Each event you use also compiles a few bytes of script into your project, on top of the fixed cost below.

| Budget | Cost |
|---|---|
| Bank 0 (HOME) | 0 bytes |
| WRAM | +213 bytes |
| Banked ROM | +2,785 bytes |

- **Bank 0:** nothing. Everything the plugin adds is compiled into a switchable ROM bank.
- **WRAM:** 213 bytes: 192 for the cache at 3 bytes per entry, plus the renderer and setting values. Dropping the capacity from 64 to 32 entries saves 96 bytes, and turning the cache off saves 195.
- **Banked ROM:** 2,785 bytes for the renderer on its own. The tall font you add to the project brings its own data, about 2 KB for the 96-character Dragon Warrior III font. Turning on **Replace stock text rendering** takes 1,959 bytes back off the renderer figure.
- **Engine WRAM headroom:** a stock GB Studio 4.3.0 project leaves about **854 bytes** of WRAM free (the engine has 7,776 bytes to work with and uses 6,922 of them). With this plugin installed roughly **641 bytes** remain. Adding more global variables to your project does not change that figure, because script memory is a fixed 3,584 byte block at stock engine settings.
- **SRAM:** not used.

---

<!-- BANK0:BEGIN -->
## Bank 0 (HOME) Usage

Bank 0 is the 16 KB fixed ROM bank shared by the GB Studio engine core, the
interrupt handlers and the GBDK runtime. Extra banked ROM is cheap to add,
bank 0 is not, so bank 0 is usually the first thing a project runs out of.

| | Bytes |
|---|---|
| Bank 0 used by this plugin | **0** |

**This plugin costs nothing in bank 0.** Everything it adds is compiled into a
switchable ROM bank.
<!-- BANK0:END -->

## Changelog

Grouped by the date each change was merged into the official
[gb-studio-plugins](https://github.com/gb-studio-dev/gb-studio-plugins) repository.

Only bug fixes, new features and feature changes are listed. Engine version
bumps, patch regeneration, packaging fixes and documentation edits are omitted.

### 2026-08-08

- Added menu support and a "replace stock UI" engine setting.
- Added a font generator tool.

### 2026-08-07

- Added an engine setting to enable or disable the tile cache.

### 2026-07-03

- Initial release: Dragon Warrior III style 16 pixel tall text using a tile-pair cache.
- Colour-only VRAM bank 1 support.
- ScreenScroll and ContinuousScene plugin compatibility.
