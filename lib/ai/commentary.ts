import type { GameRole } from "@/types/game";

interface NightCommentaryParams {
  eliminatedName?: string;
  eliminatedRole?: GameRole;
  savedByDoctor?: boolean;
  round: number;
}

interface DayCommentaryParams {
  eliminatedName: string;
  eliminatedRole: GameRole;
  voteCount: number;
  round: number;
}

const NIGHT_TEMPLATES = [
  (params: NightCommentaryParams) => {
    if (params.eliminatedName) {
      return `🌙 As the moon reached its zenith, ${params.eliminatedName} met their fate in the shadows. The village mourns another loss.`;
    }
    if (params.savedByDoctor) {
      return `🌙 The doctor's watchful eye saved a life tonight. Dawn breaks with hope still alive in the village.`;
    }
    return `🌙 The night passed peacefully. The villagers wake to find everyone safe... for now.`;
  },
  (params: NightCommentaryParams) => {
    if (params.eliminatedName) {
      return `🌑 Darkness claimed ${params.eliminatedName} in round ${params.round}. The mafia's grip tightens as fear spreads through the village.`;
    }
    if (params.savedByDoctor) {
      return `🌑 A guardian angel worked through the night. Someone lives to see another day.`;
    }
    return `🌑 An eerie silence filled the night. No one was harmed... yet.`;
  },
  (params: NightCommentaryParams) => {
    if (params.eliminatedName) {
      return `🌘 ${params.eliminatedName}'s final moments were spent in darkness. The village wakes to discover another empty home.`;
    }
    if (params.savedByDoctor) {
      return `🌘 The doctor's intervention prevented tragedy. The village breathes a collective sigh of relief.`;
    }
    return `🌘 The night watch reported no incidents. Perhaps the mafia is planning something bigger...`;
  },
  (params: NightCommentaryParams) => {
    if (params.eliminatedName) {
      return `🌚 The morning sun reveals a grim truth: ${params.eliminatedName} will not answer the town bell. Round ${params.round} brings fresh sorrow.`;
    }
    if (params.savedByDoctor) {
      return `🌚 Medical expertise saved the day! The doctor's quick thinking kept everyone alive tonight.`;
    }
    return `🌚 A quiet night under the stars. The village remains intact... for now.`;
  },
  (params: NightCommentaryParams) => {
    if (params.eliminatedName) {
      return `🌃 Tragedy struck in the dead of night. ${params.eliminatedName} has been silenced forever. Who will be next?`;
    }
    if (params.savedByDoctor) {
      return `🌃 A skilled healer prevented disaster tonight. One more day of hope for the village!`;
    }
    return `🌃 The night creatures sing peacefully. All villagers accounted for at sunrise.`;
  },
];

const DAY_TEMPLATES = [
  (params: DayCommentaryParams) => {
    const isMafia = params.eliminatedRole === "mafia";
    return `☀️ After intense deliberation, ${params.eliminatedName} received ${params.voteCount} votes and was eliminated. ${
      isMafia 
        ? "🟢 The crowd erupts in relief! A member of the mafia has been brought to justice!" 
        : "🔴 The village realizes too late... an innocent has been condemned."
    }`;
  },
  (params: DayCommentaryParams) => {
    const isMafia = params.eliminatedRole === "mafia";
    return `☀️ The town square falls silent as ${params.eliminatedName} faces elimination with ${params.voteCount} votes. ${
      isMafia 
        ? "🟢 Justice prevails! The mafia's numbers dwindle!" 
        : "🔴 Another innocent life lost to paranoia and fear..."
    }`;
  },
  (params: DayCommentaryParams) => {
    const isMafia = params.eliminatedRole === "mafia";
    return `☀️ Democracy has spoken. ${params.eliminatedName} was eliminated by ${params.voteCount} votes in round ${params.round}. ${
      isMafia 
        ? "🟢 The village grows safer with each fallen mafia member!" 
        : "🔴 The mafia watches from the shadows as the village tears itself apart."
    }`;
  },
  (params: DayCommentaryParams) => {
    const isMafia = params.eliminatedRole === "mafia";
    return `☀️ ${params.voteCount} voices united against ${params.eliminatedName}. The verdict: elimination. ${
      isMafia 
        ? "🟢 A criminal exposed! The town breathes easier tonight!" 
        : "🔴 Trust erodes as another innocent falls victim to suspicion."
    }`;
  },
  (params: DayCommentaryParams) => {
    const isMafia = params.eliminatedRole === "mafia";
    return `☀️ Round ${params.round}'s tribunal has concluded. ${params.eliminatedName} was eliminated with ${params.voteCount} votes. ${
      isMafia 
        ? "🟢 Victory! The mafia's power weakens with this elimination!" 
        : "🔴 The village's strength diminishes as another ally is lost."
    }`;
  },
];

async function generateAICommentary(
  type: "night" | "day",
  params: NightCommentaryParams | DayCommentaryParams
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to templates
    return getTemplateCommentary(type, params);
  }

  try {
    const prompt = type === "night" 
      ? createNightPrompt(params as NightCommentaryParams)
      : createDayPrompt(params as DayCommentaryParams);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a dramatic narrator for a Mafia game. Create short, atmospheric commentary (2-3 sentences max) about game events. Include appropriate emojis. Be creative and engaging, but concise."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API request failed");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getTemplateCommentary(type, params);
  } catch (error) {
    console.error("AI commentary generation failed:", error);
    return getTemplateCommentary(type, params);
  }
}

function createNightPrompt(params: NightCommentaryParams): string {
  if (params.eliminatedName) {
    return `In round ${params.round} of a Mafia game, during the night phase, ${params.eliminatedName} (a ${params.eliminatedRole}) was eliminated by the mafia. Create dramatic commentary about this tragic event. Start with a moon emoji.`;
  }
  if (params.savedByDoctor) {
    return `In round ${params.round} of a Mafia game, the doctor successfully saved someone from the mafia during the night. Create hopeful commentary about this save. Start with a moon emoji.`;
  }
  return `In round ${params.round} of a Mafia game, the night passed without any eliminations. Create suspenseful commentary about the peaceful night. Start with a moon emoji.`;
}

function createDayPrompt(params: DayCommentaryParams): string {
  const isMafia = params.eliminatedRole === "mafia";
  return `In round ${params.round} of a Mafia game, ${params.eliminatedName} (a ${params.eliminatedRole}) was eliminated by public vote during the day with ${params.voteCount} votes. ${
    isMafia 
      ? "The village successfully eliminated a mafia member - create celebratory commentary with 🟢" 
      : "An innocent villager was wrongly eliminated - create somber commentary with 🔴"
  }. Start with a sun emoji (☀️).`;
}

function getTemplateCommentary(
  type: "night" | "day",
  params: NightCommentaryParams | DayCommentaryParams
): string {
  const templates = type === "night" ? NIGHT_TEMPLATES : DAY_TEMPLATES;
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex](params as any);
}

export async function generateNightCommentary(params: NightCommentaryParams): Promise<string> {
  return generateAICommentary("night", params);
}

export async function generateDayCommentary(params: DayCommentaryParams): Promise<string> {
  return generateAICommentary("day", params);
}
