# Adventure Page — Command Bar

> Detailed DOM reference for the bottom command bar containing gameplay action buttons.

## Location in DOM

```
#gameplay-output (Story article)
  └── ... (story sections and action blocks)

[Sibling of #gameplay-output, inside the same story container column]

<div> (command area wrapper, position:relative, w:100%, pt:48px, pb:64px)
  └── <div id="2"> (opacity:1, transform:scale(1))
      └── <div> (h:t-size-7, w:100%)
          ├── <div> (absolute, gap:0, w:100%) — empty layer
          ├── <div> (absolute, gap:0, w:100%) — ACTIVE COMMAND BAR
          │   └── [aria-label="Command bar"][role="toolbar"]
          └── <div> (absolute, gap:0, w:100%) — empty layer
```

The command bar sits **below** `#gameplay-output` inside the scrollable story container, meaning it scrolls with the story content. It is not fixed to the viewport.

---

## Command Bar Container

```html
<div aria-hidden="false"
     class="is_View _pos-relative _fd-column _w-10037 _pt-48px _ox-hidden _oy-hidden
            _pb-64px _jc-space-betwe... _l-0px _zi-0 _o-1 _pe-auto">
```

| Property | Value |
|----------|-------|
| Padding top | `48px` |
| Padding bottom | `64px` |
| Overflow | Hidden (both axes) |
| Pointer events | `auto` |
| Opacity | `1` |

### Inner Animated Wrapper

```html
<div id="2" style="opacity: 1; transform: scale(1);">
```

This wrapper handles show/hide animations for the command bar (e.g., during streaming, the bar may scale down).

### Toolbar Container

```html
<div aria-hidden="false"
     aria-label="Command bar"
     role="toolbar"
     tabindex="0"
     class="is_View _pos-relative _fd-column _h-t-size-7 _pe-auto _w-10037">
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Command bar"]` |
| **Role** | `toolbar` |
| **Height** | `t-size-7` (the standard command button height) |
| **Focusable** | Yes (`tabindex="0"`) |

### Inner Animated Row

```html
<div id="26" style="opacity: 1; transform: translateY(0px) scale(1);
     width: 100%; height: 100%; flex: 1 1 0%;">
```

Another animation wrapper — `id="26"` may change across sessions. The `translateY` and `scale` animate button entrance/exit.

### Horizontal Scroll Container

```html
<div class="... r-18u37iz r-16y2uox r-1wbh5a2 r-lltvgl r-buy8e9 r-agouwx r-2eszeu"
     style="width: 100%; max-height: 100%;">
```

| Class | Meaning |
|-------|---------|
| `r-18u37iz` | `flex-direction: row` |
| `r-lltvgl` | `overflow-x: auto` (horizontal scroll if buttons overflow) |
| `r-buy8e9` | `overflow-y: hidden` |
| `r-2eszeu` | `scrollbar-width: none` (hidden scrollbar) |

---

## Command Buttons Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  [✏️ TAKE A TURN]  [✨ CONTINUE]  [🔄 Retry]  [⌫ ERASE]         │
│   gameplayPrimary   gameplaySec    gameplaySec   gameplaySec      │
│   standalone        standalone     grouped        standalone      │
└────────────────────────────────────────────────────────────────────┘
```

The buttons are arranged in a flex row with `justify-content: flex-end` and `gap: 10px`:

```html
<div class="is_Row is_View _fd-row _gap-10px _h-t-size-7
            _jc-flex-end _pr-0px _pl-0px _fg-1 _fs-1 _fb-auto">
```

---

## Individual Command Buttons

### 1. Take a Turn

The primary action button — opens the text input for the player to type their action.

```html
<span class="t_sub_theme t_gameplayPrimary is_Theme"
      style="color: var(--color); display: contents;">
  <div aria-label="Command: take a turn"
       aria-roledescription="This is the take a turn command button."
       role="button"
       class="is_Button is_View ... _cur-pointer _h-t-size-7
              _btlr-9px _btrr-9px _bbrr-9px _bblr-9px
              _pr-28px _pl-28px _btw-2px _brw-2px _bbw-2px _blw-2px">

    <!-- Icon -->
    <div class="is_View _pos-relative _fd-column _t-2--6537 _l-0px _ai-center _jc-center">
      <span aria-hidden="true"
            class="is_Text font_icons _col-objectObjec... _fos-14px">
        w_pencil
      </span>
    </div>

    <!-- Label -->
    <span class="is_ButtonText is_Text font_body _col-color _tt-uppercase _fos-16px">
      take a turn
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Command: take a turn"]` |
| **Theme** | `t_gameplayPrimary` — primary accent color (stands out from others) |
| **Icon glyph** | `w_pencil` |
| **Label** | `take a turn` (uppercase via `text-transform: uppercase`) |
| **Border radius** | `9px` all corners |
| **Border width** | `2px` all sides |
| **Padding** | `28px` left and right |
| **Height** | `t-size-7` |
| **Active state** | `opacity: 0.5` on press (`_o-0active-0--5`) |

---

### 2. Continue

Tells the AI to continue the narrative without player input.

```html
<span class="t_sub_theme t_gameplaySecondary is_Theme"
      style="color: var(--color); display: contents;">
  <div aria-label="Command: continue"
       aria-roledescription="This is the continue command button."
       role="button"
       class="is_Button is_View ... _cur-pointer _h-t-size-7
              _btlr-9px _btrr-9px _bbrr-9px _bblr-9px
              _pr-28px _pl-28px _btw-2px _brw-2px _bbw-2px _blw-2px">

    <div class="is_View ... _ai-center _jc-center">
      <span aria-hidden="true" class="is_Text font_icons _fos-14px">
        w_wand
      </span>
    </div>

    <span class="is_ButtonText is_Text font_body _tt-uppercase _fos-16px">
      continue
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Command: continue"]` |
| **Theme** | `t_gameplaySecondary` — secondary/muted color |
| **Icon glyph** | `w_wand` |
| **Label** | `continue` |
| **Same sizing as Take a Turn** | 9px radius, 2px border, 28px h-padding |

---

### 3. Retry

Regenerates the last AI response. This button is **grouped** inside a bordered container (unlike the others which are standalone):

```html
<span class="t_sub_theme t_gameplaySecondary is_Theme"
      style="color: var(--color); display: contents;">
  <div class="is_Row is_View _o-0active-0--5 _fd-row
              _btw-2px _brw-2px _bbw-2px _blw-2px
              _h-t-size-7 _btlr-9px _btrr-9px _bbrr-9px _bblr-9px
              _btc-borderColor _brc-borderColor _bbc-borderColor _blc-borderColor
              _ox-hidden _oy-hidden">

    <div aria-label="Command: retry"
         aria-roledescription="This is the retry command button."
         role="button"
         class="is_Button is_View ... _cur-pointer _h-10037
                _btlr-t-radius-0 _btrr-t-radius-0 _bbrr-t-radius-0 _bblr-t-radius-0
                _pr-28px _pl-28px _btw-0px _brw-0px _bbw-0px _blw-0px">

      <div class="is_View ... _ai-center _jc-center">
        <span aria-hidden="true" class="is_Text font_icons _fos-14px">
          w_retry
        </span>
      </div>

      <span class="is_ButtonText is_Text font_body _tt-uppercase _fos-16px">
        Retry
      </span>
    </div>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Command: retry"]` |
| **Theme** | `t_gameplaySecondary` |
| **Icon glyph** | `w_retry` |
| **Label** | `Retry` |
| **Grouped** | Yes — wrapped in an outer `is_Row` container with its own border |
| **Inner border** | `0px` (border is on the outer wrapper) |
| **Inner radius** | `0` (no inner radius — outer wrapper has 9px) |
| **Height** | `100%` of parent (fills the group container) |

**BetterDungeon note**: The Retry button is structurally different from the others. Its outer wrapper `div.is_Row` provides the border and radius, while the inner button has no border/radius of its own. This grouped container design allows for future expansion (e.g., a dropdown arrow or additional options could be added to the group).

---

### 4. Erase

Removes the last story action (player input + AI response).

```html
<span class="t_sub_theme t_gameplaySecondary is_Theme"
      style="color: var(--color); display: contents;">
  <div aria-label="Command: erase"
       aria-roledescription="This is the erase command button."
       role="button"
       class="is_Button is_View ... _cur-pointer _h-t-size-7
              _btlr-9px _btrr-9px _bbrr-9px _bblr-9px
              _pr-28px _pl-28px _btw-2px _brw-2px _bbw-2px _blw-2px">

    <div class="is_View ... _ai-center _jc-center">
      <span aria-hidden="true" class="is_Text font_icons _fos-14px">
        w_backspace
      </span>
    </div>

    <span class="is_ButtonText is_Text font_body _tt-uppercase _fos-16px">
      erase
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Command: erase"]` |
| **Theme** | `t_gameplaySecondary` |
| **Icon glyph** | `w_backspace` |
| **Label** | `erase` |
| **Same sizing as Take a Turn / Continue** | Standard standalone button |

---

## Button Shared Properties

All command buttons share these common traits:

| Property | Value |
|----------|-------|
| **Element type** | `div` with `role="button"` and `class*="is_Button"` |
| **Height** | `t-size-7` |
| **Border radius** | `9px` |
| **Border width** | `2px` (except Retry inner which is `0px`) |
| **Horizontal padding** | `28px` |
| **Icon font size** | `14px` |
| **Label font size** | `16px` |
| **Text transform** | `uppercase` |
| **Icon color** | `objectObjec...` (theme-dependent object color) |
| **Label color** | `color` (inherits theme color) |
| **Cursor** | `pointer` |
| **User select** | `none` |

### Hover/Focus/Active States

All buttons use the same Tamagui-generated state classes:

```
Hover:   _bg-0hover-backgroundH...  _btc-0hover-borderColor...  _bxsh-0hover-...
Focus:   _bg-0focus-backgroundF...  _btc-0focus-borderColor...  _bxsh-0focus-...
Active:  _bg-0active-backgroundP... _btc-0active-borderColor... _bxsh-0active-...
         _o-0active-0--5 (opacity: 0.5 on press)
```

---

## Theme Colors

| Theme Class | Applied To | Purpose |
|-------------|-----------|---------|
| `t_gameplayPrimary` | Take a Turn | Primary accent — most prominent button |
| `t_gameplaySecondary` | Continue, Retry, Erase | Secondary — less prominent |

These theme classes control `--color`, `--background`, `--borderColor`, and other CSS variables for the buttons. The exact colors depend on the active dark/light theme and any custom adventure themes.

---

## Icon Glyph Reference

| Glyph Name | Used On | Visual |
|------------|---------|--------|
| `w_pencil` | Take a Turn | Pencil/edit icon |
| `w_wand` | Continue | Magic wand icon |
| `w_retry` | Retry | Circular retry arrow |
| `w_backspace` | Erase | Backspace/delete icon |

---

## Reliable Selectors for BetterDungeon

```javascript
// Command bar container
const commandBar = document.querySelector('[aria-label="Command bar"]');

// Individual command buttons
const takeATurnBtn = document.querySelector('[aria-label="Command: take a turn"]');
const continueBtn  = document.querySelector('[aria-label="Command: continue"]');
const retryBtn     = document.querySelector('[aria-label="Command: retry"]');
const eraseBtn     = document.querySelector('[aria-label="Command: erase"]');

// All command buttons at once
const allCmdBtns = document.querySelectorAll('[aria-label^="Command: "]');

// The button row (for injecting new buttons)
const buttonRow = commandBar?.querySelector('.is_Row._fd-row[class*="_gap-10px"]');

// Check if command bar is visible
const isCommandBarVisible = commandBar?.closest('[aria-hidden]')?.getAttribute('aria-hidden') !== 'true';
```

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Text Input Area](adventure-page-input.md)
- [Story Output](adventure-page-story.md)
- [CSS Architecture](css-architecture.md)
