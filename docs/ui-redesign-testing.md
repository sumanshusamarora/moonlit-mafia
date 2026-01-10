# UI Redesign - Testing Checklist

## Overview
Comprehensive testing checklist for the UI redesign to ensure no functionality loss.

## Device Testing

### Mobile (< 1024px)
- [ ] iPhone SE (375px width)
- [ ] iPhone 12/13 (390px width)
- [ ] iPhone 14 Pro Max (430px width)
- [ ] Android small (360px width)
- [ ] Android medium (412px width)
- [ ] Tablet portrait (768px width)

### Desktop
- [ ] Small laptop (1024px width)
- [ ] Medium desktop (1280px width)
- [ ] Large desktop (1920px width)
- [ ] Ultra-wide (2560px width)

## Phase Testing

### Lobby Phase
#### Mobile
- [ ] Game code visible and copyable
- [ ] Ready/Unready button accessible
- [ ] Player list visible in drawer
- [ ] Ready status updates in real-time
- [ ] Chat accessible and functional
- [ ] (Host) Start button appears when all ready
- [ ] (Host) Settings accessible

#### Desktop
- [ ] All lobby elements visible
- [ ] Player list in left column
- [ ] Host controls in left column
- [ ] Chat in right column
- [ ] No overlapping elements

### Night Phase
#### Mobile
- [ ] Phase indicator visible in header
- [ ] Role reminder visible
- [ ] Action prompt shows when your turn
- [ ] "Waiting..." shows when not your turn
- [ ] Chat always visible below actions
- [ ] Player drawer accessible
- [ ] Test mode controls visible (if test mode)

#### Desktop
- [ ] Same as mobile plus 3-column layout works
- [ ] Activity timeline visible
- [ ] Chat persistent in right column

#### Role-Specific
- [ ] **Mafia**: Can select target, see team votes
- [ ] **Doctor**: Can select protection target
- [ ] **Detective**: Can investigate, see results
- [ ] **Villager**: Sees waiting message
- [ ] **Dead/Spectator**: Sees observer view with all roles

### Day Phase
#### Mobile
- [ ] Vote status card visible and sticky
- [ ] Your vote displayed prominently
- [ ] Leading candidate shown
- [ ] Chat + voting integrated
- [ ] Player drawer for voting
- [ ] Vote changes reflected immediately
- [ ] Can clear vote

#### Desktop
- [ ] Voting panel in action center
- [ ] Vote transparency (who voted for whom)
- [ ] Chat for discussion
- [ ] Activity timeline shows vote changes

### Game End
#### Mobile
- [ ] Winner banner visible
- [ ] Full role reveal accessible
- [ ] Game stats visible
- [ ] (Host) Archive/Restart options
- [ ] Chat history preserved

#### Desktop
- [ ] Same as mobile
- [ ] All columns display correctly

## Feature-Specific Testing

### Chat
- [ ] Send text messages
- [ ] Send voice messages
- [ ] Receive messages in real-time
- [ ] Voice message playback
- [ ] Autoplay settings work
- [ ] AI defense feature (if triggered)
- [ ] Emoji picker functional
- [ ] Phase-specific chat visibility

### Voting
- [ ] Cast vote
- [ ] Change vote
- [ ] Clear vote
- [ ] See vote counts
- [ ] See who voted (non-anonymous mode)
- [ ] Anonymous mode hides voters
- [ ] Voting locked during night
- [ ] (Host) Eliminate button appears when votes complete

### Test Mode
#### Mobile
- [ ] Test mode badge visible
- [ ] Admin Control Panel accessible
- [ ] Can control any player's actions
- [ ] Can submit night actions for all roles
- [ ] Can submit day votes for all players
- [ ] Can clear votes
- [ ] All admin tabs work
- [ ] Doesn't interfere with normal game view

#### Desktop
- [ ] Same as mobile
- [ ] Admin panel fits in layout

### Host Controls
- [ ] Start game (lobby)
- [ ] Advance phase
- [ ] Extend timer
- [ ] Reset timer
- [ ] Restart lobby
- [ ] Peek at roles (with confirmation)
- [ ] Eliminate player (day phase)
- [ ] Archive game

### Settings
- [ ] Accessible from player drawer or left column
- [ ] Voice autoplay toggle works
- [ ] Settings persist
- [ ] No interference with game

## One-Hand Usability (Mobile)

- [ ] All primary actions within thumb reach
- [ ] FAB in comfortable position (bottom-right)
- [ ] Player drawer swipes up easily
- [ ] No need to reach top of screen for critical actions
- [ ] Chat input always accessible
- [ ] Vote buttons thumb-friendly size (48px min)

## Visual Regression

- [ ] No overlapping UI elements
- [ ] No text cutoff
- [ ] No broken layouts at any breakpoint
- [ ] Smooth transitions between states
- [ ] Loading states clear
- [ ] Error states visible

## Performance

- [ ] Page loads quickly
- [ ] No layout shift
- [ ] Smooth scrolling
- [ ] FAB doesn't lag
- [ ] Drawer opens smoothly
- [ ] No console errors
- [ ] No memory leaks during long sessions

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus indicators visible
- [ ] Touch targets min 44x44px
- [ ] Color contrast meets WCAG AA
- [ ] No reliance on color alone

## Edge Cases

- [ ] Very long player names
- [ ] Many players (8+)
- [ ] Few players (3-4)
- [ ] Long chat messages
- [ ] Many voice messages
- [ ] Rapid phase changes
- [ ] Network interruption
- [ ] Browser refresh recovery

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Integration Testing

- [ ] Create game → Join → Ready → Start → Play → End flow
- [ ] Multiple players simultaneously
- [ ] Test mode + regular mode switching
- [ ] Voice + text messages mixed
- [ ] Vote changes during discussion
- [ ] Elimination during day phase
- [ ] All roles in one game

## Regression Testing

Compare with old UI:
- [ ] All old features still work
- [ ] No new bugs introduced
- [ ] Performance same or better
- [ ] Accessibility same or better

## Sign-Off

### Mobile Testing
- [ ] Tester 1: ___________ Date: ___________
- [ ] Tester 2: ___________ Date: ___________

### Desktop Testing
- [ ] Tester 1: ___________ Date: ___________
- [ ] Tester 2: ___________ Date: ___________

### Host/Admin Testing
- [ ] Tester: ___________ Date: ___________

### All Features Validated
- [ ] Developer: ___________ Date: ___________
- [ ] QA Lead: ___________ Date: ___________

## Issues Found

| Issue | Severity | Phase | Device | Status | Fixed By |
|-------|----------|-------|--------|--------|----------|
|       |          |       |        |        |          |

## Notes

Add any observations, suggestions, or concerns here.
