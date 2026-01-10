# Manual Testing Scenarios for AI Defense Feature

## Prerequisites
1. Have a running instance of the app (local or deployed)
2. For positive tests, set `OPENAI_API_KEY` in environment variables
3. For negative tests, ensure `OPENAI_API_KEY` is NOT set

## Test Scenario 1: Feature Visibility with API Key

**Setup:**
- Set `OPENAI_API_KEY=sk-...` in `.env.local`
- Create a test game with 4+ players
- Start the game and advance to day phase
- Have at least 2 players vote for the same person

**Expected Result:**
- ✅ The player with the highest votes sees a card above the chat input
- ✅ Card shows: "🤖 Need help defending yourself?"
- ✅ Card has button: "Draft defense with AI"
- ✅ Players without votes OR lower votes do NOT see the card

## Test Scenario 2: Feature Invisible without API Key

**Setup:**
- Ensure `OPENAI_API_KEY` is NOT set (or remove from .env.local)
- Same setup as Scenario 1

**Expected Result:**
- ✅ NO card appears for any player
- ✅ NO disabled buttons or placeholders
- ✅ Chat interface looks completely normal
- ✅ No console errors about missing features

## Test Scenario 3: Generate Defense

**Setup:**
- With API key set
- Be the highest-voted player
- Click "Draft defense with AI"

**Expected Result:**
- ✅ Button shows loading state: "Generating..."
- ✅ After 1-3 seconds, an editable textarea appears with AI-generated text
- ✅ Text is in first person (e.g., "I'm not Mafia because...")
- ✅ Text is 4-5 sentences max
- ✅ Text references game context (eliminations, votes, etc.)

## Test Scenario 4: Edit and Send Defense

**Setup:**
- Generated defense text is visible
- Modify the text in the textarea

**Expected Result:**
- ✅ Can freely edit all text
- ✅ Can delete parts or rewrite completely
- ✅ "Send Message" button is enabled when text is present
- ✅ Clicking "Send Message" posts to chat
- ✅ Message appears in chat like a normal player message
- ✅ No special markers indicating it was AI-generated
- ✅ After sending, the defense card disappears

## Test Scenario 5: Cancel/Dismiss Flow

**Setup:**
- Defense card is visible (either before or after generation)
- Click the X button or "Cancel" button

**Expected Result:**
- ✅ Card disappears completely
- ✅ No message is sent to chat
- ✅ Can still type and send normal messages
- ✅ Card will reappear if player still has highest votes

## Test Scenario 6: Rate Limiting (One Per Round)

**Setup:**
- Use the AI defense feature once
- Send the message to chat
- Try to click the area where the card was

**Expected Result:**
- ✅ Card does NOT reappear in the same round
- ✅ Even if player gets more votes, no new card
- ✅ After round ends (advance to night, then back to day), card can appear again

## Test Scenario 7: Tie Scenario

**Setup:**
- Day phase with 4+ players
- Player A gets 2 votes
- Player B gets 2 votes
- Player C gets 1 vote
- Players A and B are tied for highest

**Expected Result:**
- ✅ BOTH Player A and Player B see the defense card
- ✅ Player C does NOT see the card
- ✅ Each can generate their own defense independently
- ✅ Rate limiting applies per player (not shared)

## Test Scenario 8: Test Mode Support

**Setup:**
- Create a game in Test Mode (checkbox when creating game)
- Admin acts as a player
- Admin gets highest votes

**Expected Result:**
- ✅ Admin sees the AI defense card
- ✅ Can generate, edit, and send defense
- ✅ Feature works identically to normal mode

## Test Scenario 9: Error Handling

**Setup:**
- Set an invalid `OPENAI_API_KEY` (e.g., "sk-invalid")
- Try to generate a defense

**Expected Result:**
- ✅ Loading state appears briefly
- ✅ Error message appears: "Failed to generate defense"
- ✅ Can dismiss the error
- ✅ No crash or console spam
- ✅ Normal chat still works

## Test Scenario 10: Night Phase Behavior

**Setup:**
- Use AI defense during day
- Advance to night phase

**Expected Result:**
- ✅ Defense card does NOT appear during night
- ✅ No errors or console warnings
- ✅ Voting is locked anyway (existing behavior)

## Test Scenario 11: Observer/Spectator Behavior

**Setup:**
- Join a game in progress as a spectator
- OR be eliminated and become an observer

**Expected Result:**
- ✅ Defense card NEVER appears for spectators/observers
- ✅ Even if spectator would have "highest votes" (they can't vote)
- ✅ No errors or console warnings

## Quick Verification Checklist

After implementing, verify:
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser (even without API key)
- [ ] Feature is completely invisible without API key
- [ ] Highest-voted detection works correctly
- [ ] Tie scenarios work (all tied players see it)
- [ ] Rate limiting works (once per round)
- [ ] Edit flow works smoothly
- [ ] Cancel flow works
- [ ] Send flow integrates with existing chat
- [ ] Test mode works
- [ ] Error handling is graceful
- [ ] No security warnings in browser console
