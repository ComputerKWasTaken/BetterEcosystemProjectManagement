# 09 - Snippet Verification Checklist

> Reduced checklist for public Ultrascripts examples after the snippet diet.

## How to use this

The docs now have one main copy-paste surface: Quick Start.

Manual AI Dungeon testing is reserved for snippets that authors are expected to
paste into Library, Context, Input, or Output. Module pages should mostly teach
contracts, result shapes, and patterns in prose.

For each kept snippet, verify:

- copy/paste produces literal code
- the snippet works inside the intended AI Dungeon hook
- no functions are stored on serializable `state`
- no top-level early `return` is used
- turn timing is correct
- enhanced vs required posture is clear

Mark each item:

- `[ ]` not checked after latest edit
- `[x]` verified after latest edit
- `[!]` needs cleanup

## Manual AI Dungeon Tests

These are the only snippets that should currently require manual play-test
verification.

### Quick Start

- [x] [UltrascriptsQuickStartGuide.vue:211](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:211>) - SDK helper copy block
- [x] [UltrascriptsQuickStartGuide.vue:275](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:275>) - Enhanced fallback pattern
- [ ] [UltrascriptsQuickStartGuide.vue:323](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:323>) - Required guard pattern after no-early-return rewrite
- [ ] [UltrascriptsQuickStartGuide.vue:379](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:379>) - HP bar library snippet
- [ ] [UltrascriptsQuickStartGuide.vue:389](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:389>) - HP bar context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:422](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:422>) - Clock context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:473](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:473>) - AI Co-GM context snippet
- [ ] [UltrascriptsQuickStartGuide.vue:532](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:532>) - Complete scenario library snippet
- [ ] [UltrascriptsQuickStartGuide.vue:543](</C:/Users/compu/OneDrive/Documents/CascadeProjects/Projects/Web Dev/BetterEcosystem/BetterRepository/src/components/guides/UltrascriptsQuickStartGuide.vue:543>) - Complete scenario context snippet

## Static Review Items

These should not require manual AI Dungeon testing unless they become executable
copy-paste snippets again.

### Module Contract Blocks

- [x] AI guide request/response/payload JSON examples
- [x] Clock guide args/result examples
- [x] Geolocation guide args/result examples
- [x] Network guide args/result examples
- [x] SDK guide result-shape examples
- [x] Scripture guide payload, widget, and event examples
- [x] System guide args/result examples
- [x] Weather guide args/result examples
- [x] WebFetch guide args/payload examples

### Architecture / BetterDungeon Authoring

- [x] Architecture transport and JSON examples
- [x] Authoring interfaces and BetterDungeon-side module examples

## Scrapped From Manual Queue

These areas no longer publish independent copy-paste snippets and do not need
manual AI Dungeon testing:

- Cookbook recipe snippets, now replaced with a pattern matrix
- AI module raw-card recipes
- Clock module raw-card recipe
- Geolocation module raw-card recipe
- Network module raw-card recipe
- System module raw-card recipe
- Weather module raw-card recipe
- WebFetch module raw-card recipes
- SDK guide duplicate helper and generic raw ops helper
- Scripture guide duplicate helper and raw event-consume snippet

## High-Risk Grep Targets

Run these before considering snippet work done:

- `state.bd`
- `return text`
- `return { text`
- `storyCards.find(function (c) { return c.title`
- `card.value =`
- `data.content`
- `moduleId`
- `max_tokens`
- `response_format`
- `top_p`
- WebFetch examples teaching `POST` or request bodies
- `platformType`
- `preferredLocale`
- `viewport`
- `data.now`
- `lat`
- `lon`
- `accuracyMeters`

Expected: no hits in public AI Dungeon copy-paste snippets except legitimate
helper internals such as `moduleId` parameter names inside `bd.us`.
