# Moonlit Mafia Gameplay Flow

This document captures the first-pass rules and data requirements for aligning the Moonlit Mafia app with classic social deduction expectations. It focuses on protecting hidden information, guiding players through night actions, and keeping the game host empowered without unfair advantages.

## Core Roles & Responsibilities

- **Host (admin):** Sets up the lobby, starts and advances phases, and may peek at all roles once. Peeking immediately marks the host as "dead" (no longer alive) but leaves administrative controls intact.
- **Mafia:** Coordinate at night to select a target for elimination. All mafia members share vision of each other's votes and the final consensus.
- **Doctor:** Chooses one player each night to protect. Protection nullifies the current kill target if both match.
- **Detective:** Investigates a single player at night to learn whether they are mafia.
- **Villager & Other supporting roles:** Participate in daytime discussion and voting; no special night actions.

## High-Level Phase Loop

1. **Lobby**
   - Players join, choose display names, and ready up.
   - Roles are assigned but hidden from everyone except the owning player.
   - Host may optionally "peek" at roles; doing so flips the host to `isAlive = false` and enables dead-player visibility, effectively removing them from future win conditions.

2. **Night Phase** (structured sub-steps)
   - **Night Stage: Mafia Vote**
     - Prompt all alive mafia members to choose a target. Votes are visible to all mafia in real time.
     - A majority vote locks in the target or, if the timer expires, the most recent consensus is used.
   - **Night Stage: Doctor Save**
     - Doctor selects a player to protect. The choice is private to the doctor.
   - **Night Stage: Detective Investigate**
     - Detective selects a player to investigate. The result (mafia or not) is shown privately after submission.
   - **Night Stage: Resolution**
     - Apply kill minus protection.
     - Mark eliminated player `isAlive = false` and emit a system message. Reveal role to dead players only.
     - Reset night action state and advance to the Day phase.

3. **Day Phase**
   - Alive players discuss and vote to eliminate suspects via existing voting UI.
   - Host (or timer) can advance the phase back to Night once the lynch is resolved.

4. **End Game**
   - When all mafia are eliminated or mafia outnumber villagers, set phase to `ended` and mark status `completed`.

## Data Model Extensions

Introduce the following additions to `MafiaGame`:

```ts
interface MafiaGame {
  ...
  hostPeeked?: boolean;
  nightState?: {
    stage: "idle" | "mafia" | "doctor" | "detective" | "resolution";
    mafiaVotes: Array<{ voterUid: string; targetUid: string; submittedAt: number }>;
    lockedTargetUid?: string | null;
    doctorTargetUid?: string | null;
    detectiveTargetUid?: string | null;
    detectiveResult?: { targetUid: string; isMafia: boolean } | null;
    lastTransitionAt: number;
  };
}
```

Supporting utility types should live alongside existing game types. Initial values when a game is created:

```ts
hostPeeked: false,
nightState: {
  stage: "idle",
  mafiaVotes: [],
  lockedTargetUid: null,
  doctorTargetUid: null,
  detectiveTargetUid: null,
  detectiveResult: null,
  lastTransitionAt: Date.now(),
},
```

## Service Layer Updates

- **createGame:** Initialize the new fields and mark the host as ready + alive.
- **peekAtRoles(gameId, hostUid):**
  - Validate the host is alive and matches `hostId`.
  - Update the host player `isAlive = false`, set `hostPeeked = true`, append a system message advising all players.
- **recordNightAction(gameId, payload):** Provide role-specific endpoints:
  - `submitMafiaVote` accumulates votes and updates `mafiaVotes`, recalculating consensus.
  - `lockMafiaTarget` finalizes `lockedTargetUid` once votes agree or timer expires.
  - `submitDoctorSave` stores `doctorTargetUid`.
  - `submitDetectiveInvestigation` stores `detectiveTargetUid` and computes `detectiveResult`.
- **advanceNightStage(gameId):** Transition the `nightState.stage` field after prerequisites are satisfied, culminating in applying the kill and pushing the phase to day.

## UI Responsibilities

- **Player List:**
  - Reveal roles only if the viewer is the player, the player is dead, or `hostPeeked` and viewer is host (now flagged dead).
  - Add a host-only action button labelled "Peek at roles (you will die)".

- **Night Action Prompts:**
  - Create a `NightActionPanel` component that reads `nightState` and the viewer role to present contextual controls.
  - Mafia view: live list of mafia members with their current votes, plus selection UI for targets.
  - Doctor view: single-select list of alive players.
  - Detective view: single-select list of alive players; after submission show investigation result.
  - Non-action roles: show waiting indicator describing current stage.

- **Phase Management:**
  - Auto-transition to the next `nightState.stage` once all required actions are completed or timers elapse (host can still override via manual phase controls if necessary).
  - Display the current night stage and any resolved outcomes inside `PhaseStatusCard`.

## Open Questions & Next Steps

1. Should mafia kill resolution require unanimous agreement or majority? (Current plan assumes last consensus or majority.)
2. How do we handle multiple doctors/detectives in custom role configurations? (Assume single instances for now; extend later.)
3. Daytime lynch resolution still needs alignment with the new kill rules. (Out of scope for this iteration.)

Implementation will proceed in slices:

1. Update TypeScript types and Firestore service helpers.
2. Adjust lobby UI to hide roles and add the host peek mechanic.
3. Build the night action state machine and supporting UI.
4. Wire transitions and test through manual flows before re-enabling automation.
