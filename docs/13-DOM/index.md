# AI Dungeon DOM Reference

> Accurate, interference-free documentation of the AI Dungeon DOM structure, captured with no extensions active.

## Purpose

This section provides a thorough reference of the AI Dungeon front-end DOM as it exists natively — without BetterDungeon or any other extensions modifying it. This serves as the canonical baseline for:

1. **Feature development** — Know exactly what elements exist and where before injecting or modifying them
2. **Bug diagnosis** — Compare the native DOM against the modified DOM to isolate BetterDungeon-introduced issues
3. **Selector stability** — Document the class naming patterns and IDs so we can write resilient selectors
4. **Upgrade resilience** — When AI Dungeon pushes updates, we can re-capture the DOM and diff against these docs to see what changed

## Technology Stack (Observable)

- **Framework**: Next.js (React) — evidenced by `#__next`, `__NEXT_DATA__`, `_next/static/` asset paths
- **UI Library**: Tamagui / React Native Web — atomic CSS classes like `_fd-column`, `_w-10037`, `is_View`, `is_Button`
- **Styling**: Atomic CSS with design tokens — theme variables like `t-space-4`, `t-size-5`, `t-radius-10`
- **Theming**: Class-based dark/light (`t_dark`, `t_light`) with sub-themes (`t_sub_theme`, `t_core1`, `t_gameplayPrimary`)
- **Icon Font**: Custom icon font (`font_icons`) using `w_` prefixed glyph names (e.g., `w_gear`, `w_pencil`, `w_undo`)
- **Routing**: Dynamic routes — Adventure page is `/[contentType]/[shortId]/[title]/play`

## Pages Documented

### Adventure Page (Gameplay)
The primary page where players interact with scenarios. This is the most important page for BetterDungeon since nearly all features target it.

- [Adventure Page Overview](adventure-page-overview.md) — Full page hierarchy and layout layers
- [Navigation Bar](adventure-page-navigation.md) — Top toolbar: menu, title, model switcher, undo/redo, settings
- [Story Output](adventure-page-story.md) — The `#gameplay-output` area: story sections, action blocks, streaming
- [Command Bar](adventure-page-commands.md) — Bottom command buttons: Take a Turn, Continue, Retry, Erase
- [Text Input Area](adventure-page-input.md) — The `#game-text-input` textarea and submit button
- [Input Modes](adventure-page-input-modes.md) — Do / Say / Story / See mode selection menu
- [Settings Panel](adventure-page-settings.md) — Right sidebar: Adventure/Gameplay tabs, Plot, Story Cards, Themes, Text Style
- [Background & Ambience](adventure-page-background.md) — Background image layers, gradients, saturate filters
- [CSS Architecture](css-architecture.md) — Atomic class naming, theme system, font families, design tokens

## Capture Methodology

All DOM snapshots were captured with:
- **Browser**: Chrome
- **BetterDungeon**: Disabled (no extension interference)
- **Theme**: Dark mode (`t_dark`)
- **State**: Mid-adventure (story text + action history present, command bar visible)

This ensures the DOM reflects AI Dungeon's native, unmodified structure.

## Important Notes

- AI Dungeon uses **React Native Web / Tamagui**, so most elements are `div` or `span` with atomic utility classes rather than semantic HTML. Rely on `aria-label`, `role`, and `id` attributes for stable targeting.
- **IDs are scarce but valuable**: `#gameplay-output`, `#game-text-input`, `#game-blur-button`, `#gameplay-saturate`, `#action-icon`, `#action-text`, `#transition-opacity` are the main ones.
- **`#game-blur-button` is reused** across multiple buttons (Game Menu, Undo, Redo, Settings). Do not rely on it as a unique selector — use `aria-label` to disambiguate.
- Class names are **auto-generated and volatile** (e.g., `_bg-0hover-backgroundH3423444`). Prefer `aria-label`, `role`, and structural position for selectors.
- The `__NEXT_DATA__` script tag contains route metadata including `contentType`, `shortId`, and `title` — useful for detecting which page the user is on.
