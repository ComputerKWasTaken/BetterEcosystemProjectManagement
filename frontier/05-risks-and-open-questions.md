# 05 — Risks & Open Questions

Tracked list of things that could bite us during implementation and unresolved design choices to settle as we go. Update in-place as each item is mitigated or answered.

## Technical risks

### R1 — WebSocket interceptor races the AI Dungeon bundle

**Risk:** If `ws-interceptor.js` doesn't install before AI Dungeon's JS constructs its socket, we miss frames until the next WebSocket instantiation (which may be the next adventure load, or never).

**Mitigation:**
- Use manifest `"world": "MAIN"` + `"run_at": "document_start"`. On supported Chromium versions this is guaranteed-before-page-scripts.
- Firefox: if `world: "MAIN"` isn't available on our minimum version, fall back to injecting a `<script>` element with `src = chrome.runtime.getURL('services/frontier/ws-interceptor.js')` from the isolated-world script at `document_start`.
- On install, log the first captured frame's timestamp and compare to `document.currentScript` timing; flag any race.

**Verification:** First commit's manual test explicitly checks that frames are captured from the moment the adventure loads.

**Status:** Open until Phase 1 acceptance.

---

### R2 — AI Dungeon changes the GraphQL subscription shape

**Risk:** The `adventureStoryCardsUpdate` subscription payload is not a documented public API. AI Dungeon could rename, restructure, or replace it at any time.

**Mitigation:**
- Key identification off shape (`payload.data.adventureStoryCardsUpdate`) rather than operation name strings.
- Warn-log any frame whose shape doesn't match the expected schema so we notice drift quickly.
- Don't hard-error the extension on unknown shapes; degrade gracefully (BetterScripts features stop working; the rest of BetterDungeon is unaffected).

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
- In Lite, the heartbeat is the ONLY BD-originated write, so there's nothing else to coalesce with.

**Status:** Implement with per-turn default; revisit if rate-limit warnings appear.

---

### R9 — Action-ID stability assumption (foundational)

**Risk:** The entire action-ID history design assumes AI Dungeon action ids are **stable** across the operations scripts and users perform:
- Do ids survive `Retry` (tail replaced) as distinct new ids, or does the retry reuse the old id?
- Do ids survive `Edit in place` on a past action?
- Do ids survive `Continue` (extending the tail)?
- Do ids survive page reload and adventure re-open?
- Are ids globally unique, or reused across adventures?

If any answer breaks our assumption, the whole Scripture-on-action-ID design is compromised: widgets may show stale values, lose history entries, or fail to revert correctly.

**Mitigation:**
- **Phase 0 verifies every case empirically** before any code is written. Findings recorded in `services/frontier/ACTION_IDS.md`.
- If a specific operation breaks the assumption, fall back to `info.actionCount` (the numeric turn counter) instead of the stable id for that case, and document the caveat in the Scripture guide.
- Core's `tailActionId` field in the heartbeat lets scripts cross-check against their own `history[history.length-1].id` and detect drift at runtime.

**Status:** Verify in Phase 0 — blocking for all of Phase 1.

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

### Q2 — Is `history[i].id` reliably populated in AI Dungeon's script environment?

We assume the script can read the current action's stable id from `history[history.length - 1].id`. If that field isn't always present (e.g. first turn of a fresh adventure, or a specific scenario mode like Multiplayer), `frontierUpdateHistory` returns false and nothing is written for that turn.

**Resolution path:** Phase 0 scratch scenario verifies. If there's a gap, document the fallback (skip history write for that turn; script retries next turn).

---

### Q3 — Which WebSocket subscription carries the action window on BD's side?

AI Dungeon pushes card updates via `adventureStoryCardsUpdate`. The action window arrives on a different subscription; exact name TBD from Phase 0 instrumentation. Candidates observed in the user's earlier WS capture: `adventure.actionWindow[]`, possibly `adventureActionsUpdate` or part of a larger `adventureUpdate` payload.

**Resolution path:** Phase 0 logs distinct top-level `data.*` keys from every observed frame over a few turns. The subscription that carries action ids will be obvious from the shape.

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

### Q10 — Writing state before the first action exists

On a brand-new adventure, turn 1's `onOutput` runs before the first action enters `history` (possibly; needs verification). If `frontierCurrentActionId()` returns null, `frontierUpdateHistory` bails. Widgets would not render until turn 2.

**Options:**
- Accept the one-turn delay. Document it.
- Fall back to writing under a sentinel key (e.g. `"a-initial"`) and letting BD rehydrate when the real action id arrives.

**Preferred:** Accept the one-turn delay. Simpler, and turn 1 is cheap to re-render.

**Resolution path:** Phase 0 scratch scenario confirms whether turn 1 has an action id by `onOutput`. If yes, no issue. If no, document.

---

## Follow-up work (post-MVP, explicitly scoped out)

| Item | Priority | Rough estimate | Depends on |
|------|----------|---------------|------------|
| **Full Frontier (two-way comms)** | High | Large | Lite MVP released and stable |
| First real capability module (likely WebFetch) | High | Medium | Full Frontier complete |
| NPM / TypeScript / bundler migration | Medium | Large | Own epic; re-evaluate after MVP |
| `story-card-scanner.js` migration to card-stream | Medium | Medium | Phase 1 complete |
| GraphQL write path hardening (auth robustness) | Medium | Medium | MVP released; observed failure modes |
| Registry UI + curated module catalog | Medium | Large | Full Frontier + first external module |
| Sandboxed user scripts | Low | Very large | Security review; Full Frontier |
| Inter-module calls | Low | Small | At least two real modules exist |
| Debug inspector UI | Medium | Medium | Phase 1 complete |
| Per-module permission prompts | Medium | Medium | Registry exists |
| Mobile APK parity testing (automated) | High | Small–Medium | BD V2 Android builds |
| Hard-cap enforcement on state-card size | Medium | Small | Phase 0 measurement complete |

## Questions for later that need USER input, not implementation

- Do we want Frontier modules to be able to prompt the user for permission before a sensitive action (network fetch, clipboard read)? If so, how should that UI look? (Native browser permission prompts vs in-BD modal vs implicit trust for built-ins only.) — Relevant once Full Frontier ships.
- Do we want Frontier modules to be able to render their own UI outside of Scripture's widget bar? (Future Dashboard module that overlays a full sidebar, etc.)
- Should the BetterRepository host a module catalog even in MVP (just as static documentation), or wait until the install flow exists?
- Naming: is the umbrella still "BetterScripts" in any user-facing sense, or fully "Frontier"? (Current plan: fully Frontier. Confirm before rewriting guides.)
- When is the right time to revisit Robyn's NPM/bundler pitch? (Current plan: declined for MVP, re-open as a separate epic after Frontier stabilizes. User signal needed for prioritization.)
- Should Full Frontier's two-way comms land as a single big milestone, or be broken into sub-phases (e.g. "ops without acks" → "multi-turn with acks" → "cancellation + timeouts")? — Decide when Full Frontier is queued up, not now.
