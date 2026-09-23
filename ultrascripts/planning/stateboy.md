# Stateboy Release Plan

## Status

Stateboy is the active feature project. It has a substantial working
implementation, but remains unpublished in BetterRepository. Copy and download
are intentionally withheld until the release gate below is met.

The detailed product decisions and current implementation behavior are in the
[Stateboy product and technical design](../design/stateboy-design.md). This
page tracks only remaining release work.

## Release Goal

Publish Stateboy as a reliable, user-editable state tracker that can set, add,
and remove states from story evidence while keeping the Stateboy card
authoritative and understandable.

## Existing Foundation

The current source already provides:

- Stateboy, Settings, and Guide cards, with manual editing as the source of
  truth;
- typed state parsing, shorthand State Directives, and Context-safe injection;
- asynchronous Ultrascripts AI setup and readiness guidance;
- AI `set` updates with type, confidence, and read-only checks;
- bounded change history and Widget presentation; and
- protection against stale asynchronous results overwriting newer manual edits.

The four source files live in
`../../../BetterRepository/src/data/raw-scripts/` under `library/`, `input/`,
`context/`, and `output/`.

## Remaining Work

### 1. Finish prompt budgeting

- Build within the `promptMaxChars` advertised by `ai.status`, with a safe
  margin and a fallback for older module responses.
- Prioritize instructions, the complete state sheet, recent output, and
  recent changes; report truncation clearly in Debug Mode.
- Keep the BetterDungeon executor's shared prompt limit unchanged unless live
  testing shows that Stateboy needs a separately reviewed increase.

### 2. Add guarded AI `add` and `remove`

- Extend settings and the response schema for adding and removing states.
- Apply bounded, ordered operations; reject duplicates, invalid targets,
  disabled operations, and changes to locked or important states.
- Use separate confidence thresholds for set, add, and remove; preserve
  manual-edit authority and meaningful change records.
- Update the generated Guide and the author-facing contract.

### 3. Verify the release candidate

- Check missing, stale, and recovering Ultrascripts/AI/Widget capabilities.
- Verify setup guidance follows the selected provider reported by `ai.status`
  instead of assuming Gemini.
- Check existing-state updates, add/remove limits, confidence thresholds,
  important/locked states, manual edits, and delayed AI responses.
- Check long state sheets and histories against the advertised prompt budget.
- Review Context injection, Widget behavior, and actual AI Dungeon behavior on
  representative browser and Android environments.
- Resolve any mismatch between the product design, source, and public claims.

### 4. Prepare and publish

- Update BetterRepository's Stateboy entry, info dump, and author guidance.
- Keep copy/download disabled until the reviewed source and documentation
  agree.
- Verify the published raw script matches the reviewed four-file source.
- Publish Stateboy as its own release and record the shipped scope here.

## Release Gate

Publish when:

- the normal story loop remains usable while asynchronous AI work is pending;
- AI updates can set, add, and remove states safely and within bounded limits;
- user edits remain authoritative, and important/locked protections hold;
- setup failures and recovery are clear without damaging the Stateboy card;
- prompts stay within the advertised executor budget;
- the source and public instructions agree; and
- the release candidate passes the focused live review above.

## Deferred Until After the First Release

Automatic initial generation, user-triggered generation, cleanup jobs, slash
commands, and undo/redo are not first-release gates. Reassess them after
Stateboy has real usage feedback; do not expand the release by default.
