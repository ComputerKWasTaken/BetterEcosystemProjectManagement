# Adventure Page — Custom Themes & Sprite System

> Detailed DOM reference for AI Dungeon's sprite-based custom theme system, including theme cards in settings, the sprite sheet layout, 9-slice rendering, and text style options.

## Overview

AI Dungeon offers custom visual themes that reskin UI elements (buttons, borders, backgrounds) using **sprite sheets** — single PNG images containing pre-rendered UI regions. The app crops specific rectangles from the sprite via CSS `background-image` + negative `left`/`top` offsets inside `overflow: hidden` containers.

This system is important for BetterDungeon because any custom UI elements (like the Try mode button or input mode sprites) must align precisely with these sprite regions to look correct.

---

## Location in DOM

Themes appear in the **Settings Panel → Gameplay tab → Themes** section:

```
Settings Panel
  └── Gameplay Tab
      └── Themes section (horizontal scroll of theme cards)
          ├── Theme Card: "S'mores"
          ├── Theme Card: "Cyber"
          └── ... (more themes)
```

The Themes section header:
```html
<span class="is_Text font_body _col-coreA8 ... _tt-uppercase">Themes</span>
```

Theme cards are arranged in a horizontal row inside a scrollable container.

---

## Theme Card Structure

Each theme card is a button containing a left info column and a right preview panel:

```html
<div role="button"
     class="is_Button is_View ... _h-t-size-16 _btlr-0px _btrr-0px _bbrr-0px _bblr-0px
            _pr-t-space-1 _pl-t-space-1 _fd-row _bg-background
            _btw-0px _brw-0px _bbw-0px _blw-0px">

  <!-- LEFT: Theme Info Column (width ~33%) -->
  <div class="is_Column is_View _fd-column _pt-t-space-1 _pr-t-space-0
              _pb-t-space-1 _pl-t-space-1 _h-10037 _jc-space-betwe... _w-3337">

    <!-- Color Indicator Dot -->
    <div class="is_View ... _h-t-size-4 _w-t-size-4 _btlr-99px _btrr-99px
                _bbrr-99px _bblr-99px _btw-1px _brw-1px _bbw-1px _blw-1px
                _btc-coreA1 _brc-coreA1 _bbc-coreA1 _blc-coreA1 _bg-coreA1">
    </div>

    <!-- Theme Name -->
    <div class="is_Column is_View _fd-column _gap-t-space-1--53">
      <span class="is_Text font_body _col-color ... _fos-f-size-2 _fow-500">
        S'mores
      </span>
    </div>
  </div>

  <!-- RIGHT: Theme Preview Panel -->
  <div class="is_View ... _bg-core0 _h-t-size-14 _btlr-t-radius-1 _btrr-t-radius-1
              _bbrr-t-radius-1 _bblr-t-radius-1 _ox-hidden _oy-hidden
              _fg-1 _fs-1 _fb-auto _ai-center _jc-center">
    [Offscreen Canvas]
    [Blurred Adventure Background]
    [Header Sprite Preview]
    [9-Slice Border Grid]
    [Button Preview + Text Sample]
  </div>
</div>
```

### Theme Card Properties

| Property | Value |
|----------|-------|
| **Element** | `div[role="button"]` with `is_Button` |
| **Height** | `t-size-16` |
| **Border radius** | `0px` (square corners) |
| **Border width** | `0px` (no border) |
| **Layout** | `flex-direction: row` |
| **Left column width** | ~33% (`_w-3337`) |
| **Color dot** | Circle (`border-radius: 99px`), `t-size-4` × `t-size-4`, `bg-coreA1` |
| **Theme name** | `font_body`, `f-size-2`, weight 500 |

---

## Sprite Sheet System

### Sprite Sheet URL Pattern

```
https://latitude-standard-pull-zone-1.b-cdn.net/site_assets/aidungeon/client/themes/{themeId}.png
```

### Known Theme Sprite Sheets

| Theme | ID |
|-------|----|
| S'mores | `3e9ce211-4caf-49b7-89f9-6f8375cd0100` |
| Cyber | `00bdb29c-f308-46a5-33ee-5ee4f4c0ff00` |

### How Sprites Are Rendered

Each sprite region is displayed using a **viewport + offset** pattern:

```html
<!-- Viewport: clips the visible area -->
<div class="is_View _pos-relative _ox-hidden _oy-hidden _w-{width} _h-{height}">

  <!-- Inner: sized to full sprite, positioned with negative offsets -->
  <div style="width: {spriteW}px; height: {spriteH}px; left: {-offsetX}px; top: {-offsetY}px;">

    <!-- Sprite image via background-image -->
    <div style="background-image: url('{spriteUrl}');"
         class="r-1niwhzg r-vvn4in r-u6sd8q r-1p0dtai r-1pi2tsx r-1d2f490
                r-u8s1d r-zchlnj r-ipm5af r-13qz1uu r-1wyyakw r-x3cy2q">
    </div>

    <!-- Hidden fallback img for layout -->
    <img alt="" draggable="false" class="css-9pa8cd" src="{spriteUrl}">
  </div>
</div>
```

**Key CSS classes on the sprite background div:**

| Class | Meaning |
|-------|---------|
| `r-1niwhzg` | `background-color: transparent` |
| `r-vvn4in` | `background-position: center` |
| `r-u6sd8q` | `background-repeat: no-repeat` |
| `r-x3cy2q` | `background-size: 100% 100%` |
| `r-1wyyakw` | `z-index: -1` |
| `r-1p0dtai` ... `r-ipm5af` | `position: absolute; inset: 0` |

The `css-9pa8cd` class on the fallback `<img>` makes it invisible (`opacity: 0; z-index: -1`).

---

## Theme Preview Components

### 1. Offscreen Canvas

Each theme card contains a hidden canvas used for sprite processing/generation:

```html
<div class="is_View _pos-absolute _fd-column _t--1440px _l--1440px _pe-none">
  <canvas width="1440" height="1440"></canvas>
</div>
```

| Property | Value |
|----------|-------|
| **Size** | 1440 × 1440 px |
| **Position** | `top: -1440px; left: -1440px` (offscreen) |
| **Pointer events** | `none` |

This canvas is likely used to render or composite the theme sprite at runtime.

### 2. Blurred Adventure Background

Behind the sprite preview, the adventure's background image is shown at low opacity:

```html
<div class="is_View _fd-column _pos-absolute _h-10037 _w-10037 _t-0px _l-0px
            _o-0--3 _tr-scale31281">
  <img alt="" loading="lazy" decoding="async" data-nimg="fill"
       src=".../{imageId}.png?class=blur200"
       style="object-fit: cover; object-position: left 50% top 50%;">
</div>
```

| Property | Value |
|----------|-------|
| **Opacity** | `0.3` (`_o-0--3`) |
| **Transform** | Scale (encoded as `_tr-scale31281`) |
| **Image** | Same adventure background as main page, `?class=blur200` |

### 3. Header Sprite Preview

A horizontal strip showing the theme's header/banner region:

```html
<div class="is_View _pos-relative _ox-hidden _oy-hidden _w-205px _h-112px">
  <div style="width: 205px; height: 224px; left: 0px; top: -112px;">
    <!-- sprite background-image -->
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Viewport** | 205 × 112 px |
| **Sprite region** | `left: 0, top: -112` → showing Y range 112–224 of the sprite |
| **Full sprite tile** | 205 × 224 px (at this scale) |

---

## 9-Slice Border Rendering

The UI element preview uses a **9-slice** (3×3 grid) system to render scalable themed borders. The sprite sheet contains corner, edge, and center regions at fixed pixel coordinates.

### Grid Layout

```
┌─────────────────────────────────────────────┐
│ [TL Corner]  [Top Edge (stretch)]  [TR Corner] │  Row 1: 24px tall
│    24×24           flex×24            24×24     │
├─────────────────────────────────────────────┤
│ [Left Edge]  [Center (stretch)]  [Right Edge]  │  Row 2: 40px tall
│    24×40           flex×40            24×40     │
├─────────────────────────────────────────────┤
│ [BL Corner]  [Bottom Edge (stretch)] [BR Corner]│ Row 3: 24px tall
│    24×24           flex×24            24×24     │
└─────────────────────────────────────────────┘
```

### 9-Slice DOM Structure

Each row is an `is_Row` (flex-direction: row), containing three viewport divs:

```html
<div class="is_View _pos-absolute _fd-column _h-10037 _w-10037 _t-0px _l-0px _zi-1">

  <!-- Row 1: Top corners + edge -->
  <div class="is_Row is_View _fd-row">
    <div class="... _w-24px _h-24px"> [TL corner sprite] </div>
    <div class="... _w-{flex} _h-24px"> [Top edge sprite]  </div>
    <div class="... _w-24px _h-24px"> [TR corner sprite] </div>
  </div>

  <!-- Row 2: Side edges + center -->
  <div class="is_Row is_View _fd-row">
    <div class="... _w-24px _h-40px"> [Left edge sprite]  </div>
    <div class="... _w-{flex} _h-40px"> [Center sprite]    </div>
    <div class="... _w-24px _h-40px"> [Right edge sprite] </div>
  </div>

  <!-- Row 3: Bottom corners + edge -->
  <div class="is_Row is_View _fd-row">
    <div class="... _w-24px _h-24px"> [BL corner sprite] </div>
    <div class="... _w-{flex} _h-24px"> [Bottom edge sprite] </div>
    <div class="... _w-24px _h-24px"> [BR corner sprite] </div>
  </div>

</div>
```

### Sprite Coordinates (S'mores Theme at 720px Scale)

The sprite sheet is rendered at 720×720 scale. Coordinates for each 9-slice cell:

| Cell | Viewport Size | Sprite Container | Offset (left, top) |
|------|---------------|-----------------|---------------------|
| **TL Corner** | 24 × 24 | 720 × 720 | (-408, -80) |
| **Top Edge** | flex × 24 | 1110.6 × 720 | (-666.36, -80) |
| **TR Corner** | 24 × 24 | 720 × 720 | (-512, -80) |
| **Left Edge** | 24 × 40 | 720 × 900 | (-408, -130) |
| **Center** | flex × 40 | 1110.6 × 900 | (-666.36, -130) |
| **Right Edge** | 24 × 40 | 720 × 900 | (-512, -130) |
| **BL Corner** | 24 × 24 | 720 × 720 | (-408, -136) |
| **Bottom Edge** | flex × 24 | 1110.6 × 720 | (-666.36, -136) |
| **BR Corner** | 24 × 24 | 720 × 720 | (-512, -136) |

**Important**: The sprite container is scaled proportionally. The flexible-width cells (edges + center) use a width class `_w-123--40000915928483905` which encodes a percentage-based flexible width that fills the remaining space.

---

## Button Preview (3-Part Horizontal Sprite)

Below the 9-slice grid, the theme card shows a button preview using a **3-part horizontal sprite** (left cap, stretchable center, right cap):

```html
<div class="is_View _pos-relative _fd-column _ai-center _jc-center _h-t-size-5 _w-t-size-10">
  <div style="position: absolute; ... flex-direction: row; ... justify-content: space-between;">

    <!-- Left Cap -->
    <div class="... _w-16px _h-40px">
      <div style="width: 720px; height: 600px; left: 0px; top: 0px;">
        [sprite]
      </div>
    </div>

    <!-- Center Stretch -->
    <div class="... _w-48--3px _h-40px">
      <div style="height: 600px; left: -7.43077px; top: 0px; width: 334.385px;">
        [sprite]
      </div>
    </div>

    <!-- Right Cap -->
    <div class="... _w-16px _h-40px">
      <div style="width: 720px; height: 600px; left: -120px; top: 0px;">
        [sprite]
      </div>
    </div>

  </div>

  <!-- Icon overlay (theme-colored) -->
  <div class="is_View _pos-relative ... _ai-center _jc-center">
    <span aria-hidden="true" class="is_Text font_icons _col-{themeColor} ... _fos-f-size-1 _zi-1">
      w_pencil
    </span>
  </div>
</div>
```

### Button Sprite Coordinates (at 720px Scale)

| Part | Viewport | Sprite Container | Offset |
|------|----------|-----------------|--------|
| **Left Cap** | 16 × 40 | 720 × 600 | (0, 0) |
| **Center** | flex × 40 | ~334 × 600 | (-7.43, 0) |
| **Right Cap** | 16 × 40 | 720 × 600 | (-120, 0) |

The center section stretches to fill available width, with fractional pixel offsets for precise alignment.

---

## Theme-Specific Colors

Each theme applies unique colors to text and icons in the preview:

### Text Sample ("Aa")

```html
<span class="is_Text font_heading _col-{themeTextColor} ... _fos-f-size-5 _fow-500 _zi-1">
  Aa
</span>
```

- **S'mores**: `_col-rgba8351911948809947` — warm/amber text color
- **Cyber**: `_col-rgba3322722193802961` — cool/neon text color

### Icon Color (Pencil)

```html
<span class="is_Text font_icons _col-{themeIconColor} ... _fos-f-size-1 _zi-1">
  w_pencil
</span>
```

- **S'mores**: `_col-rgba24623921731976992`
- **Cyber**: `_col-rgba3422922196573524`

These colors are encoded in the class name as RGBA values (with the decimal point removed). They are theme-specific and set dynamically.

---

## Text Style Options

Adjacent to the Themes section, the **Text Style** section offers three font presets:

```html
<div class="is_Row is_View _fd-row _gap-t-space-1 ... _bg-blackA2
            _btlr-t-radius-2 _btrr-t-radius-2 _bbrr-t-radius-2 _bblr-t-radius-2">

  <!-- Print (serif-ish heading font) -->
  <span class="t_sub_theme t_coreA0 is_Theme">
    <div role="button" class="is_Button ... _w-33--3337">
      <span class="is_Text font_heading ...">Print</span>
    </div>
  </span>

  <!-- Clean (default sans-serif, currently selected) -->
  <span class="t_sub_theme t_coreA1 is_Theme">
    <div role="button" class="is_Button ... _w-33--3337">
      <span class="is_Text font_body ...">Clean</span>
    </div>
  </span>

  <!-- Hacker (monospace font) -->
  <span class="t_sub_theme t_coreA0 is_Theme">
    <div role="button" class="is_Button ... _w-33--3337">
      <span class="is_Text font_mono ...">Hacker</span>
    </div>
  </span>

</div>
```

### Text Style Properties

| Style | Font Class | Description | Theme When Selected |
|-------|-----------|-------------|---------------------|
| **Print** | `font_heading` | Serif/heading typeface | `t_coreA1` |
| **Clean** | `font_body` | Default sans-serif | `t_coreA1` |
| **Hacker** | `font_mono` | Monospace typeface | `t_coreA1` |

**Selection indicator**: The active style uses `t_coreA1` (brighter background), inactive ones use `t_coreA0` (near-transparent). All three buttons are equal width (`_w-33--3337` ≈ 33.3%).

**Container**: `bg-blackA2` with `border-radius: t-radius-2` — a subtle dark pill housing the three buttons.

---

## Theme Separator

Between theme cards a thin horizontal separator line is drawn:

```html
<div class="is_View _pos-absolute _fd-column _w-11037 _bbw-1px _t-0px _l-16px
            _btc-blackA6 _brc-blackA6 _bbc-blackA6 _blc-blackA6 _bbs-solid">
</div>
```

| Property | Value |
|----------|-------|
| **Width** | ~110% (`_w-11037` — slightly wider than parent) |
| **Border** | 1px solid `blackA6` (bottom only) |
| **Position** | Absolute, `top: 0, left: 16px` |

---

## Sprite Sheet Layout Map

Based on the coordinate analysis, the sprite sheet (at native resolution) is organized into these conceptual regions:

```
┌───────────────────────────────────────────────┐
│                                               │
│    Button Sprite Region (top-left area)       │
│    Left cap / center / right cap              │
│    Y: 0–40  (at 600/720 scale)               │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│    9-Slice Border Region (center area)        │
│    Corners at (408,80), (512,80)              │
│    Edges at same X, varying Y                 │
│    Y: 80–160  (at 720 scale)                 │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│    Header / Banner Region                     │
│    Full-width preview strip                   │
│    Y: 112–224  (at 205×224 scale)            │
│                                               │
└───────────────────────────────────────────────┘
```

> **Note**: Exact pixel coordinates vary between themes and may be computed dynamically by the offscreen canvas. The values above are derived from the S'mores/Cyber theme snapshot.

---

## BetterDungeon Implications

### Sprite Alignment for Custom Buttons

BetterDungeon's custom UI elements (like the Try mode button) must respect the sprite coordinate system. Key considerations:

- **Corner pieces are fixed 24×24 px** — never stretch these
- **Edge pieces are fixed 24px on the short axis** — only stretch along the long axis
- **Center fills remaining space** — this is the only freely scalable region
- **Button caps are fixed 16px wide** — left and right caps must not be stretched
- **Fractional pixel offsets** (e.g., `-7.43077px`) are used for sub-pixel alignment — rounding these can cause visible gaps (this is likely the root cause of the sprite gap issues noted in the bug tracker)

### Detecting the Active Theme

```javascript
// Find all theme cards in the settings panel
const themeCards = document.querySelectorAll(
  '.is_Button[class*="_h-t-size-16"]'
);

// Get theme sprite URLs from a card's preview
function getThemeSpriteUrl(card) {
  const bgDiv = card.querySelector('[style*="background-image"]');
  const match = bgDiv?.style.backgroundImage.match(/url\("([^"]+)"\)/);
  return match?.[1] || null;
}

// Extract theme ID from sprite URL
function getThemeId(spriteUrl) {
  const match = spriteUrl?.match(/themes\/([a-f0-9-]+)\.png/);
  return match?.[1] || null;
}
```

### Detecting Active Text Style

```javascript
// Text style buttons are inside a bg-blackA2 container
const textStyleContainer = document.querySelector(
  '.is_Row[class*="_bg-blackA2"]'
);

// The active style has t_coreA1 theme (others have t_coreA0)
function getActiveTextStyle() {
  const buttons = textStyleContainer?.querySelectorAll('[role="button"]');
  for (const btn of buttons || []) {
    const themeWrapper = btn.closest('.is_Theme');
    if (themeWrapper?.classList.contains('t_coreA1')) {
      return btn.querySelector('.is_Text')?.textContent.trim();
    }
  }
  return null; // e.g., "Print", "Clean", or "Hacker"
}
```

### Matching Sprite Coordinates for Injected Elements

When BetterDungeon injects themed elements, it needs to read the sprite offsets from the active theme's 9-slice grid and replicate them:

```javascript
// Read sprite coordinates from an existing 9-slice cell
function getSpriteCoords(nineSliceCell) {
  const inner = nineSliceCell.querySelector('.css-g5y9jx[style*="left"]');
  if (!inner) return null;
  const style = inner.style;
  return {
    width: parseFloat(style.width),
    height: parseFloat(style.height),
    left: parseFloat(style.left),
    top: parseFloat(style.top),
    spriteUrl: inner.querySelector('[style*="background-image"]')
      ?.style.backgroundImage.match(/url\("([^"]+)"\)/)?.[1]
  };
}
```

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Settings Panel](adventure-page-settings.md)
- [CSS Architecture](css-architecture.md)
- [Background & Ambience](adventure-page-background.md)
