# BetterEcosystem — Unified Design System

> Canonical design tokens and conventions shared across **BetterDungeon**, **BetterRepository**, and all future ecosystem projects.

---

## Quick Start

| Project | How to consume |
|---------|---------------|
| **BetterDungeon** (extension) | `@import` or copy `theme-variables.css` into `core/theme-variables.css` |
| **BetterRepository** (Vue/Tailwind) | `@import '../../design/theme-variables.css'` in `src/styles/main.css` + mirror values in `tailwind.config.js` |

All variables use the `--bd-` prefix to avoid collisions with host pages (important for the extension context).

---

## File Structure

```
Project Management/design/
├── theme-variables.css   ← Single source of truth for all CSS custom properties
└── README.md             ← This file — design conventions and usage guide
```

---

## 1. Color Palette

### Backgrounds (dark → light)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bd-bg-primary` | `#0d0d0f` | Page / deepest background |
| `--bd-bg-secondary` | `#16161a` | Cards, panels, sidebar |
| `--bd-bg-tertiary` | `#1e1e24` | Nested cards, hover states |
| `--bd-bg-elevated` | `#252530` | Inputs, raised interactive elements |
| `--bd-bg-overlay` | `rgba(0,0,0,0.85)` | Modal / sheet backdrops |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--bd-text-primary` | `#e8e8ec` | Main body text |
| `--bd-text-secondary` | `#a0a0a8` | Supporting / label text |
| `--bd-text-muted` | `#6b6b75` | Disabled, hints, placeholders |
| `--bd-text-inverse` | `#0d0d0f` | Text on colored backgrounds |

### Brand / Accent (Orange)

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-accent-primary` | `#ff9500` | Primary brand color |
| `--bd-accent-secondary` | `#e07800` | Darker orange for gradients |
| `--bd-accent-light` | `#ffb84d` | Lighter hover state |
| `--bd-accent-glow` | `rgba(255,149,0,0.12)` | Ambient glow / selection |
| `--bd-accent-muted` | `rgba(255,149,0,0.15)` | Tinted backgrounds |

### Status Colors

| State | Color | Background | Border |
|-------|-------|------------|--------|
| Success | `#22c55e` | `rgba(34,197,94,0.15)` | `rgba(34,197,94,0.3)` |
| Error | `#ef4444` | `rgba(239,68,68,0.15)` | `rgba(239,68,68,0.3)` |
| Warning | `#f59e0b` | `rgba(245,158,11,0.15)` | `rgba(245,158,11,0.3)` |
| Info | `#3b82f6` | `rgba(59,130,246,0.15)` | `rgba(59,130,246,0.3)` |

### Category Colors

Used for tags, badges, section icons, and decorative accents:

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `--bd-blue` | `#3b82f6` | `--bd-pink` | `#ec4899` |
| `--bd-purple` | `#a855f7` | `--bd-emerald` | `#10b981` |
| `--bd-green` | `#22c55e` | `--bd-teal` | `#14b8a6` |
| `--bd-amber` | `#fbbf24` | `--bd-indigo` | `#6366f1` |
| `--bd-cyan` | `#06b6d4` | `--bd-rose` | `#f43f5e` |
| `--bd-orange` | `#f97316` | `--bd-slate` | `#94a3b8` |
| `--bd-red` | `#ef4444` | `--bd-gray` | `#6b7280` |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-border-subtle` | `rgba(255,255,255,0.06)` | Faintest dividers |
| `--bd-border-default` | `rgba(255,255,255,0.10)` | Standard card borders |
| `--bd-border-strong` | `rgba(255,255,255,0.15)` | Hovered / emphasized |
| `--bd-border-accent` | `rgba(255,149,0,0.25)` | Brand-tinted borders |
| `--bd-border-focus` | `var(--bd-accent-primary)` | Focus rings |

---

## 2. Typography

### Font Families

| Token | Stack | Usage |
|-------|-------|-------|
| `--bd-font-family-primary` | `'IBM Plex Sans', -apple-system, …` | All UI text |
| `--bd-font-family-mono` | `'Roboto Mono', 'Consolas', …` | Code, values, monospace |

### Font Sizes (px scale)

| Token | Size | Typical Use |
|-------|------|-------------|
| `--bd-font-size-xs` | 10px | Badges, footnotes |
| `--bd-font-size-sm` | 11px | Hints, small labels |
| `--bd-font-size-base` | 12px | Default body / form labels |
| `--bd-font-size-md` | 13px | Card titles, descriptions |
| `--bd-font-size-lg` | 14px | Section text, button labels |
| `--bd-font-size-xl` | 16px | Section headings |
| `--bd-font-size-2xl` | 18px | Page subheadings |
| `--bd-font-size-3xl` | 22px | Hero / page titles |

### Font Weights

| Token | Weight |
|-------|--------|
| `--bd-font-weight-normal` | 400 |
| `--bd-font-weight-medium` | 500 |
| `--bd-font-weight-semibold` | 600 |
| `--bd-font-weight-bold` | 700 |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `--bd-line-height-tight` | 1.4 | Compact UI elements |
| `--bd-line-height-normal` | 1.5 | Default body text |
| `--bd-line-height-relaxed` | 1.6 | Long-form content |

---

## 3. Spacing

4px base grid. Use multiples for consistency:

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| `--bd-space-1` | 4px | `--bd-space-6` | 24px |
| `--bd-space-2` | 8px | `--bd-space-8` | 32px |
| `--bd-space-3` | 12px | `--bd-space-10` | 40px |
| `--bd-space-4` | 16px | `--bd-space-12` | 48px |
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

## 5. Shadows

| Token | Usage |
|-------|-------|
| `--bd-shadow-sm` | Subtle elevation (buttons) |
| `--bd-shadow-md` | Cards, dropdowns |
| `--bd-shadow-lg` | Modals, popovers |
| `--bd-shadow-xl` | Full-screen overlays |
| `--bd-shadow-glow` | Brand accent ambient glow |
| `--bd-shadow-glow-lg` | Emphasized brand glow |

---

## 6. Transitions

| Token | Duration | Usage |
|-------|----------|-------|
| `--bd-transition-fast` | 0.15s ease | Hover, focus states |
| `--bd-transition-normal` | 0.2s ease | Toggles, expand/collapse |
| `--bd-transition-slow` | 0.3s ease | Page transitions, modals |

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
| `--bd-z-toast` | 99999 | Toast notifications |
| `--bd-z-loading` | 999999 | Loading overlays |

---

## 8. Component Conventions

### Buttons

| Variant | Background | Hover |
|---------|------------|-------|
| **Primary** | 135° gradient `accent-primary → accent-secondary` | Gradient `accent-light → accent-primary` + `translateY(-1px)` + glow shadow |
| **Secondary / Ghost** | `rgba(255,255,255,0.08)` | `rgba(255,255,255,0.12)` |
| **Danger** | `error-bg` with error border | Solid `error` background, white text |

### Cards

- Background: `--bd-card-bg` (`--bd-bg-secondary`)
- Border: `1px solid --bd-card-border` (`--bd-border-subtle`)
- Hover: background shifts to `--bd-card-hover-bg`, border to `--bd-card-hover-border`
- Radius: `--bd-card-radius` (`--bd-radius-xl` / 10px)

### Inputs

- Background: `--bd-input-bg` (`--bd-bg-elevated`)
- Border: `1px solid --bd-input-border`
- Focus: border becomes `--bd-input-focus-border` + `--bd-input-focus-ring` (3px accent glow)

### Toggle Switches

- Track off: `--bd-bg-elevated`
- Track on: `--bd-accent-primary`
- Thumb: transitions from muted to white on activation

### Section Headers

- Font: uppercase, `--bd-font-size-xs`, `--bd-font-weight-semibold`, `letter-spacing: 0.5px`
- Color: `--bd-text-muted`
- Icon: 14–16px, matching section's category color

---

## 9. Icons

All projects use [Lucide Icons](https://lucide.dev/):

- **BetterDungeon**: Lucide CSS icon font (`lucide.css`)
- **BetterRepository**: `lucide-vue-next` Vue component library

Standard icon sizes:
- **Inline** (next to text): 14–16px
- **Card header**: 16–18px
- **Navigation**: 16–20px
- **Hero / empty state**: 24–32px

---

## 10. Gradient Patterns

### Brand Title Gradient
```css
background: linear-gradient(135deg, var(--bd-accent-primary) 0%, var(--bd-accent-secondary) 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Primary Button Gradient
```css
background: linear-gradient(135deg, var(--bd-accent-primary) 0%, var(--bd-accent-secondary) 100%);
/* hover: */
background: linear-gradient(135deg, var(--bd-accent-light) 0%, var(--bd-accent-primary) 100%);
```

### Decorative Accent Bar
```css
background: linear-gradient(to right, var(--bd-accent-primary), var(--bd-purple), var(--bd-cyan));
height: 1px; /* or 2–4px for emphasis */
```

---

## 11. Scrollbar Styling

```css
::-webkit-scrollbar { width: 6–8px; }
::-webkit-scrollbar-track { background: var(--bd-bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--bd-bg-elevated); border-radius: var(--bd-radius-sm); }
::-webkit-scrollbar-thumb:hover { background: var(--bd-border-strong); }
```

---

## 12. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| CSS variables | `--bd-{category}-{property}` | `--bd-bg-primary` |
| CSS classes (extension) | `bd-{component}-{modifier}` | `bd-widget-bar-fill` |
| CSS classes (popup) | BEM-lite: `{block}-{element}` | `feature-card`, `modal-header` |
| Tailwind utilities | `bd-{token}` mapping | `bg-bd-bg-primary`, `text-bd-accent-light` |

---

## Updating This System

1. Edit `Project Management/design/theme-variables.css` — this is the **canonical** file.
2. Copy / sync changes to each project's local copy:
   - `BetterDungeon/core/theme-variables.css`
   - `BetterRepository/design/theme-variables.css`
3. If adding Tailwind-mapped tokens, update `BetterRepository/tailwind.config.js` to match.
4. Update this README if new token categories or conventions are introduced.
