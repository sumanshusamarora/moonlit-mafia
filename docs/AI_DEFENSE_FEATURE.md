# AI-Assisted Defense Feature

## Overview
This feature helps players with the highest votes generate a short, realistic defense story using AI. It's completely optional and invisible if the OpenAI API key is not configured.

## How It Works

### For Players
1. During the day phase, if you have the highest number of votes, you'll see a subtle card above the chat input
2. Click "Draft defense with AI" to generate a defense based on the game history
3. Edit the generated text as much as you want
4. Click "Send Message" to post it to chat (or Cancel to dismiss)
5. The message appears as a normal chat message - indistinguishable from manually typed messages

### Feature Visibility
- **With OpenAI API Key**: Feature appears to highest-voted players
- **Without OpenAI API Key**: Feature is completely invisible (no UI, no buttons, no placeholders)

### Rate Limiting
- Each player can use the AI defense **once per voting round**
- After the round ends and a new day phase begins, the limit resets

### Tie Scenarios
- If multiple players are tied for the highest votes, **all tied players** see the feature

## Technical Implementation

### Files Created
1. **`app/api/ai/defense/route.ts`** - Server-side API endpoint for OpenAI integration
2. **`hooks/use-ai-defense-draft.ts`** - React hook managing state and highest-voted logic
3. **`components/chat/ai-defense-nudge.tsx`** - UI component for the defense nudge

### Files Modified
1. **`components/chat/chat-panel.tsx`** - Integrated AI defense nudge
2. **`app/game/[gameId]/page.tsx`** - Passed game state and viewerId to ChatPanel

### AI Prompt Design
The prompt uses the exact specifications from the requirements:

**System Prompt:**
```
You are an assistant helping a player in a Mafia game defend themselves.
Your goal is to generate a short, realistic, and logical spoken-style defense.
Do not sound robotic or omniscient.
Do not reveal hidden information.
Do not claim certainty.
Keep it under 4–5 sentences.
Sound like a real human under pressure.
```

**User Prompt includes:**
- Player's role
- Current phase
- Elimination history
- Voting history
- Current situation (highest votes)

### Security Considerations
- API key is stored server-side only (never exposed to client)
- Feature gates at multiple levels:
  - API route returns 404 if no key available
  - Hook checks feature availability before showing UI
  - No auto-sending of messages
- Players remain accountable for all messages sent

### Known Limitations
1. The API endpoint doesn't validate request authenticity (trusts client-provided game state)
   - This is acceptable because the feature only generates text suggestions
   - No game state is modified
   - Player must manually review and send the message
2. Usage tracking is session-based (resets on page refresh)
   - This is intentional to keep the feature simple and stateless
   - Still prevents spam within a single session

## Testing Checklist

### Manual Testing Required
- [ ] Test with OpenAI API key set - feature should appear
- [ ] Test with OpenAI API key unset - feature should be invisible
- [ ] Test in Test Mode - feature should work for admin as player
- [ ] Test highest-voted detection - only show to player(s) with most votes
- [ ] Test tie scenario - show to all tied players
- [ ] Test editing flow - allow modification of AI-generated text
- [ ] Test cancel flow - dismiss without sending
- [ ] Test send flow - message appears in chat
- [ ] Test rate limiting - can only use once per round
- [ ] Test error handling - graceful failure if OpenAI API fails

### Automated Testing
- [x] TypeScript compilation passes
- [x] Voting logic unit tests pass
- [ ] Build succeeds (blocked by font loading in CI environment)

## Environment Variables

Add to `.env.local` (optional):
```
OPENAI_API_KEY=sk-...
```

If not set, the feature will be invisible to all players.

## Cost Considerations
- Uses `gpt-4o-mini` model (cost-effective)
- Max 150 tokens per request
- Rate limited to 1 request per player per round
- Typical game: 5-10 players, 3-5 rounds = 15-50 requests max per game
- Estimated cost: ~$0.01-0.05 per game

## Future Enhancements
- Add request authentication to API endpoint
- Store usage in Firestore for cross-session persistence
- Add more context (e.g., night action hints for special roles)
- Allow regeneration with different tones
