# Adventure Page — Settings Panel

> Detailed DOM reference for the right-side settings panel that opens when the player clicks the Settings (gear) button.

## Overview

The settings panel is a **fixed-width sidebar** that slides in from the right side of the viewport. It contains two main tabs — **Adventure** and **Gameplay** — each with their own sub-sections for configuring the current adventure.

---

## Location in DOM

```
#__next > div > [Theme Wrappers]
  └── Main Content (flex-direction: row)
      ├── Story Column (flex: 1, content container)
      └── Settings Panel (position: relative, 424px wide)
          └── Animated Container (border-radius:16px, border:1px, bg:rgba(0,0,0,0.5))
              └── Column (full height, overflow:hidden, flex:1)
                  ├── Tab Header Row (Adventure | Gameplay | Close)
                  └── Scrollable Content Area
                      ├── Section Tabs (Plot | Story Cards | Details)
                      └── Section Content (varies by active tab)
```

The settings panel is a **sibling** of the story column, not an overlay or modal. When visible, it reduces the story area width.

---

## Settings Panel Container

```html
<div aria-hidden="false"
     class="is_View _pos-relative _fd-column
            _pt-t-space-1 _pr-t-space-1 _pb-t-space-1 _pl-t-space-1
            _h-10037 _maw-424px _w-424px">
```

| Property | Value |
|----------|-------|
| **Width** | `424px` (both `_w-424px` and `_maw-424px`) |
| **Height** | `100%` |
| **Padding** | `t-space-1` on all sides |
| **Position** | `relative` |
| **aria-hidden** | `false` when visible |

### Inner Animated Container

```html
<div class="css-g5y9jx"
     style="overflow: hidden; z-index: 1; border-radius: 16px;
            border-width: 1px; width: 408px; flex: 1 1 0%;
            border-color: rgba(209, 234, 255, 0.19);
            background-color: rgba(0, 0, 0, 0.5);
            transform: translateX(0px);">
```

| Property | Value |
|----------|-------|
| **Width** | `408px` (424px minus padding) |
| **Border** | `1px solid rgba(209, 234, 255, 0.19)` (subtle light border) |
| **Background** | `rgba(0, 0, 0, 0.5)` (50% black, semi-transparent) |
| **Border radius** | `16px` |
| **Overflow** | `hidden` |
| **Animation** | `translateX` — slides in/out horizontally |
| **Open state** | `translateX(0px)` |
| **Closed state** | `translateX(424px)` (slides fully off-screen to the right) |

---

## Tab Header

The top bar with Adventure/Gameplay tabs and a Close button:

```html
<div class="is_Row is_View _fd-row _ai-center _jc-space-betwe3241
            _bbw-1px _btc-coreA2 _brc-coreA2 _bbc-coreA2 _blc-coreA2 _bbs-solid">
  <div role="tablist" class="is_Row is_View _fd-row _fg-1 _fs-1 _fb-auto">
    <!-- Adventure Tab -->
    <!-- Gameplay Tab -->
  </div>
  <!-- Close Settings Button -->
</div>
```

| Property | Value |
|----------|-------|
| **Layout** | Row with `space-between` — tabs on left, close button on right |
| **Bottom border** | `1px solid coreA2` (separator line) |

---

### Adventure Tab (Active)

```html
<span class="t_sub_theme t_coreA0 is_Theme" style="display: contents;">
  <div role="tab"
       class="is_Button is_View ... _h-t-size-8 _fg-1 _fs-1 _fb-auto
              _bg-background _btw-0px _brw-0px _bbw-4px _blw-0px
              _btc-primary _brc-primary _bbc-primary _blc-primary">
    <span class="is_Text font_icons _col-coreA8 _fos-f-size-1">
      w_scroll
    </span>
    <span class="is_ButtonText is_Text font_body _col-color _fos-f-size-2 _tt-uppercase">
      Adventure
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Role** | `tab` |
| **Icon** | `w_scroll` |
| **Label** | `Adventure` (uppercase) |
| **Active indicator** | `4px` bottom border in `primary` color |
| **Height** | `t-size-8` |
| **Flex** | `1 1 auto` (expands to fill) |

---

### Gameplay Tab (Inactive)

```html
<span class="t_sub_theme t_coreA0 is_Theme" style="display: contents;">
  <div role="tab"
       class="is_Button is_View ... _h-t-size-8 _fg-1 _fs-1 _fb-auto
              _bg-background _btw-0px _brw-0px _bbw-4px _blw-0px
              _btc-coreA0 _brc-coreA0 _bbc-coreA0 _blc-coreA0">
    <span class="is_Text font_icons _col-coreA8 _fos-f-size-1">
      w_controller
    </span>
    <span class="is_ButtonText is_Text font_body _col-color _fos-f-size-2 _tt-uppercase">
      Gameplay
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Role** | `tab` |
| **Icon** | `w_controller` |
| **Label** | `Gameplay` (uppercase) |
| **Inactive indicator** | `4px` bottom border in `coreA0` (transparent/invisible) |

**Active vs Inactive**: The only visual difference is the bottom border color — `primary` (accent) for active, `coreA0` (transparent) for inactive.

---

### Close Settings Button

```html
<span class="t_sub_theme t_coreA0 is_Theme" style="display: contents;">
  <div aria-label="Close settings"
       role="button"
       class="is_Button is_View ... _h-t-size-8 _w-t-size-8
              _btw-0px _brw-0px _bbw-0px _blw-0px">
    <span class="is_Text font_icons _col-color _fos-f-size-1">
      w_close
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Close settings"]` |
| **Icon** | `w_close` |
| **Size** | `t-size-8` square |
| **Border** | None (0px all sides) |

---

## Section Tabs (Pill Switch)

Below the tab header, a horizontally scrollable pill-style tab bar selects sub-sections:

```html
<div class="pill-switch-mask" style="margin-left: -20px; width: 366.4px;">
  <div aria-label="Section Tabs"
       role="tablist"
       class="css-g5y9jx r-150rngu r-18u37iz r-16y2uox r-1wbh5a2
              r-lltvgl r-buy8e9 r-agouwx r-2eszeu"
       style="user-select: none; touch-action: auto;">
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Section Tabs"]` |
| **Role** | `tablist` |
| **Container** | `.pill-switch-mask` — clips overflow with left margin offset |
| **Scroll** | Horizontal scroll (`overflow-x: auto`), hidden scrollbar |
| **Width** | `366.4px` (computed) |

### Section Tab Buttons

All section tabs share a pill shape with `t-radius-64` (fully rounded) and height `t-size-5`.

#### Plot Tab (Active)

```html
<span class="t_sub_theme t_core9 is_Theme" style="display: contents;">
  <div aria-label="Selected tab plot"
       role="tab" tabindex="0"
       class="is_Button is_View ... _btlr-t-radius-64 _btrr-t-radius-64
              _bbrr-t-radius-64 _bblr-t-radius-64 _h-t-size-5 _mah-t-size-4
              _btw-1px _brw-1px _bbw-1px _blw-1px">
    <span class="is_Text font_icons _col-color _fos-f-size-1 _o-0--5">
      w_details
    </span>
    <span class="is_Text font_body _col-color _fos-f-size-2 _tt-uppercase">
      plot
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Selected tab plot"]` |
| **Theme** | `t_core9` (bright — indicates active) |
| **Icon** | `w_details` |
| **Label** | `plot` (uppercase) |
| **Border** | `1px solid borderColor` |
| **Note** | `aria-label` prefix is `"Selected tab"` for the active tab |

#### Story Cards Tab (Inactive)

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="display: contents;">
  <div aria-label="Tab Story Cards"
       role="tab" tabindex="0"
       class="is_Button is_View ... _btlr-t-radius-64 ...">
    <span class="is_Text font_icons _col-color _fos-f-size-1 _o-0--5">
      w_assets
    </span>
    <span class="is_Text font_body _col-color _fos-f-size-2 _tt-uppercase">
      Story Cards
    </span>
    <!-- Count badge -->
    <div class="is_View _blw-1px _h-10037 _blc-blackA7 _pl-t-space-1--53 _bls-solid">
      <span class="is_Text font_body _col-color _fos-f-size-2 _o-0--5">
        4
      </span>
    </div>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Tab Story Cards"]` |
| **Theme** | `t_coreA1` (muted — indicates inactive) |
| **Icon** | `w_assets` |
| **Label** | `Story Cards` (uppercase) |
| **Count badge** | Displays number of story cards (e.g., `4`), separated by a left border |
| **Note** | Inactive tabs use `aria-label` prefix `"Tab"` instead of `"Selected tab"` |

#### Details Tab (Inactive)

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="display: contents;">
  <div aria-label="Tab details"
       role="tab" tabindex="0"
       class="is_Button is_View ... _btlr-t-radius-64 ...">
    <span class="is_Text font_icons _col-color _fos-f-size-1 _o-0--5">
      w_list
    </span>
    <span class="is_Text font_body _col-color _fos-f-size-2 _tt-uppercase">
      details
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Tab details"]` |
| **Icon** | `w_list` |
| **Label** | `details` (uppercase) |

### Scroll Right Button

When tabs overflow, a floating scroll-right button appears:

```html
<div aria-hidden="true" tabindex="-1"
     style="width: 60px; height: 100%; position: absolute; right: -22px;
            top: -2px; z-index: 999; opacity: 0;">
  <div role="button" aria-label="scroll right" tabindex="-1" aria-hidden="true"
       class="is_Button ... _btlr-t-radius-10 _btrr-t-radius-10"
       style="box-shadow: rgb(0, 0, 0) 0px 0px 32px;">
    <span class="is_Text font_icons _col-color _fos-f-size-1">
      w_arrow_right
    </span>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="scroll right"]` |
| **Visibility** | Hidden when no overflow (`opacity: 0`), visible when tabs overflow |
| **Position** | Absolute, right edge of the tab container |

---

## Plot Section Content

When the "Plot" tab is active, three collapsible cards are shown:

### Card Pattern (Shared Structure)

All plot cards follow this pattern:

```html
<div class="is_Column is_View _fd-column _gap-0px
            _btlr-t-radius-1-1448 _btrr-t-radius-1-1448
            _bbrr-t-radius-1-1448 _bblr-t-radius-1-1448
            _ox-hidden _oy-hidden _bg-coreA0
            _pt-t-space-0 _pr-t-space-0 _pb-t-space-0 _pl-t-space-0">
  <!-- Header Row -->
  <div class="is_Row is_View _fd-row _jc-space-betwe3241 _bg-coreA1 _h-t-size-7 _ai-center">
    <!-- Left: title/selector -->
    <!-- Right: action buttons -->
  </div>
  <!-- Textarea Content -->
  <div class="is_Column is_View _fd-column _bg-coreA1">
    <textarea ...></textarea>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Background** | `coreA0` (outer), `coreA1` (header and textarea bg) |
| **Border radius** | `t-radius-1-1448` (custom token, slightly rounded) |
| **Overflow** | Hidden |
| **Header height** | `t-size-7` |

---

### 1. AI Instructions Card

The primary configuration card with a scenario selector and a large text area.

#### Header

```html
<div class="is_Row is_View _fd-row _jc-space-betwe3241 _bg-coreA1 _h-t-size-7
            _ai-center _pr-t-space-1 _pl-t-space-1">
  <div class="is_Row is_View _fd-row _gap-6px _ai-center">
    <!-- Scenario Selector -->
    <!-- "AI Instructions" heading -->
  </div>
  <div class="is_Row is_View _fd-row _gap-t-space-1 _ai-center">
    <!-- Delete button -->
  </div>
</div>
```

#### Scenario Selector (Combobox)

```html
<button type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-autocomplete="none"
        data-disable-theme="true"
        class="is_ListItem is_View ... SelectTrigger
               _btlr-t-radius-9 _btrr-t-radius-9 _bbrr-t-radius-9 _bblr-t-radius-9
               _btw-1px _brw-1px _bbw-1px _blw-1px _gap-6px _cur-pointer">
  <!-- Avatar image -->
  <div class="is_View _h-t-size-4 _w-t-size-4 _btlr-t-radius-9 ... _bg-coreA1">
    <img alt="option" src="...avatarLarge" style="object-fit: cover;">
  </div>
  <!-- Label -->
  <span class="is_Text font_body _col-color _fos-f-size-2">
    Scenario Default
  </span>
  <!-- Chevron -->
  <span class="is_Text font_icons _col-coreA8 _fos-f-size-1">
    w_chevron_down
  </span>
</button>
```

| Property | Value |
|----------|-------|
| **Element** | `<button>` with `role="combobox"` |
| **Class** | `is_ListItem`, `SelectTrigger` |
| **Avatar** | Adventure image at `avatarLarge` variant |
| **Label** | `"Scenario Default"` (or custom scenario name) |
| **Dropdown icon** | `w_chevron_down` |
| **Border** | `1px solid`, radius `t-radius-9` |
| **Expanded state** | `aria-expanded="true"` when dropdown is open |

#### Section Heading

```html
<span role="heading" aria-level="2"
      class="is_Text font_body _col-coreA8 _fos-f-size-2">
  AI Instructions
</span>
```

| Property | Value |
|----------|-------|
| **Role** | `heading`, level `2` |
| **Color** | `coreA8` (muted gray) |

#### Delete Button

```html
<div aria-label="Delete" role="button"
     class="is_Button is_View ... _h-t-size-5
            _btlr-t-radius-10 _btrr-t-radius-10
            _w-t-size-5 _mah-t-size-5 _maw-t-size-5 _cur-pointer">
  <span class="is_Text font_icons _col-color _fos-f-size-1">
    w_trash
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Delete"]` (note: multiple Delete buttons exist — one per card) |
| **Icon** | `w_trash` |
| **Shape** | Circular (`t-radius-10`, `t-size-5` square) |

#### AI Instructions Textarea

```html
<textarea tabindex="0"
          maxlength="100000"
          placeholder="Influence the AI's responses by providing instructions for the AI to follow. "
          data-disable-theme="true"
          rows="3"
          class="is_Input is_View font_body
                 _btc-0focus-primary _bg-0focus-blackA3
                 _ws-pre-wrap _pr-t-space-2 _pl-t-space-2 _h-416px
                 _btlr-t-radius-0 _fow-f-weight-2 _fos-f-size-3 _lh-f-lineHeigh112922
                 _col-color _pt-t-space-1--53 _pb-t-space-1--53
                 _btw-0px _brw-0px _bbw-0px _blw-0px
                 _bg-coreA0 _mih-t-size-24 _mah-t-size-52
                 is_TextArea is_View font_body"
          style="--placeholderColor: rgba(255,255,255,0.3);">
</textarea>
```

| Property | Value |
|----------|-------|
| **Max length** | `100000` characters |
| **Placeholder** | `"Influence the AI's responses by providing instructions..."` |
| **Placeholder color** | `rgba(255,255,255,0.3)` |
| **Font** | `font_body`, weight `f-weight-2`, size `f-size-3` |
| **Background** | `coreA0` |
| **Focus background** | `blackA3` |
| **Focus border** | `primary` color |
| **Height** | `416px` (inline, auto-grows) |
| **Min height** | `t-size-24` |
| **Max height** | `t-size-52` |
| **Padding** | `t-space-1--53` vertical, `t-space-2` horizontal |
| **Border radius** | `0` (flush against card edges) |

**BetterDungeon note**: Unlike `#game-text-input`, the settings textareas have **no `id` attribute**. Target them via their parent card structure or placeholder text.

---

### 2. Plot Essentials Card

#### Header

```html
<div class="is_Row is_View _fd-row _jc-space-betwe3241 _bg-coreA1 _h-t-size-7
            _ai-center _pr-t-space-1 _pl-t-space-2">
  <span role="heading" aria-level="2"
        class="is_Text font_body _col-color _fos-f-size-2">
    Plot Essentials
  </span>
  <!-- Delete button -->
</div>
```

| Property | Value |
|----------|-------|
| **Heading text** | `"Plot Essentials"` |
| **Heading color** | `color` (bright, unlike AI Instructions' `coreA8`) |
| **Left padding** | `t-space-2` (larger — no combobox here) |

#### Plot Essentials Textarea

```html
<textarea tabindex="0"
          maxlength="100000"
          placeholder="Enter important information about the adventure. The AI will always use this when generating new responses."
          data-disable-theme="true"
          rows="3"
          class="is_Input is_View font_body ... _bg-coreA0
                 _mih-t-size-24 _mah-t-size-52"
          style="--placeholderColor: rgba(255,255,255,0.3);
                 height: 408px; max-height: 417px; overflow: hidden;">
</textarea>
```

| Property | Value |
|----------|-------|
| **Placeholder** | `"Enter important information about the adventure..."` |
| **Height** | `408px` (example with content) |
| **Same sizing/styling as AI Instructions textarea** | Yes |

---

### 3. Author's Note Card

#### Header

```html
<div class="is_Row is_View _fd-row _jc-space-betwe3241 _bg-coreA1 _h-t-size-7
            _ai-center _pr-t-space-1 _pl-t-space-2">
  <span role="heading" aria-level="2"
        class="is_Text font_body _col-color _fos-f-size-2">
    Author's Note
  </span>
  <!-- Delete button -->
</div>
```

#### Author's Note Textarea

```html
<textarea tabindex="0"
          maxlength="100000"
          placeholder="Influence the AI's writing style with directions. 
      Ex. &quot;Use a very descriptive writing style in 17th century language&quot;"
          data-disable-theme="true"
          rows="3"
          class="is_Input is_View font_body ... _bg-coreA0
                 _mih-t-size-24 _mah-t-size-52"
          style="--placeholderColor: rgba(255,255,255,0.3);
                 height: 336px; max-height: 417px; overflow: hidden;">
</textarea>
```

| Property | Value |
|----------|-------|
| **Placeholder** | `"Influence the AI's writing style with directions..."` (multi-line placeholder) |

---

### Mirror Spans (All Textareas)

Each textarea card has a hidden mirror `<span>` (positioned absolutely, `_o-0`, `_pe-none`) that duplicates the textarea content for auto-height calculations. Same pattern as the main input textarea's mirror row.

---

## Gameplay Tab Content

When the Gameplay tab is active, the following sections appear:

### Themes Section

A horizontal scrollable row of theme preview cards:

```html
<div class="is_Column is_View _fd-column">
  <!-- Theme Card 1 -->
  <div role="button"
       class="is_Button is_View ... _h-t-size-16 _pe-auto
              _gap-t-space-1 _pt-t-space-1 _pb-t-space-1">
    <!-- Left: info column (avatar + name) -->
    <div class="is_Column is_View _fd-column _w-3337">
      <div class="... _h-t-size-4 _w-t-size-4 _btlr-99px ... _bg-coreA1">
        <!-- Avatar circle (empty/colored) -->
      </div>
      <span class="is_Text font_body _col-color _fos-f-size-2">
        Atlantis
      </span>
    </div>
    <!-- Right: preview card -->
    <div class="is_View _bg-core0 _h-t-size-14 _btlr-t-radius-1 ...">
      <!-- Background blur image -->
      <!-- Theme sprite sheet preview -->
      <!-- "Aa" text sample with theme colors -->
      <!-- Pencil icon -->
    </div>
  </div>
  <!-- Theme Card 2: "S'mores" -->
  <!-- Theme Card 3: "Cyber" -->
  <!-- More themes... -->
</div>
```

#### Theme Card Properties

| Property | Value |
|----------|-------|
| **Element** | `div` with `role="button"` |
| **Height** | `t-size-16` |
| **Layout** | Row — left column (33% width) with name, right area with preview |
| **Preview** | Shows blurred adventure image, theme sprite overlay, and "Aa" sample text in theme colors |
| **Theme sprites** | Loaded from `latitude-standard-pull-zone-1.b-cdn.net/site_assets/aidungeon/client/themes/{themeId}.png` |

#### Known Theme Names (from DOM)

| Name | Theme ID (from sprite URL) |
|------|---------------------------|
| Atlantis | `89da9ad1-b472-4c6b-8e8c-3c934bda9900` |
| S'mores | `3e9ce211-4caf-49b7-89f9-6f8375cd0100` |
| Cyber | `00bdb29c-f308-46a5-33ee-5ee4f4c0ff00` |

---

### Text Style Section

Three buttons for choosing the gameplay text rendering style:

```html
<div class="is_Column is_View _fd-column _gap-t-space-1">
  <span class="is_Text font_body _col-coreA8 _fos-f-size-1 _tt-uppercase">
    Text Style
  </span>
  <div class="is_Row is_View _fd-row _gap-t-space-1
              _pt-t-space-1 _pr-t-space-1 _pb-t-space-1 _pl-t-space-1
              _bg-blackA2 _btlr-t-radius-2 _btrr-t-radius-2 ...">
    <!-- Print Button -->
    <!-- Clean Button -->
    <!-- Hacker Button -->
  </div>
</div>
```

#### Print Button (Active in example)

```html
<span class="t_sub_theme t_coreA0 is_Theme" style="display: contents;">
  <div role="button"
       class="is_Button is_View ... _h-t-size-8 _fg-1 _fs-1 _fb-auto _w-33--3337
              _btlr-t-radius-1 _btrr-t-radius-1 _bbrr-t-radius-1 _bblr-t-radius-1
              _btw-1px _brw-1px _bbw-1px _blw-1px">
    <span class="is_Text font_heading _col-color _fos-f-size-3">
      Print
    </span>
  </div>
</span>
```

#### Clean Button

```html
<span class="t_sub_theme t_coreA1 is_Theme" style="display: contents;">
  <div role="button" class="is_Button is_View ... _w-33--3337">
    <span class="is_Text font_body _col-color _fos-f-size-3">
      Clean
    </span>
  </div>
</span>
```

#### Hacker Button

```html
<span class="t_sub_theme t_coreA0 is_Theme" style="display: contents;">
  <div role="button" class="is_Button is_View ... _w-33--3337">
    <span class="is_Text font_mono _col-color _fos-f-size-3">
      Hacker
    </span>
  </div>
</span>
```

| Style | Font Class | Theme (Active) | Theme (Inactive) | Description |
|-------|-----------|-----------------|-------------------|-------------|
| **Print** | `font_heading` | `t_coreA0` | `t_coreA1` | Serif/heading font style |
| **Clean** | `font_body` | `t_coreA0` | `t_coreA1` | Default sans-serif |
| **Hacker** | `font_mono` | `t_coreA0` | `t_coreA1` | Monospace/terminal style |

**Note**: Each button is `33.33%` width (`_w-33--3337`), evenly splitting the row.

---

### Accessibility Accordion (Collapsed)

```html
<div class="is_Column is_View _fd-column _bg-coreA1
            _btlr-t-radius-1-1448 _btrr-t-radius-1-1448
            _bbrr-t-radius-1-1448 _bblr-t-radius-1-1448
            _ox-hidden _oy-hidden _btw-0px _btc-blackA5">
  <div aria-label="Accessibility"
       aria-expanded="false"
       role="button"
       class="is_Row is_View _fd-row _jc-space-betwe3241
              _pl-t-space-2 _pr-t-space-2--53 _ai-center
              _cur-pointer _pe-auto _h-t-size-7">
    <span class="is_Text font_body _col-color _fos-f-size-3">
      Accessibility
    </span>
    <div style="transform: rotate(0deg);">
      <span class="is_Text font_icons _col-coreA8 _fos-f-size-3">
        w_chevron_right
      </span>
    </div>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Accessibility"]` |
| **State** | `aria-expanded="false"` (collapsed) / `"true"` (expanded) |
| **Chevron rotation** | `rotate(0deg)` when collapsed, `rotate(90deg)` when expanded |
| **Height** | `t-size-7` (header row) |
| **Background** | `coreA1` |

---

### Behavior Accordion (Collapsed)

```html
<div class="is_Column is_View _fd-column _bg-coreA1 ...">
  <div aria-label="Behavior"
       aria-expanded="false"
       role="button"
       class="is_Row is_View _fd-row _jc-space-betwe3241
              _pl-t-space-2 _pr-t-space-2--53 _ai-center
              _cur-pointer _pe-auto _h-t-size-7">
    <span class="is_Text font_body _col-color _fos-f-size-3">
      Behavior
    </span>
    <div style="transform: rotate(0deg);">
      <span class="is_Text font_icons _col-coreA8 _fos-f-size-3">
        w_chevron_right
      </span>
    </div>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Behavior"]` |
| **Same pattern as Accessibility** | Yes — collapsible accordion with chevron indicator |

---

## Section Tab Active/Inactive Identification

| Tab State | aria-label Prefix | Theme Class |
|-----------|-------------------|-------------|
| **Active** | `"Selected tab {name}"` | `t_core9` (bright) |
| **Inactive** | `"Tab {name}"` | `t_coreA1` (muted) |

**BetterDungeon note**: The `aria-label` changes when a tab becomes active/inactive. Use a partial match to find tabs regardless of state:
```javascript
const plotTab = document.querySelector('[aria-label*="plot"][role="tab"]');
```

---

## Reliable Selectors for BetterDungeon

```javascript
// Settings panel visibility
const settingsPanel = document.querySelector('[aria-label="Close settings"]')?.closest('[aria-hidden]');
const isSettingsOpen = settingsPanel?.getAttribute('aria-hidden') === 'false';

// Close settings
const closeSettingsBtn = document.querySelector('[aria-label="Close settings"]');

// Main tabs
const adventureTab = document.querySelector('[role="tablist"] [role="tab"] .is_ButtonText');
// Better approach: find tab by text content
function findSettingsTab(name) {
  const tabs = document.querySelectorAll('[role="tab"] .is_ButtonText');
  return [...tabs].find(t => t.textContent.trim().toLowerCase() === name.toLowerCase())?.closest('[role="tab"]');
}

// Section tabs (Plot, Story Cards, Details)
const sectionTabs = document.querySelector('[aria-label="Section Tabs"]');
const plotTab = document.querySelector('[aria-label*="plot"][role="tab"]');
const storyCardsTab = document.querySelector('[aria-label*="Story Cards"][role="tab"]');
const detailsTab = document.querySelector('[aria-label*="details"][role="tab"]');

// Check which section tab is active
function getActiveSectionTab() {
  const tabs = sectionTabs?.querySelectorAll('[role="tab"]') || [];
  return [...tabs].find(t => t.getAttribute('aria-label')?.startsWith('Selected tab'));
}

// Plot card textareas (by placeholder substring)
function getSettingsTextarea(placeholderSubstring) {
  const textareas = document.querySelectorAll('.is_TextArea');
  return [...textareas].find(t => t.placeholder?.includes(placeholderSubstring));
}
const aiInstructionsTextarea = getSettingsTextarea('Influence the AI');
const plotEssentialsTextarea = getSettingsTextarea('important information');
const authorsNoteTextarea    = getSettingsTextarea('writing style');

// Card headings
const cardHeadings = document.querySelectorAll('[role="heading"][aria-level="2"]');

// Delete buttons (multiple — scope to parent card)
function getDeleteButtonForCard(headingText) {
  const headings = document.querySelectorAll('[role="heading"][aria-level="2"]');
  const heading = [...headings].find(h => h.textContent.trim() === headingText);
  return heading?.closest('.is_Row')?.querySelector('[aria-label="Delete"]');
}

// Accordion sections
const accessibilitySection = document.querySelector('[aria-label="Accessibility"]');
const behaviorSection = document.querySelector('[aria-label="Behavior"]');
const isAccessibilityExpanded = accessibilitySection?.getAttribute('aria-expanded') === 'true';

// Scenario selector combobox
const scenarioSelector = document.querySelector('[role="combobox"].SelectTrigger');
const currentScenario = scenarioSelector?.querySelector('.is_Text.font_body')?.textContent?.trim();

// Text style buttons
function getTextStyleButtons() {
  const container = [...document.querySelectorAll('.is_Text.font_body')]
    .find(el => el.textContent.trim() === 'Text Style')?.closest('.is_Column');
  return container?.querySelectorAll('[role="button"]') || [];
}
```

---

## Icon Glyph Reference (Settings Panel)

| Glyph | Used On |
|-------|---------|
| `w_scroll` | Adventure tab |
| `w_controller` | Gameplay tab |
| `w_close` | Close settings button |
| `w_details` | Plot section tab |
| `w_assets` | Story Cards section tab |
| `w_list` | Details section tab |
| `w_arrow_right` | Scroll right (pill tabs) |
| `w_chevron_down` | Scenario selector dropdown |
| `w_chevron_right` | Accordion expand indicator |
| `w_trash` | Delete card button |
| `w_pencil` | Theme card edit icon |

---

## See Also

- [Adventure Page Overview](adventure-page-overview.md)
- [Navigation Bar](adventure-page-navigation.md)
- [Text Input Area](adventure-page-input.md)
- [Input Modes](adventure-page-input-modes.md)
- [CSS Architecture](css-architecture.md)
