import {
  getTemplateCommentary,
  type DayCommentaryParams,
  type NightCommentaryParams,
} from "@/lib/ai/commentary-shared";

type CommentaryType = "night" | "day";

async function generateCommentary(
  type: CommentaryType,
  params: NightCommentaryParams | DayCommentaryParams
): Promise<string> {
  try {
    const response = await fetch("/api/ai/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, params }),
    });

    if (!response.ok) {
      return getTemplateCommentary(type, params);
    }

    const data = (await response.json()) as { commentary?: unknown };
    const commentary = typeof data.commentary === "string" ? data.commentary.trim() : "";
    return commentary || getTemplateCommentary(type, params);
  } catch {
    return getTemplateCommentary(type, params);
  }
}

export async function generateNightCommentary(params: NightCommentaryParams): Promise<string> {
  return generateCommentary("night", params);
}

export async function generateDayCommentary(params: DayCommentaryParams): Promise<string> {
  return generateCommentary("day", params);
}
