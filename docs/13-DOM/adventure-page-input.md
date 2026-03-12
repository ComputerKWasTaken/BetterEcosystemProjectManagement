# Adventure Page — Text Input Area

> Detailed DOM reference for the `#game-text-input` textarea and its surrounding input drawer.

## Location in DOM

```
#__next > div > [Theme Wrappers]
  └── Main Content > Content Container (1067px)
      └── Input Drawer (position:absolute, bottom:0, z-index:3 when open)
          ├── Inner Container (with background blur)
          │   ├── Background Image Layer
          │   ├── #game-text-input (textarea)
          │   └── Submit Button
          ├── Mirror Row (hidden, used for sizing)
          └── Input Mode Toolbar (see [Input Modes](adventure-page-input-modes.md))
```

The input drawer is a **sibling** of the `.game-text-mask` story area, absolutely positioned at the bottom of the content container. It slides up when the player activates the "Take a Turn" command.

---

## Input Drawer Container (Outer)

```html
<!-- CLOSED STATE -->
<div class="css-g5y9jx r-633pao"
     style="position: absolute; bottom: 0px; z-index: 0; width: 100%;
            justify-content: center; align-items: center;
            transform: translateY(80px); opacity: 0;"
     aria-hidden="true">

<!-- OPEN STATE -->
<div class="css-g5y9jx r-105ug2t"
     style="position: absolute; bottom: 0px; z-index: 3; width: 100%;
            justify-content: center; align-items: center;
            transform: translateY(8px); opacity: 1;">
```

| Property | Closed | Open |
|----------|--------|------|
| **z-index** | `0` | `3` |
| **transform** | `translateY(80px)` | `translateY(8px)` |
| **opacity** | `0` | `1` |
| **aria-hidden** | `true` | removed |
| **Pointer events class** | `r-633pao` (`none !important`) | `r-105ug2t` (`auto !important`) |
| **Width** | `100%` | `100%` |

**BetterDungeon note**: The input drawer's visibility is controlled via inline `transform` and `opacity` styles, plus `aria-hidden`. To detect whether the input is open, check:
```javascript
const inputDrawer = document.getElementById('game-text-input')?.closest('[aria-hidden]');
const isInputOpen = inputDrawer?.getAttribute('aria-hidden') === 'false';
```

---

## Input Drawer Inner Container

```html
<div class="is_View _pos-relative _fd-column _w-10037 _maw-996px _mah-521--25px
            _bg-coreA0 _h-170px _btrr-t-radius-1 _btlr-t-radius-1
            _btc-coreA1 _brc-coreA1 _bbc-coreA1 _blc-coreA1">
```

| Property | Value |
|----------|-------|
| Max width | `996px` (matches story container) |
| Max height | `521.25px` |
| Default height | `170px` |
| Background | `coreA0` (near-transparent dark) |
| Border radius | `t-radius-1` on top corners only |
| Border color | `coreA1` (subtle border) |

---

## Visible Input Row

The actual input area with the textarea and submit button:

```html
<div class="is_Row is_View _fd-row _pr-32px _pl-32px _pb-32px _pt-40px
            _maw-996px _w-10037 _pos-absolute _zi-1 _gap-t-space-3
            _ox-hidden _oy-hidden _btlr-13--5px _btrr-13--5px _bbrr-13--5px _bblr-13--5px
            _bg-core1 _bxsh-0px0px32pxc...">
```

| Property | Value |
|----------|-------|
| **Position** | `absolute`, `z-index: 1` |
| **Padding** | `40px` top, `32px` right/bottom/left |
| **Background** | `core1` (solid dark panel) |
| **Border radius** | `13.5px` all corners |
| **Box shadow** | `0px 0px 32px` with a dark color (drop shadow) |
| **Gap** | `t-space-3` between textarea and submit button |
| **Max width** | `996px` |
| **Overflow** | Hidden (both axes) |

---

## Background Image Layer (Inside Input Drawer)

A decorative blurred background image behind the input area:

```html
<div aria-hidden="true"
     class="is_View _pos-absolute _fd-column _pe-none _t-0px _l-0px
            _w-10037 _h-10037 _zi-0 _o-0--2 _jc-center _ai-center
            _btrr-t-radius-1 _btlr-t-radius-1">
  <div id="gameplay-saturate"
       class="is_View _fd-column _pos-absolute _b-0px _w-1067px _h-695px">
    <img alt="Adventure Background"
         loading="lazy" decoding="async" data-nimg="fill"
         src="...blur250"
         style="position: absolute; height: 100%; width: 100%; inset: 0px;
                object-fit: cover; object-position: left 50% top 50%;">
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Opacity** | `0.2` (`_o-0--2`) |
| **Pointer events** | `none` |
| **Image** | Same adventure background image with `blur250` class variant |
| **Saturate** | `#gameplay-saturate` applies `backdrop-filter: saturate(1.8)` |

---

## #game-text-input (Textarea)

The primary text input where players type their actions:

```html
<textarea tabindex="0"
          aria-label="Action input"
          placeholder="What do you do?"
          data-disable-theme="true"
          id="game-text-input"
          rows="3"
          class="is_Input is_View font_gameplaySans
                 _btc-0hover-coreA3 _brc-0hover-coreA3 _bbc-0hover-coreA3 _blc-0hover-coreA3
                 _btc-0focus-primary _brc-0focus-primary _bbc-0focus-primary _blc-0focus-primary
                 _outlineWidth-0focus-visible-2px _outlineStyle-0focus-visible-solid
                 _bg-0focus-transparent _outlineWidth-0focus-0px
                 _ws-pre-wrap _pr-0px _pl-0px _h-t-size-13
                 _btlr-t-radius-1 _btrr-t-radius-1 _bbrr-t-radius-1 _bblr-t-radius-1
                 _ff-f-family _fow-300 _ls-0px _fos-f-size-5 _lh-31--97px
                 _col-fff35 _pt-0px _pb-0px
                 _btw-0px _brw-0px _bbw-0px _blw-0px _outlineWidth-0px
                 _btc-coreA1 _brc-coreA1 _bbc-coreA1 _blc-coreA1
                 _bg-transparent _miw-0px
                 _mah-389--25px _mt--4px _mb--4px
                 _fg-1 _fs-18 _fb-auto _mih-46px _zi-1 _o-0--3 _pe-none
                 is_TextArea is_View font_body"
          style="--placeholderColor: rgba(219,239,255,0.35);
                 height: 46px; max-height: 417px; overflow: hidden;">
</textarea>
```

### Textarea Properties

| Property | Value |
|----------|-------|
| **Selector** | `#game-text-input` or `[aria-label="Action input"]` |
| **Element** | `<textarea>` |
| **Rows** | `3` (initial) |
| **Placeholder** | **Varies by input mode** — `"What do you do?"` (Do), `"What do you say?"` (Say), etc. See [Input Modes](adventure-page-input-modes.md) |
| **Placeholder color** | `rgba(219,239,255,0.35)` (via CSS variable `--placeholderColor`) |
| **Font** | `font_gameplaySans` and `font_body` classes, weight `300`, size `f-size-5` |
| **Line height** | `31.97px` |
| **Letter spacing** | `0px` |
| **Text color** | `fff35` (light text, ~35% white-ish) |
| **Background** | `transparent` |
| **Border** | `0px` all sides (no visible border) |
| **Focus border** | Changes to `primary` color (the accent color) |
| **Focus outline** | `2px solid` on `:focus-visible` only |
| **Min height** | `46px` |
| **Max height** | `389.25px` (inline style says `417px`, class says `389.25px`) |
| **Default height** | `46px` (inline style) |
| **Whitespace** | `pre-wrap` |
| **Overflow** | `hidden` (grows dynamically, no scroll) |
| **Flex** | `flex-grow: 1`, `flex-shrink: 18`, `flex-basis: auto` |
| **Z-index** | `1` |
| **Pointer events** | `none` when drawer is hidden, `auto` when active |

### Textarea States

| State | Pointer Events | Opacity | Notes |
|-------|---------------|---------|-------|
| **Hidden** (drawer closed) | `none` | `0.3` | `aria-hidden="true"` on outer container |
| **Active, empty** (drawer open, no text) | `none` | `0.3` | Textarea and submit dimmed until text entered |
| **Active, with text** (drawer open, text entered) | `auto` | `1` | User can type and submit |
| **Disabled** (during streaming) | `none` | Reduced | Prevents input during AI generation |

**BetterDungeon note**: The textarea uses `overflow: hidden` and dynamically adjusts its `height` via inline styles as the user types. It does NOT scroll internally — it grows up to `max-height`. The `data-disable-theme="true"` attribute tells Tamagui not to apply theme-specific overrides.

---

## Submit Action Button

Positioned to the right of the textarea:

```html
<span class="t_sub_theme t_primary is_Theme"
      style="color: var(--color); display: contents;">
  <div role="button"
       aria-label="Submit action"
       class="is_Button is_View ... _cur-pointer _h-t-size-5
              _btlr-t-radius-10 _btrr-t-radius-10 _bbrr-t-radius-10 _bblr-t-radius-10
              _pr-0px _pl-0px _bg-coreA1
              _btw-0px _brw-0px _bbw-0px _blw-0px
              _als-flex-end _mih-48px _miw-48px
              _pt-0px _pb-0px _w-t-size-5 _mah-t-size-5 _maw-t-size-5
              _pe-none _t--4px _o-1"
       aria-disabled="true">

    <div class="is_View _pos-relative _fd-column _t-2--6537 _l-0px _ai-center _jc-center">
      <span aria-hidden="true"
            class="is_Text font_icons _col-color _fos-16px">
        w_run
      </span>
    </div>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Submit action"]` |
| **Theme** | `t_primary` — uses the primary accent color |
| **Icon glyph** | **Varies by input mode** — `w_run` (Do), `w_comment` (Say), `w_paper_plane` (Story), `w_image` (See) |
| **Icon size** | `16px` |
| **Size** | `48px` min height/width, max constrained to `t-size-5` |
| **Shape** | Circle/rounded (`t-radius-10`) |
| **Background** | `coreA1` |
| **Border** | `0px` (no border) |
| **Alignment** | `align-self: flex-end` (bottom-aligned) |
| **Offset** | `top: -4px` for visual alignment |
| **Disabled state** | `aria-disabled="true"`, `_pe-none` (no pointer events) |
| **Enabled state** | When textarea has content: `aria-disabled` removed, pointer events restored |

**BetterDungeon note**: The submit button is disabled when the textarea is empty. Check `aria-disabled` attribute to determine state.

---

## Mirror Row (Hidden Sizing Helper)

Below the visible input row, there's a hidden duplicate used for layout calculations:

```html
<div class="is_Row is_View _fd-row _mah-389--25px _pr-32px _pl-32px _pb-32px _pt-40px
            _maw-996px _w-10037 _pe-none _o-0 _zi--1 _gap-t-space-3
            _ox-hidden _oy-hidden _btlr-13--5px _btrr-13--5px _bbrr-13--5px _bblr-13--5px
            _bxsh-0px0px32pxc...">
  <div class="is_Row is_View _fd-row _fg-1 _fs-1 _fb-auto _mih-33px">
    <span aria-hidden="true"
          class="is_Text font_gameplaySans _col-red _fos-f-size-5 ...
                 _fs-1 _fg-1 _fb-auto _mr-2px _ml-0px _pb-9px _ta-left">
    </span>
    <!-- Spacer + disabled submit mirror -->
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Opacity** | `0` (`_o-0`) — completely invisible |
| **Z-index** | `-1` — behind everything |
| **Pointer events** | `none` |
| **Purpose** | Mirrors the input row layout for height calculations |
| **Error text color** | `red` — the span may show character count or error text |

**BetterDungeon note**: This hidden row is used internally by AI Dungeon for textarea auto-sizing. Do not remove or modify it, as it may break the textarea's height calculations.

---

## Input Drawer Animation Flow

```
Closed State:
  ├── class: r-633pao              → pointer-events: none !important
  ├── z-index: 0                   → below content
  ├── transform: translateY(80px)  → pushed below viewport edge
  ├── opacity: 0                   → invisible
  ├── aria-hidden: true            → hidden from accessibility
  └── textarea _o-0--3             → dimmed at 0.3 opacity

  ↓ Player clicks "Take a Turn" ↓

Open State:
  ├── class: r-105ug2t             → pointer-events: auto !important
  ├── z-index: 3                   → above story content
  ├── transform: translateY(8px)   → slides into view (8px offset)
  ├── opacity: 1                   → fully visible
  ├── aria-hidden: removed         → accessible
  └── textarea _o-0--3 → _o-1      → opacity transitions to 1 when text entered
```

When closed, the class `r-633pao` sets `pointer-events: none !important`. When opened, the class swaps to `r-105ug2t` which sets `pointer-events: auto !important`, enabling interaction with the textarea and submit button.

---

## Reliable Selectors for BetterDungeon

```javascript
// The textarea itself
const textInput = document.getElementById('game-text-input');

// Alternative selector
const textInput2 = document.querySelector('[aria-label="Action input"]');

// The submit button
const submitBtn = document.querySelector('[aria-label="Submit action"]');

// The input drawer container (for open/close detection)
const inputDrawer = textInput?.closest('[aria-hidden]');
const isInputOpen = inputDrawer?.getAttribute('aria-hidden') === 'false';

// The visible input row (for injecting sibling elements)
const inputRow = textInput?.closest('.is_Row');

// Check if submit is enabled
const isSubmitEnabled = submitBtn?.getAttribute('aria-disabled') !== 'true';

// Get current input text
const currentInput = textInput?.value || '';

// Set input text programmatically
// Note: Must also dispatch 'input' event for React to pick up the change
function setInputText(text) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype, 'value'
  ).set;
  nativeInputValueSetter.call(textInput, text);
  textInput.dispatchEvent(new Event('input', { bubbles: true }));
}

// Get the placeholder text (changes based on input mode)
const placeholder = textInput?.placeholder; // e.g., "What do you do?" or "What do you say?"

// Detect current input mode from placeholder
function getCurrentInputMode() {
  const p = textInput?.placeholder || '';
  if (p.includes('do')) return 'do';
  if (p.includes('say')) return 'say';
  if (p.includes('happen')) return 'story';
  if (p.includes('see')) return 'see';
  return 'unknown';
}
```

---

## See Also

- [Input Modes (Do/Say/Story/See)](adventure-page-input-modes.md)
- [Adventure Page Overview](adventure-page-overview.md)
- [Command Bar](adventure-page-commands.md)
- [Story Output](adventure-page-story.md)
- [CSS Architecture](css-architecture.md)
