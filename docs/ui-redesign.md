# UI/UX Redesign Documentation
## Moonlit Mafia - Mobile-First Complete Redesign

**Version**: 1.0  
**Date**: January 2026  
**Status**: Planning Phase  

---

## Table of Contents
1. [Design Goals](#design-goals)
2. [Core Screens](#core-screens)
3. [Information Hierarchy](#information-hierarchy)
4. [Layout Strategy](#layout-strategy)
5. [Chat + Action Integration](#chat--action-integration)
6. [Interaction Patterns](#interaction-patterns)
7. [Visual Direction](#visual-direction)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Design Goals

### Current UX Problems

1. **Mobile Cognitive Overload**
   - Too much information competing for attention simultaneously
   - Action Center, Chat, Voting, and Player List all visible at once
   - No clear visual hierarchy - everything feels equally important
   - Tabs require context switching, breaking game flow

2. **Information Density Issues**
   - Chat messages get lost among game actions
   - Critical actions buried in tab navigation
   - Timer and phase indicators not prominent enough
   - Role reminders compete with action prompts

3. **Desktop Layout Inefficiencies**
   - Chat relegated to sidebar on xl screens only
   - Action Center and Activity Timeline in same column create vertical sprawl
   - Admin controls scattered across different sections

4. **Test Mode Integration**
   - Admin Control Panel feels bolted on
   - Not clearly separated from regular gameplay
   - Takes up prime real estate when active

### Success Criteria

✅ **Primary Goals**:
- One-hand mobile usability (thumb-friendly interactions)
- Instant clarity on "what should I do right now?"
- Chat always visible and accessible without navigation
- Zero functionality loss
- Calm, uncluttered visual design

✅ **Measurable Outcomes**:
- Reduce tap count to primary actions by 40%
- Eliminate unnecessary tab switching
- All critical info visible above fold on mobile
- Test mode controls accessible but unobtrusive
- No overlapping UI elements in any phase

---

## Core Screens

### 1. Lobby Screen

**Purpose**: Player gathering, readiness confirmation, game configuration

**User Goals**:
- See who's joined
- Indicate ready status
- (Host) Configure game settings
- (Host) Start game when ready

**Key Elements**:
- Player list with ready badges
- Game code (prominent, easy to copy)
- Ready/Unready button
- Host controls (start game, settings)
- Pre-game chat

**Mobile Layout Priority**:
```
┌─────────────────────────┐
│ 🎭 Lobby • CODE: ABC123 │ ← Sticky header
├─────────────────────────┤
│                         │
│  Status Card            │ ← Primary focus
│  Players Ready: 3/4     │
│  [Ready Up] 💚          │
│                         │
├─────────────────────────┤
│  Player Grid            │ ← Compact, horizontal scroll
│  [P1✓][P2✓][P3✓][P4 ]  │
├─────────────────────────┤
│  Chat (collapsible)     │ ← Bottom sheet
│  💬 Latest: "Ready!"    │
│  [Tap to expand]        │
└─────────────────────────┘
```

---

### 2. Night Phase Screen

**Purpose**: Role-specific actions executed in sequence

**User Goals**:
- Know if it's my turn
- Perform night action (if applicable)
- See night progress
- Coordinate with team (mafia only)

**Key Elements**:
- Phase indicator (🌙 NIGHT • Round 2)
- Role reminder
- Stage indicator (Mafia Turn / Doctor Turn / etc.)
- Action prompt (contextual to role + stage)
- Timer
- Chat (night chat for coordination)

**Mobile Layout Priority**:
```
┌─────────────────────────┐
│ 🌙 Night • R2 • 2:45   │ ← Sticky header with timer
├─────────────────────────┤
│ Action Card (Sticky)    │ ← Primary focus
│ ┌─────────────────────┐ │
│ │ YOUR ROLE: MAFIA    │ │
│ │ Status: Your Turn   │ │
│ │                     │ │
│ │ Choose target...    │ │
│ │ [Player buttons]    │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Chat (50% height)       │ ← Always visible
│ Messages scrollable     │
│ [Send message...]       │
└─────────────────────────┘
```

**Progressive Disclosure**:
- Show action prompt only when it's your turn
- Hide player selection when waiting
- Collapse to "Waiting..." when action complete

---

### 3. Day Phase Screen

**Purpose**: Discussion, voting, elimination decision

**User Goals**:
- Discuss in chat
- Vote for elimination
- See current vote standings
- Defend yourself if targeted

**Key Elements**:
- Phase indicator (☀️ DAY • Round 2)
- Role reminder (persistent, collapsible)
- Voting interface
- Vote standings (real-time)
- Chat (primary communication)
- Timer

**Mobile Layout Priority**:
```
┌─────────────────────────┐
│ ☀️ Day • R2 • 4:30     │ ← Sticky header
├─────────────────────────┤
│ Vote Status (Sticky)    │ ← Primary focus
│ ┌─────────────────────┐ │
│ │ Your Vote: Charlie  │ │
│ │ Leading: Charlie 3v │ │
│ │ [Change Vote]       │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Chat + Voting Combined  │ ← Integrated view
│                         │
│ Messages with voting    │
│ actions inline          │
│                         │
│ Quick Vote Buttons:     │
│ [Alice] [Bob] [Charlie] │
│                         │
│ [Send message...]       │
└─────────────────────────┘
```

**Key Innovation**: Voting integrated into chat interface
- Tap player name in chat to vote
- Vote buttons appear contextually
- No separate voting tab needed

---

### 4. Ghost / Spectator Screen

**Purpose**: Observe game as eliminated player or spectator

**User Goals**:
- See all roles and actions
- Follow game progress
- Read chat

**Key Elements**:
- Observer indicator (👻)
- Full role reveal
- Passive observation of actions
- Read-only chat

**Mobile Layout Priority**:
```
┌─────────────────────────┐
│ 👻 Observer Mode        │ ← Clear indicator
├─────────────────────────┤
│ Role Reveal Card        │ ← Primary focus
│ 🔴 Alice - Mafia        │
│ 🔴 Bob - Mafia          │
│ 🔵 Charlie - Detective  │
│ ... (all roles)         │
├─────────────────────────┤
│ Current Phase Info      │ ← Context
│ Night • Mafia Turn      │
├─────────────────────────┤
│ Chat (read-only)        │
│ Follow the discussion   │
└─────────────────────────┘
```

---

### 5. Test Mode / Admin Screen

**Purpose**: Host testing and debugging capabilities

**User Goals**:
- Control actions for all players
- Advance phases manually
- Test game mechanics
- Monitor game state

**Key Elements**:
- Clear "TEST MODE" indicator
- Player action controls (tabbed)
- Phase controls
- Quick actions

**Mobile Layout Priority**:
```
┌─────────────────────────┐
│ 🧪 TEST MODE           │ ← Persistent badge
├─────────────────────────┤
│ [Game View] [Admin]     │ ← Tab switcher
├─────────────────────────┤
│ Admin Tab:              │
│                         │
│ Player Tabs:            │
│ [Alice][Bob][Charlie]   │
│                         │
│ Current: Alice          │
│ Role: Mafia             │
│                         │
│ Night Actions:          │
│ [Target Bob]            │
│ [Target Charlie]        │
│                         │
│ Day Actions:            │
│ [Vote Bob]              │
│ [Clear Vote]            │
└─────────────────────────┘
```

**Key Innovation**: Test mode as overlay/separate tab
- Doesn't interfere with normal gameplay view
- Can toggle between player view and admin view
- All test actions in one place

---

### 6. Game End Screen

**Purpose**: Show final results, declare winner, reveal all roles

**User Goals**:
- See who won
- View all roles
- Review game history
- Start new game

**Key Elements**:
- Winner banner
- Full role reveal
- Game stats
- Activity history
- Host controls (restart/archive)

---

## Information Hierarchy

### Hierarchy Principles

**Tier 1 - Critical** (Always Visible):
- Current phase and round
- Timer (when active)
- Your role (collapsible after acknowledgment)
- Primary action prompt

**Tier 2 - Contextual** (Show when relevant):
- Voting interface (day only)
- Night action interface (night only, your turn)
- Vote standings (day only)
- Test mode controls (test mode only)

**Tier 3 - Supporting** (Always accessible, but not primary):
- Chat
- Player list
- Activity timeline
- Settings

**Tier 4 - Tertiary** (Hidden by default):
- Game settings
- Host danger zone actions
- Full activity history
- Help/rules

### Per-Screen Hierarchy

#### Lobby
1. Ready status / Start button
2. Player list
3. Chat
4. Settings (host only)

#### Night
1. Action prompt (if your turn)
2. Stage indicator
3. Chat
4. Timer
5. Player list (minimal)

#### Day
1. Vote status (your vote + leader)
2. Chat with inline voting
3. Vote standings (collapsible)
4. Timer
5. Player list (minimal)

#### Ghost/Spectator
1. Role reveal
2. Current phase info
3. Chat (observer)
4. Action visibility (passive)

#### Test Mode
1. Test mode indicator
2. Player selector
3. Action controls for selected player
4. Regular game view (background)

---

## Layout Strategy

### Mobile Layout (Primary Design - up to 1024px)

**Core Principle**: Single column, progressive disclosure

**Regions**:
```
┌─────────────────────────┐
│ Sticky Header           │ ← Phase, Timer, Code
├─────────────────────────┤
│ Primary Surface         │ ← Context-specific main card
│ (Action/Status Card)    │   (Voting, Night Action, etc.)
│                         │
├─────────────────────────┤
│ Chat + Actions Combined │ ← Integrated, 40-60% screen
│ (Main Interaction Area) │
│                         │
│ [Input area]            │
└─────────────────────────┘

Floating Elements:
- FAB for primary action (if applicable)
- Bottom nav (if multi-tab needed)
```

**Key Changes from Current**:
- ✅ Eliminate tab navigation between Game/Chat
- ✅ Combine chat and action center on same view
- ✅ Use FAB for primary actions instead of hidden in tabs
- ✅ Collapse secondary info by default

**Specific Mobile Layouts**:

**Lobby Mobile**:
```
Header: Code, Copy button
Primary: Ready status card
Secondary: Player grid (horizontal scroll)
Tertiary: Chat (bottom sheet, expandable)
FAB: Ready/Unready button
```

**Night Mobile**:
```
Header: Phase, Round, Timer
Primary: Action card (contextual)
  - If your turn: Action prompt + player selection
  - If waiting: "Waiting..." + stage indicator
Secondary: Chat (50% height, always visible)
FAB: None (actions in primary card)
```

**Day Mobile**:
```
Header: Phase, Round, Timer
Primary: Vote status card (your vote + leader)
Secondary: Chat with inline vote buttons
Tertiary: Vote standings (expandable)
FAB: Quick vote menu
```

**Test Mode Mobile**:
```
Header: TEST MODE badge, Phase, Timer
Tab Bar: [Game View] [Admin Controls]
Admin View:
  - Player selector (horizontal tabs)
  - Action grid for selected player
  - Phase controls
```

---

### Desktop Layout (1024px and above)

**Core Principle**: Multi-column, persistent panels

**Two-Column Layout (1024-1280px)**:
```
┌──────────────────────┬─────────────────────────┐
│ Left Column (40%)    │ Right Column (60%)      │
│                      │                         │
│ Action Center        │ Chat                    │
│ (Sticky)             │ (Full height)           │
│                      │                         │
│ Player List          │                         │
│ (Compact)            │                         │
│                      │                         │
│ Host Controls        │                         │
│ (if host)            │                         │
└──────────────────────┴─────────────────────────┘
```

**Three-Column Layout (1280px+)**:
```
┌────────────┬─────────────────┬──────────────┐
│ Left (25%) │ Center (50%)    │ Right (25%)  │
│            │                 │              │
│ Players    │ Action Center   │ Chat         │
│ (Compact)  │ (Sticky top)    │ (Full height)│
│            │                 │              │
│ Host Ctrl  │ Activity        │              │
│            │ Timeline        │              │
│            │ (Scrollable)    │              │
│            │                 │              │
│ Settings   │ Vote Details    │              │
│            │ (if day)        │              │
└────────────┴─────────────────┴──────────────┘
```

**Key Changes from Current**:
- ✅ Chat always visible (not just on xl screens)
- ✅ Action Center more prominent
- ✅ Activity Timeline in center, not competing with actions
- ✅ Settings in left sidebar, not in tabs

---

### Sticky vs Contextual Regions

**Always Sticky**:
- Header (phase, timer, game code)
- Action Center on desktop
- Chat input area on mobile

**Conditionally Sticky**:
- Vote status card (day phase, mobile)
- Test mode indicator

**Never Sticky**:
- Activity timeline
- Player list (except header)
- Chat messages area

---

## Chat + Action Integration

### Core Challenge
> "Chat + Action Center must remain on the SAME screen"

### Solution: Contextual Integration

#### Mobile Approach: Vertical Split
```
┌─────────────────────────┐
│ Action Surface (40%)    │ ← Contextual to phase
│                         │   Collapses when not needed
│ [Your action UI here]   │
├─────────────────────────┤
│ Chat Surface (60%)      │ ← Always visible
│                         │   Primary interaction area
│ Messages                │
│ [Input]                 │
└─────────────────────────┘
```

**Benefits**:
- No tab switching
- Both visible simultaneously
- Action card collapses when not your turn
- Chat expands to fill space

**Implementation**:
- Action surface: `min-h-[30vh] max-h-[40vh]`
- Chat surface: `flex-1` (fills remaining space)
- On lobby: Action surface minimal (just status)
- On night (waiting): Action surface shows "Waiting..."
- On your turn: Action surface expands to show controls

#### Desktop Approach: Side-by-Side
```
┌────────────────┬──────────────┐
│ Action Center  │ Chat         │
│ (Center col)   │ (Right col)  │
│                │              │
│ Always visible │ Always       │
│ Sticky top     │ visible      │
│                │              │
│ Activity below │ Full height  │
└────────────────┴──────────────┘
```

**Benefits**:
- More screen real estate
- Both always visible
- No competition for space

---

### How Actions Appear/Disappear

**Progressive Disclosure Rules**:

1. **Lobby Phase**:
   - Action Surface: Ready status + button
   - Minimal height
   - Chat: Full conversation space

2. **Night Phase - Waiting**:
   - Action Surface: Collapsed to "Waiting..." banner
   - Shows stage indicator
   - Chat: Expanded for team coordination

3. **Night Phase - Your Turn**:
   - Action Surface: Expands to show player selection
   - Clear call-to-action
   - Chat: Compressed but still visible

4. **Day Phase**:
   - Action Surface: Vote status summary
   - Quick vote buttons
   - Chat: Integrated with inline voting

5. **Ghost/Spectator**:
   - Action Surface: Observer info + role reveals
   - Static (no actions)
   - Chat: Read-only view

6. **Test Mode Active**:
   - Toggle between normal view and admin view
   - Admin view replaces action surface
   - Chat remains visible

---

### Transition Animations

**Smooth State Changes**:
- Action surface expand/collapse: 200ms ease-in-out
- Chat height adjustment: 200ms ease-in-out
- Vote button appearance: fade-in 150ms
- Phase transition: 300ms with subtle pulse

**No Animation**:
- Timer updates
- Message additions
- Vote count changes

---

## Interaction Patterns

### Mobile Gestures

**Implemented Gestures**:
- ✅ Tap: Primary actions (vote, select, send)
- ✅ Swipe down: Refresh game state
- ❌ Long press: Not used (too easy to trigger accidentally)
- ❌ Swipe left/right: Not used (conflicts with scrolling)

**Rationale**: Keep it simple and predictable

### Tabs vs Drawers vs Sheets

**Current Approach**: Bottom tabs (Game, Players, Settings, Host)

**New Approach**: Minimize tabs, use contextual surfaces

**Decision Matrix**:

| Element | Pattern | Reason |
|---------|---------|--------|
| Chat | Always visible | Primary interaction |
| Actions | Contextual surface | Phase-dependent |
| Players | Collapsible list / Bottom drawer | Secondary info |
| Settings | Separate screen / Modal | Infrequent access |
| Test Mode | Tab toggle | Distinct context |
| Vote details | Expandable accordion | Progressive disclosure |

**Specific Implementations**:

1. **Players**: Bottom drawer on mobile (swipe up to expand)
2. **Settings**: Gear icon → Full-screen modal
3. **Test Mode**: Persistent tab bar when active
4. **Vote Details**: Accordion within day view
5. **Activity Timeline**: Desktop only (or expandable on mobile)

---

### Micro-Interactions

**Button States**:
- Default: Subtle border
- Hover: Background shift
- Active: Pressed state (scale 0.98)
- Disabled: 50% opacity + cursor-not-allowed
- Loading: Spinner + disabled state

**Vote Interactions**:
- Vote cast: Success pulse
- Vote changed: Warning shake
- Vote cleared: Fade out
- Leading candidate: Highlight pulse (subtle)

**Phase Transitions**:
- Night → Day: Sunrise gradient sweep
- Day → Night: Moonrise gradient sweep
- Game start: Fade in from lobby
- Game end: Confetti + winner banner slide-in

**Chat Interactions**:
- New message: Slide in from bottom
- Own message: Slide in from right
- System message: Fade in center
- Voice message: Waveform animation

---

### Touch Targets

**Minimum Sizes** (Mobile):
- Primary buttons: 44x44px
- Secondary buttons: 40x40px
- Player selection: 48x48px (larger hit area)
- Chat input: 56px height
- FAB: 56x56px

**Spacing**:
- Between action buttons: 12px minimum
- Between player avatars: 8px minimum
- Edges to content: 16px
- Section spacing: 24px

---

## Visual Direction

### Typography Philosophy

**Goals**:
- Legible at small sizes
- Clear hierarchy
- Not overwhelming

**Font Families**:
- Primary: Inter (already used - good choice)
- Accent: Space Grotesk (already used for headings)
- Monospace: System monospace (for codes)

**Type Scale**:
```
- Display (Winner banner): 2.5rem / 40px
- H1 (Phase header): 1.75rem / 28px
- H2 (Card titles): 1.25rem / 20px
- H3 (Section headers): 1.125rem / 18px
- Body: 1rem / 16px
- Small: 0.875rem / 14px
- Tiny (timestamps): 0.75rem / 12px
```

**Line Heights**:
- Display: 1.2
- Headings: 1.3
- Body: 1.5
- Small: 1.4

**Font Weights**:
- Regular: 400 (body text)
- Medium: 500 (emphasis)
- Semibold: 600 (headings)
- Bold: 700 (strong emphasis - sparingly)

---

### Color Philosophy

**Goals**:
- Calm, not overwhelming
- Clear phase differentiation
- Accessible contrast
- Dark mode friendly (already implemented)

**Principles**:
1. Use color sparingly - rely on layout and typography first
2. Reserve bright colors for critical states (elimination, winner)
3. Use subtle backgrounds instead of borders
4. Maintain WCAG AA contrast minimum

**Color Roles**:

**Phase Colors** (Subtle, not aggressive):
- Lobby: Neutral gray
- Night: Deep blue-purple (not pure black)
- Day: Warm amber (not bright yellow)
- Ended: Soft green (success)

**Status Colors**:
- Success: Green (vote confirmed, action complete)
- Warning: Amber (timer running low)
- Danger: Red (elimination, critical choice)
- Info: Blue (system messages)

**Team Colors** (Only when roles revealed):
- Mafia: Red-orange
- Village: Blue
- Neutral: Gray

**Current Implementation** (Keep):
```css
/* Tailwind CSS variables - already well-chosen */
--background: Adaptive
--foreground: Adaptive
--primary: Blue (good choice)
--destructive: Red
--muted: Gray
```

**Proposed Additions**:
```css
/* Phase-specific accents (optional) */
--night-accent: hsl(240, 40%, 25%)
--day-accent: hsl(45, 60%, 50%)

/* Subtle status backgrounds */
--success-bg: hsl(142, 50%, 96%)
--warning-bg: hsl(45, 90%, 96%)
--danger-bg: hsl(0, 70%, 96%)
```

---

### Icon Usage

**Icons** (Lucide already imported):
- ✅ Use for phase indicators (moon, sun)
- ✅ Use for actions (vote hand, message, settings)
- ✅ Use for status (check, x, clock)
- ❌ Don't use as decoration
- ❌ Don't use without text labels (accessibility)

**Icon Sizes**:
- Large (phase headers): 24px
- Medium (buttons): 20px
- Small (inline): 16px

**Icon Colors**:
- Inherit text color by default
- Accent color for emphasis (sparingly)

---

### Density Rules

**Mobile Density**: Comfortable (more spacing)
- Padding: 16px standard
- Between cards: 16px
- Line height: 1.5

**Desktop Density**: Compact (efficient use of space)
- Padding: 12px standard
- Between cards: 12px
- Line height: 1.4

**Information Density**:
- Show less on mobile (progressive disclosure)
- Show more on desktop (persistent panels)

---

### Border vs Shadow vs Background

**Prefer**:
1. Subtle background color differences
2. Soft shadows (elevation)
3. Borders sparingly (only for separation)

**Avoid**:
- Heavy borders everywhere
- Multiple shadow layers
- Aggressive color backgrounds

**Card Styling**:
```css
/* Current (borders everywhere) */
.card {
  border: 1px solid var(--border);
}

/* Proposed (subtle elevation) */
.card {
  background: var(--card);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid var(--border/0.5); /* Very subtle */
}

/* Emphasis cards */
.card-emphasis {
  background: var(--primary/0.05);
  border: 1px solid var(--primary/0.2);
}
```

---

### Spacing System

**Use Tailwind's spacing scale** (already in use):
- 1 unit = 4px
- Common: 2, 3, 4, 6, 8, 12, 16

**Component Spacing**:
- Card padding: `p-4` (16px)
- Card gap: `gap-4` (16px)
- Section spacing: `space-y-6` (24px)
- Button padding: `px-4 py-2` (16px × 8px)

---

## Implementation Roadmap

### Prerequisites
✅ This document approved
✅ All stakeholders reviewed
✅ No feature loss confirmed
✅ No game logic changes needed

### Phase 1: Foundation (Week 1)
**Goal**: Set up new architecture without breaking existing

- [ ] Create `components/ui/surfaces/` directory
  - [ ] `GameSurface.tsx` - Wrapper for game context
  - [ ] `ChatSurface.tsx` - Chat container
  - [ ] `ActionSurface.tsx` - Action/status container
  
- [ ] Create `components/ui/panels/` directory
  - [ ] `VotePanel.tsx` - Refactored voting interface
  - [ ] `NightActionPanel.tsx` - Night actions
  - [ ] `StatusPanel.tsx` - Compact status display

- [ ] Create `components/ui/layout/` directory
  - [ ] `MobileGameLayout.tsx` - New mobile structure
  - [ ] `DesktopGameLayout.tsx` - New desktop structure
  - [ ] `TestModeLayout.tsx` - Test mode wrapper

### Phase 2: Mobile Refactor (Week 2)
**Goal**: Implement new mobile layout

- [ ] Replace tab navigation with integrated view
- [ ] Implement Action + Chat combined surface
- [ ] Add collapsible player list drawer
- [ ] Implement FAB for primary actions
- [ ] Progressive disclosure for vote details
- [ ] Test all phases on mobile

### Phase 3: Desktop Optimization (Week 3)
**Goal**: Optimize desktop experience

- [ ] Implement 2-column layout (1024-1280px)
- [ ] Implement 3-column layout (1280px+)
- [ ] Make chat always visible
- [ ] Reorganize settings to sidebar
- [ ] Test all phases on desktop

### Phase 4: Test Mode Integration (Week 4)
**Goal**: Preserve test mode without cluttering main UI

- [ ] Create test mode toggle
- [ ] Implement separate admin view
- [ ] Maintain all existing admin functionality
- [ ] Test mode badge and indicators
- [ ] Verify all test scenarios work

### Phase 5: Polish & Cleanup (Week 5)
**Goal**: Remove old code, add micro-interactions

- [ ] Remove unused mobile tab components
- [ ] Remove duplicate layout logic
- [ ] Add transition animations
- [ ] Implement micro-interactions
- [ ] Accessibility audit
- [ ] Performance optimization

### Phase 6: Validation (Week 6)
**Goal**: Ensure nothing broken, all features work

- [ ] Full game playthrough (all roles)
- [ ] Mobile testing (various devices)
- [ ] Desktop testing (various resolutions)
- [ ] Test mode validation
- [ ] Accessibility testing
- [ ] Performance testing

### Phase 7: Documentation & Handoff (Week 7)
**Goal**: Document changes, train team

- [ ] Update component documentation
- [ ] Create migration guide
- [ ] Record demo video
- [ ] User testing feedback
- [ ] Final adjustments
- [ ] Release

---

## Appendix: Component Comparison

### Before Redesign
```
page.tsx
├── MobileTabs
│   ├── Game Tab (Action + Chat)
│   ├── Players Tab
│   ├── Settings Tab
│   └── Host Tab
└── Desktop Layout
    ├── PlayerList (left)
    ├── ActionCenter + Timeline (center)
    └── ChatPanel (right, xl only)
```

### After Redesign
```
page.tsx
├── MobileGameLayout
│   ├── Header (sticky)
│   ├── ActionSurface (contextual)
│   ├── ChatSurface (always visible)
│   ├── PlayerDrawer (bottom sheet)
│   └── FAB (primary action)
└── DesktopGameLayout
    ├── LeftColumn
    │   ├── PlayerList
    │   ├── HostControls
    │   └── Settings
    ├── CenterColumn
    │   ├── ActionCenter (sticky)
    │   └── ActivityTimeline
    └── RightColumn
        └── ChatPanel
```

---

## Notes & Decisions

**Key Decisions**:
1. ✅ Eliminate mobile tabs in favor of integrated view
2. ✅ Chat always visible, never hidden
3. ✅ Progressive disclosure over constant visibility
4. ✅ Test mode as overlay/toggle, not mixed in main view
5. ✅ FAB for primary actions on mobile
6. ✅ Collapsible player list instead of separate tab

**Rejected Approaches**:
1. ❌ Swipe gestures (too easy to trigger accidentally)
2. ❌ Hamburger menu (hides critical navigation)
3. ❌ Full-screen action modals (breaks flow)
4. ❌ Floating chat window (overlaps content)
5. ❌ Separate pages for each phase (too many navigations)

**Open Questions**:
- Should player list be bottom drawer or inline collapsible?
  - **Decision**: Bottom drawer on mobile (better thumb reach)
- Should settings be modal or separate page?
  - **Decision**: Modal (less navigation)
- Should activity timeline be mobile-visible or desktop-only?
  - **Decision**: Desktop primary, mobile expandable (lower priority)

---

## Success Metrics

**Measure Before/After**:
1. Tap count to cast vote (target: <3 taps)
2. Time to find primary action (target: <2 seconds)
3. Thumb reach comfort (target: 90%+ one-handed)
4. Cognitive load survey (target: 40% reduction)
5. Feature discoverability (target: 100% maintained)

**Validation Checklist**:
- [ ] All phases playable on 375px wide screen
- [ ] One-hand usability confirmed
- [ ] Chat never hidden or inaccessible
- [ ] Test mode fully functional
- [ ] No console errors
- [ ] No overlapping UI
- [ ] Smooth transitions
- [ ] Fast performance (< 100ms interactions)

---

**End of Document**
