import { NextRequest, NextResponse } from "next/server";
import {
  createDayPrompt,
  createNightPrompt,
  getTemplateCommentary,
  type DayCommentaryParams,
  type NightCommentaryParams,
} from "@/lib/ai/commentary-shared";

type CommentaryType = "night" | "day";

interface CommentaryRequest {
  type: CommentaryType;
  params: NightCommentaryParams | DayCommentaryParams;
}

export async function POST(request: NextRequest) {
  try {
    const body: CommentaryRequest = await request.json();

    if (!body?.type || !body?.params) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ commentary: getTemplateCommentary(body.type, body.params) });
    }

    const openaiBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    // Prefer a smaller/faster commentary model by default to reduce latency.
    const model = process.env.OPENAI_COMMENTARY_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
    const openaiOrgId = process.env.OPENAI_ORG_ID;
    const openaiProjectId = process.env.OPENAI_PROJECT_ID;

    const prompt = body.type === "night"
      ? createNightPrompt(body.params as NightCommentaryParams)
      : createDayPrompt(body.params as DayCommentaryParams);

    const systemInstructions =
      "You are God, the dramatic storyteller for a Mafia game. " +
      "Produce very short, atmospheric commentary: 1 short sentence or at most 1–2 short sentences (<=30 words). " +
      "Include one emoji where appropriate. Be creative but keep it brief.";

    const startTs = Date.now();
    console.debug && console.debug("Generating commentary with model", model);
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
      }),
    });
    const duration = Date.now() - startTs;
    console.info("Commentary fetch finished", { model, status: response.status, durationMs: duration });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API request failed:", response.status, errorText);

      const parsed = parseOpenAIError(errorText);
      const fallback = getTemplateCommentary(body.type, body.params);
      const isDev = process.env.NODE_ENV !== "production";

      return NextResponse.json({
        commentary: fallback,
        source: "template",
        ...(isDev
          ? {
              openai: {
                status: response.status,
                model,
                error: parsed,
              },
            }
          : null),
      });
    }

    const data: unknown = await response.json();
    const commentary = extractResponseText(data);
    const totalDuration = Date.now() - startTs;
    console.info("Commentary generation complete", { model, hasOpenAI: !!commentary, durationMs: totalDuration });

    return NextResponse.json({
      commentary: commentary?.trim() || getTemplateCommentary(body.type, body.params),
      source: commentary?.trim() ? "openai" : "template",
    });
  } catch (error) {
    console.error("Error generating commentary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function parseOpenAIError(raw: string): { message?: string; type?: string; code?: string } {
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; type?: string; code?: string } };
    return {
      message: parsed?.error?.message,
      type: parsed?.error?.type,
      code: parsed?.error?.code,
    };
  } catch {
    return { message: raw?.slice(0, 300) };
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
