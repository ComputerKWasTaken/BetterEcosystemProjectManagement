# BetterEcosystem — Unified Design System

> Single source of truth for every visual property shared across **BetterDungeon** (PC), **BetterDungeon-Mobile**, **BetterRepository**, and all future ecosystem projects.

---

## Quick Start

| Project | How to consume |
|---------|---------------|
| **BetterDungeon** (extension) | Inline copy `theme-variables.css` into `core/theme-variables.css` (CSP-safe — no `@import`) |
| **BetterDungeon-Mobile** (Android) | Same as BetterDungeon — inline copy into `assets/betterdungeon/core/theme-variables.css` |
| **BetterRepository** (Vue / Tailwind) | `@import '../../design/theme-variables.css'` in `src/styles/main.css` + mirror values in `tailwind.config.js` |

All variables use the **`--bd-`** prefix to avoid collisions with host-page styles (critical for extension contexts).

---

## File Structure

```
design/
├── theme-variables.css   ← Canonical CSS custom properties
└── README.md             ← This file — conventions & usage guide
```

---

## 1. Color Palette

### 1.1 Backgrounds (deepest → lightest)

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-bg-primary` | `#0d0d0f` | Page canvas, deepest layer |
| `--bd-bg-secondary` | `#16161a` | Cards, panels, sidebar |
| `--bd-bg-tertiary` | `#1e1e24` | Nested cards, hover fills |
| `--bd-bg-elevated` | `#252530` | Inputs, raised surfaces |
| `--bd-bg-active` | `#2c2c36` | Pressed / active states |
| `--bd-bg-overlay` | `rgba(0,0,0,0.85)` | Modal / sheet backdrop |

### 1.2 Text

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-text-primary` | `#e8e8ec` | Body copy |
| `--bd-text-secondary` | `#a0a0a8` | Labels, supporting copy |
| `--bd-text-muted` | `#6b6b75` | Hints, placeholders, disabled |
| `--bd-text-inverse` | `#0d0d0f` | On colored backgrounds |
| `--bd-text-on-accent` | `#ffffff` | On accent fills |

### 1.3 Brand / Accent (Orange)

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-accent-primary` | `#ff9500` | Primary brand orange |
| `--bd-accent-secondary` | `#e07800` | Darker orange (gradient end) |
| `--bd-accent-light` | `#ffb84d` | Hover / highlight state |
| `--bd-accent-glow` | `rgba(255,149,0,0.12)` | Ambient glow, focus rings |
| `--bd-accent-muted` | `rgba(255,149,0,0.15)` | Tinted backgrounds |
| `--bd-accent-strong` | `rgba(255,149,0,0.25)` | Hover tint / emphasis |

### 1.4 Status Colors

Each status has four tokens: color, light, background, and border.

| State | Color | Light | Background | Border |
|-------|-------|-------|------------|--------|
| Success | `#22c55e` | `#4ade80` | `rgba(34,197,94,0.15)` | `rgba(34,197,94,0.3)` |
| Error | `#ef4444` | `#f87171` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.3)` |
| Warning | `#f59e0b` | `#fbbf24` | `rgba(245,158,11,0.15)` | `rgba(245,158,11,0.3)` |
| Info | `#3b82f6` | `#60a5fa` | `rgba(59,130,246,0.15)` | `rgba(59,130,246,0.3)` |

### 1.5 Category Palette

Used for tags, badges, section icons, and decorative accents. Each has a base and a light variant.

| Token | Value | Light variant | Value |
|-------|-------|---------------|-------|
| `--bd-blue` | `#3b82f6` | `--bd-blue-light` | `#60a5fa` |
| `--bd-purple` | `#a855f7` | `--bd-purple-light` | `#c084fc` |
| `--bd-green` | `#22c55e` | `--bd-green-light` | `#4ade80` |
| `--bd-amber` | `#fbbf24` | `--bd-amber-light` | `#fcd34d` |
| `--bd-cyan` | `#06b6d4` | `--bd-cyan-light` | `#22d3ee` |
| `--bd-orange` | `#f97316` | `--bd-orange-light` | `#fb923c` |
| `--bd-pink` | `#ec4899` | `--bd-emerald` | `#10b981` |
| `--bd-red` | `#ef4444` | `--bd-teal` | `#14b8a6` |
| `--bd-indigo` | `#6366f1` | `--bd-rose` | `#f43f5e` |
| `--bd-slate` | `#94a3b8` | `--bd-gray` | `#6b7280` |

### 1.6 Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-border-subtle` | `rgba(255,255,255,0.06)` | Faintest dividers |
| `--bd-border-default` | `rgba(255,255,255,0.10)` | Standard card borders |
| `--bd-border-strong` | `rgba(255,255,255,0.15)` | Hover / emphasis |
| `--bd-border-accent` | `rgba(255,149,0,0.25)` | Brand-tinted borders |
| `--bd-border-focus` | `var(--bd-accent-primary)` | Focus rings |

### 1.7 Interactive Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-tag-bg` | `rgba(255,255,255,0.08)` | Chips, badges, tags |
| `--bd-tag-hover-bg` | `rgba(255,255,255,0.12)` | Tag hover state |

### 1.8 Third-Party Brand Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-discord` | `#5865F2` | Discord links & buttons |

---

## 2. Typography

### 2.1 Font Families

| Token | Stack | Usage |
|-------|-------|-------|
| `--bd-font-family-primary` | `'IBM Plex Sans', -apple-system, …` | All UI text |
| `--bd-font-family-mono` | `'Roboto Mono', 'Consolas', …` | Code, values, monospace |

### 2.2 Font Sizes (fixed px scale)

| Token | Size | Typical Use |
|-------|------|-------------|
| `--bd-font-size-xs` | 10px | Badges, footnotes, labels |
| `--bd-font-size-sm` | 11px | Hints, small labels |
| `--bd-font-size-base` | 12px | Default body text, form labels |
| `--bd-font-size-md` | 13px | Card titles, descriptions |
| `--bd-font-size-lg` | 14px | Section text, button labels |
| `--bd-font-size-xl` | 16px | Section headings |
| `--bd-font-size-2xl` | 18px | Page subheadings |
| `--bd-font-size-3xl` | 22px | Hero / page titles |

### 2.3 Font Weights

| Token | Value |
|-------|-------|
| `--bd-font-weight-normal` | 400 |
| `--bd-font-weight-medium` | 500 |
| `--bd-font-weight-semibold` | 600 |
| `--bd-font-weight-bold` | 700 |

### 2.4 Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-line-height-tight` | 1.4 | Compact UI elements |
| `--bd-line-height-normal` | 1.5 | Default body text |
| `--bd-line-height-relaxed` | 1.6 | Long-form content |

### 2.5 Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-tracking-tight` | -0.3px | Large headings |
| `--bd-tracking-normal` | 0 | Body text |
| `--bd-tracking-wide` | 0.5px | Uppercase labels, section titles |

---

## 3. Spacing

4 px base grid. Use multiples for consistency:

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| `--bd-space-0` | 0 | `--bd-space-6` | 24px |
| `--bd-space-1` | 4px | `--bd-space-8` | 32px |
| `--bd-space-2` | 8px | `--bd-space-10` | 40px |
| `--bd-space-3` | 12px | `--bd-space-12` | 48px |
| `--bd-space-4` | 16px | `--bd-space-16` | 64px |
| `--bd-space-5` | 20px | | |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-radius-sm` | 4px | Chips, small elements |
| `--bd-radius-md` | 6px | Buttons, inputs |
| `--bd-radius-lg` | 8px | Cards, dropdowns |
| `--bd-radius-xl` | 10px | Modals, panels |
| `--bd-radius-2xl` | 12px | Large containers |
| `--bd-radius-3xl` | 16px | Hero sections |
| `--bd-radius-full` | 9999px | Pills, avatars |

---

## 5. Shadows & Elevation

| Token | Usage |
|-------|-------|
| `--bd-shadow-sm` | Subtle elevation (buttons) |
| `--bd-shadow-md` | Cards, dropdowns |
| `--bd-shadow-lg` | Modals, popovers |
| `--bd-shadow-xl` | Full-screen overlays |
| `--bd-shadow-2xl` | Heavy backdrop layering |
| `--bd-shadow-glow` | Brand ambient glow |
| `--bd-shadow-glow-lg` | Emphasized brand glow |
| `--bd-shadow-glow-xl` | Primary button hover glow |

---

## 6. Transitions & Motion

| Token | Duration | Usage |
|-------|----------|-------|
| `--bd-transition-fast` | 0.15s ease | Hover, focus states |
| `--bd-transition-normal` | 0.2s ease | Toggles, expand/collapse |
| `--bd-transition-slow` | 0.3s ease | Page transitions, modals |

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy scale-in |

---

## 7. Z-Index Scale

Shared hierarchy prevents layer conflicts:

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-z-base` | 0 | Default stacking |
| `--bd-z-elevated` | 1 | Slightly raised elements |
| `--bd-z-sticky` | 100 | Sticky headers |
| `--bd-z-fixed` | 200 | Fixed sidebars |
| `--bd-z-dropdown` | 1000 | Dropdowns, popovers |
| `--bd-z-modal-backdrop` | 9000 | Modal backdrop overlays |
| `--bd-z-modal` | 10000 | Modal dialogs |
| `--bd-z-tutorial` | 30000 | Tutorial overlays |
| `--bd-z-toast` | 99999 | Toast notifications |
| `--bd-z-loading` | 999999 | Loading overlays |

---

## 8. Component Tokens

### 8.1 Buttons

| Variant | Background | Hover | Text |
|---------|------------|-------|------|
| **Primary** | `--bd-btn-primary-bg` (135deg gradient `accent-primary` to `accent-secondary`) | `--bd-btn-primary-hover` (gradient `accent-light` to `accent-primary`) + `translateY(-1px)` + `--bd-btn-primary-shadow` | `--bd-text-on-accent` (white) |
| **Secondary / Ghost** | `--bd-btn-secondary-bg` (`rgba(255,255,255,0.08)`) | `--bd-btn-secondary-hover` (`rgba(255,255,255,0.12)`) | `--bd-text-primary` |
| **Danger** | `--bd-btn-danger-bg` (error bg) + `--bd-btn-danger-border` | Solid `--bd-error` background | `--bd-text-on-accent` |

### 8.2 Cards

| Property | Token |
|----------|-------|
| Background | `--bd-card-bg` (`--bd-bg-secondary`) |
| Border | `--bd-card-border` (`--bd-border-subtle`) |
| Hover background | `--bd-card-hover-bg` (`--bd-bg-tertiary`) |
| Hover border | `--bd-card-hover-border` (`--bd-border-default`) |
| Radius | `--bd-card-radius` (`--bd-radius-xl` / 10px) |

### 8.3 Inputs

| Property | Token |
|----------|-------|
| Background | `--bd-input-bg` (`--bd-bg-elevated`) |
| Border | `--bd-input-border` (`--bd-border-default`) |
| Focus border | `--bd-input-focus-border` (`--bd-accent-primary`) |
| Focus ring | `--bd-input-focus-ring` (3px accent glow) |

### 8.4 Toggle Switches

| State | Property | Value |
|-------|----------|-------|
| Off | Track | `--bd-bg-active` |
| On | Track | `--bd-accent-primary` |
| Off | Thumb | `--bd-text-muted` |
| On | Thumb | `--bd-text-on-accent` (white) |

### 8.5 Toasts

| Variant | Token |
|---------|-------|
| Success | `--bd-toast-success-bg` (gradient `success-light` to `success`) |
| Error | `--bd-toast-error-bg` (gradient `error-light` to `error`) |
| Info | `--bd-toast-info-bg` (gradient `info` to deeper blue) |

### 8.6 Loading Screen

| Property | Token |
|----------|-------|
| Container bg | `--bd-loading-bg` (180deg gradient) |
| Spinner color | `--bd-loading-spinner` (`--bd-accent-primary`) |
| Overlay bg | `--bd-loading-overlay-bg` (dark blur backdrop) |

### 8.7 Scrollbar

| Property | Token |
|----------|-------|
| Width | `--bd-scrollbar-width` (8px) |
| Track | `--bd-scrollbar-track` (`--bd-bg-secondary`) |
| Thumb | `--bd-scrollbar-thumb` (`--bd-bg-elevated`) |
| Thumb hover | `--bd-scrollbar-hover` (`--bd-border-strong`) |

### 8.8 Section Headers

```css
font-size: var(--bd-font-size-sm);        /* 11px */
font-weight: var(--bd-font-weight-semibold);
text-transform: uppercase;
letter-spacing: var(--bd-tracking-wide);   /* 0.5px */
color: var(--bd-text-secondary);
```

---

## 9. Gradients

Reusable gradient patterns defined as tokens:

| Token | Pattern | Usage |
|-------|---------|-------|
| `--bd-gradient-brand` | 135deg `accent-primary` to `accent-secondary` | Title text, buttons, nav active |
| `--bd-gradient-brand-hover` | 135deg `accent-light` to `accent-primary` | Button hover |
| `--bd-gradient-accent-bar` | to right `accent-primary`, `purple`, `cyan` | Decorative accent bars |
| `--bd-gradient-shimmer` | 90deg `accent-primary` → `accent-light` → `accent-primary` | Progress bars |

### Brand Title Gradient (text fill)
```css
background: var(--bd-gradient-brand);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Decorative Accent Bar
```css
background: var(--bd-gradient-accent-bar);
height: 1px; /* or 2-4px for emphasis */
```

---

## 10. Markdown & Content Tokens

Tokens for rendered markdown inside game text (used by BetterDungeon content styles):

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-code-inline-bg` | `var(--bd-tag-bg)` | Inline code background |
| `--bd-code-inline-border` | `var(--bd-border-default)` | Inline code border |
| `--bd-code-inline-color` | `#e8b4b4` | Inline code text |
| `--bd-code-block-bg` | `rgba(0,0,0,0.3)` | Code block background |
| `--bd-code-block-color` | `#d4d4d4` | Code block text |
| `--bd-link-color` | `var(--bd-blue-light)` | Hyperlinks |
| `--bd-link-hover-color` | `#a8cbff` | Hyperlink hover |
| `--bd-highlight-bg` | `var(--bd-accent-muted)` | Highlighted text |

---

## 11. Extension-Specific Tokens

### 11.1 Popup Short Aliases

The extension popup (PC and Mobile) uses shorter variable names mapped from `--bd-` tokens. These aliases are defined in the canonical file so both popup.css files remain in sync. See section 21 of `theme-variables.css` for the full alias map.

### 11.2 Input Mode Colors

Each AI Dungeon input mode gets four tokens:

| Suffix | Purpose | Example (Do mode) |
|--------|---------|-------------------|
| base | Primary color | `--bd-mode-do` = `var(--bd-blue)` |
| `-light` | Hover / text | `--bd-mode-do-light` = `var(--bd-blue-light)` |
| `-glow` | Box-shadow tint | `--bd-mode-do-glow` = `rgba(59,130,246,0.15)` |
| `-rgb` | Raw RGB triplet | `--bd-mode-do-rgb` = `59, 130, 246` |

Modes: **Do** (blue), **Try** (purple), **Say** (green), **Story** (amber), **See** (cyan), **Command** (orange).

### 11.3 Trigger Highlights

| Token | Usage |
|-------|-------|
| `--bd-trigger-bg` / `color` / `border` | Active story card keyword matches |
| `--bd-suggested-trigger-bg` / `color` / `border` | Suggested trigger word indicators |

### 11.4 Section Icon Colors

Semantic colors for popup section/feature icons:

| Token | Color |
|-------|-------|
| `--bd-section-input-modes` | `--bd-blue` |
| `--bd-section-tools` | `--bd-cyan` |
| `--bd-section-formatting` | `--bd-purple` |
| `--bd-section-automations` | `--bd-amber` |

---

## 12. Icons

All projects use [Lucide Icons](https://lucide.dev/):

| Project | Integration |
|---------|-------------|
| BetterDungeon / Mobile | Lucide CSS icon font (`lucide.css`) |
| BetterRepository | `lucide-vue-next` Vue component library |

Standard icon sizes:

| Context | Size |
|---------|------|
| Inline (next to text) | 14-16px |
| Card header | 16-18px |
| Navigation | 16-20px |
| Hero / empty state | 24-32px |

---

## 13. Scrollbar Styling

```css
::-webkit-scrollbar        { width: var(--bd-scrollbar-width); }
::-webkit-scrollbar-track  { background: var(--bd-scrollbar-track); }
::-webkit-scrollbar-thumb  { background: var(--bd-scrollbar-thumb); border-radius: var(--bd-radius-sm); }
::-webkit-scrollbar-thumb:hover { background: var(--bd-scrollbar-hover); }
```

---

## 14. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| CSS variables | `--bd-{category}-{property}` | `--bd-bg-primary` |
| CSS classes (extension) | `bd-{component}-{modifier}` | `bd-widget-bar-fill` |
| CSS classes (popup) | BEM-lite: `{block}-{element}` | `feature-card`, `modal-header` |
| Tailwind utilities | `bd-{token}` mapping | `bg-bd-bg-primary`, `text-bd-accent-light` |

---

## 15. Rules

1. **Never hardcode hex values** in stylesheets or components. Always use `var(--bd-*)` tokens (CSS) or Tailwind `bd-*` classes.
2. **Never use unprefixed aliases** (`--accent`, `--border`, etc.) outside of `popup.css`. Those aliases exist only for backward compatibility in the extension popup.
3. **Category colors for tags/badges** must use the `--bd-{color}` tokens, not raw hex.
4. **Gradients** should use the reusable `--bd-gradient-*` tokens or compose from `--bd-*` color tokens.
5. **Third-party brand colors** (Discord, etc.) must use the `--bd-discord` token, not hardcoded hex.
6. **Spacing** should follow the 4px grid. No arbitrary pixel values for padding/margin.
7. **Border radius** should use `--bd-radius-*` tokens for consistency.

---

## 16. Updating This System

1. Edit `design/theme-variables.css` in this repo — this is the **canonical** file.
2. Copy / sync changes to each project's local copy:
   - `BetterDungeon/core/theme-variables.css`
   - `BetterDungeon-Mobile/app/src/main/assets/betterdungeon/core/theme-variables.css`
   - `BetterRepository/design/theme-variables.css`
3. If adding Tailwind-mapped tokens, update `BetterRepository/tailwind.config.js`.
4. Update this README if new token categories or conventions are introduced.
