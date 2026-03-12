# Adventure Page — Background & Ambience

> Detailed DOM reference for the background image layers, gradient overlays, and saturate filters on the Adventure page.

## Location in DOM

```
#__next > div > [Theme Wrappers]
  └── div (background layer, position:absolute, z-index:0, full size)
      ├── div#0 (opacity:1, absolute, full size)
      │   └── #gameplay-saturate (absolute, full size, opacity ~0.9)
      │       └── <img alt="Ambience"> (cover, blurred)
      │
      └── div (gradient overlay, absolute, full size, z-index:1)
          └── div (linear-gradient background)
```

The background is the **first child** inside the theme wrappers, positioned absolutely with `z-index: 0` so all content floats above it.

---

## Background Layer Container

```html
<div aria-hidden="true"
     class="is_View _pos-absolute _fd-column _l-0px _w-10037 _h-100--337 _zi-0 _t-0px">
```

| Property | Value |
|----------|-------|
| **Position** | `absolute`, top-left anchored |
| **Size** | `width: 100%`, `height: 100%` (approximately) |
| **Z-index** | `0` |
| **aria-hidden** | `true` — decorative, not read by screen readers |

---

## Ambience Image

The adventure's background image, rendered as a blurred full-bleed cover:

```html
<div class="css-g5y9jx" id="0"
     style="opacity: 1; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;">

  <div id="gameplay-saturate"
       class="is_View _fd-column _pos-absolute _w-10037 _h-10037 _o-0--9">

    <img alt="Ambience"
         loading="lazy"
         decoding="async"
         data-nimg="fill"
         class="r-1p0dtai r-1d2f490 r-u8s1d r-zchlnj r-ipm5af"
         src="https://latitude-standard-pull-zone-1.b-cdn.net/user_content/.../image.png?class=blur200"
         style="position: absolute; height: 100%; width: 100%; inset: 0px;
                object-fit: cover; object-position: left 50% top 50%; color: transparent;">
  </div>
</div>
```

### Image Properties

| Property | Value |
|----------|-------|
| **Alt text** | `"Ambience"` |
| **Loading** | `lazy` |
| **Object-fit** | `cover` (fills container, cropping as needed) |
| **Object-position** | `left 50% top 50%` (centered) |
| **Source URL pattern** | `...user_content/{userId}/images/uploads/{imageId}.png?class=blur200` |
| **Blur variant** | `?class=blur200` — server-side blur applied via CDN transform |

### Image CSS Classes

| Class | Meaning |
|-------|---------|
| `r-1p0dtai` | `bottom: 0px` |
| `r-1d2f490` | `left: 0px` |
| `r-u8s1d` | `position: absolute` |
| `r-zchlnj` | `right: 0px` |
| `r-ipm5af` | `top: 0px` |

These classes combine to make the image fill its parent via `position: absolute; inset: 0px`.

### #gameplay-saturate Filter

```css
#gameplay-saturate {
  -webkit-backdrop-filter: saturate(1.8);
  backdrop-filter: saturate(1.8);
}
```

| Property | Value |
|----------|-------|
| **ID** | `gameplay-saturate` |
| **Opacity** | `~0.9` (`_o-0--9`) |
| **Backdrop filter** | `saturate(1.8)` — boosts color vibrancy |

**BetterDungeon note**: `#gameplay-saturate` is used in **two places** — once in the main background layer and once inside the input drawer's decorative background. The CSS rule applies to both instances.

---

## Gradient Overlay

A semi-transparent dark gradient over the background image to ensure text readability:

```html
<div data-disable-theme="true"
     class="is_LinearGradient is_View _fd-column _ox-hidden _oy-hidden
            _pos-absolute _w-10037 _h-10037 _zi-1">
  <div class="css-g5y9jx"
       style="position: absolute; inset: 0px; z-index: 0;
              background-image: linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.66));">
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Class** | `is_LinearGradient` |
| **Gradient direction** | Top to bottom (default) |
| **Top color** | `rgba(0, 0, 0, 0.8)` — 80% black |
| **Bottom color** | `rgba(0, 0, 0, 0.66)` — 66% black |
| **Z-index** | `1` (above the image, below the content) |
| **Overflow** | Hidden (both axes) |
| **data-disable-theme** | `true` — gradient colors don't change with theme |

**BetterDungeon note**: The gradient is darker at the top (where the navigation bar sits) and slightly lighter at the bottom. This is a deliberate design choice to keep the nav readable against any background image.

---

## Visual Stack Order (Bottom to Top)

```
┌─────────────────────────────────────┐
│ 4. Content (nav, story, commands)   │  z-index: 2+ (relative)
├─────────────────────────────────────┤
│ 3. Gradient Overlay                 │  z-index: 1 (absolute)
│    rgba(0,0,0,0.8) → rgba(0,0,0,0.66)
├─────────────────────────────────────┤
│ 2. #gameplay-saturate               │  z-index: 0 (absolute)
│    backdrop-filter: saturate(1.8)   │  opacity: 0.9
├─────────────────────────────────────┤
│ 1. Ambience Image                   │  z-index: 0 (absolute)
│    object-fit: cover, blur200       │
└─────────────────────────────────────┘
```

---

## Image URL Pattern

Adventure background images follow this CDN URL pattern:

```
https://latitude-standard-pull-zone-1.b-cdn.net/user_content/{userId}/images/uploads/{imageId}.png?class={variant}
```

### Known Image Variants

| Variant | Used In | Description |
|---------|---------|-------------|
| `blur200` | Main background layer | Heavy blur for ambient backdrop |
| `blur250` | Input drawer background | Even heavier blur |
| `public` | og:image meta tag | Full resolution, no blur |

**BetterDungeon note**: The image ID and user ID can be extracted from the `<img alt="Ambience">` element's `src` attribute. This could be useful for features that need the adventure's background image at different qualities.

---

## #game-blur-button Backdrop Filter

The navigation buttons also use a blur effect to blend with the background:

```css
#game-blur-button {
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  backdrop-filter: blur(24px) saturate(1.5);
}
```

This rule applies to ALL elements with `id="game-blur-button"` (Game Menu, Undo, Redo, Settings buttons), giving them a frosted-glass appearance over the background.

---

## Reliable Selectors for BetterDungeon

```javascript
// Main background ambience image
const ambienceImg = document.querySelector('img[alt="Ambience"]');
const ambienceUrl = ambienceImg?.src;

// Gradient overlay
const gradientOverlay = document.querySelector('.is_LinearGradient');

// Gameplay saturate containers (both instances)
const saturateElements = document.querySelectorAll('#gameplay-saturate');

// Extract image ID from URL
function getAdventureImageId(url) {
  const match = url?.match(/uploads\/([a-f0-9-]+)\./);
  return match?.[1] || null;
}

// Get a different quality variant of the same image
function getImageVariant(url, variant) {
  return url?.replace(/\?class=\w+/, `?class=${variant}`);
}
```

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Navigation Bar](adventure-page-navigation.md)
- [Text Input Area](adventure-page-input.md)
- [CSS Architecture](css-architecture.md)
