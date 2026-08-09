# Navigator Mutation Contract

Status: **Verified on 2026-08-08 against a disposable AI Dungeon adventure.**

This is the research contract for Navigator Phase 7A. It records AI Dungeon's
native GraphQL write behavior and the safety rules derived from live probes. It
does not authorize production writes and does not add a mutation API to
BetterDungeon.

Sanitized machine-readable request fixtures live in
[`navigator-mutation-fixtures.json`](./navigator-mutation-fixtures.json). They
contain no credentials, cookies, authorization headers, or user identifiers.

## Research Adventure and Baseline

The disposable adventure remains intact at short ID `4x41Zd-6ZXs0`. Its
research baseline was:

| Field | Baseline |
|---|---|
| Adventure ID | `209767557` |
| Plot Essentials (`memory`) | `NAV_MUTATION_LAB_PLOT_BASELINE_20260808` |
| Author's Note | `NAV_MUTATION_LAB_AUTHOR_BASELINE_20260808` |
| Third person | `true` |
| AI Instructions | `{ "type": "custom", "custom": "NAV_MUTATION_LAB_AI_BASELINE_20260808" }` |
| Story Summary | `NAV_MUTATION_LAB_SUMMARY_BASELINE_20260808` |
| Story-card instructions | empty string |
| Story-card story information | empty string |
| Image style | empty string |
| Memories | empty array |
| Last summarized/memory action IDs | empty strings |

The new quick-create adventure had no playable story actions. Its two research
cards were:

| ID | Type | Title | Triggers | Entry | Description |
|---|---|---|---|---|---|
| `924501899` | `character` | `NAV_MUTATION_LAB_CARD_ALPHA` | `navlab-alpha, sentinel-alpha` | `NAV_MUTATION_LAB_CARD_ALPHA_VALUE_BASELINE` | empty |
| `375971683` | `location` | `NAV_MUTATION_LAB_CARD_BETA` | `navlab-beta, sentinel-beta` | `NAV_MUTATION_LAB_CARD_BETA_VALUE_BASELINE` | empty |

The extension-managed `ultrascripts:heartbeat` card was present but excluded
from mutation probes. Its value and `updatedAt` advance normally while
BetterDungeon is running, so it is not a stable baseline field.

At the end of the research pass, both Plot/state sentinels and both research
cards matched this baseline. The temporary create/delete card was absent.
Expected timestamps advanced, and the heartbeat card continued updating.

## Confirmed Input Schema

Live schema introspection returned:

```graphql
input AdventureStateInput {
  shortId: String!
  state: JSONObject
}

input AdventurePlotInput {
  shortId: String!
  memory: String
  authorsNote: String
  thirdPerson: Boolean
}

input UpdateStoryCardInput {
  id: String!
  shortId: String!
  contentType: String!
  type: String!
  title: String!
  description: String!
  keys: String!
  value: String!
  useForCharacterCreation: Boolean!
}

input DeleteStoryCardInput {
  id: String!
  shortId: String!
  contentType: String!
}
```

All Story Card update fields are required. A deliberate partial update with
only `id`, `shortId`, `contentType`, and `value` failed GraphQL validation with
HTTP 400 before the resolver ran. Therefore card updates are full-record writes:
read the current card, overlay intended changes, compare, then submit every
field.

## Adventure State Writes

AI Dungeon's UI uses `UpdateAdventureState`:

```graphql
mutation UpdateAdventureState($input: AdventureStateInput) {
  updateAdventureState(input: $input) {
    adventure {
      id
      state {
        instructions
        storySummary
        storyCardStoryInformation
        storyCardInstructions
        imageStyle
      }
      editedAt
    }
    message
    success
  }
}
```

The UI sends its complete known mutable state plus a `changedFields` array. For
an AI Instructions edit, the relevant variables were:

```json
{
  "input": {
    "shortId": "4x41Zd-6ZXs0",
    "state": {
      "changedFields": ["instructions"],
      "instructions": {
        "type": "custom",
        "custom": "NAV_MUTATION_LAB_AI_PROBE_20260808"
      },
      "storySummary": "NAV_MUTATION_LAB_SUMMARY_BASELINE_20260808",
      "storyCardStoryInformation": "",
      "storyCardInstructions": "",
      "imageStyle": ""
    }
  }
}
```

Verified semantics:

- `state` is merged, not replaced. A direct request containing only a new
  `storySummary` preserved AI Instructions and every surrounding readable state
  field.
- `changedFields` is a UI coordination marker, not a resolver requirement. The
  partial request omitted it and succeeded.
- The authoritative AI Instructions write representation is the JSON object
  `{ type: "custom", custom: <string> }`. It round-trips through
  `Adventure.state.instructions` in that shape.
- Story Summary is a plain string at `Adventure.state.storySummary`.
- The mutation returns the updated state slice and a new `Adventure.editedAt`.

Although merge behavior is verified, production restoration should submit the
captured five-field mutable state snapshot. That makes undo explicit and avoids
depending on future server changes to partial merge behavior.

## Plot Writes

AI Dungeon's UI uses `UpdateAdventurePlot`:

```graphql
mutation UpdateAdventurePlot($input: AdventurePlotInput) {
  updateAdventurePlot(input: $input) {
    adventure { id thirdPerson memory authorsNote editedAt }
    message
    success
  }
}
```

The UI normally sends all three fields. Direct read-back probes established:

- Omitted fields remain unchanged. Sending only `memory` preserved
  `authorsNote` and `thirdPerson`.
- Empty strings clear string fields. Both `memory: ""` and an empty Author's
  Note were visible as empty after the mutation, then restored successfully.
- Removing the Third Person Plot Component sends `thirdPerson: false`; adding it
  again sends `true`.
- Each successful write returns the current three-field plot slice and changes
  `Adventure.editedAt`.

## Story Card Upsert and Delete

AI Dungeon does not use a separate create mutation in the observed UI. Creation
and editing both call `updateStoryCard`; a new client-generated numeric string
ID makes the operation an upsert. The UI used two operation names over the same
document (`UseAutoSaveStoryCard` and `SaveQueueStoryCard`):

```graphql
mutation UseAutoSaveStoryCard($input: UpdateStoryCardInput!) {
  updateStoryCard(input: $input) {
    success
    message
    storyCard {
      id type title description keys value
      useForCharacterCreation updatedAt
    }
  }
}
```

Observed create behavior:

- The UI generated ID `536603098`, submitted every non-null field, and the new
  card appeared immediately with that ID.
- `type`, `title`, `description`, `keys`, and `value` may be empty strings at the
  value level, but they may not be omitted or `null`.
- `contentType` was `"adventure"`; `useForCharacterCreation` was `false`.
- Editing returns the complete card and a new `updatedAt`.
- Finishing an edit can cause the UI to submit both autosave and save-queue
  operations with the same payload. Navigator should issue one intentional
  request, not emulate this UI duplication.

Deletion uses:

```graphql
mutation UseDeleteStoryCard($input: DeleteStoryCardInput!) {
  deleteStoryCard(input: $input) {
    success
    message
    storyCard { id deletedAt }
  }
}
```

Deleting the temporary card returned its ID plus a non-null `deletedAt`, removed
it from the visible list, and reduced the card count immediately. The API did
not expose an undelete or restoration operation during this capture.

The exact client-side new-ID generation algorithm was not researched. A future
implementation must either reproduce a collision-resistant accepted ID format
or find a server-generated creation path before enabling card creation.

## Refresh and Timing Evidence

Observed request-to-response times on the research run were approximately:

| Operation | Time |
|---|---:|
| `updateAdventurePlot` | 94-130 ms |
| `updateAdventureState` | 160-460 ms |
| `updateStoryCard` | 300 ms |
| `deleteStoryCard` | 150 ms |

Mutation responses contain enough data for immediate cache updates. Plot and
state textareas reflected the new values without a page reload, Story Card
upserts appeared in the list immediately, and deletion removed the card
immediately. Explicit post-mutation GraphQL reads nevertheless matched every
probe and restoration. Navigator must still read back from the server before
declaring a write or undo successful.

## Concurrency Contract

`Adventure.editedAt` advanced on state writes, plot writes, Story Card writes,
and Story Card deletion. It is therefore an adventure-wide marker, not a
resource-specific version. The extension heartbeat can also advance it while a
user is idle. For example, the controlled sequence advanced it from
`2026-08-09T01:27:40.766Z` through state and plot timestamps ending after
`2026-08-09T01:28:20Z`.

Story Card `updatedAt` advances on successful upserts. Card Alpha moved from
`2026-08-09T01:19:42.800Z` to `2026-08-09T01:28:20.205Z` during a full-record
restore, even though most fields were unchanged.

Required compare-before-write policy:

- Plot write: compare `editedAt` and a stable hash over normalized
  `{ memory, authorsNote, thirdPerson }`. Abort on a target-slice hash mismatch;
  tolerate unrelated `editedAt` drift only after re-reading and confirming the
  hash.
- State write: compare `editedAt` and a stable hash over normalized
  `{ instructions, storySummary, storyCardStoryInformation,
  storyCardInstructions, imageStyle }`.
- Card update/delete: compare card ID, `updatedAt`, and a hash over every
  `UpdateStoryCardInput` content field. Because updates are full-record writes,
  any mismatch is a conflict.
- Card creation: assert the chosen ID is absent immediately before the upsert.

## Undo and Restoration Recipes

- Plot/state update: capture the relevant complete before-slice, write the
  change, read back, and store before/after hashes. Undo compares against the
  stored after-hash, writes the before-values, then reads back again.
- Card creation: retain the returned ID; undo calls `deleteStoryCard` with that
  ID and verifies absence.
- Card update: retain the entire prior card; undo performs a full-record
  `updateStoryCard` and verifies all fields.
- Card deletion: retain the complete prior card for possible recreation. No
  undelete contract was observed, so recreation may receive or require a new ID
  and references to the old ID cannot be promised.

## Known Limitations

- This contract was verified against one disposable adventure in the current AI
  Dungeon web UI. GraphQL operation names are client labels; input types and
  resolver behavior are the durable part of the contract.
- The UI's autosave can emit duplicate state or card writes. Production code
  must serialize its own requests and must not rely on UI debounce behavior.
- Deleted-ID reuse remains unresolved; recreation cannot promise the original
  card identity.
- No production mutation method, Navigator tool loop, permission, or write UI was
  added during the Phase 7A research milestone.

## Phase 7C Follow-up

On 2026-08-09 the production implementation resolved the creation-ID gate with
a cryptographically generated nine-digit numeric string, a fresh authoritative
card-list collision check, and up to eight retries. A disposable-adventure probe
successfully created the card, read it back, updated all five player-facing
fields, deleted it, and verified absence. The temporary card was removed and the
research baseline was otherwise restored.
