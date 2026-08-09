# Navigator Phase 7C — Basic Confirmed Mutations

Status: **Complete and live-tested on 2026-08-09.**

Navigator can prepare Plot Component and Story Card mutations, but the model
cannot execute a GraphQL write. Every proposal renders as an extension-owned
change card, and only a direct player click can apply it.

This milestone deliberately uses confirmation without Undo or a durable audit
log. The transcript does not persist actionable proposal records.

## Capability Boundary

The governing invariant is:

> The model may prepare a proposal. Only an explicit player action may apply it.

- Mutation proposals are available by default.
- `betterDungeon_navigator_read_only` is synchronized through extension storage
  and defaults to `false`.
- Read-only mode removes mutation definitions from future provider requests and
  disables pending Apply controls immediately.
- Apply re-reads the setting, active adventure, and mutation target before every
  write, so a stale UI or in-flight mode change cannot bypass the restriction.
- Apply, Reject, and Delete controls are not model-callable tools.
- No mutation is exposed through the Ultrascripts operations dispatcher, and
  the frozen `ai.query` contract is unchanged.

## Proposal Tools

The model-facing registry contains five proposal-only functions:

```text
propose_plot_component_change({ component, content, reason? })
propose_third_person_change({ enabled, reason? })
propose_story_card_create({ type, title, triggers, entry, notes, reason? })
propose_story_card_update({ id, changes, reason? })
propose_story_card_delete({ id, reason? })
```

The four text component identifiers are `ai_instructions`, `plot_essentials`,
`authors_note`, and `story_summary`. Empty content removes a text component.
Third Person uses a boolean.

Story Card updates accept partial changes across the five player-facing fields:
Type, Name, Triggers, Entry, and Notes. The mutation layer overlays those
changes onto a fresh complete record and preserves `useForCharacterCreation`.

Each successful proposal call returns only:

```json
{
  "proposalId": "proposal-...",
  "status": "pending_approval"
}
```

Creating the proposal performs no GraphQL write and does not consume the 16k
Story Card read-tool result allowance.

## Write Mapping

| Player field | GraphQL field |
|---|---|
| Plot Essentials | `AdventurePlotInput.memory` |
| Author's Note | `AdventurePlotInput.authorsNote` |
| Third Person | `AdventurePlotInput.thirdPerson` |
| AI Instructions | `state.instructions = { type: "custom", custom: content }` |
| Story Summary | `state.storySummary` |
| Card Type | `type` |
| Card Name | `title` |
| Card Triggers | `keys` |
| Card Entry | `value` |
| Card Notes | `description` |

Creation and update both use `updateStoryCard`. Creation generates a secure
nine-digit numeric string with `crypto.getRandomValues`, checks it against a
fresh authoritative card list, and retries up to eight times. The accepted ID
format was verified through live create/read/update/delete on the disposable
mutation adventure.

## Approval and Verification

Each proposal card shows its target, inferred operation, reason, and before/after
values. Text is rendered with safe DOM nodes. Deletion has a red **Delete card**
control and states that Navigator cannot undo it.

Apply follows one serialized path:

1. Recheck extension context, Read-only mode, active adventure, and proposal
   status.
2. Re-read the authoritative target.
3. Compare the proposal-time field value, or the complete Story Card content
   plus `updatedAt`, with the current target.
4. Stop without writing and show `conflict` if the target changed.
5. Issue exactly one confirmed GraphQL mutation.
6. Re-read the server state and require it to match the accepted values.
7. Mark the card **Applied** and refresh Navigator context only after successful
   verification.

Duplicate clicks are disabled immediately. Multiple accepted proposals share
one in-memory queue. Pending proposals expire on reload, navigation, transcript
clear, extension invalidation, or an interrupted provider turn. Applied,
rejected, and pending proposal payloads are not durable audit records.

Stable failures include `read_only`, `adventure_changed`, `conflict`,
`mutation_failed`, `verification_failed`, `id_generation_failed`,
`invalid_proposal`, and existing GraphQL availability failures.

## Verification Record

Local smoke coverage exercised:

- all five proposal definitions and mixed read/proposal tool rounds;
- Read-only tool removal and apply-time blocking;
- Plot/state set and clear behavior;
- Story Card creation, complete-record update, field preservation, deletion,
  secure ID format, conflict rejection, and post-write read-back;
- omission of proposal payloads from persisted transcripts.

Live Chromium testing against disposable adventure `4x41Zd-6ZXs0` exercised:

- proposal rejection with authoritative confirmation that no write occurred;
- an Author's Note apply/read-back/restore cycle;
- Story Card creation with all five fields, all-five-field update, and deletion;
- directory coverage changing from 3 to 4 and back to 3 after verified writes;
- disabled duplicate controls, irreversible deletion wording, and clean console
  output.

The disposable adventure ended with its Plot Component baseline restored and
the temporary Story Card absent. Expected timestamps advanced.

## Known Limits

- There is no Navigator Undo or durable mutation audit log in this milestone.
- Story Card deletion is permanent; recreating content cannot promise the old
  card ID.
- Pending proposals are intentionally lost across reloads.
- Firefox/Gecko still requires the manual cross-browser regression pass used for
  the rest of the extension release gate.
