# Mafia Game - UI Design & Flow Specification

## Table of Contents
1. [Design Principles](#design-principles)
2. [Layout Architecture](#layout-architecture)
3. [Action Center Design](#action-center-design)
4. [Information Display Strategy](#information-display-strategy)
5. [Phase-Specific UI States](#phase-specific-ui-states)
6. [Activity Timeline Design](#activity-timeline-design)
7. [Component Hierarchy](#component-hierarchy)

---

## Design Principles

### Core UX Goals
1. **Clarity Over Clutter**: Every player should instantly understand what action they need to take
2. **Context-Aware UI**: Show only relevant information for current phase and role
3. **Progressive Disclosure**: Reveal information as it becomes relevant, hide what's not needed
4. **Persistent Action Center**: Critical actions always visible in fixed position
5. **Scannable Activity Log**: Easy to review game history and recent events
6. **Mobile-First Responsive**: Work seamlessly on phones, tablets, and desktops

### Information Hierarchy (Top to Bottom)
1. **Action Center** (Sticky, highest priority)
2. **Activity Timeline** (Scrollable feed of events)
3. **Player List** (Compact roster at bottom)
4. **Chat** (Sidebar or expandable panel)

---

## Layout Architecture

### Desktop Layout (≥1024px)

```
┌────────────────────────────────────────────────────────────┐
│ Header (Game Code, Phase, Timer)                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────┐  ┌─────────────────────┐   │
│  │                          │  │                     │   │
│  │   ACTION CENTER          │  │   CHAT              │   │
│  │   (Sticky, Fixed)        │  │   (Sidebar)         │   │
│  │                          │  │                     │   │
│  │   • Current Phase Info   │  │   • Messages        │   │
│  │   • Your Role Reminder   │  │   • System Narration │  │
│  │   • Active Action Prompt │  │                     │   │
│  │   • Relevant Buttons     │  │                     │   │
│  │                          │  │                     │   │
│  └──────────────────────────┘  └─────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │   ACTIVITY TIMELINE                                │   │
│  │   (Scrollable Event Feed)                          │   │
│  │                                                    │   │
│  │   • Night outcomes revealed                        │   │
│  │   • Vote changes (real-time)                       │   │
│  │   • Role reveals                                   │   │
│  │   • Eliminations                                   │   │
│  │   • System messages                                │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │   PLAYER LIST (Compact Grid)                       │   │
│  │   [Avatar] [Name] [Status Badge] [Role if dead]    │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<1024px)

```
┌──────────────────────────┐
│ Header (Collapsed)       │
├──────────────────────────┤
│                          │
│  ACTION CENTER           │
│  (Sticky Top)            │
│                          │
│  • Phase/Role Badge      │
│  • Action Prompt         │
│  • Primary Button        │
│                          │
├──────────────────────────┤
│                          │
│  ACTIVITY TIMELINE       │
│  (Main Scroll Area)      │
│                          │
│  • Event cards           │
│  • Expandable details    │
│                          │
├──────────────────────────┤
│  PLAYER LIST             │
│  (Horizontal Scroll)     │
│                          │
│  [P1] [P2] [P3] [P4]...  │
│                          │
├──────────────────────────┤
│  CHAT (Bottom Sheet)     │
│  [Tap to expand]         │
└──────────────────────────┘
```

---

## Action Center Design

### Purpose
- Single source of truth for "What should I do right now?"
- Always visible (sticky/fixed positioning)
- Changes based on phase, role, and player state

### Component Structure

```tsx
<ActionCenter>
  <PhaseIndicator phase={currentPhase} round={round} />
  <RoleReminder role={viewerRole} isAlive={viewerAlive} />
  <ActionPrompt>
    {/* Dynamic content based on state */}
  </ActionPrompt>
  <ActionButtons>
    {/* Context-specific buttons */}
  </ActionButtons>
  <TimerDisplay deadline={phaseEndsAt} />
</ActionCenter>
```

### State-Based Content

#### Lobby Phase
```
┌─────────────────────────────────┐
│ 🎭 LOBBY • Waiting to Start     │
├─────────────────────────────────┤
│ You: [Player Name]              │
│ Status: [Ready / Not Ready]     │
├─────────────────────────────────┤
│ Waiting for all players to      │
│ ready up...                     │
│                                 │
│ Players Ready: 3/4              │
├─────────────────────────────────┤
│ [Ready Up]  [Leave Game]        │
│                                 │
│ (Host Only)                     │
│ [Start Game] [Game Settings]    │
└─────────────────────────────────┘
```

#### Night Phase - Mafia (Active)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2 • Mafia Turn │
├─────────────────────────────────┤
│ Your Role: MAFIA                │
│ Status: Alive                   │
├─────────────────────────────────┤
│ Choose a target to eliminate    │
│                                 │
│ Mafia Votes:                    │
│ • You → [Selected Target]       │
│ • Alice → [Pending...]          │
│ • Bob → [Selected Target]       │
│                                 │
│ ⚠️ Waiting for Alice...         │
├─────────────────────────────────┤
│ [Change Vote]                   │
│                                 │
│ ⏱️ 2:34 remaining               │
└─────────────────────────────────┘
```

#### Night Phase - Mafia (Consensus Reached)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2 • Mafia Turn │
├─────────────────────────────────┤
│ Your Role: MAFIA                │
│ Status: Alive                   │
├─────────────────────────────────┤
│ ✅ Consensus Reached            │
│                                 │
│ Target: Charlie                 │
│                                 │
│ All mafia voted for Charlie.    │
│ Waiting for other roles...      │
├─────────────────────────────────┤
│ (Host Only)                     │
│ [Advance to Doctor Stage]       │
│                                 │
│ ⏱️ 2:34 remaining               │
└─────────────────────────────────┘
```

#### Night Phase - Doctor (Active)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2 • Doctor Turn│
├─────────────────────────────────┤
│ Your Role: DOCTOR               │
│ Status: Alive                   │
├─────────────────────────────────┤
│ Choose one player to protect    │
│ from elimination tonight        │
│                                 │
│ [Alice]  [Bob]  [Charlie]       │
│ [Dave]   [Eve]  [You]           │
│                                 │
│ Selected: Charlie               │
├─────────────────────────────────┤
│ [Confirm Protection]            │
│                                 │
│ ⏱️ 1:45 remaining               │
└─────────────────────────────────┘
```

#### Night Phase - Detective (Active)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2 • Detective  │
├─────────────────────────────────┤
│ Your Role: DETECTIVE            │
│ Status: Alive                   │
│ Investigations Left: 2          │
├─────────────────────────────────┤
│ Investigate one player to learn │
│ their alignment                 │
│                                 │
│ [Alice]  [Bob]  [Charlie]       │
│ [Dave]   [Eve]                  │
│                                 │
│ Selected: Bob                   │
├─────────────────────────────────┤
│ [Confirm Investigation]         │
│                                 │
│ ⏱️ 1:12 remaining               │
└─────────────────────────────────┘
```

#### Night Phase - Detective (Result Shown)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2 • Detective  │
├─────────────────────────────────┤
│ Your Role: DETECTIVE            │
│ Status: Alive                   │
│ Investigations Left: 1          │
├─────────────────────────────────┤
│ 🔍 Investigation Result:        │
│                                 │
│ Bob is NOT aligned with         │
│ the mafia.                      │
│                                 │
│ Waiting for night to end...     │
├─────────────────────────────────┤
│ (Host Only)                     │
│ [Enter Day]                     │
│                                 │
│ ⏱️ 0:58 remaining               │
└─────────────────────────────────┘
```

#### Night Phase - Villager (Waiting)
```
┌─────────────────────────────────┐
│ 🌙 NIGHT • Round 2              │
├─────────────────────────────────┤
│ Your Role: VILLAGER             │
│ Status: Alive                   │
├─────────────────────────────────┤
│ 😴 You are asleep               │
│                                 │
│ Special roles are performing    │
│ their night actions...          │
│                                 │
│ Current Stage: Doctor           │
├─────────────────────────────────┤
│ (Host Only)                     │
│ [Advance Phase]                 │
│                                 │
│ ⏱️ 2:15 remaining               │
└─────────────────────────────────┘
```

#### Day Phase - Voting (Your Turn)
```
┌─────────────────────────────────┐
│ ☀️ DAY • Round 2 • Voting       │
├─────────────────────────────────┤
│ Your Role: VILLAGER             │
│ Status: Alive                   │
├─────────────────────────────────┤
│ Vote to eliminate a suspect     │
│                                 │
│ Your Vote: Charlie              │
│                                 │
│ Current Standings:              │
│ • Charlie: 3 votes              │
│ • Alice: 2 votes                │
│ • Bob: 1 vote                   │
├─────────────────────────────────┤
│ [Change Vote]  [Clear Vote]     │
│                                 │
│ ⏱️ 4:30 remaining               │
└─────────────────────────────────┘
```

#### Day Phase - Detective Reveal Option
```
┌─────────────────────────────────┐
│ ☀️ DAY • Round 3 • Voting       │
├─────────────────────────────────┤
│ Your Role: DETECTIVE (Hidden)   │
│ Status: Alive                   │
│ Investigations Left: 1          │
├─────────────────────────────────┤
│ 🔍 Special Action Available     │
│                                 │
│ You can reveal your detective   │
│ status to gain credibility, but │
│ you'll become a mafia target.   │
│                                 │
│ ⚠️ This action is permanent!    │
├─────────────────────────────────┤
│ [Reveal as Detective]           │
│                                 │
│ (Continue voting below)         │
│ Your Vote: [Not voted yet]      │
│                                 │
│ ⏱️ 4:30 remaining               │
└─────────────────────────────────┘
```

#### Dead Player (Observer)
```
┌─────────────────────────────────┐
│ 👻 OBSERVER • You are eliminated│
├─────────────────────────────────┤
│ Your Role: DOCTOR (Revealed)    │
│ Status: Eliminated Round 2      │
├─────────────────────────────────┤
│ You can observe the game and    │
│ see all roles:                  │
│                                 │
│ 🔴 Alice - MAFIA                │
│ 🔴 Bob - MAFIA                  │
│ 🔵 Charlie - DETECTIVE          │
│ 🔵 Dave - VILLAGER              │
│ 🔵 Eve - VILLAGER               │
├─────────────────────────────────┤
│ Current Phase: Day • Round 3    │
│                                 │
│ ⏱️ 4:30 remaining               │
└─────────────────────────────────┘
```

#### Host Controls (Always Present for Host)
```
┌─────────────────────────────────┐
│ 🎮 HOST CONTROLS                │
├─────────────────────────────────┤
│ [Advance Phase]                 │
│ [Extend Timer +30s]             │
│ [Reset Timer]                   │
│ [Restart Lobby]                 │
│ [Archive Game]                  │
│                                 │
│ (Danger Zone)                   │
│ [Peek at Roles] ⚠️             │
└─────────────────────────────────┘
```

---

## Activity Timeline Design

### Purpose
- Chronological feed of all game events
- Shows vote changes, eliminations, night outcomes, role reveals
- Filterable by phase/event type
- Auto-scrolls to latest event

### Event Card Types

#### Night Outcome Event
```
┌─────────────────────────────────────────┐
│ 🌙 NIGHT 2 ENDED                        │
├─────────────────────────────────────────┤
│ Charlie was eliminated by the mafia     │
│ Role revealed: DETECTIVE                │
│                                         │
│ 2 minutes ago                           │
└─────────────────────────────────────────┘
```

#### Doctor Save Event
```
┌─────────────────────────────────────────┐
│ 🌙 NIGHT 3 ENDED                        │
├─────────────────────────────────────────┤
│ ✨ The doctor's protection saved        │
│ someone! No one was eliminated.         │
│                                         │
│ 30 seconds ago                          │
└─────────────────────────────────────────┘
```

#### Day Vote Event (Non-Anonymous)
```
┌─────────────────────────────────────────┐
│ ☀️ DAY 2 • VOTING                       │
├─────────────────────────────────────────┤
│ Alice voted to eliminate Bob            │
│                                         │
│ Current votes for Bob: 2                │
│ • Alice                                 │
│ • Dave                                  │
│                                         │
│ Just now                                │
└─────────────────────────────────────────┘
```

#### Vote Change Event
```
┌─────────────────────────────────────────┐
│ ☀️ DAY 2 • VOTING                       │
├─────────────────────────────────────────┤
│ Alice changed vote from Bob to Charlie  │
│                                         │
│ Current votes for Charlie: 3            │
│ • Alice                                 │
│ • Eve                                   │
│ • Frank                                 │
│                                         │
│ Just now                                │
└─────────────────────────────────────────┘
```

#### Day Elimination Event
```
┌─────────────────────────────────────────┐
│ ☀️ DAY 2 ENDED                          │
├─────────────────────────────────────────┤
│ Bob was voted out                       │
│ Final vote count: 4                     │
│                                         │
│ Role revealed: MAFIA                    │
│                                         │
│ ✅ Good choice! Bob was mafia.          │
│                                         │
│ 1 minute ago                            │
└─────────────────────────────────────────┘
```

#### Detective Reveal Event
```
┌─────────────────────────────────────────┐
│ ☀️ DAY 3 • PUBLIC REVEAL                │
├─────────────────────────────────────────┤
│ 🔍 Charlie has revealed themselves as   │
│ the DETECTIVE!                          │
│                                         │
│ Charlie's past investigations:          │
│ • Night 1: Alice is NOT mafia           │
│ • Night 2: Bob IS mafia ✅              │
│                                         │
│ Investigations remaining: 1             │
│                                         │
│ 2 minutes ago                           │
└─────────────────────────────────────────┘
```

#### Game Start Event
```
┌─────────────────────────────────────────┐
│ 🎭 GAME STARTED                         │
├─────────────────────────────────────────┤
│ 8 players ready                         │
│                                         │
│ Roles assigned:                         │
│ • 2 Mafia                               │
│ • 1 Detective                           │
│ • 1 Doctor                              │
│ • 4 Villagers                           │
│                                         │
│ Round 1 begins...                       │
│                                         │
│ 5 minutes ago                           │
└─────────────────────────────────────────┘
```

#### Win Condition Event
```
┌─────────────────────────────────────────┐
│ 🏆 GAME ENDED                           │
├─────────────────────────────────────────┤
│ THE VILLAGE WINS! 🎉                    │
│                                         │
│ All mafia members eliminated            │
│                                         │
│ Final Roles:                            │
│ 🔴 Alice - MAFIA (Eliminated R2)        │
│ 🔴 Bob - MAFIA (Eliminated R3)          │
│ 🔵 Charlie - DETECTIVE (Alive)          │
│ 🔵 Dave - DOCTOR (Alive)                │
│ 🔵 Eve - VILLAGER (Eliminated R1)       │
│ 🔵 Frank - VILLAGER (Alive)             │
│ 🔵 Grace - VILLAGER (Alive)             │
│                                         │
│ Game lasted 4 rounds                    │
│                                         │
│ Just now                                │
└─────────────────────────────────────────┘
```

### Vote Transparency Display (Non-Anonymous Mode)

#### Compact View (Collapsed)
```
┌─────────────────────────────────────────┐
│ ☀️ CURRENT VOTES                        │
├─────────────────────────────────────────┤
│ Charlie: 3 votes [▼ Show details]       │
│ Alice: 2 votes [▼ Show details]         │
│ Bob: 1 vote [▼ Show details]            │
│ No vote: 2 players                      │
└─────────────────────────────────────────┘
```

#### Expanded View (Show Who Voted)
```
┌─────────────────────────────────────────┐
│ ☀️ CURRENT VOTES                        │
├─────────────────────────────────────────┤
│ Charlie: 3 votes [▲ Hide details]       │
│   • Dave → Charlie                      │
│   • Eve → Charlie                       │
│   • You → Charlie                       │
│                                         │
│ Alice: 2 votes [▼ Show details]         │
│ Bob: 1 vote [▼ Show details]            │
│ No vote: 2 players                      │
└─────────────────────────────────────────┘
```

#### Real-Time Update Animation
```
┌─────────────────────────────────────────┐
│ ☀️ CURRENT VOTES                        │
├─────────────────────────────────────────┤
│ Charlie: 3 votes → 4 votes ✨ [New!]    │
│   • Dave → Charlie                      │
│   • Eve → Charlie                       │
│   • You → Charlie                       │
│   • Frank → Charlie (Just now)          │
│                                         │
│ Alice: 2 votes → 1 vote                 │
│   • Alice → Alice                       │
│   (Frank changed vote)                  │
└─────────────────────────────────────────┘
```

---

## Information Display Strategy

### Role-Based Visibility Matrix

| Information                  | Mafia | Doctor | Detective | Villager | Dead Player |
|-----------------------------|-------|--------|-----------|----------|-------------|
| Own role                     | ✅    | ✅     | ✅        | ✅       | ✅          |
| Other mafia members          | ✅    | ❌     | ❌        | ❌       | ✅          |
| All roles                    | ❌    | ❌     | ❌        | ❌       | ✅          |
| Mafia votes (night)          | ✅    | ❌     | ❌        | ❌       | ✅          |
| Doctor protection (night)    | ❌    | ✅     | ❌        | ❌       | ✅          |
| Detective result (night)     | ❌    | ❌     | ✅        | ❌       | ✅          |
| Day votes (non-anon)         | ✅    | ✅     | ✅        | ✅       | ✅          |
| Day votes (anonymous)        | Count | Count  | Count     | Count    | ✅          |
| Night outcomes (next day)    | ✅    | ✅     | ✅        | ✅       | ✅          |
| Revealed detective status    | ✅    | ✅     | ✅        | ✅       | ✅          |
| Dead player roles (if config)| ✅    | ✅     | ✅        | ✅       | ✅          |

### Progressive Information Reveal

#### Night → Day Transition
1. **Immediately revealed** (at day start):
   - Who died last night
   - Their role (if config enabled)
   - Whether doctor save occurred (not who was saved)
   - Detective's private investigation result (to detective only)

2. **Never revealed** (remains hidden):
   - Who mafia voted for (unless that person died)
   - Who doctor protected
   - Individual mafia vote assignments (only mafia see this)

#### Day → Night Transition
1. **Immediately revealed** (at night start):
   - Who was voted out during day
   - Their role (if config enabled)
   - Final vote tally

2. **Activity log preserved**:
   - All day phase votes (if non-anonymous)
   - Vote changes throughout day
   - Detective reveals (if occurred)

---

## Phase-Specific UI States

### Lobby Phase UI

#### Layout
```
┌────────────────────────────────────────────┐
│ Header: MAFIA GAME • Code: ABC123         │
├────────────────────────────────────────────┤
│                                            │
│ [ACTION CENTER - Sticky]                   │
│ • Lobby status                             │
│ • Ready button                             │
│ • Host controls (if host)                  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [PLAYER LIST - Main Content]              │
│ • Grid of player cards                     │
│ • Ready status badges                      │
│ • Host crown icon                          │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [CHAT - Sidebar or Bottom]                 │
│ • Pre-game chat                            │
│                                            │
└────────────────────────────────────────────┘
```

#### Host-Specific Controls
- Game Settings button → Modal with role config
- Start Game button (enabled when all ready)
- Kick player buttons (future)

---

### Night Phase UI

#### Layout
```
┌────────────────────────────────────────────┐
│ Header: NIGHT • Round 2 • Timer: 2:45     │
├────────────────────────────────────────────┤
│                                            │
│ [ACTION CENTER - Sticky]                   │
│ • Night stage indicator                    │
│ • Role-specific action prompt              │
│ • Mafia vote alignment (mafia only)        │
│ • Doctor/Detective selection               │
│ • Investigation result (detective only)    │
│ • "Waiting..." message (villagers/done)    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [ACTIVITY TIMELINE]                        │
│ • Previous night outcome                   │
│ • Previous day elimination                 │
│ • Win condition checks                     │
│ • Phase transitions                        │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [PLAYER LIST - Bottom]                     │
│ • Alive/Dead status                        │
│ • Roles revealed for dead (if config)      │
│                                            │
└────────────────────────────────────────────┘
```

#### Stage-Specific Action Center Content

**Mafia Stage**:
- "Choose elimination target" prompt
- Real-time mafia vote tracker: `[Name] → [Target]` or `Undecided`
- Consensus lock indicator when all aligned
- Player selection grid (alive non-mafia only)

**Doctor Stage**:
- "Choose player to protect" prompt
- Player selection grid (all alive players)
- Selected player highlighted

**Detective Stage**:
- "Choose player to investigate" prompt
- Investigations remaining counter (if limited mode)
- Player selection grid (alive players except self)
- Investigation result display after submission

**Resolution/Idle Stage**:
- "Night actions complete" message
- Host advance button
- No player interaction needed

---

### Day Phase UI

#### Layout
```
┌────────────────────────────────────────────┐
│ Header: DAY • Round 2 • Timer: 4:30       │
├────────────────────────────────────────────┤
│                                            │
│ [ACTION CENTER - Sticky]                   │
│ • "Vote to eliminate" prompt               │
│ • Current vote standings (expandable)      │
│ • Your vote highlighted                    │
│ • Detective reveal button (if detective)   │
│ • Vote change / clear buttons              │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [ACTIVITY TIMELINE]                        │
│ • Night outcome from start of day          │
│ • Real-time vote changes (if non-anon)     │
│ • Detective reveals (if occurred)          │
│ • Chat messages interspersed              │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [PLAYER LIST - Bottom]                     │
│ • Clickable to vote                        │
│ • Vote count badges                        │
│ • Alive/Dead status                        │
│                                            │
└────────────────────────────────────────────┘
```

#### Vote Display Options

**Non-Anonymous Mode** (default):
```
Current Votes (5/8 voted)

Charlie: 3 votes [Expand ▼]
  ↳ Dave, Eve, You

Alice: 2 votes [Expand ▼]
  ↳ Alice, Frank

No vote yet: Bob, Grace, Henry
```

**Anonymous Mode**:
```
Current Votes (5/8 voted)

Charlie: 3 votes
Alice: 2 votes

3 players haven't voted yet
```

---

### Ended Phase UI

#### Layout
```
┌────────────────────────────────────────────┐
│ Header: GAME ENDED                         │
├────────────────────────────────────────────┤
│                                            │
│ [WINNER BANNER]                            │
│ 🏆 THE VILLAGE WINS!                       │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [FINAL STATS]                              │
│ • Rounds played: 4                         │
│ • Duration: 23 minutes                     │
│ • Total eliminations: 4                    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [FULL ROLE REVEAL]                         │
│ 🔴 Alice - MAFIA (Eliminated R2)           │
│ 🔴 Bob - MAFIA (Eliminated R3)             │
│ 🔵 Charlie - DETECTIVE (Alive)             │
│ 🔵 Dave - DOCTOR (Alive)                   │
│ 🔵 Eve - VILLAGER (Eliminated R1)          │
│ 🔵 Frank - VILLAGER (Alive)                │
│ 🔵 Grace - VILLAGER (Alive)                │
│ 🔵 Henry - VILLAGER (Eliminated R4)        │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [ACTIVITY TIMELINE - Full Game History]   │
│ • Every elimination                        │
│ • Every vote                               │
│ • Every night outcome                      │
│ • Filterable/searchable                    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ [HOST CONTROLS]                            │
│ [Restart Lobby] [Archive Game]             │
│                                            │
└────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Proposed Component Structure

```
app/game/[gameId]/page.tsx
├── GameHeader
│   ├── GameCodeDisplay
│   ├── PhaseTimer
│   └── RoundIndicator
│
├── GameLayout (responsive grid)
│   ├── ActionCenterColumn (sticky)
│   │   ├── ActionCenter
│   │   │   ├── PhaseIndicator
│   │   │   ├── RoleReminder
│   │   │   ├── ActionPrompt
│   │   │   │   ├── LobbyActions
│   │   │   │   ├── NightActions
│   │   │   │   │   ├── MafiaVotePanel
│   │   │   │   │   ├── DoctorProtectionPanel
│   │   │   │   │   └── DetectiveInvestigationPanel
│   │   │   │   ├── DayActions
│   │   │   │   │   ├── VotePanel
│   │   │   │   │   └── DetectiveRevealPanel
│   │   │   │   └── ObserverMessage
│   │   │   ├── ActionButtons
│   │   │   └── TimerDisplay
│   │   │
│   │   └── HostControlPanel (conditional)
│   │
│   ├── ActivityTimelineColumn (main scroll)
│   │   ├── ActivityTimeline
│   │   │   ├── EventFilter
│   │   │   ├── EventList
│   │   │   │   ├── NightOutcomeEvent
│   │   │   │   ├── DayEliminationEvent
│   │   │   │   ├── VoteEvent
│   │   │   │   ├── VoteChangeEvent
│   │   │   │   ├── DetectiveRevealEvent
│   │   │   │   ├── GameStartEvent
│   │   │   │   └── GameEndEvent
│   │   │   └── AutoScrollContainer
│   │   │
│   │   └── VoteTransparencyPanel (day phase, expandable)
│   │       ├── VoteStandingsCompact
│   │       └── VoteStandingsDetailed
│   │
│   ├── PlayerListSection (bottom)
│   │   └── PlayerList
│   │       ├── PlayerCard
│   │       │   ├── PlayerAvatar
│   │       │   ├── PlayerName
│   │       │   ├── StatusBadge (alive/dead)
│   │       │   ├── RoleBadge (conditional)
│   │       │   └── VoteIndicator (day phase)
│   │       └── PlayerGrid (responsive)
│   │
│   └── ChatSidebarColumn (desktop) / ChatBottomSheet (mobile)
│       └── ChatPanel
│
└── GameModals
    ├── GameSettingsModal (lobby)
    ├── DetectiveRevealConfirmModal
    ├── PeekRolesConfirmModal
    └── GameEndModal
```

---

## Implementation Priorities

### Phase 1: Core Action Center (High Priority)
- [ ] Extract current action logic from player-list controls
- [ ] Build sticky ActionCenter component with phase routing
- [ ] Implement state-based ActionPrompt rendering
- [ ] Add role reminder and timer display
- [ ] Style with clear visual hierarchy

### Phase 2: Activity Timeline (High Priority)
- [ ] Create ActivityTimeline component with event feed
- [ ] Build event card types (night outcome, day vote, etc.)
- [ ] Implement real-time event subscription
- [ ] Add auto-scroll to latest event
- [ ] Format timestamps and phase indicators

### Phase 3: Vote Transparency (High Priority)
- [ ] Add vote tracking to day phase activity log
- [ ] Build expandable vote standings component
- [ ] Show "who voted for whom" in non-anonymous mode
- [ ] Animate real-time vote changes
- [ ] Add vote count aggregation

### Phase 4: Responsive Layout (Medium Priority)
- [ ] Refactor page layout to new grid structure
- [ ] Move player list to bottom section
- [ ] Implement sticky positioning for action center
- [ ] Add mobile bottom sheet for chat
- [ ] Test on various screen sizes

### Phase 5: Polish & Accessibility (Medium Priority)
- [ ] Add loading states for async actions
- [ ] Improve keyboard navigation
- [ ] Add ARIA labels for screen readers
- [ ] Implement focus management
- [ ] Add success/error animations

### Phase 6: Advanced Features (Lower Priority)
- [ ] Event filtering by phase/type
- [ ] Full game history export
- [ ] Detective reveal modal with confirmation
- [ ] Vote change undo/redo
- [ ] Activity timeline search

---

## Design Tokens & Styling

### Color Palette

```css
/* Phase Colors */
--phase-lobby: hsl(220, 15%, 50%);
--phase-night: hsl(230, 40%, 20%);
--phase-day: hsl(45, 90%, 60%);
--phase-ended: hsl(140, 50%, 50%);

/* Team Colors */
--team-mafia: hsl(0, 70%, 50%);
--team-village: hsl(210, 70%, 50%);
--team-neutral: hsl(40, 70%, 50%);

/* Status Colors */
--status-alive: hsl(140, 60%, 50%);
--status-dead: hsl(0, 5%, 40%);
--status-ready: hsl(140, 60%, 50%);
--status-not-ready: hsl(40, 70%, 50%);

/* Action Colors */
--action-primary: hsl(210, 80%, 50%);
--action-danger: hsl(0, 70%, 50%);
--action-success: hsl(140, 60%, 45%);
--action-warning: hsl(40, 90%, 50%);
```

### Typography Scale

```css
--text-xs: 0.75rem;    /* Timestamps, labels */
--text-sm: 0.875rem;   /* Body text, buttons */
--text-base: 1rem;     /* Default */
--text-lg: 1.125rem;   /* Subheadings */
--text-xl: 1.25rem;    /* Card titles */
--text-2xl: 1.5rem;    /* Section headers */
--text-3xl: 1.875rem;  /* Phase indicators */
--text-4xl: 2.25rem;   /* Win banners */
```

### Spacing System

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
```

---

## End of UI Design Flow Document
Version 1.0 - January 2026
