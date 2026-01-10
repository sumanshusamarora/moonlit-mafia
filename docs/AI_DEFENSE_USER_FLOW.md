# AI Defense Feature - User Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME STATE CHECK                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  Is it DAY phase?    │
                    └──────────────────────┘
                         │           │
                        YES         NO → Feature hidden
                         │
                         ▼
                    ┌──────────────────────┐
                    │ Does player have     │
                    │ highest votes?       │
                    └──────────────────────┘
                         │           │
                        YES         NO → Feature hidden
                         │
                         ▼
                    ┌──────────────────────┐
                    │ Already used this    │
                    │ round?               │
                    └──────────────────────┘
                         │           │
                        NO          YES → Feature hidden
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE APPEARS                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │ 🤖 Need help defending yourself?                   │ [X]     │
│  │                                                     │         │
│  │ Generate a short defense based on the game so far. │         │
│  │                                                     │         │
│  │ ┌────────────────────────────────────────────────┐ │         │
│  │ │       [Draft defense with AI]                  │ │         │
│  │ └────────────────────────────────────────────────┘ │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               Click Button         Click [X]
                    │                     │
                    ▼                     ▼
          ┌─────────────────┐      ┌──────────┐
          │ Generating...   │      │ Dismiss  │
          │ (Loading)       │      │ Feature  │
          └─────────────────┘      └──────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 AI RESPONSE RECEIVED                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │ 🤖 AI-Generated Defense                            │ [X]     │
│  │                                                     │         │
│  │ Edit the defense below before sending:             │         │
│  │                                                     │         │
│  │ ┌────────────────────────────────────────────────┐ │         │
│  │ │ Look, I know things look bad, but think       │ │         │
│  │ │ about it - if I were Mafia, why would I have  │ │         │
│  │ │ voted the way I did? That doesn't make sense  │ │         │
│  │ │ from a Mafia perspective. [EDITABLE]          │ │         │
│  │ └────────────────────────────────────────────────┘ │         │
│  │                                                     │         │
│  │ ┌──────────────┐  ┌──────────────────────────────┐│         │
│  │ │   Cancel     │  │      Send Message            ││         │
│  │ └──────────────┘  └──────────────────────────────┘│         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                    ┌──────────┴──────────┐
                    │                     │
               Edit & Send            Cancel
                    │                     │
                    ▼                     ▼
          ┌─────────────────┐      ┌──────────┐
          │ Message sent to │      │ Dismiss  │
          │ chat (normal)   │      │ Feature  │
          └─────────────────┘      └──────────┘
                    │
                    ▼
          ┌─────────────────┐
          │ Feature hidden  │
          │ (used this rnd) │
          └─────────────────┘
```

## Key UI States

### State 1: Initial Nudge (No API Key)
```
┌────────────────────────────────────┐
│ [NOTHING VISIBLE]                  │
│ Chat works normally                │
│ No buttons, no placeholders        │
└────────────────────────────────────┘
```

### State 2: Initial Nudge (With API Key, Highest Votes)
```
┌────────────────────────────────────────────┐
│ 🤖 Need help defending yourself?         X│
│                                            │
│ Generate a short defense based on the     │
│ game so far.                               │
│                                            │
│ ┌────────────────────────────────────────┐│
│ │      Draft defense with AI             ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### State 3: Loading State
```
┌────────────────────────────────────────────┐
│ 🤖 Need help defending yourself?         X│
│                                            │
│ Generate a short defense based on the     │
│ game so far.                               │
│                                            │
│ ┌────────────────────────────────────────┐│
│ │ ⏳ Generating...                        ││
│ └────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### State 4: Edit State
```
┌────────────────────────────────────────────┐
│ 🤖 AI-Generated Defense                  X│
│                                            │
│ Edit the defense below before sending:    │
│                                            │
│ ┌────────────────────────────────────────┐│
│ │ I understand the votes are against me, ││
│ │ but consider my actions this whole    ││
│ │ game. Would Mafia really play like    ││
│ │ this? [FULLY EDITABLE]                ││
│ └────────────────────────────────────────┘│
│                                            │
│ ┌──────┐  ┌───────────────────────────────┤
│ │Cancel│  │     Send Message              │
│ └──────┘  └───────────────────────────────┘
└────────────────────────────────────────────┘
```

### State 5: Error State
```
┌────────────────────────────────────────────┐
│ Failed to generate defense. Please try   X│
│ again.                                     │
└────────────────────────────────────────────┘
```

## Integration Points

### In Chat Panel
```
┌─────────────────────────────────────────┐
│ Day chat                                │
├─────────────────────────────────────────┤
│                                         │
│ [AI Defense Nudge - if conditions met] │ ← NEW
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Share a hunch with the town...      │ │ ← Existing
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 😀 Emoji   🎤 Voice        [Send]      │ ← Existing
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Chat Messages...                    │ │ ← Existing
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Technical Flow

```
Player with highest votes
         │
         ▼
useAIDefenseDraft() hook
  ├─ Calculates highest votes
  ├─ Checks if already used
  └─ Returns canShowDefense: true
         │
         ▼
AIDefenseNudge component renders
         │
         ▼
User clicks "Draft defense"
         │
         ▼
POST /api/ai/defense
  ├─ Validates API key (404 if missing)
  ├─ Builds prompt with game context
  ├─ Calls OpenAI API
  └─ Returns defense text
         │
         ▼
Text appears in editable textarea
         │
         ▼
User edits and clicks "Send"
         │
         ▼
Existing chat handler (onSend)
         │
         ▼
Message posted to Firestore
  (indistinguishable from normal)
         │
         ▼
Feature marks as "used this round"
```

## Real-World Example

**Scenario**: Day 2, Alice has 3 votes (highest)

1. Alice sees in her chat:
   ```
   ┌────────────────────────────────┐
   │ 🤖 Need help defending yourself? │
   │ Generate a short defense...      │
   │ [Draft defense with AI]          │
   └────────────────────────────────┘
   ```

2. Alice clicks the button

3. AI generates (based on game history):
   ```
   Look, I voted for Bob yesterday because his 
   behavior seemed suspicious, not because I'm 
   Mafia. If I were Mafia, I would've stayed 
   quiet instead of drawing attention to myself. 
   Think about the pattern here.
   ```

4. Alice edits it:
   ```
   I voted for Bob yesterday because his behavior 
   was suspicious. If I were Mafia, why would I 
   draw attention to myself? Plus I've been 
   actively participating in discussions.
   ```

5. Alice clicks "Send Message"

6. Everyone sees in chat:
   ```
   Alice: I voted for Bob yesterday because his 
   behavior was suspicious. If I were Mafia, why 
   would I draw attention to myself? Plus I've 
   been actively participating in discussions.
   ```
   (No indication it was AI-assisted)

## Summary

✅ **Helpful**: Suggests defense based on actual game context  
✅ **Non-intrusive**: Only appears when relevant  
✅ **Optional**: Can dismiss or ignore completely  
✅ **Editable**: Full control over final message  
✅ **Invisible**: No trace without API key  
✅ **Integrated**: Uses existing chat system  
