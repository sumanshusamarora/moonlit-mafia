# UI Redesign - Cleanup Candidates

## Overview
This document lists components and code that may no longer be needed after the UI redesign.

## ⚠️ Important
Do NOT remove these until after thorough testing confirms they are truly unused.

## Potentially Unused Components

### 1. `components/ui/tabs-mobile.tsx`
- **Status**: No longer used in main game page
- **Original Purpose**: Mobile tab navigation (Game/Players/Settings/Host)
- **Replaced By**: `MobileGameLayout` with integrated view
- **Check Before Removing**: 
  - Search entire codebase for `MobileTabs` usage
  - Verify no other pages use it
  - Test all game flows first

### 2. `components/ui/collapsible-section.tsx`
- **Status**: No longer used in main game page
- **Original Purpose**: Host controls collapsible sections
- **Replaced By**: Direct layout in `DesktopGameLayout`
- **Check Before Removing**:
  - May still be useful for future features
  - Consider keeping as reusable component

### 3. `components/game/player-list-compact.tsx`
- **Status**: No longer used in mobile view
- **Original Purpose**: Compact player list in tabs
- **Replaced By**: `PlayerDrawer` with full player cards
- **Check Before Removing**:
  - Still used in some contexts?
  - May be useful for other views

## Confirmed Still Needed

### Components Preserved
- ✅ `ActionCenter` - Core game interface
- ✅ `ChatPanel` - Chat functionality
- ✅ `VotingPanel` - Day phase voting
- ✅ `AdminControlPanel` - Test mode controls
- ✅ `PlayerList` - Desktop player list
- ✅ `ActivityTimeline` - Game event log
- ✅ `SettingsPanel` - User settings
- ✅ `FloatingActionButton` - Mobile primary actions
- ✅ `AppShell` - Top-level layout wrapper

### New Components Added
- ✅ `MobileGameLayout` - Mobile layout orchestrator
- ✅ `DesktopGameLayout` - Desktop layout orchestrator
- ✅ `ActionSurface` - Action container
- ✅ `ChatSurface` - Chat container
- ✅ `GameSurface` - Game wrapper
- ✅ `StatusPanel` - Compact status display
- ✅ `PlayerDrawer` - Mobile player access
- ✅ `Sheet` - Bottom sheet component

## Removal Checklist

Before removing any component:
- [ ] Search codebase for all imports
- [ ] Check if used in other pages/routes
- [ ] Test all game phases without it
- [ ] Verify no runtime errors
- [ ] Check if it's a reusable utility
- [ ] Document removal reason in commit

## Dead Code Search Commands

```bash
# Find all imports of a component
grep -r "from.*MobileTabs" --include="*.tsx" --include="*.ts"

# Find all usages
grep -r "MobileTabs" --include="*.tsx" --include="*.ts"

# Find all imports of CollapsibleSection
grep -r "CollapsibleSection" --include="*.tsx" --include="*.ts"
```

## Recommendation

**DO NOT REMOVE YET**. Wait for:
1. Complete testing of all game phases
2. User feedback on new layout
3. Confirmation no edge cases need old components
4. At least 1 week of production use

After validation period, create separate cleanup PR with:
- Clear justification for each removal
- Before/after component tree
- Confirmation of testing
