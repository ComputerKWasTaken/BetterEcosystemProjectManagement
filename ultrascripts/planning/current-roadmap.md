# Ultrascripts Current Roadmap

## Status Snapshot

Ultrascripts is feature-complete for the BetterDungeon V2 launch. Treat the runtime and shipped module set as production-facing infrastructure, not an active construction project.

Completed:

- Core runtime, transport, write path, heartbeat discovery, and state-card dispatch.
- Request/response operations and module registry.
- Popup integration and per-module settings.
- Nine first-party modules with dedicated regression suites.
- Enhanced and Required starter templates.
- BetterRepository public Ultrascripts guide foundation.
- Chromium, Firefox/Gecko, and Android WebView support.
- AI module with stable asynchronous `status`/`query` contract.
- Widget V2 polish pass.
- PC/mobile behavior resynchronization.
- Mobile release-distribution polish.
- Stateboy Required showcase script.

## Active Release Workstream

The remaining work is the paired BetterDungeon V2 and BetterRepository V1.7 launch:

### 1. Polish BetterRepository V1.7

- Refresh public Ultrascripts guides against the live Widget, SDK, template, and mobile contracts.
- Keep the public info dump and guide components aligned.
- Verify the Enhanced and Required templates and Stateboy entry.
- Polish the V1.7 What's New section and release wording.
- Avoid presenting Brainiac or Chronos V2 as shipped.

### 2. Upload BetterDungeon to Firefox Add-ons

- Prepare the Firefox-compatible package and listing copy.
- Upload the extension to Firefox Add-ons.
- Validate installation, popup behavior, content-script behavior, and Ultrascripts on Firefox.
- Record any store-specific compatibility issues before launch.

### 3. Teasers, Bugfixes, and Launch Polish

- Continue Reddit teasers while keeping the messaging accurate.
- Run final regression checks across modules, templates, and examples.
- Fix launch-blocking bugs and compatibility issues.
- Check PC/mobile parity after the final shared-runtime changes.
- Finish release screenshots, README copy, store copy, and changelog wording.

### 4. Release the Paired Launch

- Release BetterDungeon V2.
- Release BetterRepository V1.7.
- Keep official Android APK distribution on the primary BetterDungeon repository.
- Confirm public links and documentation point users to the correct release locations.

## Post-V2

- Build Brainiac as an AI-powered story-card and brain-card management script.
- Build Chronos V2 as a vanilla-safe timekeeper enhanced by Ultrascripts.

## Settled Decisions

- Ultrascripts supports two-way communication.
- Heartbeat is the discovery surface; SDK is metadata/configuration, not discovery.
- Direct `SaveQueueStoryCard` writeback is the production write path.
- Mutation-template priming, Lite/full profiles, and invisible-text transport are retired.
- `ai` is the canonical module id.
- AI Dungeon scripts must expect module responses on later turns.
- The AI module is complete enough for V2 and is not an active rebuild track.
- BetterRepository's paired launch target is V1.7, not V2.

## Intentional Future Work

These are good ideas, but none are required for the paired launch:

- Third-party module registry and sandboxing.
- A richer runtime inspector/debugger.
- Deeper AI provider/backend expansion.
- Full migration of older BetterDungeon Story Card consumers.
- TypeScript/NPM/bundler migration.

## Risks to Keep Visible

- Public examples can drift from the helper/template contract.
- AI queries depend on player API-key setup and should fail closed with actionable errors.
- WebFetch examples must respect consent, blocked targets, and late responses.
- Mobile/PC parity must be checked after final shared-runtime changes.

## Practical Next Action

Start with the BetterRepository V1.7 polish pass. Once its public guides and release wording are ready, move through Firefox publishing, teasers/final polish, and the paired release.
