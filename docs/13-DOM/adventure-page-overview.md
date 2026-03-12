# Adventure Page — DOM Overview

> High-level structural breakdown of the AI Dungeon Adventure (gameplay) page.

## Route

```
/[contentType]/[shortId]/[title]/play
```

Example: `/scenario/BgHjN2Rgxbp3/youre-the-eccentric-cousin/play`

Route metadata is embedded in the `__NEXT_DATA__` script tag:
```json
{
  "page": "/[contentType]/[shortId]/[title]/play",
  "query": {
    "source": "discover",
    "published": "true",
    "contentType": "scenario",
    "shortId": "BgHjN2Rgxbp3",
    "title": "youre-the-eccentric-cousin"
  }
}
```

---

## Full Page Hierarchy

```
<html class="t_dark" style="--vh: 6.95px;">
├── <head> ... (meta, scripts, styles)
└── <body>
    ├── <div id="__next">
    │   └── <div> (root flex container, r-13awgt0 = flex:1)
    │       └── [Theme Wrappers: t_dark > is_Theme > font_body > t_sub_theme t_core1]
    │           ├── LAYER 0: Background Layer (position:absolute, z-index:0)
    │           │   ├── Ambience Image + #gameplay-saturate
    │           │   └── Gradient Overlay (linear-gradient)
    │           │
    │           └── LAYER 1: Main Content (position:relative, flex-row)
    │               └── Content Container (width: 1067px)
    │                   ├── Navigation Bar (position:absolute, z-index:2)
    │                   │   ├── Game Menu Button
    │                   │   ├── Story Title
    │                   │   ├── Model Switcher
    │                   │   ├── Undo / Redo Buttons
    │                   │   └── Settings Button
    │                   │
    │                   ├── Story Area (.game-text-mask, position:absolute, z-index:0)
    │                   │   └── ScrollView
    │                   │       └── Story Container (max-width:996px)
    │                   │           ├── Safe Area Padding
    │                   │           ├── Nav Bar Spacers (x2)
    │                   │           ├── #gameplay-output (Story + Actions)
    │                   │           └── Command Bar
    │                   │
    │                   └── Text Input Drawer (position:absolute, bottom:0, z-index:0)
    │                       ├── #game-text-input (textarea)
    │                       └── Submit Button
    │
    ├── Toast/Notification Viewport (position:fixed, z-index:100000)
    ├── Theme Portal Layers (position:fixed, various z-indexes)
    ├── Churnkey Widgets
    ├── Stripe iframe
    ├── Google Analytics scripts
    ├── Cloudflare challenge iframe
    └── <next-route-announcer> (accessibility)
```

---

## Layout Layers (Z-Index Stack)

The Adventure page uses absolute/fixed positioning to create distinct visual layers:

| Layer | Z-Index | Element | Purpose |
|-------|---------|---------|---------|
| Background | 0 | Ambience image + gradient overlay | Visual backdrop behind all content |
| Story Area | 0 | `.game-text-mask` | Scrollable story text with masking |
| Navigation | 2 | Navigation toolbar | Top bar floats above story |
| Text Input | 0 → 3 | Input drawer | `z-index: 0` when closed, `3` when open |
| Toast | 100000 | Notification viewport | Toasts/alerts on top of everything |
| Portals | 101–25101 | Theme portal spans | Dialogs, modals, dropdowns |

---

## Theme Wrapper Chain

Every element on the page is nested inside a chain of theme wrappers. This is how Tamagui applies design tokens:

```html
<span class="t_dark _dsp_contents">
  <span class=" t_dark is_Theme" style="color: var(--color); display: contents;">
    <span class="_dsp_contents font_body">
      <span class="t_sub_theme t_core1 is_Theme" style="color: var(--color); display: contents;">
        <!-- Actual page content here -->
      </span>
    </span>
  </span>
</span>
```

- **`t_dark`** / **`t_light`** — Top-level theme (set via `localStorage.getItem('theme')`)
- **`is_Theme`** — Tamagui theme boundary marker
- **`font_body`** — Default font family context
- **`t_sub_theme t_core1`** — Sub-theme for the core content area
- **`_dsp_contents`** — `display: contents` (transparent wrapper, no box generated)

---

## Content Container Dimensions

The main content area has specific sizing constraints:

| Property | Value | Notes |
|----------|-------|-------|
| Container width | `1067px` | Fixed width for the content column |
| Story max-width | `996px` | Max width of story + command area |
| Story padding | `32px` left/right | Horizontal padding on story container |
| Min story height | `695px` | Minimum height for the story container |
| Input max-width | `996px` | Matches story width |
| Input padding | `32px` left/right, `32px` bottom, `40px` top | Input drawer padding |

---

## Key IDs Reference

| ID | Element | Uniqueness | Notes |
|----|---------|------------|-------|
| `__next` | Root Next.js container | Unique | Standard Next.js root |
| `gameplay-output` | Story article container | Unique | Primary story content wrapper |
| `game-text-input` | Action textarea | Unique | Text input for player actions |
| `game-blur-button` | Multiple buttons | **NOT UNIQUE** | Reused on Menu, Undo, Redo, Settings buttons |
| `gameplay-saturate` | Backdrop filter div | Used twice | Once in background layer, once in input drawer |
| `transition-opacity` | Story text spans | **NOT UNIQUE** | Every story section span uses this |
| `action-icon` | Action block icon | Per action block | Icon span inside action divs |
| `action-text` | Action block text | Per action block | Text span inside action divs |
| `model-switcher-title` | Model switcher heading | Unique | `"STORY MODELS"` heading inside the model dialog |
| `story-edit-textarea` | Story edit textarea | Conditional | Only present when editing story text |

---

## Key ARIA Labels Reference

Since many IDs are reused, `aria-label` is the most reliable way to target specific elements:

| aria-label | Element Type | Location |
|------------|-------------|----------|
| `"Navigation bar"` | `role="toolbar"` | Top navigation container |
| `"Game Menu"` | `role="button"` | Left-most nav button (hamburger/logo) |
| `"Story title: [title]"` | `role="heading"` | Story title text in nav |
| `"Model Switcher"` | `role="button"` | AI model selection button |
| `"Undo change"` | `role="button"` | Undo button in nav |
| `"Redo change"` | `role="button"` | Redo button in nav |
| `"Game settings"` | `role="button"` | Settings gear button in nav |
| `"Story"` | `role="article"` | Main story output container |
| `"Story section: [text...]"` | `role="document"` | Individual story sections |
| `"Action [text]"` | `role="heading"` | Player action text blocks |
| `"Last action: [text...]"` | `aria-live="polite"` | Most recent AI response |
| `"Command bar"` | `role="toolbar"` | Bottom command button container |
| `"Command: take a turn"` | `role="button"` | Take a Turn button |
| `"Command: continue"` | `role="button"` | Continue button |
| `"Command: retry"` | `role="button"` | Retry button |
| `"Command: erase"` | `role="button"` | Erase button |
| `"Action input"` | `textarea` | Text input for player actions |
| `"Submit action"` | `role="button"` | Submit/send button |
| `"Close 'Input Mode' menu"` | `role="button"` | Back button in expanded mode menu |
| `"Set to 'Do' mode"` | `role="button"` | Do mode button |
| `"Set to 'Say' mode"` | `role="button"` | Say mode button |
| `"Set to 'Story' mode"` | `role="button"` | Story mode button |
| `"Set to 'See' mode"` | `role="button"` | See mode button |
| `"Close text input"` | `role="button"` | Close button on collapsed mode bar |
| `"Change input mode"` | `role="button"` | Mode-switch trigger on collapsed bar |
| `"Close settings"` | `role="button"` | Close button on settings panel |
| `"Section Tabs"` | `role="tablist"` | Pill tab bar in settings (Plot/Story Cards/Details) |
| `"Accessibility"` | `role="button"` | Accordion toggle in settings |
| `"Behavior"` | `role="button"` | Accordion toggle in settings |
| `"Available AI models"` | `role="list"` | Model list inside model switcher dialog |
| `"Confirm selection: {Model}"` | `role="button"` | Confirm button in model switcher |
| `"Show more AI models"` | `role="button"` | Expand toggle in model switcher |
| `"Notifications (F8)"` | `role="region"` | Toast notification area |

---

## See Also

- [Navigation Bar](adventure-page-navigation.md)
- [Story Output](adventure-page-story.md)
- [Command Bar](adventure-page-commands.md)
- [Text Input Area](adventure-page-input.md)
- [Input Modes](adventure-page-input-modes.md)
- [Model Switcher](adventure-page-model-switcher.md)
- [Settings Panel](adventure-page-settings.md)
- [Background & Ambience](adventure-page-background.md)
- [CSS Architecture](css-architecture.md)
