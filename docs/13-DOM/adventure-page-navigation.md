# Adventure Page — Navigation Bar

> Detailed DOM reference for the top navigation toolbar on the Adventure page.

## Location in DOM

```
#__next > div > [Theme Wrappers] > div (main content)
  └── div (content container, width: 1067px)
      └── div[aria-label="Navigation bar"][role="toolbar"] (position:absolute, z-index:2)
```

The navigation bar is **absolutely positioned** at the top of the content container with `z-index: 2`, floating above the story scroll area. It uses `transform: translateY(0px)` — suggesting it can animate in/out (e.g., hide on scroll).

---

## Structure

```html
<div aria-label="Navigation bar" role="toolbar" tabindex="0"
     style="width: 100%; position: absolute; z-index: 2; transform: translateY(0px);">
  <div class="is_View _pos-relative _fd-column">
    <div class="is_View ... _pos-relative _fd-row _zi-1 _mih-t-size-barH... _w-10037
                _pr-t-space-3 _pl-t-space-3 _ai-center _jc-space-betwe... _gap-t-space-5
                _pt-8px _pb-t-space-0">

      <!-- LEFT SIDE: Menu + Title -->
      <div class="is_Row is_View _fd-row _fs-1 _gap-t-space-2 _ai-center">
        [Game Menu Button]
        [Story Title]
      </div>

      <!-- RIGHT SIDE: Model, Undo/Redo, Settings -->
      <div class="is_Row is_View _fd-row _gap-t-space-1">
        [Model Switcher Column]
        [Undo/Redo Row]
        [Settings Button]
      </div>

    </div>
  </div>
</div>
```

**Layout**: Horizontal flex row with `justify-content: space-between`. Left side has Menu + Title, right side has controls.

---

## Elements (Left to Right)

### 1. Game Menu Button

Opens the side navigation / game menu.

```html
<div id="game-blur-button"
     aria-label="Game Menu"
     role="button"
     aria-expanded="false"
     data-state="closed"
     data-disable-theme="true"
     aria-haspopup="dialog"
     class="is_Button is_View ... _cur-pointer _h-t-size-5 _w-t-size-8
            _btlr-t-radius-64 _btrr-t-radius-64 _bbrr-t-radius-64 _bblr-t-radius-64
            _bg-background _btw-1px _brw-1px _bbw-1px _blw-1px">
  <div class="is_Row is_View _fd-row ... _ai-center _jc-center _pe-none">
    <div class="is_View ... _ai-center _jc-center">
      <span aria-hidden="true"
            class="is_Text font_icons _col-core9 _fos-f-size-3">
        w_social_aidungeon
      </span>
    </div>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Game Menu"]` |
| **ID** | `game-blur-button` (shared — not unique!) |
| **Icon glyph** | `w_social_aidungeon` |
| **Shape** | Pill/rounded (`border-radius: t-radius-64`) |
| **Size** | Height: `t-size-5`, Width: `t-size-8` |
| **Border** | 1px solid all sides |
| **Backdrop** | `backdrop-filter: blur(24px) saturate(1.5)` via `#game-blur-button` CSS rule |
| **Dialog** | `aria-haspopup="dialog"`, `data-state="closed"` |

**BetterDungeon note**: The `#game-blur-button` ID is reused on Undo, Redo, and Settings buttons. The CSS rule `#game-blur-button { backdrop-filter: blur(24px) saturate(1.5) }` applies to ALL of them. Use `aria-label` to target specifically.

---

### 2. Story Title

Displays the current adventure/scenario name.

```html
<span role="heading" aria-level="1"
      aria-label="Story title: You're the Eccentric Cousin"
      class="is_Text font_body _col-core9 _fos-f-size-3 _fow-500
             _ws-nowrap _pe-none _maw-10037 _ox-hidden _oy-hidden
             _textOverflow-ellipsis _pr-t-space-2 _pos-relative _t--3px">
  You're the Eccentric Cousin
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[role="heading"][aria-level="1"]` or `[aria-label^="Story title:"]` |
| **Font** | `font_body`, size `f-size-3`, weight 500 |
| **Color** | `core9` (light text on dark theme) |
| **Overflow** | Hidden with `text-overflow: ellipsis` |
| **Interaction** | `pointer-events: none` — not clickable |
| **Position** | Offset `top: -3px` for visual alignment |

---

### 3. Model Switcher

Shows the currently selected AI model and opens a model selection dialog.

```html
<div class="is_Column is_View _fd-column _ai-center _jc-space-betwe...">
  <div aria-label="Model Switcher"
       role="button"
       aria-expanded="false"
       data-state="closed"
       data-disable-theme="true"
       aria-haspopup="dialog"
       class="is_Button is_View ... _h-t-size-8
              _btlr-t-radius-10 _btrr-t-radius-10 _bbrr-t-radius-10 _bblr-t-radius-10
              _ox-visible _oy-visible _w-t-size-8 _mah-t-size-5 _maw-t-size-5
              _btw-1px _brw-1px _bbw-1px _blw-1px">
    <div class="is_Row is_View _fd-row ... _ai-center _jc-center _pe-none _gap-t-space-1">
      <img alt="DeepSeek"
           src="https://latitude-standard-pull-zone-1.b-cdn.net/.../DeepSeek32.svg"
           style="height: 18px; width: 18px; object-fit: contain; z-index: 100;">
    </div>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Model Switcher"]` |
| **Shape** | Rounded (`t-radius-10`) |
| **Size** | `t-size-8` height, constrained to `t-size-5` max |
| **Content** | `<img>` tag with model icon (18×18px) |
| **Overflow** | `visible` (unlike other buttons which clip) |
| **Dialog** | `aria-haspopup="dialog"`, `data-state="closed"` |

**BetterDungeon note**: The model name is in the `alt` attribute of the `<img>` (e.g., `"DeepSeek"`). The image URL follows the pattern `.../model-images/icons/[ModelName]32.svg`.

---

### 4. Undo Button

Undoes the last story action.

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="color: var(--color); display: contents;">
  <div id="game-blur-button"
       aria-label="Undo change"
       role="button"
       class="is_Button is_View ... _cur-pointer _h-t-size-5
              _btlr-t-radius-10 _btrr-t-radius-10 _bbrr-t-radius-10 _bblr-t-radius-10
              _w-t-size-5 _mah-t-size-5 _maw-t-size-5
              _btw-1px _brw-1px _bbw-1px _blw-1px">
    <span aria-hidden="true"
          class="is_Text font_icons _col-core9 _fos-f-size-2 _o-1 _ussel-none">
      w_undo
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Undo change"]` |
| **Icon glyph** | `w_undo` |
| **Size** | Square: `t-size-5` × `t-size-5` |
| **Theme wrapper** | `t_sub_theme t_coreA1` — muted/secondary color |
| **Opacity** | `1` when active (has undo history) |

---

### 5. Redo Button

Redoes a previously undone action.

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="color: var(--color); display: contents;">
  <div id="game-blur-button"
       aria-label="Redo change"
       role="button"
       aria-disabled="true"
       class="is_Button is_View ... _cur-pointer _h-t-size-5
              _w-t-size-5 _mah-t-size-5 _maw-t-size-5
              _pe-none _btw-1px _brw-1px _bbw-1px _blw-1px">
    <span aria-hidden="true"
          class="is_Text font_icons _col-core9 _fos-f-size-2 _o-0--5 _ussel-none">
      w_redo
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Redo change"]` |
| **Icon glyph** | `w_redo` |
| **Disabled state** | `aria-disabled="true"`, `_pe-none` (pointer-events: none), opacity `0.5` |
| **Enabled state** | `aria-disabled` removed, opacity `1`, pointer-events restored |

**BetterDungeon note**: Check `aria-disabled` to determine button state, not CSS classes.

---

### 6. Settings Button

Opens the game settings panel.

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="color: var(--color); display: contents;">
  <div id="game-blur-button"
       aria-label="Game settings"
       role="button"
       class="is_Button is_View ... _cur-pointer _h-t-size-5
              _btlr-t-radius-10 _w-t-size-5 _mah-t-size-5 _maw-t-size-5
              _ox-visible _oy-visible
              _btw-1px _brw-1px _bbw-1px _blw-1px">
    <div class="is_View _pos-relative _fd-column _t-2--6537 _l-0px _ai-center _jc-center">
      <span aria-hidden="true"
            class="is_Text font_icons _col-core9 _fos-f-size-2">
        w_gear
      </span>
    </div>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Game settings"]` |
| **Icon glyph** | `w_gear` |
| **Overflow** | `visible` (dropdowns/panels may overflow) |
| **Size** | Square: `t-size-5` × `t-size-5` |

---

## Navigation Bar Layout Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ [🏰 Menu] Story Title...              [⚙] [↩] [↪] [⚙Settings] │
│  Game Menu   (heading h1)          Model Undo Redo   Settings  │
└─────────────────────────────────────────────────────────────────┘
     ↑                                  ↑    ↑    ↑       ↑
   pill shape                        square  square  square
   w-t-size-8                       t-size-5 each (except model)
```

---

## Reliable Selectors for BetterDungeon

```javascript
// Navigation bar container
const navBar = document.querySelector('[aria-label="Navigation bar"]');

// Individual buttons (preferred method)
const menuBtn    = document.querySelector('[aria-label="Game Menu"]');
const modelBtn   = document.querySelector('[aria-label="Model Switcher"]');
const undoBtn    = document.querySelector('[aria-label="Undo change"]');
const redoBtn    = document.querySelector('[aria-label="Redo change"]');
const settingsBtn = document.querySelector('[aria-label="Game settings"]');

// Story title
const storyTitle = document.querySelector('[aria-label^="Story title:"]');

// Current model name
const modelImg = document.querySelector('[aria-label="Model Switcher"] img');
const modelName = modelImg?.alt; // e.g., "DeepSeek"
```

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Command Bar](adventure-page-commands.md)
- [CSS Architecture](css-architecture.md)
