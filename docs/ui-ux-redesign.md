Moonlit Mafia – Full UX & UI Redesign (Web-First)

1. Goals & Non-Negotiables
Primary Goals

Dramatically improve clarity, calmness, and usability

Make web experience first-class

Preserve 100% of existing functionality

Make Test Mode usable, powerful, and obvious

Make role feedback (e.g. Detective checks) immediately understandable

Non-Negotiables

Chat and actions must be on the same screen

No functionality removal

No game logic changes

UI must work in dark mode and light mode

Test Mode must be fully usable on web

2. Core UX Problems (From Current UI)
Structural

Center panel underutilized

Chat + Activity separated → cognitive friction

Test Mode feels bolted-on, not integrated

Horizontal tabs overflow without scroll (broken)

Visual

Dark mode contrast failures (text invisible)

Too many rounded cards competing for attention

Inconsistent hierarchy (everything looks “important”)

Gameplay UX

Detective feedback unclear

Action results buried or ephemeral

Logs not persistent or scannable

3. New High-Level Layout (Web)
Overall Structure
┌───────────────────────────────────────────────────────────┐
│ Top Bar: Phase · Timer · Code · Test Mode Badge           │
└───────────────────────────────────────────────────────────┘

┌──────────────┬─────────────────────────────┬─────────────┐
│ Players      │ Main Game Surface            │ Chat & Log  │
│ (Context)    │ (Phase + Actions + Results)  │ + Actions   │
└──────────────┴─────────────────────────────┴─────────────┘

4. Panel Responsibilities
LEFT — Players Panel (Context Only)

Purpose: Awareness, not interaction

Compact vertical list

Clear status icons:

Alive

Dead

Ghost

Test

Role only visible for self

No cards → flat list with subtle separators

CENTER — Main Game Surface (Primary Focus)

This is the heart of the game.

Phase Header

Large, centered

Icon + label

Timer directly below

Action Result Zone (IMPORTANT)

Used for:

Detective checks

Doctor saves

Mafia kills

Narrator events

Example:

🕵️ Detective Result
You investigated Test Player 3
✅ NOT Mafia


This area:

Is persistent for the phase

Does not disappear after a few seconds

Role-Specific Panels

Only visible when relevant.

Detective

Clear result card:

Green = Not Mafia

Red = Mafia

Investigation Log

Scrollable list

Each entry:

Player

Result

Round number

RIGHT — Chat + Activity + Actions (Unified)

This becomes a single vertical surface.

Tabs (Scrollable)

Chat

Activity (Narrator + system)

Host (only for host)

Test (only in Test Mode)

Settings

⚠️ Tabs MUST be horizontally scrollable on web and mobile.

Chat Tab

Standard chat

Voice + AI + emoji live here

Input docked at bottom

Activity Tab

All narrations

Eliminations

Phase changes

Detective logs (read-only mirror)

5. Test Mode UX (Major Fix)
Placement

Test Mode panel moves to CENTER

Appears under Phase Header when enabled

Test Player Control

Vertical list instead of tabs

Each player expands accordion-style

Actions appear inside player section

No horizontal scrolling. Ever.

6. Detective UX (Critical Fix)
Immediate Feedback

Result shown instantly in Action Result Zone

Color + icon + text

Persistent Log

Investigation history visible:

Center panel (active)

Activity tab (historical)

No ambiguity. No hidden results.

7. Visual Design System
Colors

Background: near-black (#0F1117)

Surface: dark slate (#171A23)

Primary: moon purple

Success: muted green

Danger: muted red

Typography

One font family

Clear hierarchy:

Phase title: largest

Action result: medium

Metadata: small, low contrast

Cards

Fewer cards

More spacing

Elevation instead of borders

8. Dark Mode Rules (Strict)

All text must meet contrast AA

No gray-on-gray text

Buttons must have visible focus states

Icons must not rely on color alone

9. Cleanup Rules

Remove:

Unused components

Mobile-only hacks affecting web

Dead CSS

Do not remove game logic

Every deletion must be intentional

10. Success Criteria

Detective always knows result

Test Mode fully usable on web

No invisible text

No horizontal overflow bugs

Chat + actions never separated

UI feels calmer, clearer, premium