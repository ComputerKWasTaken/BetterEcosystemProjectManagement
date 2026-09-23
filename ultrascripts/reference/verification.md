# Verification Reference

## Automated Baseline

The repository smoke suite at
`../../../BetterDungeon/tests/smoke/` checks release version parity, extension
package boundaries, Android runtime source resolution, and the absence of
tracked build or signing output.

Run `build.ps1 test` for the smoke suite. Run `build.ps1 all` to also package
the extension and build the Android debug APK. GitHub Actions runs the same
quality gate on every push and retains both artifacts for review.

Gradle validates Android asset composition as part of the debug build. The
quality gate makes no authenticated provider or AI Dungeon request.

## Manual Review

Use focused browser and Android checks for behavior the automated baseline
cannot establish, including live AI Dungeon DOM changes, provider interaction,
keyboard and touch behavior, and platform-specific UI. Record the scope and
outcome when the review informs a release, confirmed fix, or contract change.

## Testing Boundary

A comprehensive live-browser, Playwright, or simulated-DOM framework is not
planned. AI Dungeon's product surface changes too frequently for that coverage
to justify its implementation and maintenance cost. Add isolated deterministic
automation only for a small, stable, high-value contract the existing smoke
checks cannot protect.

The author templates under
`../../../BetterDungeon/examples/aid-scripts/` remain examples, not active test
suites.
