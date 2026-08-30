# Navigator Auto Mode — Implementation Plan

Status: **Planned for V3.0. Not yet implemented on either platform.**

This document plans the V3.0 change to Navigator's application model: changes
apply **automatically by default**, with the player kept fully informed through
concise change cards. It covers both the browser extension (PC) and the Android
client (Mobile).

## 1. Concept

Thorough live testing has shown Navigator to be consistently reasonable and
non-destructive when editing adventures. AI Dungeon's mutable surface is small,
simple, and cohesive — plot components and story cards, not code — so any
capable model makes solid, logical edits. Voyage's Studio system uses the same
model: changes are auto-approved and the user is simply told what's different.

The V3.0 mentality is therefore: **let the player course-correct when
necessary, not approve presumptively.**

- **Auto mode (default).** Navigator applies every validated change
  automatically during the turn — no Apply button, no approval step. Each
  applied change is reported in the transcript as a concise change card the
  player can expand to see exactly what changed.
- **Review mode (opt-out).** The existing per-change approval flow, kept for
  players who want it. Pending cards with Apply/Reject, exactly as today.
- **Read-only mode.** Unchanged. Removes mutation tool definitions entirely
  and blocks all writes. Read-only overrides both modes.

What does **not** change:

- Navigator stays player-initiated. Auto mode applies only changes produced by
  a turn the player started; there is no scheduled or unattended execution.
- The full verified-mutation safety pipeline is preserved per
  [`navigator-mutation-contract.md`](./navigator-mutation-contract.md):
  stable-ID and current-value preconditions, compare-before-write hashes,
  serialized GraphQL writes, and mandatory server read-back before a change is
  reported as applied.
- Apply remains a runtime action, never a model-callable function. In Auto
  mode the *runtime* auto-applies validated proposals; the model still cannot
  invoke writes directly.
- Story Card deletion keeps its explicit irreversible labeling on the change
  card.

## 2. Behavior Specification

### Auto mode turn flow

1. The model emits a mutation proposal tool call (unchanged five-tool set).
2. The runtime validates it exactly as today (preconditions, hashing,
   normalization).
3. Instead of parking the proposal as `pending`, the runtime queues it for
   automatic application: `queued → applying → applied` (or
   `conflict` / `error`), serialized with any other in-flight write.
4. Server read-back verifies the write; the change card then renders as
   **Applied** with the before/after diff available on expand.
5. The tool result returned to the model states the change was applied (or
   failed and why), so the model narrates accurately.

Failure handling is unchanged in substance: `conflict`, `error`, and precondition
mismatches surface on the change card with the existing messaging. Auto mode
never retries a conflicted write on its own; the model (and player) see the
conflict and decide.

### Course correction

The player stays in the know and can react:

- Every applied change remains visible in the transcript as a change card with
  the full before/after values on expand.
- The player can ask Navigator to revert or adjust in plain chat; the captured
  before-values on the card make "undo that" a well-grounded request the model
  can execute with a normal follow-up mutation (per the restoration recipes in
  the mutation contract). Card deletion remains the one non-restorable case
  and keeps its irreversible warning.
- Switching to Review mode or Read-only mode takes effect immediately for
  subsequent turns.

### Mode setting

- New per-adventure Navigator setting `applyMode: 'auto' | 'review'` with
  `'auto'` as the default, stored alongside the existing per-adventure
  settings (which already carry `readOnly`).
- Global default in the popup settings; per-adventure override in the drawer
  settings, mirroring how Read-only is layered today.
- Migration: existing users get Auto mode on upgrade (it is the new default);
  no stored value is rewritten. Read-only values are untouched.
- Primer/system-instruction update: in Auto mode the model is told its
  accepted changes apply immediately and that it should state clearly what it
  changed; the Review-mode guidance and `READ_ONLY_GUIDANCE` remain for their
  modes.

## 3. Change Card Redesign

The current proposal cards are heavyweight approval surfaces: header, reason
paragraph, full before/after blocks always expanded, warning rows, and an
action row. In Auto mode most of that is noise. The V3.0 card is redesigned to
be concise and visually consistent with the tool usage indicators (the Tool
Trail rows):

- **Collapsed by default**, one row: action verb + target
  (e.g. "Modified · Plot Essentials", "Created · Story Card: Kara"), a compact
  status chip (Applied / Applying… / Conflict / Failed / Needs approval), and
  an expand affordance.
- **Expanded**: the reason line and the before/after comparison, reusing the
  existing safe-DOM value rendering (no `innerHTML`, text-only values).
- Deletion cards carry the irreversible warning in both states.
- Review mode uses the same compact card with Apply/Reject in the expanded
  state, so the two modes share one component and one stylesheet.
- Status vocabulary stays the existing lifecycle set (`queued`, `applying`,
  `applied`, `rejected`, `conflict`, `error`, `expired`; `pending` remains for
  Review mode).

## 4. PC Implementation (BetterDungeon)

| Area | File | Change |
|---|---|---|
| Session/settings | `services/navigator/session.js` | Add `applyMode` to `DEFAULT_NAVIGATOR_SETTINGS`, per-adventure resolution (as `readOnly` does), and auto-apply orchestration: on validated proposal registration in Auto mode, enqueue `applyProposal` through the existing serialized write path |
| Mutation pipeline | `services/navigator/mutations.js` | No contract change. Ensure proposal registration exposes a clean "validated, ready to apply" state the session can auto-trigger; keep preconditions, serialization, and read-back intact |
| System guidance | `services/navigator/primer.js` | Mode-aware mutation guidance (auto vs. review vs. read-only) |
| Drawer UI | `features/navigator_feature.js` | Replace `createProposalCard` with the compact change card (collapsed/expanded states, status chips, Review-mode buttons in expanded state); add the mode control to the drawer settings |
| Styles | `styles.css` | Replace `.bd-navigator-proposal-*` block with the compact card styles, aligned with the tool-indicator visual language; tokens only |
| Popup | `popup.html` / `popup.js` / `popup.css` | Global Auto/Review default control next to the existing Navigator settings; hide the Artisan teaser card (see §6) |
| Hydration | `services/adventure-write-hydration.js` | Unchanged behavior; verify applied-change hydration paths still fire when writes originate from auto-apply |
| Tests | `tests/navigator-settings-contract.test.js`, `tests/adventure-write-hydration-contract.test.js`, new `tests/navigator-auto-apply-contract.test.js` | Settings resolution and migration for `applyMode`; auto-apply lifecycle (queued/applied/conflict/error), serialization, read-back, Read-only supremacy, Review-mode pending flow unchanged |

## 5. Mobile Implementation (BetterDungeon-Mobile)

Mobile mirrors the PC runtime under
`app/src/main/assets/betterdungeon/`, so the same changes land in the mirrored
files:

| Area | File | Change |
|---|---|---|
| Session/settings | `services/navigator/session.js` | Same `applyMode` setting and auto-apply orchestration as PC |
| Mutation pipeline | `services/navigator/mutations.js` | Same as PC |
| System guidance | `services/navigator/primer.js` | Same as PC |
| Overlay UI | `features/navigator_feature.js` | Compact change card adapted for touch: full-width rows, tap to expand, comfortable hit targets; mode control in the overlay settings sheet |
| Styles | `styles.css` | Mirrored compact card styles |
| Popup | `popup.html` / `popup.js` / `popup.css` | Same global mode control; hide the Artisan teaser card (see §6) |
| Tests | `tests/navigator-proposal-lifecycle-contract.test.js`, `tests/navigator-mutation-contract.test.js`, `tests/navigator-options-contract.test.js` | Extend for the auto-apply lifecycle and mode setting; keep the existing Review/Read-only assertions passing |

Mobile-specific care:

- Auto-apply runs during a streaming turn; Android backgrounding, activity
  destruction, and Back-navigation cleanup must either finish or cleanly fail
  the in-flight serialized write, never leave a proposal stuck in `applying`.
- Touch UI has no hover; the collapsed card must communicate status without
  hover affordances.
- Keep every shared runtime file behaviorally aligned with PC per the standing
  maintenance rule.

## 6. Artisan Teaser Hiding (both platforms)

Artisan's inclusion is undecided; the teaser is hidden, not deleted, so it can
be restored if Artisan ships.

- PC: remove/comment the Artisan teaser card in `popup.html`
  (`data-feature="artisan"` article and the header mention), its `popup.css`
  rule, and the "Coming later: Artisan" line in `README.md`.
- Mobile: the mirrored `popup.html` article and `popup.css` rule under
  `app/src/main/assets/betterdungeon/`.

## 7. Build Order

1. **PC runtime:** `applyMode` setting, resolution, and auto-apply
   orchestration in `session.js`; primer guidance; durable contract tests.
2. **PC UI:** compact change card, drawer mode control, popup default control,
   styles.
3. **Mobile runtime + UI:** mirror 1–2 into the Android asset tree with the
   touch and lifecycle adaptations above; extend the Mobile contract suites.
4. **Artisan teaser hiding** on both platforms (independent; can land first).
5. **Live verification:** Auto mode application across all five mutation
   kinds, conflict and error surfacing, Review mode regression, Read-only
   supremacy, chat-driven revert of an applied change, and Android
   backgrounding during an auto-apply.

## 8. Open Questions

- Whether auto-applied Story Card **deletions** should get any extra friction
  (e.g. Auto mode applies them but the card renders pre-expanded with the
  irreversible warning). Current plan: no extra approval step, per the Auto
  mode concept; the warning stays prominent.
- Whether the collapsed card should show a one-line change summary in addition
  to action + target, at the cost of density.
