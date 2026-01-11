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
  Your goal is to generate a concise, realistic, and natural spoken-style defense.
  Do not sound robotic or omniscient.
  Do not reveal hidden information.
  Do not claim certainty.
  Respond in 1–2 short sentences (about 20–35 words total).
  Sound like a real human under pressure.`;

    let response: Response;
    try {
      response = await fetch(`${openaiBaseUrl}/responses`, {
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
        }),
      });
    } catch (error) {
      const isDev = process.env.NODE_ENV !== "production";
      console.error("OpenAI fetch threw before receiving a response", {
        model,
        openaiBaseUrl,
        error: serializeError(error),
      });

      return NextResponse.json(
        {
          error: "OpenAI request failed",
          message: "Network error while contacting OpenAI. See server console for details.",
          ...(isDev ? { model, openaiBaseUrl } : null),
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API request failed:", response.status, errorText);

      let message: string | undefined;
      let code: string | undefined;
      let type: string | undefined;
      try {
        const parsed = JSON.parse(errorText) as { error?: { message?: string; code?: string; type?: string } };
        message = parsed?.error?.message;
        code = parsed?.error?.code;
        type = parsed?.error?.type;
      } catch {
        // Ignore parse errors; we log raw text above.
      }

      const isDev = process.env.NODE_ENV !== "production";

      if (response.status === 429 && code === "insufficient_quota") {
        return NextResponse.json(
          {
            error: "OpenAI quota exceeded",
            status: response.status,
            message:
              message ??
              "OpenAI reported insufficient quota. Check your plan, billing, and usage limits.",
            code,
            type,
            ...(keyMismatch
              ? {
                  debug:
                    "Detected a different OPENAI_API_KEY in .env.local than the one currently in process.env. A shell/exported key can override .env.local. Unset the shell OPENAI_API_KEY (or update it) and restart the dev server.",
                }
              : null),
            ...(isDev ? { model } : null),
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        {
          error: "OpenAI API request failed",
          status: response.status,
          message: message ?? (errorText ? errorText.slice(0, 300) : undefined),
          code,
          type,
          ...(isDev ? { model } : null),
        },
        { status: 502 }
      );
    }

    let data: any = await response.json();

    // If the model returned an "incomplete" response due to hitting the
    // max_output_tokens limit, try one retry with a larger max_output_tokens.
    try {
      const incompleteReason = data?.incomplete_details?.reason;
      if (incompleteReason === "max_output_tokens") {
        console.warn("OpenAI response incomplete due to max_output_tokens; retrying without max_output_tokens param (prompt contains sentence-length guidance)", {
          model,
        });

        const retryResp = await fetch(`${openaiBaseUrl}/responses`, {
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
            // Intentionally omit `max_output_tokens` to allow the model to
            // determine output length based on the prompt instructions.
          }),
        });

        if (retryResp.ok) {
          data = await retryResp.json();
        } else {
          const errTxt = await retryResp.text().catch(() => "[no body]");
          console.error("Retry OpenAI request failed:", retryResp.status, errTxt);
        }
      }
    } catch (retryErr) {
      console.error("Error during OpenAI retry attempt:", serializeError(retryErr));
    }
    const defense = extractResponseText(data);

    if (!defense) {
      const isDev = process.env.NODE_ENV !== "production";
      const summary = summarizeOpenAIResponse(data);
      // Log both a summary and the raw response (truncated) so we can inspect
      // models that return non-text output types (e.g. 'reasoning').
      const raw = safeStringify(data, 16_000);
      console.error("OpenAI returned no extractable defense text", {
        model,
        openaiBaseUrl,
        summary,
        rawResponsePreview: raw.slice(0, 2000),
      });

      return NextResponse.json(
        {
          error: "No defense generated",
          message:
            "OpenAI returned a response but no readable text was found. See server console for details.",
          ...(isDev
            ? { model, openaiBaseUrl, openaiResponseSummary: summary, openaiRaw: raw }
            : null),
        },
        { status: 502 }
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

function serializeError(error: unknown): { name?: string; message?: string; stack?: string; cause?: unknown } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as Error & { cause?: unknown }).cause,
    };
  }

  return { message: String(error) };
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

  const outputText = (data as { output_text?: unknown }).output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const output = (data as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const type = (item as { type?: unknown }).type;

    if (type === "output_text") {
      const text = (item as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text.trim();
    }

    if (type !== "message") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const partType = (part as { type?: unknown }).type;
      if (partType === "output_text" || partType === "text") {
        const text = (part as { text?: unknown }).text;
        if (typeof text === "string" && text.trim()) return text.trim();
      }
    }
  }

  return null;
}

function summarizeOpenAIResponse(data: unknown): {
  hasOutputText: boolean;
  outputItemTypes: string[];
  messagePartTypes: string[];
} {
  const outputText =
    !!data &&
    typeof data === "object" &&
    typeof (data as { output_text?: unknown }).output_text === "string" &&
    !!(data as { output_text?: string }).output_text?.trim();

  const output =
    !!data && typeof data === "object" ? (data as { output?: unknown }).output : undefined;

  const outputItemTypes: string[] = [];
  const messagePartTypes: string[] = [];

  if (Array.isArray(output)) {
    for (const item of output) {
      if (!item || typeof item !== "object") continue;
      const type = (item as { type?: unknown }).type;
      if (typeof type === "string") outputItemTypes.push(type);
      if (type !== "message") continue;
      const content = (item as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const partType = (part as { type?: unknown }).type;
        if (typeof partType === "string") messagePartTypes.push(partType);
      }
    }
  }

  return {
    hasOutputText: outputText,
    outputItemTypes,
    messagePartTypes,
  };
}

function safeStringify(obj: unknown, maxLen = 8000): string {
  try {
    const raw = JSON.stringify(obj, (_k, v) => {
      // Avoid huge binary blobs
      if (typeof v === "string" && v.length > 2000) return v.slice(0, 2000) + "...[truncated]";
      return v;
    }, 2);
    if (raw.length > maxLen) return raw.slice(0, maxLen) + "...[truncated]";
    return raw;
  } catch (e) {
    try {
      return String(obj).slice(0, maxLen) + "...[stringified]";
    } catch {
      return "[unserializable response]";
    }
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
