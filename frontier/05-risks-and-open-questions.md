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
- Empirically measure during Phase 1 by issuing progressively larger `updateStoryCard` mutations and observing what round-trips intact.
- Document the measured limit as a constant in `core.js`.
- Core enforces the limit pre-write; responses that would exceed it spill into `frontier:state:<module>-overflow-N` cards as specified in the protocol.

**Status:** Measure during Phase 2.

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

### R5 — Extension storage quota for in-flight request tracking

**Risk:** Core tracks in-flight requests by id; if a script leaks requests (never acks, never times out cleanly), memory grows.

**Mitigation:**
- Cap `processedRequestIds` size at N (default 10,000) with LRU eviction.
- `timeoutTurns` default of 20 ensures no request lingers indefinitely.
- Per-adventure scope: all state clears on adventure transition.

**Status:** Bake in from Phase 2.

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
- If it does become a problem, reduce frequency to "every N turns" or "on-demand only when a new request arrives."
- Coalesce heartbeat with any in-flight response writes so we don't write the heartbeat separately when we're already writing the `frontier:in:<module>` card.

**Status:** Implement coalesced; revisit if rate-limit warnings appear.

---

### R9 — Undo/retry semantics assume adventure-text reversion

**Risk:** The entire dual-transport design rests on "invisible chars embedded in output text revert when the user undoes that turn." Robyn confirmed that story cards do NOT revert, but the text-revert assumption has not been empirically re-verified by us in every edge case:
- Does `Retry` replace the current turn's text entirely, or append a new variant?
- Does `Continue` re-emit the prior turn's output (and therefore its invisible frame), or skip straight to a new turn?
- Does edit-in-place on a past turn modify that turn's text in-place (preserving the frame) or replace it (losing it)?

If any of these break the assumption, Scripture values will drift from narrative state in a way that looks like a bug to the user.

**Mitigation:**
- Phase 1B acceptance test MUST include a manual matrix of undo / retry / continue / edit operations with a diagnostic scenario that logs which frames BD observes after each operation.
- Document each confirmed behavior in `PORT_NOTES.md`.
- If any operation loses/corrupts text frames unexpectedly, fall back to card-transport values for that operation's case and document the caveat.

**Status:** Verify matrix during Phase 1B.

---

### R10 — Context Modifier adoption

**Risk:** If a scenario author forgets to install the Context Modifier snippet, the AI sees the raw invisible characters in its context window. Impacts: wasted tokens, possible model confusion, possible unsafe behavior if the chars fall into a prompt-injection edge case.

**Mitigation:**
- The Frontier Library's base snippet includes a one-line `frontierContextModifier` helper; the Scripture guide's "Getting Started" makes the Context Modifier step PROMINENT (one of three mandatory hooks).
- Core can heuristically detect the absence: if the script has emitted text frames but those same frames are later present in `info.text` during `onModelContext`, Core SHOULD log a warning to the in-page console. (Detection runs in the extension, not the AI.)
- (Future) The heartbeat can carry a `contextModifierDetected: boolean` field if we can reliably observe it.

**Status:** Implement the Library helper in Phase 1B; implement detection + warning in Phase 2.

---

### R11 — Codec port divergence from Robyn's upstream

**Risk:** We're manually porting Robyn's TS `invisible-unicode-decoder` to vendored JS. When she iterates on her upstream (perf, new features, bug fixes, codec version bumps), our port will lag or diverge unless we actively maintain it.

**Mitigation:**
- `PORT_NOTES.md` pins the exact upstream commit SHA the port is based on.
- Include Robyn's original test fixtures in our test suite. Any upstream change that breaks test compatibility is flagged immediately.
- Establish a process with Robyn: tag upstream releases, subscribe to release notifications, schedule re-port passes.
- Emit `codecVersion` in every heartbeat so scripts using her Library directly (should that ever be a thing) can detect mismatches.

**Status:** Ongoing — baseline port in Phase 1B; maintenance process post-MVP.

---

### R12 — Copy-paste leakage of invisible chars

**Risk:** Users sometimes copy adventure output to share (e.g. post a cool scene on Discord). If the text contains invisible Frontier frames, those chars travel with the paste. While harmless in most targets, they may:
- Show up as boxes in editors that don't handle ZW chars.
- Fail to round-trip through systems that normalize Unicode (some DBs, some chat apps).
- Leak internal widget values that the user intended private.

**Mitigation:**
- Document the behavior in the Frontier Guide ("invisible text is in your story text; if you copy, it copies").
- Offer users the opt-out via the global text-transport toggle (decision #11).
- (Future) A context-menu option to "Copy without Frontier metadata" that round-trips through `textCodec.strip` before writing to clipboard.

**Status:** Documented in MVP; clipboard integration is a post-MVP enhancement.

---

## Open design questions to resolve during implementation

### Q1 — Card `entry` vs `value` field

`addStoryCard(keys, entry, type)` accepts `entry`; the card object exposes both `entry` and `value` (and `value` is "when exported"). Which field holds the authoritative user-set content? Need to confirm by experiment whether `entry` and `value` always match, and which one to write/read for Frontier.

**Resolution path:** Phase 1 logging will reveal the truth.

---

### Q2 — Concurrent writes from multiple modules in one turn

If two modules both want to write their `frontier:in:<module>` cards in the same turn, we issue two GraphQL mutations. Are there any server-side atomicity concerns, e.g. one overwriting the other's changes? Probably not since they're different cards, but worth confirming.

**Resolution path:** Verify during Phase 2 with a contrived two-module scenario.

---

### Q3 — How does the script know the current turn number for its `turn` field?

The protocol says scripts should include `turn: info.actionCount` in their `frontier:out` payload. Confirm `info.actionCount` is always available and monotonically increasing across Input/Context/Output modifiers.

**Resolution path:** Cross-reference `Project Management/docs/01-scripting/api/info-object.md`; test in a scenario during Phase 1.

---

### Q4 — Should Scripture ever emit responses or just read state?

Current design: Scripture listens for state changes (manifest) and optionally handles ops like `flashWidget`. If Scripture never actually needs `frontier:in:scripture`, that card family never appears for Scripture users, keeping the card list cleaner. Worth confirming whether any planned Scripture op requires a response.

**Resolution path:** Defer until Phase 3 module work; design the `flashWidget` op as fire-and-forget if so.

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

For dev workflow, an in-browser inspector showing live envelopes (BOTH card + text), heartbeat status, and module registration would be invaluable. Where should it live? Options:
- A DevTools panel (complex).
- An injected overlay on the adventure page activated by keyboard shortcut.
- A popup tab.

**Resolution path:** Defer past MVP. Useful for Phase 2+ module development but not blocking Scripture-only MVP.

---

### Q9 — Exact output-text subscription name

The WS interceptor needs to capture whatever GraphQL subscription carries AI Dungeon's streaming output text. We don't know the subscription name yet; `adventureStoryCardsUpdate` is the card one, but output has a separate channel.

**Resolution path:** Phase 1A/1B instrumentation should log all distinct `data.*` top-level keys observed on the WS so we can identify the output subscription by empirical frequency + shape.

---

### Q10 — Do we emit text frames at the start, middle, or end of output?

Authors have a choice of where in the output text to append the frame. Options:
- **End (recommended):** simplest; `text + frame` in the Output Modifier.
- **Start:** frame appears before visible text. Risk: might interact oddly with text trimming by AI Dungeon.
- **Inline (mid-sentence):** possible but no benefit, adds chance of interfering with word-boundary logic elsewhere.

**Preferred:** End. Document as the canonical pattern; Library's `frontierAppendTextFrame(text)` helper enforces it.

**Resolution path:** Phase 1B manual test confirms end-placement round-trips through AI Dungeon's text pipeline intact. If not, try start-placement as a fallback.

---

### Q11 — Text frame placement when the script returns an empty string

Edge case: the script might return an empty `text` from `onOutput` (e.g. suppressing output). Should we still emit the frame? If yes, the frame stands alone as the "turn's output." Will AI Dungeon render that as an empty turn (bad) or suppress it (fine)?

**Resolution path:** Phase 1B: test empty-output-with-frame behavior. If AI Dungeon renders it as an empty turn, the Library should refuse to emit a frame on empty output and log a warning.

---

## Follow-up work (post-MVP, explicitly scoped out)

| Item | Priority | Rough estimate | Depends on |
|------|----------|---------------|------------|
| **Schema compression for text transport** | High | Medium | MVP shipped; Scripture in production |
| `story-card-scanner.js` migration to card-stream | High | Medium | Phase 1A complete |
| Codec upstream tracking process (re-port runbook) | High | Small | Phase 1B complete |
| First real capability module (likely WebFetch) | High | Medium | MVP released |
| GraphQL write path hardening (auth robustness) | Medium | Medium | MVP released; observed failure modes |
| Registry UI + curated module catalog | Medium | Large | WebFetch shipped (proves there's demand) |
| Sandboxed user scripts | Low | Very large | Security review |
| Inter-module calls | Low | Small | At least two real modules exist |
| Debug inspector UI | Medium | Medium | Phase 2 complete |
| Clipboard "copy without Frontier metadata" | Low | Small | Quarterly polish |
| Per-module permission prompts | Medium | Medium | Registry exists |
| Mobile APK parity testing | High | Small–Medium | BD V2 Android builds |

## Questions for later that need USER input, not implementation

- Do we want Frontier modules to be able to prompt the user for permission before a sensitive action (network fetch, clipboard read)? If so, how should that UI look? (Native browser permission prompts vs in-BD modal vs implicit trust for built-ins only.)
- Do we want Frontier modules to be able to render their own UI outside of Scripture's widget bar? (Future Dashboard module that overlays a full sidebar, etc.)
- Should the BetterRepository host a module catalog even in MVP (just as static documentation), or wait until the install flow exists?
- Naming: is the umbrella still "BetterScripts" in any user-facing sense, or fully "Frontier"? (Current plan: fully Frontier. Confirm before rewriting guides.)
- Should the global invisible-text toggle default to on or off? (Current plan: on. Users who care can disable; most won't think about it.)
- If a collaboration with Robyn on a framework-agnostic bundle of her codec becomes viable (decision #10 option 4), would we switch to that? Current plan manually ports; it would be a net simplification if the upstream offered a pre-bundled release.
