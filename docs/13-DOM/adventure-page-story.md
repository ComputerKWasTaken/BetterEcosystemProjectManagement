# Adventure Page — Story Output

> Detailed DOM reference for the `#gameplay-output` story area — where all narrative text, player actions, and AI responses are displayed.

## Location in DOM

```
#__next > div > [Theme Wrappers]
  └── Main Content > Content Container (1067px)
      └── .game-text-mask (position:absolute, z-index:0, full size)
          └── ScrollView (overflow-y:auto, -webkit-overflow-scrolling:touch)
              └── Story Container (max-width:996px, padding:0 32px)
                  └── <div> (is_Column)
                      ├── Safe Area Top Padding
                      ├── Nav Bar Spacer (x2)
                      ├── #gameplay-output ← THIS SECTION
                      └── Command Bar Area
```

---

## Scroll Mask Container

The story area is wrapped in a `.game-text-mask` div that provides a gradient fade effect at the top:

```html
<div class="game-text-mask" style="height: 100%; width: 100%; position: absolute;
     top: 0px; left: 0px; overflow: hidden; z-index: 0;">
```

**CSS mask behavior:**
```css
.game-text-mask {
  /* Default: fades content at the top */
  mask-image: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.1) 10%, rgba(0,0,0,1) 30%, rgba(0,0,0,1));
  mask-size: 100% 110%;
  transition: mask-position .3s ease, mask-size .3s ease;
}

/* When scrolled to top — mask effect is off */
.game-text-mask.off {
  mask-image: linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, rgba(0,0,0,.2));
}

/* When scrolled up — mask shifts */
.game-text-mask.up {
  mask-position: 0 100%;
  mask-size: 100% 130%;
}
```

**BetterDungeon note**: The mask classes (`off`, `up`) toggle dynamically based on scroll position. If injecting elements that affect scroll height, be aware the mask state may change.

---

## ScrollView

Inside the mask container is a React Native Web ScrollView:

```html
<div class="... is_ScrollView is_View"
     style="height: 100%; width: 100%;"
     r-150rngu r-eqz5dr r-16y2uox r-1wbh5a2 r-11yh6sk r-1rnoaur r-agouwx>
```

| Class | Meaning |
|-------|---------|
| `r-150rngu` | `-webkit-overflow-scrolling: touch` |
| `r-eqz5dr` | `flex-direction: column` |
| `r-16y2uox` | `flex-grow: 1` |
| `r-1wbh5a2` | `flex-shrink: 1` |
| `r-11yh6sk` | `overflow-x: hidden` |
| `r-1rnoaur` | `overflow-y: auto` |
| `r-agouwx` | `transform: translateZ(0)` (GPU acceleration) |

---

## Story Container

The scrollable content area that holds story text:

```html
<div class="is_View _pos-relative _fd-column _w-10037 _maw-996px
            _pr-32px _pl-32px _jc-flex-end _mih-695px _pb-0px">
```

| Property | Value |
|----------|-------|
| Max width | `996px` |
| Padding | `32px` left and right |
| Min height | `695px` |
| Justify content | `flex-end` — content pushes to bottom (newest content visible) |

---

## #gameplay-output (Story Article)

The main container for all story content:

```html
<div aria-label="Story"
     tabindex="0"
     role="article"
     id="gameplay-output"
     class="is_View _pos-relative _fd-column">
```

| Property | Value |
|----------|-------|
| **Selector** | `#gameplay-output` or `[aria-label="Story"]` |
| **Role** | `article` |
| **Direction** | `flex-direction: column` |
| **Focusable** | Yes (`tabindex="0"`) |

**Children of `#gameplay-output` follow this repeating pattern:**
1. Story Section (AI narrative text)
2. Action Block (player input)
3. Story Section (AI response to that action)
4. Action Block (next player input)
5. ... and so on

---

## Story Sections

Story sections are `<span>` elements with `role="document"` containing the AI-generated narrative text.

### Outer Wrapper (Story Section Container)

```html
<span aria-label="Story section: [full text preview...]"
      role="document"
      class="is_Text font_heading _col-color _ff-f-family _fos-f-size-5
             _lh-f-lineHeigh112925 _ls-f-letterSpa1360334200
             _mt--8--6px _mb--7--6px _fow-500 _ws-break-space115 _ta-justify">
```

| Property | Value |
|----------|-------|
| **Selector** | `#gameplay-output > [role="document"]` |
| **Font class** | `font_heading` (outer), `font_gameplaySans` (inner spans) |
| **Font size** | `f-size-5` |
| **Font weight** | `500` |
| **Text align** | `justify` (outer), `left` (inner spans) |
| **aria-label** | Contains the full text content of the section |
| **Margins** | Negative top/bottom margins for tight line spacing |

### Inner Text Spans (Transition Opacity)

Each story section contains one or more `<span id="transition-opacity">` elements that hold the actual visible text:

```html
<span id="transition-opacity"
      class="is_Text font_gameplaySans
             _bts-0hover-dashed _brs-0hover-dashed _bbs-0hover-dashed _bls-0hover-dashed
             _blw-0hover-0px _btw-0hover-0px _brw-0hover-0px _bbw-0hover-2px
             _col-core9 _fos-f-size-5 _lh-f-lineHeigh112925
             _mt--8--6px _mb--7--6px _fow-500 _ws-break-space115 _ta-left
             _o-1 _cur-pointer _btc-coreA2 _brc-coreA2 _bbc-coreA2 _blc-coreA2
             _ff-f-family _pe-auto"
      style="transition: opacity 180ms;">
  You crest the final hill just as the castle comes into full view...
</span>
```

| Property | Value |
|----------|-------|
| **ID** | `transition-opacity` (**NOT UNIQUE** — repeated per section) |
| **Font** | `font_gameplaySans` |
| **Color** | `core9` (standard text color in dark theme) |
| **Cursor** | `pointer` — clicking opens the edit interface |
| **Hover effect** | Bottom border becomes `2px dashed` |
| **Transition** | `opacity 180ms` — used for fade-in/streaming effects |
| **Pointer events** | `auto` — clickable |

### The "Last Action" Span (Most Recent AI Response)

The most recent AI response has additional attributes for accessibility and visual distinction:

```html
<span id="transition-opacity"
      aria-label="Last action: [text...]"
      aria-live="polite"
      aria-hidden="false"
      tabindex="0"
      class="is_Text font_gameplaySans
             _blw-0hover-0px _btw-0hover-0px _brw-0hover-0px _bbw-0hover-2px
             _btc-0hover-coreA1 _brc-0hover-coreA1 _bbc-0hover-coreA1 _blc-0hover-coreA1
             _bg-0hover-coreA05 _bbs-0hover-solid _bts-0hover-solid
             _col-color _fos-f-size-5 _o-1 _cur-pointer _w-10037
             _bbw-2px _bg-coreA1 _bbs-solid"
      style="transition: opacity 180ms;">
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label^="Last action:"]` or `[aria-live="polite"]` inside `#gameplay-output` |
| **Background** | `coreA1` — subtle highlight background |
| **Bottom border** | `2px solid` — visual indicator of the latest response |
| **Hover background** | `coreA05` — slightly brighter on hover |
| **aria-live** | `polite` — screen readers announce new content |
| **Focusable** | Yes (`tabindex="0"`) |
| **Width** | `100%` (`_w-10037`) |

**BetterDungeon note**: This is the most reliable way to identify the latest AI response — look for the `<span>` with `aria-live="polite"` inside `#gameplay-output`.

---

## Action Blocks (Player Input History)

Player actions appear as indented, left-bordered blocks between story sections:

```html
<div id="transition-opacity"
     class="is_Row is_View _fd-row _pe-auto _o-1 _blw-3px _cur-pointer
            _pl-28px _pb-16px _pt-16px _mt-40px _mb-40px
            _btc-coreA2 _brc-coreA2 _bbc-coreA2 _blc-coreA2
            _fs-1 _w-10037 _pos-relative _bls-solid">

  <!-- Left border accent line (invisible but structural) -->
  <div class="is_View _pos-absolute _fd-column _h-10037 _w-t-size-3 _l-0px _t-0px"></div>

  <!-- Action Icon -->
  <span id="action-icon" aria-hidden="true"
        class="is_Text font_icons _col-coreA8 _pr-16px _fos-17px _lh-15px _fow-100">
    w_comment
  </span>

  <!-- Action Text -->
  <span aria-label='Action You say, "No no, it\'s quite alright, haha." '
        role="heading" aria-level="3"
        class="is_Text font_gameplaySans _col-coreA8 _fos-f-size-5
               _bbw-3px _btc-coreA0 _brc-coreA0 _bbc-coreA0 _blc-coreA0 _bbs-solid">
    <span id="action-text">You say, "No no, it's quite alright, haha." </span>
  </span>
</div>
```

### Action Block Visual Layout

```
                    ┌──────────────────────────────────────────┐
  40px margin top   │                                          │
                    │  3px solid  💬  You say, "No no, it's   │
                    │  left border     quite alright, haha."   │
                    │                                          │
  40px margin bot   └──────────────────────────────────────────┘
```

### Action Block Properties

| Property | Value |
|----------|-------|
| **Container selector** | `#gameplay-output .is_Row[class*="_blw-3px"]` or `div` containing `#action-text` |
| **Layout** | `flex-direction: row` |
| **Left border** | `3px solid`, color `coreA2` |
| **Padding** | `28px` left, `16px` top/bottom |
| **Margin** | `40px` top and bottom |
| **Width** | `100%` |

### Action Icon

| Property | Value |
|----------|-------|
| **ID** | `action-icon` |
| **Glyph** | `w_comment` (speech bubble) |
| **Color** | `coreA8` (muted/secondary text) |
| **Size** | `17px` font-size, `15px` line-height |
| **Right padding** | `16px` |

### Action Text

| Property | Value |
|----------|-------|
| **ID** (inner span) | `action-text` |
| **Outer selector** | `[aria-label^="Action "]` |
| **Role** | `heading` level 3 |
| **Color** | `coreA8` (muted — distinguishes from AI text) |
| **Font** | `font_gameplaySans`, size `f-size-5` |
| **Bottom border** | `3px solid coreA0` |

**BetterDungeon note**: The `#action-text` span contains only the raw text. The `aria-label` on the parent includes the prefix "Action " before the text. Player actions use `coreA8` color (muted) while AI narrative uses `core9` (full brightness) or `color` (theme color).

---

## Streaming Text (During AI Generation)

When the AI is actively generating a response, text appears with streaming animations:

```css
/* Each chunk fades in as it arrives */
.streaming-chunk {
  opacity: 0;
  animation: streamingChunkFadeIn .34s cubic-bezier(.22,1,.36,1) forwards;
}

/* Blinking cursor at the end of the stream */
.streaming-cursor {
  display: inline-block;
  margin-left: 1px;
  animation: streamingCursorBlink .9s steps(2, start) infinite;
}

/* Final fade when streaming completes */
@keyframes streamingFinalizeFade {
  0% { opacity: .68; }
  to { opacity: 1; }
}

/* Word-by-word fade for initial story display */
.word-fade {
  opacity: 0;
  animation: wordFadeIn .5s ease-in forwards;
  animation-delay: calc(var(--word-index) * 10ms);
  pointer-events: none;
}
```

**BetterDungeon note**: During streaming, `pointer-events: none` is set on `.word-fade` elements. Features that need to interact with story text should wait for streaming to complete (watch for `.streaming-cursor` removal).

---

## Story Text Hierarchy Summary

```
#gameplay-output [role="article"]
│
├── <span role="document"> — Story Section (AI intro/narrative)
│   └── <span id="transition-opacity"> — Visible text (clickable to edit)
│       └── Plain text content
│
├── <div id="transition-opacity"> — Action Block (player input)
│   ├── <span id="action-icon"> — 💬 icon
│   └── <span role="heading" aria-level="3"> — Action text wrapper
│       └── <span id="action-text"> — Raw action text
│
├── <span role="document"> — Story Section (AI response)
│   └── <span id="transition-opacity" aria-live="polite"> — Latest response (if last)
│       └── Plain text content
│
└── ... (repeating pattern)
```

---

## Reliable Selectors for BetterDungeon

```javascript
// The story container
const storyOutput = document.getElementById('gameplay-output');

// All story text sections (AI-generated)
const storySections = storyOutput.querySelectorAll('[role="document"]');

// All visible text spans (clickable story text)
const storySpans = storyOutput.querySelectorAll('span[id="transition-opacity"]');

// The most recent AI response
const lastResponse = storyOutput.querySelector('[aria-live="polite"]');

// All player action blocks
const actionBlocks = storyOutput.querySelectorAll('[aria-label^="Action "]');

// All action text content
const actionTexts = storyOutput.querySelectorAll('#action-text');

// Check if AI is currently streaming
const isStreaming = !!document.querySelector('.streaming-cursor');

// The ScrollView (for scroll manipulation)
const scrollView = document.querySelector('.game-text-mask .is_ScrollView');
```

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Command Bar](adventure-page-commands.md)
- [Text Input Area](adventure-page-input.md)
- [Input Modes](adventure-page-input-modes.md)
- [CSS Architecture](css-architecture.md)
