# 05 — Risks & Open Questions

Tracked list of things that could bite us during implementation and unresolved design choices to settle as we go. Update in-place as each item is mitigated or answered.

## Technical risks

### R1 — WebSocket interceptor races the AI Dungeon bundle

**Risk:** If `ws-interceptor.js` doesn't install before AI Dungeon's JS constructs its socket, we miss frames until the next WebSocket instantiation (which may be the next adventure load, or never).

**Mitigation:**
- Use manifest `"world": "MAIN"` + `"run_at": "document_start"`. On supported Chromium versions this is guaranteed-before-page-scripts.
- Firefox: if `world: "MAIN"` isn't available on our minimum version, fall back to injecting a `<script>` element with `src = chrome.runtime.getURL('services/frontier/ws-interceptor.js')` from the isolated-world script at `document_start`.
- Use `class extends NativeWebSocket` rather than a function wrapper; Apollo Client breaks silently if `instanceof WebSocket` returns false, and this was observed in Phase 0.
- On install, log the first captured frame's timestamp and compare to `document.currentScript` timing; flag any race.

**Verification (Phase 0):** Confirmed working via a Violentmonkey userscript (`frontier/ws-userscript.user.js`) at `@run-at document-start`. A paste-into-console install (i.e. post-bundle) failed silently because Apollo had already captured the native `WebSocket`. The extension equivalent is `"world": "MAIN"` + `"run_at": "document_start"` in the manifest.

**Status:** Mechanism proven; still open until the extension-hosted version lands in Phase 1 (userscript vs MV3 content-script timing may differ subtly on Firefox/WebView).

---

### R2 — AI Dungeon changes the GraphQL subscription shape

**Risk:** Three subscription payloads are load-bearing and none are documented public APIs: `adventureStoryCardsUpdate`, `contextUpdate`, `actionUpdates`. AI Dungeon could rename, restructure, or replace any of them at any time.

**Mitigation:**
- Key identification off presence of each top-level data key (`payload.data.<name>`) rather than GraphQL operation name strings, so an internal operation rename doesn't break us.
- Log a counted sample of unknown top-level keys (not every frame) so we notice new or renamed subscriptions quickly.
- Don't hard-error the extension on unknown shapes; degrade gracefully (Frontier modules stop updating; the rest of BetterDungeon is unaffected).
- Validate the small set of fields we actually consume (`storyCards[].id/.keys/.title/.value`, `contextUpdate.actionId`, `actionUpdates.actions[].id/.undoneAt/.retriedActionId`). Warn if any is absent.

**Status:** Ongoing — monitor post-release.

---

### R3 — Story card `value` size limit

**Risk:** AI Dungeon may silently truncate or reject story card values over a certain length. Unknown exact limit.

**Mitigation:**
- Empirically measure during Phase 0 / Phase 1 by issuing progressively larger `updateStoryCard` mutations and observing what round-trips intact.
- Document the measured limit as a constant in `core.js`.
- Core warns any time a state card exceeds 80% of the budget. Scripts use the `historyLimit` knob to stay comfortably under.
- Overflow into supplementary cards is explicitly NOT implemented in MVP; a module that grows past the per-card budget is a design bug to be solved at the module level.

**Status:** Measure during Phase 0; wire the warning in Phase 1.

---

### R4 — GraphQL write path authentication

**Risk:** Outgoing mutations need whatever auth headers AI Dungeon uses (bearer token, CSRF token, cookies, etc.). If we can't capture or reproduce them, writes fail.

**Mitigation:**
- Capture headers from observed `fetch` / WS requests during Phase 1.
- Use `chrome.webRequest` to observe outgoing request headers if needed (may require additional permission).
- Prefer reusing the page's own GraphQL client if it's exposed on `window`.

**Fallback:** If authenticated writes prove fragile, Core falls back to a DOM-driven write (open the card in AI Dungeon's UI, set its value, submit — same pattern as `story-card-scanner.js` uses for reads). Slow and fragile but works.

**Status:** Investigate during Phase 2.

---

### R5 — History map size bloat

**Risk:** If a script forgets to prune or sets `historyLimit` too high, the `frontier:state:scripture` card grows until it hits AI Dungeon's per-card size limit. At that point writes fail silently (or get truncated server-side), and widgets stop updating correctly.

**Mitigation:**
- `frontierUpdateHistory` auto-prunes to `historyLimit` (default 100) on every write.
- Core logs a warning if any state card exceeds 80% of the known size budget, so authors notice growth early.
- Scripture exposes `scriptureConfigure({ historyLimit })` for authors who want a different cap.
- Phase 0 measures the actual size limit; once known, Core can enforce a hard cap before attempting the write.

**Status:** Bake the auto-prune into Phase 1; enforce the hard cap once Phase 0 measurements land.

---

### R6 — Firefox MV3 quirks

**Risk:** Firefox MV3 support has historically differed from Chromium (e.g. `scripting.executeScript` world support, service worker lifecycles).

**Mitigation:**
- Target the Firefox minimum version specified in `manifest.json` (currently `"strict_min_version": "109.0"`). Confirm MV3 features we rely on are available there.
- If `world: "MAIN"` isn't supported on our min version, bump the min version OR use the `<script>` injection fallback.

**Status:** Verify during Phase 0.

---

### R7 — Popup UI space

**Risk:** BetterDungeon's popup is already densely packed. Adding a Frontier section with nested module toggles could push it over the browser's default popup dimensions.

**Mitigation:**
- Frontier section is collapsible.
- Module list below Frontier section is scrollable if it exceeds a height threshold.
- Defer "Manage modules…" button rendering until there's actually a registry to browse.

**Status:** Design during Phase 4.

---

### R8 — Heartbeat write frequency

**Risk:** Writing the heartbeat card every turn means every turn triggers a GraphQL mutation from the extension. High enough traffic to get flagged or rate-limited?

**Mitigation:**
- Heartbeat is one small mutation per turn, consistent with the user's own interactions. Unlikely to be flagged.
- If it does become a problem, reduce frequency to "every N turns" or "only on module registry changes."
- In Lite, the heartbeat is the only BD-originated write. In Full, ops responses also write `frontier:in:<module>` cards, but these are coalesced by the write queue and only one write per module per turn is expected.

**Status:** Implement with per-turn default; revisit if rate-limit warnings appear.

---

### R9 — Action-ID stability assumption (RESOLVED)

**Original risk:** The action-history design depended on AI Dungeon action ids being stable across retry/edit/undo/rewind/delete.

**Phase 0 findings (all confirmed via WS capture):**
- **Format:** numeric strings (`"0"`, `"1"`, …), monotonic +1 per action. A story/do/say submit creates two ids (user input + AI response); continue creates one; retry creates one.
- **Edit in place:** preserves id. Mutation updates `text`; `id` and `undoneAt` unchanged.
- **Undo / rewind / delete:** preserves id; only `undoneAt` flips to a timestamp.
- **Restore:** preserves id; `undoneAt` flips back to `null`.
- **Retry:** creates a new action at `tail+1` with `retriedActionId` pointing to the original; original's `id` is preserved but gets `undoneAt` set. **Behavior A from the original Q11 framing.**
- **Never reused:** after rewind marks ids 2–6 as undone, subsequent submits got ids 7 and 8, not recycled slots.
- **Page reload:** ids persist (server-side adventure record).
- **Multiple adventures:** ids scoped per adventure (each starts at `"0"`).

**Design resolution:** Scripture and other history-tracking modules do NOT key by wire action id. Scripts cannot read those ids anyway (see resolved [Q2](#q2--is-historyiid-reliably-populated-in-ai-dungeons-script-environment-resolved)). Instead, both sides agree on a **live-count ordinal** — the count of non-undone actions that will exist after the current turn completes. Script-side: `history.length + 1`. BD-side: `actions.filter(a => a.undoneAt === null).length`. See [02 — Protocol: live-count history convention](./02-protocol.md#live-count-history-convention).

**Status:** Closed.

---

### R10 — Android WebView compatibility

**Risk:** Frontier is designed for BD V2, which ships on Chromium, Gecko, AND Android WebView. WebView has historically had quirks with MV3, content-script world injection, and WebSocket shimming. If the WS interceptor doesn't install reliably on WebView, Scripture breaks on mobile.

**Mitigation:**
- Phase 0 includes a multiplatform smoke test across all three platforms.
- The `<script>`-tag fallback for `world: "MAIN"` injection is the portable path; we use MAIN world only where natively supported.
- Document any WebView-specific quirks as they're discovered.
- If WebView turns out to block the WS shim entirely, fall back to a DOM MutationObserver on the card list (slower but functional) and document the degraded mode.

**Status:** Verify in Phase 0. If blocking issues surface, decide whether to gate WebView support on a later BD release.

---

### R11 — Gaps in the history map

**Risk:** Scripts prune aggressively, install mid-adventure, or crash mid-turn. Any of these can result in BD looking up `history[tailId]` for an id that doesn't exist. Widgets would show incorrect (or no) values.

**Mitigation:**
- Scripture's `onStateChange` falls back to the most-recent history entry if the tail's entry is missing, then to manifest-declared defaults if history is empty.
- `frontierUpdateHistory` always writes the current tail's entry BEFORE pruning, so the most recent entry should never be missing in normal operation.
- Document the fallback behavior in the Scripture guide so users understand why stale-looking values may appear briefly after installing Scripture mid-adventure.

**Status:** Implement the fallback in Phase 1; document in Phase 4.

---

## Open design questions to resolve during implementation

### Q1 — Card `entry` vs `value` field

`addStoryCard(keys, entry, type)` accepts `entry`; the card object exposes both `entry` and `value` (and `value` is "when exported"). Which field holds the authoritative user-set content? Need to confirm by experiment whether `entry` and `value` always match, and which one to write/read for Frontier.

**Resolution path:** Phase 1 logging will reveal the truth.

---

### Q2 — Is `history[i].id` reliably populated in AI Dungeon's script environment? (RESOLVED)

**Answer: No. There is no `id` field on script-side history entries at all.** Phase 0 probe confirmed `history[i]` exposes only `{ text, type, rawText }`. Wire action ids are completely inaccessible to Output Modifiers.

**Resolution:** The Scripture history pattern was redesigned to use a **live-count ordinal** instead of wire action ids. Both sides agree on `history.length + 1` (script) ≡ `actions.filter(!undoneAt).length` (BD). Because this ordinal is computed from observable data on each side independently, no id is needed. See [02 — Protocol: live-count history convention](./02-protocol.md#live-count-history-convention) and the resolution under [R9](#r9--action-id-stability-assumption-resolved).

**Status:** Closed.

---

### Q3 — Which WebSocket subscriptions drive Frontier on BD's side? (RESOLVED)

Confirmed via Phase 0 WS capture. Three subscriptions, all under the single `wss://api.aidungeon.com/graphql` connection:

- `adventureStoryCardsUpdate` — full card list every turn.
- `contextUpdate` — per-turn prompt context; carries `actionId` for the current tail.
- `actionUpdates` — fires on every action mutation (create / edit / undo / rewind / delete); carries the full `actions[]` snapshot with `id`, `undoneAt`, and `retriedActionId`.

See [02 — Protocol: observation channels](./02-protocol.md#ai-dungeon-observation-channels) for the canonical spec.

**Resolution:** Documented. Closed.

---

### Q4 — Synthetic `onStateChange` on action-id change: once per module or once per card?

When the tail action id changes, Core re-dispatches `onStateChange` so modules can re-read `history[newTailId]`. Should Core pass the cached parsed state of:

- **Option A:** every state card the module cares about (one call per card), or
- **Option B:** just one call with the full set of modules' state?

Option A is simpler and symmetric with the card-change path. Option B is slightly more efficient but adds an API distinction.

**Preferred:** Option A. Keep the API uniform; one `onStateChange` per state-card entry in `stateNames`.

**Resolution path:** Implement in Phase 1; document in 03-modules.md.

---

### Q5 — BetterRepository guide split: one page or two?

Option A: One `FrontierGuide.vue` with Scripture as a sub-section.
Option B: Two separate guides with cross-links.

**Resolution path:** Review the length of the existing `BetterScriptsGuide.vue` (1221 lines) and the proposed Frontier + Scripture content. If combined content exceeds ~1500 lines, split; otherwise one page with clear TOC.

---

### Q6 — Module-specific persisted state

Should Core offer modules a key-value store (e.g. `ctx.storage.get/set`) scoped to the module id, or should each module manage its own `chrome.storage` usage? Offering it centrally makes module code cleaner and enables future namespacing / quota enforcement; making it BYO is zero-effort for Core.

**Resolution path:** Offer a thin `ctx.storage` helper in Phase 2 that wraps `chrome.storage.sync` under a per-module key prefix. Modules can still reach `chrome.storage` directly if needed.

---

### Q7 — What happens if a script publishes `frontier:state:<name>` for a module that isn't enabled?

Options:
- Core caches the state until the module is enabled, then replays it.
- Core ignores it until the module is enabled.
- Core emits an error response to the next turn (but there's no request to reply to).

**Preferred:** Cache-and-replay. When a module's `onEnable` is called, Core synchronously emits `onStateChange` for any state cards the module claims that already exist.

**Resolution path:** Implement as described; document in 03-modules.md.

---

### Q8 — Debug inspector UI

For dev workflow, an in-browser inspector showing live state-card changes, action-id transitions, heartbeat status, and module registration would be invaluable. Where should it live? Options:
- A DevTools panel (complex).
- An injected overlay on the adventure page activated by keyboard shortcut.
- A popup tab.

**Resolution path:** Defer past MVP. Useful for Phase 2+ module development but not blocking Scripture-only MVP.

---

### Q9 — History order reconstruction after page reload

When BD rehydrates after a reload, it reads the full `frontier:state:scripture` card and sees the `history` object. It doesn't know the insertion order of those keys (JSON key order is unreliable). Does it need to? Only if the script's pruning logic depends on knowing the order — but the script stores `state.frontier._historyOrder[name]` as a backing list, which gets persisted in AI Dungeon's `state` blob, so order is preserved script-side.

**Question:** Does BD ever need to know the order? Or is it sufficient for BD to just look up `history[tailId]` and never iterate?

**Preferred:** BD doesn't need order. Keep it script-side.

**Resolution path:** Confirm during Phase 1 implementation.

---

### Q10 — Writing state before the first action exists (RESOLVED)

**Answer: Not an issue.** Phase 0 probe confirmed that on turn 1 of a fresh adventure, the Output Modifier fires with `history.length === 1` (the user's submitted story input is already in history; the AI response is being generated). Scripts can compute the live-count key (`history.length + 1 === 2`) and write on turn 1 without any fallback.

**Status:** Closed.

---

### Q11 — Retry semantics: do retries reuse an action id? (RESOLVED)

**Answer: Behavior A.** Retry creates a new action at `tail+1` with `retriedActionId` pointing to the original. The original's `id` is preserved but its `undoneAt` is set. Confirmed via Phase 0 WS capture: `contextUpdate` tail advanced 4→5, and the accompanying `actionUpdates` frame carried `n=2` with both the original (now undone) and the new action (with `retriedActionId`).

**Impact on design:** Under the live-count history scheme, retry leaves the live count unchanged (one action goes to undone, one new action is created; net 0). The script's next Output Modifier call writes the new values under the **same** live-count key, overwriting the original's values. This is the behavior Scripture wants: the user sees the new text, so widgets should reflect the new values. See the retry row in [02 — Protocol: event-to-channel matrix](./02-protocol.md#event-to-channel-matrix).

**Status:** Closed.

---

## Follow-up work (post-V2, explicitly scoped out)

| Item | Priority | Rough estimate | Depends on |
|------|----------|---------------|------------|
| NPM / TypeScript / bundler migration | Medium | Large | Own epic; re-evaluate after V2 |
| `story-card-scanner.js` migration to card-stream | Medium | Medium | Phase 1 complete |
| GraphQL write path hardening (auth robustness) | Medium | Medium | V2 released; observed failure modes |
| Registry UI + curated module catalog | Medium | Large | At least one external module exists |
| Sandboxed user scripts | Low | Very large | Security review; Full Frontier stable |
| Inter-module calls | Low | Small | At least two real modules exist |
| Debug inspector UI | Medium | Medium | Phase 1 complete |
| Per-module permission prompts | Medium | Medium | Registry exists |
| Mobile APK parity testing (automated) | High | Small–Medium | BD V2 Android builds |
| Hard-cap enforcement on state-card size | Medium | Small | Phase 0 measurement complete |

## Questions for later that need USER input, not implementation

- Do we want Frontier modules to be able to prompt the user for permission before a sensitive action (network fetch, clipboard read)? If so, how should that UI look? (Native browser permission prompts vs in-BD modal vs implicit trust for built-ins only.) — Relevant now that Full Frontier is in V2.
- Do we want Frontier modules to be able to render their own UI outside of Scripture's widget bar? (Future Dashboard module that overlays a full sidebar, etc.)
- Should the BetterRepository host a module catalog even in V2 (just as static documentation), or wait until the install flow exists?
- Naming: is the umbrella still "BetterScripts" in any user-facing sense, or fully "Frontier"? (Current plan: fully Frontier. Confirm before rewriting guides.)
- When is the right time to revisit Robyn's NPM/bundler pitch? (Current plan: declined for V2, re-open as a separate epic after Frontier stabilizes. User signal needed for prioritization.)
