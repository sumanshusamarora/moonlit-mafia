# Mafia Game Rules - Complete Rulebook

## Table of Contents
1. [Game Overview](#game-overview)
2. [Roles and Teams](#roles-and-teams)
3. [Game Phases](#game-phases)
4. [Information Visibility](#information-visibility)
5. [Win Conditions](#win-conditions)
6. [Action Resolution](#action-resolution)
7. [Special Rules](#special-rules)

---

## Game Overview

Mafia is a social deduction game where players are divided into two main teams: the **Mafia** (informed minority) and the **Village** (uninformed majority). The game alternates between **Night** and **Day** phases, with players using deduction, discussion, and voting to identify and eliminate opponents.

### Basic Setup
- **Minimum Players**: 4 (enforced: 1 Mafia, 1 Doctor, 2 Villagers)
- **Player Distribution**: Only **ready** players receive roles when the game starts
- **Role Allocation**: Based on ready player count, ensuring minimum 2 villagers always

---

## Roles and Teams

### Mafia Team (Informed Minority)

#### Mafia
- **Objective**: Eliminate all villagers
- **Night Action**: Vote collectively to eliminate one player
- **Information**: Knows all other mafia members from the start
- **Voting**: All mafia must agree on a target (consensus-based)
- **Visibility**: Can see each other's current vote choices in real-time during night phase
- **Allocation**: Always at least 1; increases with player count (1 per 4 players)

### Village Team (Uninformed Majority)

#### Villager
- **Objective**: Eliminate all mafia members
- **Night Action**: None (sleeps through the night)
- **Day Action**: Participate in discussion and voting
- **Information**: No special knowledge
- **Allocation**: Minimum 2 required; fills remaining slots after special roles

#### Doctor
- **Objective**: Protect villagers and eliminate mafia
- **Night Action**: Select one player to protect from mafia elimination
- **Protection Rules**: 
  - If protection matches mafia target, elimination is prevented
  - No limit on consecutive protections of same player
  - Can protect self
- **Information**: Does not learn if protection was successful until day phase
- **Allocation**: 1 if 4+ players (reduced from 6+ based on defaults)

#### Detective
- **Objective**: Identify mafia through investigation
- **Night Action**: Investigate one player to learn their alignment (Mafia/Not Mafia)
- **Investigation Modes**:
  - **Once Per Round** (configurable): Can investigate once every night, unlimited total
  - **Limited Checks** (configurable): Has X total investigations for entire game (default = number of mafia)
- **Result Visibility**: Investigation result revealed privately at end of night
- **Charge Depletion**: When limited checks run out, detective is automatically converted to villager
- **Voluntary Reveal**: Can publicly reveal detective status during day phase (one-time action)
- **Reveal Effect**: Gains credibility but becomes mafia target; loses ability to conceal identity
- **Allocation**: 1 if 6+ players

#### Guardian (Future Implementation)
- **Objective**: Protect village during day voting
- **Special Action**: Can shield one player from day elimination once per game
- **Allocation**: 1 if 8+ players

#### Vigilante (Future Implementation)
- **Objective**: Take justice into own hands
- **Night Action**: Can eliminate one player during night (once per game)
- **Risk**: May accidentally kill a villager
- **Allocation**: 1 if 9+ players

### Neutral Team (Future Implementation)

#### Jester
- **Objective**: Get voted out during day phase
- **Win Condition**: Wins alone if eliminated by village vote
- **Allocation**: 1 if 7+ players

---

## Game Phases

### Lobby Phase

**Duration**: Until host starts game

**Actions**:
- Players join using 6-character game code
- Players toggle ready status
- Host configures game settings:
  - Max players (4-20)
  - Role distribution
  - Phase timers
  - Detective mode (once-per-round vs limited checks)
  - Vote anonymity
  - Voice memos
  - Role reveal on death

**Start Requirements**:
- Minimum 4 ready players
- All players must be ready
- Host clicks "Start Game"

**Role Assignment**:
1. Count ready players only
2. Assign roles based on recommendations for that count
3. Ensure minimum 2 villagers
4. Ensure at least 1 mafia
5. Fisher-Yates shuffle role pool
6. Assign to ready players only (non-ready players have `role: null`)

---

### Night Phase

**Duration**: Configurable timer (default: 3 minutes)

**Sub-Stages** (Sequential):

#### 1. Mafia Stage
- **Active Role**: Mafia members only
- **Action**: Each mafia votes for a target (non-mafia, alive player)
- **Consensus Requirement**: All alive mafia must vote for the same target
- **Visibility**:
  - Each mafia sees all other mafia members' current votes
  - Vote assignments displayed as: `[Mafia Name] → [Target Name]` or `Undecided`
  - Locked when consensus reached
- **UI State**: Shows "Mafia Alignment" panel with real-time vote tracking
- **Advancement**: Automatic when consensus reached OR host manually advances

#### 2. Doctor Stage (if doctor is alive)
- **Active Role**: Doctor only
- **Action**: Select one player to protect (any alive player, including self)
- **Visibility**: Only doctor sees this stage; others see "Waiting for doctor"
- **UI State**: Grid of player buttons; selected player highlighted
- **Advancement**: Automatic when doctor submits choice OR host manually advances

#### 3. Detective Stage (if detective is alive and has charges)
- **Active Role**: Detective only
- **Action**: Select one player to investigate (any alive player except self)
- **Charge Check**:
  - Once-per-round mode: Always allowed (no charge deduction)
  - Limited mode: Requires `detectiveChecksRemaining > 0`
- **Result**: Shown privately to detective as "Mafia" or "Not mafia"
- **Charge Deduction**: If limited mode, reduce `detectiveChecksRemaining` by 1
- **Auto-Conversion**: If charges reach 0, detective becomes villager
- **Visibility**: Only detective sees this stage; others see "Waiting for detective"
- **UI State**: Grid of investigatable players; result displayed in bordered alert
- **Advancement**: Automatic when investigation submitted OR host manually advances

#### 4. Resolution Stage
- **Active Role**: None (automated)
- **Process**:
  1. Check if doctor protection matches mafia target
  2. If match: No elimination
  3. If no match: Eliminate mafia target
  4. Apply detective charge deduction/conversion
  5. Update player `isAlive` status
  6. Store night outcome message
- **Visibility**: All players see "Night outcomes are being applied"
- **Advancement**: Host clicks "Enter Day"

**Eliminated Players**:
- Become observers ("ghosts")
- Can see all roles revealed
- Cannot participate in actions or voting
- Can still chat (unless restricted)

**Commentary/Activity Log**:
- Night starts: "Night has fallen. Mafia, choose your target."
- Mafia consensus: "The mafia has chosen their target."
- Doctor acts: "The doctor is protecting someone."
- Detective investigates: "The detective is investigating."
- Resolution: "Night actions are being resolved..."

---

### Day Phase

**Duration**: Configurable timer (default: 5 minutes)

**Actions**:
- **Discussion**: All alive players discuss and share information
- **Voting**: Each alive player votes to eliminate one player
- **Vote Changes**: Players can change vote any time before phase ends
- **Visibility Rules**:
  - **Anonymous Mode OFF** (default): Every player sees who voted for whom
    - Display format: `[Voter Name] → [Target Name]` with vote count aggregation
    - Shows real-time vote changes
  - **Anonymous Mode ON**: Only vote counts shown per candidate
    - Display format: `[Candidate Name]: X votes`
- **Detective Actions**:
  - Can choose to voluntarily reveal detective status (one-time, irreversible)
  - Reveal sets `detectiveRevealed: true` on player object
  - Gains credibility but becomes obvious mafia target

**Day Phase UI Requirements**:
1. **Vote Transparency** (when anonymous mode OFF):
   - Show who voted for whom
   - Group by candidate with expandable voter lists
   - Update in real-time as votes change
   - Highlight viewer's own vote
   
2. **Activity Commentary**:
   - "Day has begun. Discuss and vote to eliminate a suspect."
   - When vote cast: "[Player] voted to eliminate [Target]"
   - When vote changed: "[Player] changed vote from [Old] to [New]"
   - When detective reveals: "[Player] has revealed themselves as the Detective!"
   - When elimination occurs: "[Player] was voted out. They were [Role]."

**Advancement**:
- Host clicks "Enter Night"
- Highest vote count is eliminated
- Ties: Host decides OR random selection (configurable)

---

### Ended Phase

**Duration**: Permanent (until host restarts or archives)

**Triggers**:
1. All mafia eliminated → Village wins
2. Mafia equals or outnumbers village → Mafia wins
3. Jester voted out during day → Jester wins (future)

**Display**:
- Winner announcement banner
- Full role reveal for all players
- Game statistics (rounds, eliminations, etc.)
- Host options: Restart Lobby, Archive Game

---

## Information Visibility

### What Players See at Game Start
- **All Players**: Own role only
- **Mafia Members**: All other mafia members' names and roles
- **Other Roles**: No additional information

### During Night Phase
- **Mafia**: 
  - All mafia members' identities
  - Each mafia member's current vote choice
  - Consensus lock status
- **Doctor**: Own protection choice only
- **Detective**: 
  - Own investigation choice
  - Investigation result (shown at end of detective stage)
  - Running charge count (if limited mode)
- **Dead Players**: All roles revealed

### During Day Phase
- **All Alive Players**: 
  - Day voting status (per anonymity setting)
  - Previous night's outcome (who died, if doctor save occurred)
  - Any voluntary detective reveals
- **Dead Players**: All roles revealed

### Role Reveal Triggers
1. **Death**: If `revealRolesOnDeath: true` (default)
2. **Peek Action**: Host sacrifices self to see all roles (after game starts only)
3. **Game End**: All roles always revealed
4. **Detective Reveal**: Detective voluntarily reveals own role during day

---

## Win Conditions

### Village Victory
- **Condition**: All mafia members eliminated
- **Check**: After each day vote and night resolution
- **Display**: "The Village has prevailed! All threats eliminated."

### Mafia Victory
- **Condition**: Mafia count ≥ Alive village count
- **Check**: After each day vote and night resolution
- **Rationale**: Mafia controls voting and cannot be stopped
- **Display**: "The Mafia has taken over the town!"

### Jester Victory (Future)
- **Condition**: Jester eliminated during day vote
- **Effect**: Game ends immediately; Jester wins alone
- **Display**: "The Jester tricked the village and wins!"

---

## Action Resolution

### Night Resolution Priority Order
1. **Mafia Vote**: Determine consensus target
2. **Doctor Protection**: Identify protected player
3. **Detective Investigation**: Reveal alignment result to detective
4. **Conflict Resolution**: Check if protection cancels elimination
5. **Apply Eliminations**: Update `isAlive` status
6. **Detective Charge Update**: Deduct charge if limited mode; convert if depleted
7. **Win Condition Check**: Evaluate if game should end
8. **Generate Activity Log**: Store narrative for day phase reveal

### Day Resolution Priority Order
1. **Tally Votes**: Count votes per candidate
2. **Determine Elimination**: Highest vote count (tie-breaking per config)
3. **Reveal Role**: Show eliminated player's role (if configured)
4. **Apply Elimination**: Set `isAlive: false`
5. **Win Condition Check**: Evaluate if game should end
6. **Generate Activity Log**: Store elimination record

### Activity Log Visibility Rules
- **Night Actions**: Revealed at start of day phase
  - "Last night, [Player] was eliminated by the mafia."
  - "The doctor's protection saved [Player]!"
  - "No one was harmed last night." (if save occurred)
- **Day Actions**: Shown in real-time
  - Vote changes (if not anonymous)
  - Detective reveals
  - Elimination results
- **Chronological Order**: Always display oldest to newest

---

## Special Rules

### Host Peek Rule
- **Availability**: Only after game starts, before host is eliminated
- **Effect**: Host sees all player roles immediately
- **Penalty**: Host is eliminated from game (becomes observer)
- **Visibility**: All players notified that host peeked and was eliminated
- **Use Case**: Debugging, tournament moderation, stuck games

### Detective Charge System
- **Once-Per-Round Mode**:
  - `detectiveOncePerRound: true`
  - `detectiveChecksRemaining: null`
  - Can investigate every night indefinitely
  - No conversion to villager
  
- **Limited Checks Mode**:
  - `detectiveOncePerRound: false`
  - `detectiveChecksLimit: number` (default = mafia count at game start)
  - Each investigation reduces `detectiveChecksRemaining`
  - When reaches 0: Convert to villager + announcement
  - Conversion message: "[Detective] has exhausted their investigations and now appears as a villager."

### Lobby Restart Rule
- **Availability**: Host can restart at any time (lobby, in-progress, ended)
- **Effect**:
  - Reset phase to "lobby"
  - Preserve all joined players
  - Clear all roles
  - Reset ready states to false
  - Clear votes, night state, elimination records
  - Optionally randomize role configuration (if "Random Roles" clicked)
- **Use Case**: Quick rematch without recreating game

### Mafia Consensus Rule
- **Requirement**: All alive mafia must vote for same target
- **Partial Votes**: If only some mafia have voted, consensus not reached
- **Visibility**: Each mafia sees others' current votes to coordinate
- **Lock Status**: Once consensus reached, target is locked (visible to all mafia)
- **Change Allowed**: Mafia can change votes before host advances phase

### Doctor Save Clarity
- **Save Notification**: Shown at start of day phase
  - "The doctor's protection saved someone last night!"
  - OR "No one was harmed last night."
- **Protected Player Identity**: NOT revealed to village (only doctor knows)
- **Mafia Knowledge**: Mafia knows their kill failed but not who was protected

### Dead Player Observer Rules
- **Role Visibility**: Dead players see all roles
- **Chat Access**: Can read all messages; write access configurable
- **Vote Access**: Cannot vote
- **Action Access**: Cannot perform night actions
- **UI State**: Marked as eliminated with role revealed

---

## Game Flow Summary

```
LOBBY
  ↓ (Host starts, min 4 ready players)
NIGHT - Mafia Stage
  ↓ (Consensus reached or manual advance)
NIGHT - Doctor Stage (if alive doctor)
  ↓ (Doctor acts or manual advance)
NIGHT - Detective Stage (if alive detective with charges)
  ↓ (Investigation complete or manual advance)
NIGHT - Resolution
  ↓ (Host clicks "Enter Day")
DAY
  ↓ (Discussion + Voting)
  ↓ (Host clicks "Enter Night")
Check Win Conditions
  ↓ (If no winner)
NIGHT - Mafia Stage
  ↓ (Repeat...)
  
ENDED (when win condition met)
```

---

## Configuration Reference

### Game Config Object
```typescript
{
  maxPlayers: number (4-20),
  enableVoice: boolean,
  enableAnonymousVotes: boolean,
  revealRolesOnDeath: boolean,
  dayDurationMinutes: number,
  nightDurationMinutes: number,
  roles: RoleConfig[] (role + count pairs),
  detectiveOncePerRound: boolean,
  detectiveChecksLimit: number | null
}
```

### Role Allocation Recommendations (by ready player count)
- **4 players**: 1 Mafia, 1 Doctor, 2 Villagers
- **5 players**: 1 Mafia, 1 Doctor, 3 Villagers
- **6 players**: 1 Mafia, 1 Doctor, 1 Detective, 3 Villagers
- **7 players**: 1 Mafia, 1 Doctor, 1 Detective, 4 Villagers
- **8+ players**: Scale mafia (1 per 4 players), add Guardian at 8, Vigilante at 9

### Minimum Villager Rule (Enforced)
- Always require at least 2 villagers
- If role config would result in <2 villagers, throw error
- Ensures village has baseline participation even in small games

---

## End of Rulebook
Version 1.0 - January 2026
