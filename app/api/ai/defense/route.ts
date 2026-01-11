import { NextRequest, NextResponse } from "next/server";
import type { GameRole, MafiaGame } from "@/types/game";
import fs from "node:fs";
import path from "node:path";

interface DefenseRequest {
  gameState: MafiaGame;
  playerUid: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const openaiBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    const model = process.env.OPENAI_DEFENSE_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const openaiOrgId = process.env.OPENAI_ORG_ID;
    const openaiProjectId = process.env.OPENAI_PROJECT_ID;
    
    // Feature gate: If no API key, return 404 to make feature invisible
    if (!apiKey) {
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 404 }
      );
    }

    const keyMismatch = detectLocalEnvKeyMismatch(apiKey);

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
    const systemInstructions = `You are an assistant helping a player in a Mafia game defend themselves.
Your goal is to generate a short, realistic, and logical spoken-style defense.
Do not sound robotic or omniscient.
Do not reveal hidden information.
Do not claim certainty.
Keep it under 4–5 sentences.
Sound like a real human under pressure.`;

    const response = await fetch(`${openaiBaseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...(openaiOrgId ? { "OpenAI-Organization": openaiOrgId } : null),
        ...(openaiProjectId ? { "OpenAI-Project": openaiProjectId } : null),
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemInstructions }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }],
          },
        ],
        max_output_tokens: 180,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API request failed:", response.status, errorText);

      let message: string | undefined;
      let code: string | undefined;
      try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string; code?: string } };
        message = parsed?.error?.message;
        code = parsed?.error?.code;
      } catch {
        // Ignore parse errors; we log raw text above.
      }

      if (response.status === 429 && code === "insufficient_quota") {
        return NextResponse.json(
          {
            error: "OpenAI quota exceeded",
            status: response.status,
            message:
              message ??
              "OpenAI reported insufficient quota. Check your plan, billing, and usage limits.",
            ...(keyMismatch
              ? {
                  debug:
                    "Detected a different OPENAI_API_KEY in .env.local than the one currently in process.env. A shell/exported key can override .env.local. Unset the shell OPENAI_API_KEY (or update it) and restart the dev server.",
                }
              : null),
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        {
          error: "OpenAI API request failed",
          status: response.status,
          message: message ?? (errorText ? errorText.slice(0, 300) : undefined),
        },
        { status: 502 }
      );
    }

    const data: unknown = await response.json();
    const defense = extractResponseText(data);

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

function detectLocalEnvKeyMismatch(activeApiKey: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const raw = fs.readFileSync(envPath, "utf8");
    const match = raw.match(/^OPENAI_API_KEY=(.*)$/m);
    if (!match) return false;
    const fileKey = match[1].trim();
    if (!fileKey) return false;
    return fileKey !== activeApiKey;
  } catch {
    return false;
  }
}

function extractResponseText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const type = (item as { type?: unknown }).type;
    if (type !== "message") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      if ((part as { type?: unknown }).type === "output_text") {
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string" && text.trim()) return text.trim();
      }
    }
  }

  return null;
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
