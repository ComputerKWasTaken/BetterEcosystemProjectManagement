# Project Roadmap

## Portfolio Direction

BetterDungeon v2.1 and Chronos V2 are shipped. BetterDungeon stays in
maintenance while Stateboy moves through its first dedicated release. Brainiac
is the next project to reassess after Stateboy; a private prototype exists,
but it does not yet have an approved release scope.

Chronos V2's seasonal weather update is published in AI Dungeon and
BetterRepository. Its [release record](../releases/chronos-weather.md) links the
sources and verification; the script contract describes the current behavior.

## Now: Stateboy

Stateboy is the only active dedicated release project. Its source is an
unpublished BetterRepository preview; copy and download remain withheld. The
current implementation already supports editable state cards, AI `set` updates, setup
guidance, State Directives, change logging, and Widget presentation.

The first release should finish the useful core loop:

1. Make AI prompt construction honor the executor's advertised character
   budget. Keep the shared executor limit unchanged unless live evidence shows
   a separate increase is needed.
2. Add guarded AI `add` and `remove` operations, with confidence controls,
   protected states, bounded batches, and clear change records.
3. Validate manual edits, recovery, provider limits, browser and Android
   behavior, and the final author-facing flow.
4. Align BetterRepository metadata and documentation, then publish the exact
   reviewed raw-script source.

The [Stateboy release plan](./stateboy.md) tracks these milestones. The
[product and technical design](../design/stateboy-design.md) preserves detailed
behavior requirements and implementation context.

## Next: Brainiac

Brainiac has a private prototype in
`../../../BetterDungeon/examples/aid-scripts/brainiac-prototype/`. After
Stateboy ships, decide whether Brainiac should become a release project, what
problem and users it should target, and what evidence would justify publishing
it. Do not expand the prototype before that scope decision.

## Ongoing: BetterDungeon Maintenance

Handle confirmed defects and necessary contract updates through the existing
quality gate. Treat new features, providers, or infrastructure as separately
scoped work.

## Later Work

Stateboy generation, cleanup, undo/redo, and slash commands are candidates for
a later iteration. Revisit them after the first release provides usage
feedback. No other feature project is currently committed.

## Planning Rules

- Keep one active feature release at a time.
- Separate current status, release scope, technical design, and shipped history.
- Promote work from a later list only after writing its user problem, release
  boundary, and exit criteria.
- Keep implementation details in the design or reference docs; keep this page
  focused on sequence and priority.

## Shipped History

- [BetterDungeon v2.1 release record](../releases/betterdungeon-v2.1.md)
- [Chronos V2 seasonal weather update](../releases/chronos-weather.md)
