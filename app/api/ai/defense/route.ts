import { NextRequest, NextResponse } from "next/server";
import type { GameRole, MafiaGame } from "@/types/game";

interface DefenseRequest {
  gameState: MafiaGame;
  playerUid: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Feature gate: If no API key, return 404 to make feature invisible
    if (!apiKey) {
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 404 }
      );
    }

    const body: DefenseRequest = await request.json();
    const { gameState, playerUid } = body;

    if (!gameState || !playerUid) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const player = gameState.players.find((p) => p.uid === playerUid);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 400 }
      );
    }

    const prompt = buildDefensePrompt(gameState, player);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are an assistant helping a player in a Mafia game defend themselves.
Your goal is to generate a short, realistic, and logical spoken-style defense.
Do not sound robotic or omniscient.
Do not reveal hidden information.
Do not claim certainty.
Keep it under 4–5 sentences.
Sound like a real human under pressure.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API request failed:", response.status);
      return NextResponse.json(
        { error: "Failed to generate defense" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const defense = data.choices[0]?.message?.content;

    if (!defense) {
      return NextResponse.json(
        { error: "No defense generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ defense });
  } catch (error) {
    console.error("Error generating defense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function buildDefensePrompt(game: MafiaGame, player: { uid: string; name: string; role: GameRole | null }): string {
  const role = player.role || "unknown";
  const phase = game.phase;
  
  // Build elimination history
  const eliminatedPlayers = game.players.filter((p) => !p.isAlive && p.role);
  const eliminationHistory = eliminatedPlayers.length > 0
    ? eliminatedPlayers.map((p) => `- ${p.name} (${p.role || "unknown"})`).join("\n")
    : "- No eliminations yet";

  // Build voting history from current votes
  const votes = game.votes || [];
  const voteCount = new Map<string, number>();
  votes.forEach((v) => {
    voteCount.set(v.targetUid, (voteCount.get(v.targetUid) || 0) + 1);
  });
  
  const votingHistory = votes.length > 0
    ? Array.from(voteCount.entries())
        .map(([targetUid, count]) => {
          const target = game.players.find((p) => p.uid === targetUid);
          return `- ${target?.name || "Unknown"}: ${count} vote${count > 1 ? "s" : ""}`;
        })
        .join("\n")
    : "- No votes cast yet this round";

  return `Game context:
- The player's role: ${role}
- Current phase: ${phase}
- Players eliminated so far:
${eliminationHistory}

Voting history:
${votingHistory}

Current situation:
- The player currently has the highest number of votes.

Task:
Generate a concise defense explaining why this player is likely NOT Mafia.
Use only reasonable in-game logic based on the history.
Do not claim to know other players' roles.
Do not mention AI or analysis.
Write in first person, as if spoken by the player.`;
}
