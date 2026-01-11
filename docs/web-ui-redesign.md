# Web UI Redesign Plan

## 1. Current Pain Points (Web Screenshot Review)
- Three equally weighted columns draw attention everywhere at once; no focal point for the active phase.
- Heavy use of bordered cards and pastel panels produces visual noise and does not convey hierarchy.
- Host/admin controls sit in-line with player tools, distracting non-host players and cluttering the layout.
- Chat composer competes with voting/actions; users must choose between reading chat and performing phase actions.
- Color palette is inconsistent and loud, making status indicators hard to parse quickly.
- Multiple nested scroll regions require constant scrolling and context switching, especially in the action area.
- Test Mode controls are unreliable on desktop; responsive hacks hide or cripple critical admin tooling.
- Voice recorder state persists after send, leaving the send button active and allowing duplicate submissions.

## 2. Target Layout Diagram (Desktop)
```
┌────────────────────────────────────────────────────────────────┐
│  Moonlit Mafia · Phase: Day 2 · Time Left: 02:30 · Code: 4F9K │
└────────────────────────────────────────────────────────────────┘
│ LEFT CONTEXT  │        CENTER PRIMARY SURFACE        │ CHAT & ACTIONS │
│ (players)     │        (phase-dominant content)       │ (always on)    │
└───────────────┴──────────────────────────────────────┴────────────────┘
```
- **Left (Context, ~20%)**: Compact player list, alive/dead badges, self-role chip only.
- **Center (Primary, ~50–55%)**: Dynamic surface that swaps between voting, actions, narration, or setup.
- **Right (Engagement, ~25–30%)**: Chat transcript, action footer, voice/emoji controls, AI helper slot.

## 3. Panel Responsibilities
- **Top Bar**: Game name, phase state, timer, lobby code, quick status icons (host badge, test mode).
- **Left Context Panel**:
  - Player roster (logical groups: alive, dead, observers).
  - Status icons only (target, silenced, protected) with subtle color indicators.
  - Your role display (hidden for others) with discreet styling.
  - No collapsible cards, no admin actions.
- **Center Primary Surface**:
  - Day: accusation summary, vote tallies, vote CTA, tie handling.
  - Night: role action prompts, target selectors, countdown.
  - Elimination/Reveal: narration, outcomes, next phase CTA.
  - Lobby/Test Mode: ready states, host controls, simulated players.
  - Single scroll, full-height card with soft elevation, prominent primary button(s).
- **Right Chat & Action Center**:
  - Chat feed (single scroll area, sticky headers optional).
  - Composer docked at bottom with text + voice + emoji + AI defense slot.
  - Action overlays slide in above composer (e.g., defend prompt, whisper confirmation).
  - Host/Test-Mode tools available via tabs above chat feed (Host, Test Mode, Activity).

## 4. Phase-Based UI Behavior
- **Lobby**:
  - Center: lobby management (player readiness, start game).
  - Host/Test tabs unlocked; players see read-only status.
  - Chat available for coordination.
- **Day Phase**:
  - Center: vote tracker with suspect cards, accusation log, "Cast/Change Vote" CTA.
  - Right: chat + defense prompts; when accused, defense prompt overlays above composer.
  - Timers shown in top bar and subtle progress indicator under phase title.
- **Night Phase**:
  - Center: role-specific action module (mafia, doctor, detective). Non-actors see storytelling.
  - Right: chat transitions to night chat (if allowed). Voice input available for allowed roles.
- **Elimination / Story Reveal**:
  - Center: cinematic narration card with large typography.
  - Right: chat remains visible for reactions.
- **Test Mode**:
  - Right panel: dedicated Test Mode tab exposing bot control, action overrides, timeline scrub.
  - Center: mirrors actual phase surface so admin can preview and trigger transitions.

## 5. Visual System
- **Color Palette**:
  - Background: `#0F1014` deep night with subtle noise (optional) or `#111320` solid.
  - Surface: `#1A1C27` elevated cards with soft shadow.
  - Primary: Moon purple `#7C4DFF` for CTAs, highlights, focus states.
  - Accent/Status: Success `#2ECC71`, Warning `#F1C40F`, Danger `#E74C3C`, Neutral `#95A5A6`.
  - Use saturation sparingly; rely on typography and spacing for hierarchy.
- **Typography**:
  - Single font family (e.g., Inter) with optical sizing enabled.
  - Scales: Phase title 24–28px, panel headings 18px, body text 14–16px, metadata 12px.
  - Uppercase reserved for small labels; avoid mixing fonts.
- **Components**:
  - Replace card borders with 4–8px corner radius and drop shadow.
  - Use spacing tokens (8/12/16/24/32) to separate content.
  - Buttons: high-contrast primary, ghost secondary, destructive tertiary.

## 6. Test Mode UX (Web)
- Host sees a persistent toggle or badge in top bar when Test Mode active.
- Right panel tabs include **Host**, **Test Mode**, **Chat**; default to Chat for non-hosts.
- Test Mode tab contents:
  - Simulated player list with role selectors and ready toggles.
  - Phase jump controls (Day ↔ Night ↔ Reveal) with clear warnings.
  - Action triggers (force vote, resolve night) grouped by phase.
- All controls mouse-friendly with full hover feedback; no reliance on touch gestures.
- Layout uses responsive grid but keeps tools visible on desktop (no hidden drawers).

## 7. Voice & Chat Integration Rules
- Voice recorder resets instantly on send (clears blob, restores mic icon, disables send until ready).
- Send button handles both text and queued voice; once triggered, button enters loading state.
- Chat composer pinned bottom-right; actions (defend, respond) stack above composer.
- Emoji and AI helper open lightweight popovers that do not cover composer.
- Voice preview adopts same visual language as chat attachments (soft surface, trash icon).
- Chat feed shares the right panel vertical space with action prompts; ensure min height for message history.

## 8. Cleanup Targets
- Remove unused cards, redundant borders, and duplicate CSS utilities.
- Delete mobile-only hacks that hide host/test controls on desktop.
- Decommission obsolete components replaced by new phase surfaces.
- Document all removals in PR description / commit messages for traceability.
