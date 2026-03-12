# Adventure Page — Model Switcher

> Detailed DOM reference for the Model Switcher dialog that allows players to select which AI model powers their adventure. Key target for the planned **"Better Dynamic"** feature.

## Overview

The Model Switcher is a **dialog panel** triggered by the "Model Switcher" button in the navigation bar. It displays a scrollable list of available AI models, each with an icon, name, optional badges, and an expandable details section for the currently selected model. A confirmation button at the bottom finalizes the selection.

---

## Location in DOM

```
#__next > div > [Theme Wrappers]
  └── ... (positioned overlay or portal)
      └── <div> (border-radius wrapper)
          └── <div role="dialog" aria-labelledby="model-switcher-title">
              ├── Header ("STORY MODELS" heading)
              ├── Scrollable Model List (<ul aria-label="Available AI models">)
              ├── "Show More Models +" toggle
              ├── Confirm Button ("Use {ModelName}")
              └── "Model Comparison Guide" link
```

**Note**: The dialog is rendered inside theme wrappers. Its exact portal mount point may vary, but the `role="dialog"` and `aria-labelledby="model-switcher-title"` attributes are stable anchors.

---

## Dialog Container

```html
<div role="dialog"
     aria-labelledby="model-switcher-title"
     class="is_Column is_View _fd-column _w-t-size-64 _gap-t-space-2
            _pt-t-space-2 _pr-t-space-2 _pb-t-space-2 _pl-t-space-2
            _bg-core1 _btlr-t-radius-3 _btrr-t-radius-3
            _bbrr-t-radius-3 _bblr-t-radius-3
            _mah-575px _ox-hidden _oy-hidden
            _bxsh-0px24px24px...">
```

| Property | Value |
|----------|-------|
| **Selector** | `[role="dialog"][aria-labelledby="model-switcher-title"]` |
| **Width** | `t-size-64` (large fixed width) |
| **Max height** | `575px` |
| **Background** | `core1` (solid dark panel) |
| **Border radius** | `t-radius-3` all corners |
| **Box shadow** | `0px 24px 24px` (large drop shadow) |
| **Padding** | `t-space-2` all sides |
| **Overflow** | Hidden (both axes — list scrolls internally) |

---

## Header

```html
<span id="model-switcher-title"
      role="heading" aria-level="2"
      class="is_Text font_body _col-coreA8 _fos-f-size-3
             _fow-500 _tt-uppercase _pe-none">
  STORY MODELS
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `#model-switcher-title` |
| **Text** | `"STORY MODELS"` |
| **Font** | `font_body`, weight `500`, size `f-size-3` |
| **Color** | `coreA8` (muted gray) |
| **Transform** | `uppercase` |

---

## Model List

```html
<ul aria-label="Available AI models"
    role="list"
    class="... is_ScrollView is_View _mah-10037
           _pr-t-space-1--53 _mr--14px">
  <div> <!-- scroll content wrapper -->
    <div class="is_Column is_View _fd-column _bg-core1 _gap-t-space-1">
      <li aria-label="Dynamic Small, available, recommended" ...>
      <li aria-label="Dynamic Large, available, recommended" ...>
      <li aria-label="DeepSeek, currently selected, available, staged for selection" ...>
      <li aria-label="Hermes 3 405B, available" ...>
      <li aria-label="Raven, available" ...>
      <!-- More models when "Show More" is expanded -->
    </div>
  </div>
</ul>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Available AI models"]` |
| **Role** | `list` |
| **Element** | `<ul>` wrapping `<li>` items |
| **Scroll** | Internal scrolling via `is_ScrollView` |
| **Gap** | `t-space-1` between model items |
| **Right padding** | `t-space-1--53` with negative margin `_mr--14px` (hides scrollbar) |

---

## Model List Item (Shared Structure)

Every model card is an `<li>` with a consistent internal layout:

```html
<li aria-label="{ModelName}, {status descriptors}"
    role="listitem"
    aria-selected="{true|false}"
    tabindex="0"
    class="css-g5y9jx"
    style="flex-direction: column; background-color: rgb(0, 0, 0);
           border-width: {0px|1px}; border-color: rgb(248, 174, 44);
           border-radius: 12px; cursor: pointer; border-style: solid;">

  <!-- Main Row -->
  <div class="is_Row is_View _fd-row _pt-t-space-2 _pr-t-space-2
              _pb-t-space-2 _pl-t-space-2 _gap-t-space-3 _ai-center">

    <!-- Model Icon -->
    <div class="is_View _pos-relative _fd-column">
      <div aria-hidden="true" class="... _btw-1px _btc-coreA4 _btlr-t-radius-1 ...">
        <div class="... _w-t-size-5 _h-t-size-5">
          <img alt="{ModelName} icon" src="...?class=thumb"
               style="object-fit: contain;">
        </div>
      </div>
    </div>

    <!-- Model Info Column -->
    <div class="is_Column is_View _fd-column _gap-t-space-1 _fg-1 _fs-1 _fb-auto">
      <!-- Model Name -->
      <span class="is_Text font_body _col-color _fos-f-size-2
                   _fow-f-weight-6 _ws-nowrap _textOverflow-ellipsis">
        {ModelName}
      </span>
      <!-- Description (only on selected/expanded model) -->
      <span class="is_Text font_body _col-coreA8 _fos-f-size-2 _fow-500">
        {Description}
      </span>
    </div>

    <!-- Badge (top-right, absolutely positioned) -->
    <div role="img" aria-label="{BadgeName} badge"
         class="is_Column ... _pos-absolute _t-t-space-0 _r-t-space-0
                _pt-t-space-1 _pb-t-space-1 _pr-t-space-2 _pl-t-space-2
                _bblr-t-radius-1-1448 _btrr-t-radius-1{-1448}
                _bg-{badgeColor}">
      <span class="is_Text font_body _fos-f-size-1 _tt-uppercase">
        {BadgeText}
      </span>
    </div>
  </div>

  <!-- Expanded Details Section (selected model only) -->
  <section aria-expanded="true" aria-label="{ModelName} details" role="region">
    ...
  </section>
</li>
```

### Model Item Properties

| Property | Value |
|----------|-------|
| **Element** | `<li>` with `role="listitem"` |
| **Selection** | `aria-selected="true"` for the currently selected model |
| **Background** | `rgb(0, 0, 0)` (inline, all items) |
| **Border** | `0px` when unselected, `1px solid rgb(248, 174, 44)` (gold) when selected |
| **Border radius** | `12px` (inline) |
| **Cursor** | `pointer` |
| **Padding** | `t-space-2` all sides |
| **Gap** | `t-space-3` between icon and info column |
| **Icon size** | `t-size-5` square, `object-fit: contain` |

### aria-label Format

The `aria-label` on each `<li>` is a comma-separated descriptor string:

```
"{ModelName}, {selectionState}, {availabilityState}, {additionalFlags}"
```

Examples:
- `"Dynamic Small, available, recommended"`
- `"DeepSeek, currently selected, available, staged for selection"`
- `"Hermes 3 405B, available"`

---

## Known Models (from DOM Snapshot)

| Model | Badge | Badge Background | Image URL Slug | aria-label Descriptors |
|-------|-------|-------------------|----------------|----------------------|
| **Dynamic Small** | Best Memory | `coreA2` (muted) | `b6df807b-630b-4654-349c-cb33fb21ad00` | `available, recommended` |
| **Dynamic Large** | Superior Logic | `coreA2` (muted) | `687bb887-a79a-483e-91db-fe1ae88f8b00` | `available, recommended` |
| **DeepSeek** | Current | `primary` (gold accent) | `DeepSeek32` | `currently selected, available, staged for selection` |
| **Hermes 3 405B** | *(none)* | — | `61959a43-c4e8-4334-363f-634b89c90a00` | `available` |
| **Raven** | *(none)* | — | `Raven1` | `available` |

### Image URL Pattern

```
https://latitude-standard-pull-zone-1.b-cdn.net/site_assets/aidungeon/client/model-images/{slug}.png?class=thumb
```

### Badge Types

| Badge | Background | Text Color | Meaning |
|-------|-----------|------------|---------|
| **Current** | `primary` (gold/accent) | `blackA9` (dark text on gold) | Currently active model |
| **Best Memory** | `coreA2` (subtle) | `coreA9` (light text) | Highest context retention |
| **Superior Logic** | `coreA2` (subtle) | `coreA9` (light text) | Best reasoning capability |

---

## Expanded Model Details (Selected Model)

When a model is selected (`aria-selected="true"`), a `<section>` expands below the main row:

```html
<section aria-expanded="true"
         aria-label="DeepSeek details"
         role="region"
         style="padding: 0px 16px 16px; margin-top: 0px; gap: 16px;
                max-height: 500px; overflow: hidden; opacity: 1;
                transform: translateY(0px);">
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="{ModelName} details"]` |
| **Animation** | `opacity` and `translateY` for expand/collapse |
| **Padding** | `0px 16px 16px` (no top — flush with main row) |
| **Max height** | `500px` |

### Feature Tags

A horizontal wrapping row of pill-shaped feature tags:

```html
<div role="list" aria-label="Model features" class="is_Row ... _gap-t-space-1 _fwr-wrap">
  <div role="listitem" aria-label="Feature: Deepseek"
       class="... _btw-1px _bg-coreA0 _btlr-t-radius-0-1448 ...
              _btc-coreA8 _pr-t-space-1 _pl-t-space-1">
    <span class="is_Text font_body _col-coreA8 _fos-f-size-1 _tt-uppercase">
      Deepseek
    </span>
  </div>
  <div role="listitem" aria-label="Feature: XL" ...>...</div>
  <div role="listitem" aria-label="Feature: 128K Max Context" ...>...</div>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Model features"]` |
| **Layout** | Row, `flex-wrap: wrap`, gap `t-space-1` |
| **Tag style** | Pill with `1px` border, `coreA8` border color, `coreA0` background |
| **Tag text** | `uppercase`, `f-size-1`, `coreA8` color |
| **Tag padding** | `t-space-1` horizontal, `t-space-0--53` vertical |

#### Known Feature Tags (from DeepSeek)

- `Deepseek` — model family
- `XL` — size tier
- `128K Max Context` — maximum context window

### Context Info Row

Shows the user's plan-specific context allocation and an upsell link:

```html
<div class="is_Row ... _jc-space-betwe3241 _ai-center _gap-t-space-2">
  <span class="is_Text font_body _col-coreA9 _fos-f-size-2 _fow-100">
    Legend (Your Plan): 8k Context
  </span>
  <div role="button" aria-label="Get more context for DeepSeek"
       class="... _cur-pointer">
    <span class="is_Text font_body _col-primary _fos-f-size-2
                 _td-underline _fow-100">
      Get More
    </span>
  </div>
</div>
```

| Property | Value |
|----------|-------|
| **Plan text format** | `"{PlanName} (Your Plan): {contextSize} Context"` |
| **"Get More" link** | `[aria-label="Get more context for {ModelName}"]`, styled as underlined `primary` color text |

---

## Show More Models Toggle

```html
<div role="button" tabindex="0"
     aria-expanded="false"
     aria-label="Show more AI models"
     class="... _cur-pointer">
  <span class="is_Text font_body _col-coreA9 _fos-f-size-2 _fow-500
               _w-10037 _ta-center _pt-t-space-1 _pb-t-space-2">
    Show More Models +
  </span>
</div>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label="Show more AI models"]` |
| **State** | `aria-expanded="false"` (collapsed) / `"true"` (expanded) |
| **Text** | `"Show More Models +"` |
| **Alignment** | Centered, full width |

---

## Confirm Selection Button

```html
<span class="t_sub_theme t_primary is_Theme" style="display: contents;">
  <div role="button"
       aria-label="Confirm selection: DeepSeek"
       aria-describedby="model-description-582"
       class="is_Button is_View _cur-pointer _h-t-size-6
              _btlr-t-radius-1 _btrr-t-radius-1
              _bbrr-t-radius-1 _bblr-t-radius-1
              _pr-t-space-2 _pl-t-space-2 _fd-row
              _bg-background _btw-0px _brw-0px _bbw-0px _blw-0px">
    <span class="is_ButtonText is_Text font_body _col-color
                 _fos-f-size-2 _tt-uppercase">
      Use DeepSeek
    </span>
  </div>
</span>
```

| Property | Value |
|----------|-------|
| **Selector** | `[aria-label^="Confirm selection:"]` |
| **Dynamic label** | `"Confirm selection: {ModelName}"` |
| **Theme** | `t_primary` (gold accent background) |
| **Text** | `"Use {ModelName}"` (uppercase) |
| **Height** | `t-size-6` |
| **Border** | None |
| **Described by** | `model-description-{id}` — links to the hidden description span |

---

## Model Comparison Guide Link

```html
<a href="https://help.aidungeon.com/ai-model-differences"
   target="_blank" rel="noreferrer">
  <div class="is_Row ... _gap-t-space-1 _ai-center _jc-center _w-10037">
    <span class="is_Text font_body _col-coreA7 _fos-f-size-1 _fow-500">
      Model Comparison Guide
    </span>
    <span class="is_Text font_icons _col-coreA7 _fos-f-size-1">
      w_outbound
    </span>
  </div>
</a>
```

| Property | Value |
|----------|-------|
| **URL** | `https://help.aidungeon.com/ai-model-differences` |
| **Icon** | `w_outbound` (external link indicator) |
| **Color** | `coreA7` (subtle gray) |

---

## Reliable Selectors for BetterDungeon

```javascript
// The dialog itself
const modelSwitcher = document.querySelector('[role="dialog"][aria-labelledby="model-switcher-title"]');
const isModelSwitcherOpen = !!modelSwitcher;

// The model list
const modelList = document.querySelector('[aria-label="Available AI models"]');

// All model items
const modelItems = document.querySelectorAll('[aria-label="Available AI models"] [role="listitem"]');

// Get currently selected model
function getSelectedModel() {
  const selected = document.querySelector('[aria-label="Available AI models"] [aria-selected="true"]');
  if (!selected) return null;
  const name = selected.querySelector('.is_Text.font_body._fow-f-weight-6')?.textContent?.trim();
  const badge = selected.querySelector('[role="img"]')?.getAttribute('aria-label')?.replace(' badge', '');
  return { name, badge, element: selected };
}

// Get all available model names
function getAvailableModels() {
  const items = document.querySelectorAll('[aria-label="Available AI models"] [role="listitem"]');
  return [...items].map(li => {
    const label = li.getAttribute('aria-label') || '';
    const name = label.split(',')[0].trim();
    const isSelected = li.getAttribute('aria-selected') === 'true';
    const badge = li.querySelector('[role="img"]')?.getAttribute('aria-label')?.replace(' badge', '') || null;
    return { name, isSelected, badge, element: li };
  });
}

// Select a model by name (click it, then confirm)
function selectModel(modelName) {
  const items = document.querySelectorAll('[aria-label="Available AI models"] [role="listitem"]');
  const target = [...items].find(li => li.getAttribute('aria-label')?.startsWith(modelName));
  if (target) {
    target.click(); // expands and stages the model
    // After click, the confirm button updates — click it to finalize
    setTimeout(() => {
      const confirmBtn = document.querySelector('[aria-label^="Confirm selection:"]');
      confirmBtn?.click();
    }, 100);
  }
}

// Get the confirm button and its target model
const confirmBtn = document.querySelector('[aria-label^="Confirm selection:"]');
const confirmModelName = confirmBtn?.getAttribute('aria-label')?.replace('Confirm selection: ', '');

// "Show More" toggle
const showMoreBtn = document.querySelector('[aria-label="Show more AI models"]');
const isShowMoreExpanded = showMoreBtn?.getAttribute('aria-expanded') === 'true';

// Get feature tags for the expanded model
function getModelFeatures() {
  const featureList = document.querySelector('[aria-label="Model features"]');
  if (!featureList) return [];
  return [...featureList.querySelectorAll('[role="listitem"]')].map(
    tag => tag.getAttribute('aria-label')?.replace('Feature: ', '') || ''
  );
}

// Get user's context allocation for the selected model
function getContextInfo() {
  const section = document.querySelector('[aria-label$="details"][role="region"]');
  const spans = section?.querySelectorAll('.is_Text.font_body') || [];
  const contextSpan = [...spans].find(s => s.textContent.includes('Context'));
  return contextSpan?.textContent?.trim() || null;
}
```

---

## Better Dynamic Feature Notes

The Model Switcher is the primary DOM target for the planned **Better Dynamic** feature. Key observations:

1. **Model identification** — Each model is uniquely identifiable via the first segment of its `aria-label` (e.g., `"Dynamic Small"`, `"DeepSeek"`).
2. **Selection state** — `aria-selected="true"` marks the staged model; the `"Current"` badge marks the actually active model.
3. **Two-step selection** — Clicking a model stages it (expands details), then the confirm button (`[aria-label^="Confirm selection:"]`) finalizes it. Both clicks are needed.
4. **Badge system** — Badges provide quality signals (`Best Memory`, `Superior Logic`, `Current`) that could inform automatic model selection logic.
5. **Feature tags** — Machine-readable via `[aria-label^="Feature:"]` — useful for filtering models by capability (e.g., context size).
6. **Context info** — The plan-specific context allocation (e.g., `"Legend (Your Plan): 8k Context"`) is visible in the expanded details — useful for adapting to user's plan limits.
7. **"Show More" gate** — Some models may be hidden behind the `[aria-label="Show more AI models"]` toggle. Click it first to ensure all models are visible before querying.

---

## Icon Glyph Reference (Model Switcher)

| Glyph | Used On |
|-------|---------|
| `w_outbound` | Model Comparison Guide (external link) |
| `w_chevron_down` | *(not in this dialog, but used on nav bar trigger)* |

---

## See Also

- [Navigation Bar](adventure-page-navigation.md) — Contains the Model Switcher trigger button
- [Adventure Page Overview](adventure-page-overview.md)
- [CSS Architecture](css-architecture.md)
