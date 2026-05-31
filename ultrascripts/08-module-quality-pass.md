# 08 - Module Quality Pass

> Final module-by-module polish pass before building production example scripts.

## Purpose

Ultrascripts is shipped and documented. This pass is not about proving the system
works from scratch again; it is about making each first-party module feel good
enough to showcase in real scripts.

The output of this pass should be a short list of focused fixes or refinements
per module, followed by complete example scripts that demonstrate the polished
behavior.

## Working Order

1. `scripture`
2. `webfetch`
3. `ai`
4. `sdk`
5. `clock`
6. `geolocation`
7. `weather`
8. `network`
9. `system`

Scripture and WebFetch go first because they have the most user-facing surface:
Scripture is what players see, and WebFetch is the most consent/error-prone ops
module.

## Review Questions

For each module, answer these before writing example scripts:

- Does the module API match the public guide and SDK helper expectations?
- Does the module degrade cleanly when disabled, unconfigured, denied, offline,
  or unsupported?
- Are errors clear enough for a scenario author to branch on?
- Does the result shape expose the fields authors actually need?
- Does the module behave well on mobile and narrow layouts where relevant?
- Is the regression script still representative of how authors should use it?
- Is there anything embarrassing or confusing that would show up in a showcase
  script?

## Module Targets

### Scripture

- Review mobile and narrow-sidebar widget layout.
- Confirm widget density, scrolling, compact mode, and long labels behave well.
- Improve any awkward default styling before using Scripture in showcase scripts.
- Re-check interaction events and `ackSeq` pruning with the current helper.

### WebFetch

- Review consent prompts, denied-origin behavior, timeouts, and blocked target
  messaging.
- Confirm `fetch` and `search` errors are easy for scripts to branch on.
- Review response truncation and header/body reporting for author usefulness.
- Decide whether any common public-data workflow needs a better helper pattern.

### AI

- Re-check configured/unconfigured flows, cost-cap errors, and free-model defaults.
- Confirm docs and examples consistently read `data.text` or
  `data.message.content`.
- Ensure complete scripts never assume paid models or same-turn responses.

### SDK

- Confirm `sdk.config` exposes enough sanitized setup information for enhanced
  and required scripts.
- Keep heartbeat discovery and SDK metadata responsibilities separate.

### Clock

- Confirm `now`, `tz`, and `format` cover the time-of-day use cases planned for
  examples.
- Re-check timezone labels and local/ISO fields for clarity.

### Geolocation

- Review permission-first flows, denied/unsupported behavior, and coordinate
  accuracy naming.
- Pair with Weather only after the permission story is clean.

### Weather

- Confirm fixed-place and coordinate-based flows both work cleanly.
- Review `current` and `forecast` field names for scenario-author ergonomics.

### Network

- Confirm online/offline and quality hints degrade across browsers.
- Keep it scoped to branching and fallbacks, not hard gating.

### System

- Review `deviceClass`, viewport fields, and power support on desktop/mobile.
- Use it to improve layout choices, never as a brittle user-agent branch.

## Exit Criteria

This pass is done when:

- every module has either "no change needed" or a small concrete fix list
- any accepted fixes are implemented and regression-checked
- BetterRepository guides still match the implementation
- the Enhanced and Required templates remain aligned with the SDK helper contract
- the next task can cleanly move into polished example-script creation

