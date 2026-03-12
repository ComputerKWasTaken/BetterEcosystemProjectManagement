# Adventure Page — Input Modes (Do / Say / Story / See + Try / Command)

> Detailed DOM reference for the input mode selection system — the floating toolbar that lets players switch between Do, Say, Story, and See action types. Also documents BetterDungeon's injected Try and Command modes.

## Overview

When the input drawer is open, two overlapping toolbars control the current input mode:

1. **Collapsed Mode Bar** (`id="28"`) — Shows the current mode with a close button and a mode-switch button. Visible by default when input is open.
2. **Expanded Input Mode Menu** (`id="30"`) — Full list of all four modes plus a back button. Shown when the user clicks the mode-switch button.

> **Note**: BetterDungeon injects two additional modes — **Try** and **Command** — into the expanded menu. See [BetterDungeon Custom Buttons](#betterdungeon-custom-buttons-try--command) below.

Both are positioned absolutely at `top: -24px; left: 32px` inside the input drawer's inner container, floating above the textarea.

---

## Location in DOM

```
Input Drawer Container (outer, position:absolute, bottom:0)
  └── Inner Container (_bg-coreA0, _maw-996px)
      ├── Visible Input Row (textarea + submit button)
      ├── Mirror Row (hidden sizing helper)
      └── <span t_coreA0 is_Theme> (theme wrapper, display:contents)
          ├── Expanded Input Mode Menu (id="30")  ← mode picker
          └── Collapsed Mode Bar (id="28")        ← default toolbar
```

Both toolbars are wrapped in a single `<span class="t_sub_theme t_coreA0 is_Theme">` container.

---

## Expanded Input Mode Menu (id="30")

The full mode picker that appears when the user wants to change their input mode:

```html
<div class="css-g5y9jx r-105ug2t" id="30"
     style="opacity: 1; transform: translateX(0px) scaleX(1);
            box-shadow: rgba(0, 0, 0, 0.2) 0px 8px 16px;
            flex: 0 1 0%; border-radius: 9px; flex-direction: row;
            overflow: hidden; padding: 0px; position: absolute;
            left: 32px; top: -24px;
            background-color: rgb(47, 53, 57); z-index: 2;">
```

| Property | Value |
|----------|-------|
| **Position** | `absolute`, `left: 32px`, `top: -24px` |
| **Z-index** | `2` (above the collapsed bar at z-index 1) |
| **Background** | `rgb(47, 53, 57)` (dark gray, inline) |
| **Border radius** | `9px` |
| **Box shadow** | `rgba(0,0,0,0.2) 0px 8px 16px` (drop shadow) |
| **Layout** | `flex-direction: row` — buttons are horizontal |
| **Overflow** | `hidden` |
| **Animation** | `translateX` and `scaleX` for entrance/exit |

### Visible State
- `opacity: 1`, `transform: translateX(0px) scaleX(1)` — fully visible and at rest.

### Hidden State
- Animates out via `translateX` and `scaleX` changes, then opacity fades.

---

## Expanded Menu Buttons

The menu contains 5 native buttons in a horizontal row (6–7 with BetterDungeon):

```
Native:        [← Back]  [🏃 Do]  [💬 Say]  [✈️ Story]  [🖼️ See]
BetterDungeon: [← Back]  [🏃 Do]  [🎮 Try]  [💬 Say]  [✈️ Story]  [🖼️ See]  [🤖 Command]
```

### 1. Back / Close Button

```html
<div aria-label="Close 'Input Mode' menu"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background _brc-blackA2 _brw-1px">
  <span class="is_Text font_icons _col-coreA8 _fos-f-size-1">
    w_arrow_left
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Close 'Input Mode' menu"]` |
| **Icon** | `w_arrow_left` |
| **Icon color** | `coreA8` (muted) |
| **Height** | `48px` |
| **Padding** | `18px` horizontal |
| **Right border** | `1px solid blackA2` (separator line) |
| **Border radius** | `0` (no rounding — fits flush inside parent's 9px radius) |

---

### 2. Do Mode

```html
<div aria-label="Set to 'Do' mode"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background _btw-1px _brw-1px _bbw-1px _blw-1px">
  <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
    w_run
  </span>
  <span class="is_Text font_body _col-core9 _fos-16px">
    Do
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Set to 'Do' mode"]` |
| **Icon** | `w_run` |
| **Label** | `Do` |
| **Label color** | `core9` (bright text) |
| **Placeholder when active** | `"What do you do?"` |
| **Submit icon when active** | `w_run` |

---

### 3. Say Mode

```html
<div aria-label="Set to 'Say' mode"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background">
  <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
    w_comment
  </span>
  <span class="is_Text font_body _col-core9 _fos-16px">
    Say
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Set to 'Say' mode"]` |
| **Icon** | `w_comment` |
| **Label** | `Say` |
| **Placeholder when active** | `"What do you say?"` |
| **Submit icon when active** | `w_comment` |

---

### 4. Story Mode

```html
<div aria-label="Set to 'Story' mode"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background">
  <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
    w_paper_plane
  </span>
  <span class="is_Text font_body _col-core9 _fos-16px">
    Story
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Set to 'Story' mode"]` |
| **Icon** | `w_paper_plane` |
| **Label** | `Story` |
| **Placeholder when active** | Likely `"What happens next?"` or similar |
| **Submit icon when active** | `w_paper_plane` |

---

### 5. See Mode

```html
<div aria-label="Set to 'See' mode"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background">
  <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
    w_image
  </span>
  <span class="is_Text font_body _col-core9 _fos-16px">
    See
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Set to 'See' mode"]` |
| **Icon** | `w_image` |
| **Label** | `See` |
| **Placeholder when active** | Likely `"What do you see?"` or similar |
| **Submit icon when active** | `w_image` |

---

## Shared Button Properties (All Mode Buttons)

| Property | Value |
|----------|-------|
| **Element** | `div` with `role="button"` and `class*="is_Button"` |
| **Height** | `48px` |
| **Padding** | `18px` left and right |
| **Background** | `background` (theme token) |
| **Border** | `1px solid` on all sides, `borderColor` token |
| **Border radius** | `0` (buttons are flush — parent has 9px) |
| **Icon font size** | `14px` (mode buttons) or `f-size-1` (back button) |
| **Icon color** | `coreA8` (muted gray) |
| **Label font size** | `16px` |
| **Label color** | `core9` (bright) |
| **Cursor** | `pointer` |
| **User select** | `none` |

---

## Collapsed Mode Bar (id="28")

The compact toolbar shown by default when the input drawer is open. Displays the current mode and offers a close button + mode-switch trigger.

```html
<div class="css-g5y9jx r-633pao" id="28"
     style="opacity: 0; transform: translateX(32px) scaleX(1.5);
            flex-direction: row; border-radius: 9px;
            align-self: flex-start; overflow: hidden;
            position: absolute; background-color: rgb(47, 53, 57);
            left: 32px; top: -24px; z-index: 1;">
```

| Property | Value |
|----------|-------|
| **Position** | `absolute`, `left: 32px`, `top: -24px` (same as expanded) |
| **Z-index** | `1` (below expanded menu's z-index 2) |
| **Background** | `rgb(47, 53, 57)` (same dark gray) |
| **Border radius** | `9px` |
| **Layout** | `flex-direction: row` |
| **Pointer events** | `r-633pao` = `none !important` when hidden |

### Animation States

| State | Opacity | Transform | Notes |
|-------|---------|-----------|-------|
| **Hidden** (expanded menu open) | `0` | `translateX(32px) scaleX(1.5)` | Scaled out to the right |
| **Visible** (default toolbar) | `1` | `translateX(0px) scaleX(1)` | At rest position |

---

### Collapsed Bar — Background Layer

The collapsed bar has its own decorative blurred background image:

```html
<div aria-hidden="true"
     class="is_View _pos-absolute _fd-column _t-0px _l-0px
            _w-10037 _h-10037 _zi-0 _o-0--15
            _ox-hidden _oy-hidden _btrr-9px _btlr-9px">
  <div id="gameplay-saturate"
       class="is_View _fd-column _pos-absolute _b--100px
              _l--280... _w-1067px _h-695px">
    <img alt="" src="...blur250" ...>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Opacity** | `0.15` (`_o-0--15`) — subtler than the main input drawer (0.2) |
| **Reuses** | `#gameplay-saturate` and same `blur250` image |

---

### Collapsed Bar — Close Text Input Button

```html
<div aria-hidden="true"
     aria-label="Close text input"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background _brc-blackA2 _brw-1px">
  <span class="is_Text font_icons _col-coreA8 _fos-14px">
    w_close
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Close text input"]` |
| **Icon** | `w_close` |
| **Height** | `48px` |
| **Right border** | `1px solid blackA2` (separator) |
| **Note** | `aria-hidden="true"` when the collapsed bar is hidden |

---

### Collapsed Bar — Change Input Mode Button

Shows the current mode name with chevron arrows, acts as a trigger to open the expanded menu:

```html
<div aria-hidden="true"
     aria-label="Change input mode"
     role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _bg-background">
  <div class="is_Row is_View _fd-row _ai-center _gap-18px _zi-1 _pe-none">
    <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
      w_chevron_left
    </span>
    <span class="is_Text font_body _col-core9 _fos-16px _tt-capitalize">
      do
    </span>
    <span class="is_Text font_icons _col-coreA8 _fos-14px _o-1">
      w_chevron_right
    </span>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Change input mode"]` |
| **Layout** | Row with `gap: 18px` — left chevron, mode label, right chevron |
| **Mode label** | Dynamic text matching current mode (e.g., `do`, `say`, `story`, `see`) |
| **Text transform** | `capitalize` (first letter uppercase) |
| **Icons** | `w_chevron_left` and `w_chevron_right` flanking the label |

---

## Input Mode Reference Table

| Mode | Icon | Label | Placeholder | Submit Icon | Selector | Source |
|------|------|-------|-------------|-------------|----------|--------|
| **Do** | `w_run` | Do | `"What do you do?"` | `w_run` | `[aria-label="Set to 'Do' mode"]` | Native |
| **Try** | `w_controller` | Try | *(uses Do placeholder)* | `w_run` | `[aria-label="Set to 'Try' mode"]` | BetterDungeon |
| **Say** | `w_comment` | Say | `"What do you say?"` | `w_comment` | `[aria-label="Set to 'Say' mode"]` | Native |
| **Story** | `w_paper_plane` | Story | *(varies)* | `w_paper_plane` | `[aria-label="Set to 'Story' mode"]` | Native |
| **See** | `w_image` | See | *(varies)* | `w_image` | `[aria-label="Set to 'See' mode"]` | Native |
| **Command** | `w_ai` | Command | *(uses Story placeholder)* | `w_paper_plane` | `[aria-label="Set to 'Command' mode"]` | BetterDungeon |

---

## Interaction Flow

```
Input drawer opens (e.g., "Take a Turn" clicked)
  │
  ├── Collapsed Mode Bar appears (id="28", visible)
  │     Shows: [✕ Close]  [← do →]
  │
  ├── User clicks "Change input mode" button
  │     ├── Collapsed bar animates out (scaleX → 1.5, opacity → 0)
  │     └── Expanded menu animates in (translateX → 0, scaleX → 1, opacity → 1)
  │           Shows: [← Back]  [Do]  [Say]  [Story]  [See]
  │
  ├── User clicks a mode (e.g., "Say")
  │     ├── Textarea placeholder changes to "What do you say?"
  │     ├── Submit button icon changes to w_comment
  │     ├── Expanded menu animates out
  │     └── Collapsed bar animates in, label updates to "say"
  │
  └── User clicks "Close text input" or "Back"
        └── Input drawer closes / expanded menu closes
```

---

## Sprite-Themed Button Structure

When a **sprite-based custom theme** is active (e.g., S'mores, Cyber), each button's DOM structure changes significantly from the Dynamic (default) theme.

### Dynamic Theme (Default) — No Sprites

```html
<div aria-label="Set to 'Do' mode" role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _ox-hidden _oy-hidden _bg-background
            _btw-1px _brw-1px _bbw-1px _blw-1px">
  <div class="is_View ... _ai-center _jc-center _zi-1">
    <span class="font_icons ...">w_run</span>
  </div>
  <span class="font_body ...">Do</span>
</div>
```

Key classes: `_ox-hidden _oy-hidden`, `_bg-background`, border widths `1px` on all sides.

### Sprite Theme — With Sprite Wrapper

```html
<div aria-label="Set to 'Do' mode" role="button"
     class="is_Button is_View ... _h-48px _pr-18px _pl-18px
            _ox-visible _oy-visible
            _bg-rgba000038295333
            _brw-0px _btw-0px _bbw-0px _blw-0px">

  <!-- Sprite wrapper — position:absolute overlay containing the sprite viewport -->
  <div class="css-g5y9jx"
       style="position: absolute; height: 100%; width: 100%;
              flex-direction: row; z-index: 1; pointer-events: none;
              justify-content: space-between;">

    <!-- Sprite viewport — clips the visible portion of the sprite sheet -->
    <div class="_ox-hidden _oy-hidden _w-80px _h-48px _pos-relative">

      <!-- Positioner — full sprite sheet, offset to show the correct region -->
      <div style="width: 1440px; height: 600px; left: -296px; top: 0px;">
        <div style="background-image: url('...theme-sprite.png');"
             class="r-1niwhzg r-vvn4in r-u6sd8q ..."></div>
        <img alt="" class="css-9pa8cd" src="...theme-sprite.png">
      </div>
    </div>
  </div>

  <!-- Text content (same as Dynamic, sits above sprite via z-index) -->
  <div class="is_View ... _ai-center _jc-center _zi-1">
    <span class="font_icons ...">w_run</span>
  </div>
  <span class="font_body ...">Do</span>
</div>
```

Key differences from Dynamic:

| Property | Dynamic | Sprite |
|----------|---------|--------|
| **Overflow** | `_ox-hidden _oy-hidden` | `_ox-visible _oy-visible` |
| **Background** | `_bg-background` (theme token) | `_bg-rgba000038295333` (semi-transparent black) |
| **Border width** | `1px` all sides | `0px` all sides |
| **Sprite wrapper** | Not present | `div[style*="position: absolute"]` with viewports |

### End-Cap vs Middle Button Sprites

Buttons at the **end** of the row (Close, See/Command) use a **3-part sprite** (left cap + stretchable center + right cap), while **middle** buttons (Do, Say, Story) use a **single viewport**:

```
Middle button:   [ ═══════ single viewport ═══════ ]
End-cap button:  [ left-cap ][ ═══ center ═══ ][ right-cap ]
                    16px         flexible          16px
```

The end-cap viewports are fixed at `16px` wide; the center stretches to fill the remaining width.

---

## Sprite Hover Displacement

Native buttons handle hover states by **shifting the sprite positioner horizontally** to reveal a hover-state region of the sprite sheet. This is done via inline `style.left` changes, not CSS classes.

### Displacement Formula

```
hoverLeft = restLeft - (positionerWidth × 17/90)
```

Where:
- **`restLeft`** — the positioner's `left` value at rest (non-hover)
- **`positionerWidth`** — the positioner's `width` (full sprite sheet width at current scale)
- **`17/90 ≈ 0.1889`** — a fixed fraction mapping to the horizontal gap between non-hover and hover regions in every AI Dungeon sprite sheet

### Example

For a Do button with positioner `width: 1440px` and `left: -296px`:

```
displacement = 1440 × 17/90 = 272px
hoverLeft    = -296 - 272   = -568px
```

On `mouseenter`, the positioner's `left` shifts from `-296px` to `-568px`.  
On `mouseleave`, it returns to `-296px`.

### Multi-Viewport Hover (End-Cap Buttons)

For 3-part end-cap buttons, **each viewport's positioner** is independently displaced by `17/90` of its own width:

```javascript
for (const viewport of viewports) {
  const positioner = viewport.firstElementChild;
  const posWidth = parseFloat(positioner.style.width);
  const restLeft = parseFloat(positioner.style.left);
  const hoverLeft = restLeft - (posWidth * 17 / 90);
  // Apply hoverLeft on mouseenter, restLeft on mouseleave
}
```

---

## BetterDungeon Custom Buttons (Try & Command)

BetterDungeon injects **Try** (between Do and Say) and **Command** (after See, at the end) by cloning native buttons and modifying their labels/icons.

### Injection Strategy

| Button | Cloned From | Position | Sprite Source |
|--------|------------|----------|---------------|
| **Try** | Do button | After Do, before Say | Do button's single viewport |
| **Command** | Story button | After See (last) | See button's 3-part end-cap |

When Command is injected, **See** is converted from an end-cap button to a **middle button** (its 3-part sprite is replaced with a single-viewport clone from Story).

### Sprite Theming Process

1. **Clone** the native reference button via `cloneNode(true)`
2. **Check** if the clone's sprite viewport has non-zero width (sprites may not be populated yet due to async React rendering)
3. If empty, **re-clone** sprite content from the reference button's sprite wrapper
4. **Scale** the viewport and positioner proportionally to match the custom button's rendered width
5. **Wire up hover** displacement using the `17/90` formula
6. Mark the button with `data-bd-sprite-hover` to prevent duplicate event listeners

### Reactive Theme Detection

BetterDungeon tracks the current theme state (`_lastSpriteState`) and force re-injects custom buttons when a theme switch is detected (sprite ↔ dynamic). This ensures:
- Stale sprite content is removed when switching to Dynamic theme
- Fresh sprite content is cloned when switching to a sprite theme
- See's end-cap/middle conversion is re-applied correctly
- Dynamic-theme color styling (`bd-mode-button-colored`) is cleaned up on sprite themes

The menu container receives a `data-bd-sprite-menu` attribute when sprites are active, which triggers a CSS rule to make its background transparent (eliminating visible gray gaps between sprite-covered buttons).

---

## Reliable Selectors for BetterDungeon

```javascript
// Expanded input mode menu
const modeMenu = document.querySelector('[aria-label="Close \'Input Mode\' menu"]')?.parentElement;
const isModeMenuOpen = modeMenu && getComputedStyle(modeMenu).opacity !== '0';

// Individual mode buttons (native)
const doBtn    = document.querySelector('[aria-label="Set to \'Do\' mode"]');
const sayBtn   = document.querySelector('[aria-label="Set to \'Say\' mode"]');
const storyBtn = document.querySelector('[aria-label="Set to \'Story\' mode"]');
const seeBtn   = document.querySelector('[aria-label="Set to \'See\' mode"]');

// BetterDungeon custom buttons
const tryBtn     = document.querySelector('[aria-label="Set to \'Try\' mode"]');
const commandBtn = document.querySelector('[aria-label="Set to \'Command\' mode"]');

// Collapsed mode bar buttons
const closeInputBtn  = document.querySelector('[aria-label="Close text input"]');
const changeModeBtn  = document.querySelector('[aria-label="Change input mode"]');

// Get current mode from collapsed bar label
function getCurrentMode() {
  const label = changeModeBtn?.querySelector('.is_Text.font_body');
  return label?.textContent?.trim().toLowerCase() || 'unknown';
}

// Programmatically switch mode
function switchToMode(mode) {
  const btn = document.querySelector(`[aria-label="Set to '${mode}' mode"]`);
  btn?.click();
}

// Detect whether a sprite-based theme is active
function isSpriteThemeActive() {
  const doBtn = document.querySelector('[aria-label="Set to \'Do\' mode"]');
  if (!doBtn) return false;
  const wrapper = doBtn.querySelector('div[style*="position: absolute"]');
  if (!wrapper) return false;
  const viewport = wrapper.querySelector('div[class*="_ox-hidden"]');
  if (!viewport) return false;
  return parseFloat(window.getComputedStyle(viewport).width) > 0;
}
```

---

## See Also

- [Text Input Area](adventure-page-input.md)
- [Command Bar](adventure-page-commands.md)
- [Adventure Page Overview](adventure-page-overview.md)
- [CSS Architecture](css-architecture.md)
