# Moonlit Mafia – Automation Test Plan

Last updated: 2026-01-11

## Goals

- Provide a reliable, repeatable end-to-end (E2E) automation suite that can simulate a full game cycle.
- Cover critical flows (lobby → start → night → day → end) plus edge cases.
- Keep selectors stable (prefer `data-testid` / `data-*` attributes) to avoid brittle UI tests.

## Non-goals

- Load/performance testing.
- Pixel-perfect visual regression.
- Deep unit testing of game logic (handled by TypeScript/unit tests if/when added).

## Current state (repo)

- Automation lives in `tests/automation/`.
- Stack:
  - `pytest`
  - `playwright` (sync API)
  - A helper dev-server context manager in `tests/automation/server.py` that runs `npm run dev` on a fixed port.
- Existing coverage:
  - `tests/automation/moonlit_mafia_smoke.py`: creates a lobby, joins players, readies up, starts game, posts a chat.
  - `tests/automation/test_game_flow.py`: a couple of pytest flows (ready gating + a day-vote flow).

## Known gaps / likely breakages

- Some flows require selecting a specific player in Test Mode (“view as”). Automation uses:
  - `[data-testid="player-row"][data-player-name="..."]` (added to `components/game/players-panel.tsx`).

Current decisions:
- Readiness toggling uses `data-testid="ready-toggle"` on the lobby Ready button.
- Host controls automation switches the desktop utility panel via `data-testid="utility-tab-host"`.
- Join flow no longer depends on `player-row` selectors.

- The lobby code UI is rendered inside `[data-testid="game-code-display"]` as separate elements (label + code + copy button). Automation must extract just the code value (not the entire container text).

- Firestore payloads must not include `undefined` values (e.g., inside `arrayUnion(...)`). Automation will surface these quickly as join/start actions can fail if any persisted field is `undefined`.

## Prerequisites

- Node deps installed (`npm install`) and `.env.local` configured for Firebase.
- Python env (suggested):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r tests/automation/requirements.txt
python -m playwright install
```

## How we will run automation

### Option A: Let tests spawn a dev server (default for pytest)

- `tests/automation/test_game_flow.py` uses `dev_server()` via a `base_url` session fixture.
- Env:
  - `MAFIA_TEST_PORT` (default `4300`)

Notes:
- The automation dev server helper now auto-selects the next available port if the preferred port is already in use (to avoid `EADDRINUSE` failures).

### Option B: Point at an already-running server

- For ad-hoc runs (like `moonlit_mafia_smoke.py`) you can pass `--base-url`.

## Test architecture (target)

- `tests/automation/pages/…`: Page objects for core screens (Lobby New, Lobby Join, Game Room).
- `tests/automation/flows/…`: High-level flows (create lobby, join players, ready, start, advance phases, vote, night actions).
- `tests/automation/selectors.py`: Central place for testids and robust locators.
- `tests/automation/scenarios/…`: Scenario-level tests (pytest) that compose flows.

## Scenarios (initial comprehensive list)

### Lobby

- S1: Host cannot start until all players are ready.
- S2: Player can toggle ready/unready.
- S3: Lobby code is displayed and copy action does not break UI.
- S4: Host can restart lobby.

### Core full-cycle

- S5: Minimum-player full cycle: lobby → start → at least one day vote → elimination → end state.
- S6: Archive game is available at end and returns non-error UI.

### Day voting

- S7: Player can vote and withdraw.
- S8: Votes tally updates in UI.
- S9: Tie behavior (if supported): verify UI shows tie/leader correctly.

### Night actions

- S10: Mafia vote UI is usable when mafia stage is active.
- S11: Doctor save UI is usable during doctor stage.
- S12: Detective investigation UI is usable during detective stage.
- S13: Detective can skip (if enabled) and the UI reflects the skip.

### Edge cases

- S14: Eliminated players cannot vote during day.
- S15: Spectators never block readiness gating.
- S16: Host advancing phases respects constraints (e.g., cannot advance day when elimination pending).
- S17: Chat works across phases and across multiple sessions.

## Determinism strategy

Because roles are assigned dynamically, scenario tests must either:

- Use host-only “peek roles” / reveal mechanics (if available) and then adapt actions based on discovered roles, OR
- Run in a deterministic test configuration (preferred long-term) where roles can be fixed for automation.

This plan will start with adaptive tests (read roles and branch) and evolve toward deterministic fixtures if the product supports it.

## Pass/fail criteria

- Each scenario must:
  - Create a fresh lobby/game code.
  - Avoid relying on prior state.
  - Finish within a bounded timeout.
  - Produce actionable failure output (URL + screenshot/HTML snippet + console logs when possible).

## Instrumentation & artifacts

- On failure, capture:
  - Page URL
  - Screenshot
  - DOM snapshot (truncated) or Playwright trace (optional)
  - Browser console errors

## Cleanup / machine-safety rules

- Always close Playwright contexts/pages in `finally` blocks.
- Always tear down the spawned Next.js dev server even when tests fail:
  - The helper runs the server in its own process group and kills the full group on teardown.
  - This avoids orphaned `next dev` child processes that can keep CPU pegged and make the machine unresponsive.

## Next implementation steps

1. Stabilize selectors used by Python tests (decide: update test locators vs restore `data-testid` hooks).
2. Introduce page objects + flows to reduce duplication.
3. Implement S1–S7 first (fast, stable), then night-action scenarios and end-to-end full-cycle scenarios.
4. Add CI-friendly command(s) and keep runtime under control.
