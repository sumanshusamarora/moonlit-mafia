import type { GameRole } from "@/types/game";

export interface NightCommentaryParams {
  eliminatedName?: string;
  eliminatedRole?: GameRole;
  savedByDoctor?: boolean;
  round: number;
}

export interface DayCommentaryParams {
  eliminatedName: string;
  eliminatedRole: GameRole;
  voteCount: number;
  round: number;
}

const NIGHT_ELIMINATION_TEMPLATES = [
  (params: NightCommentaryParams) =>
    `🌙 As the moon reached its zenith, ${params.eliminatedName} met their fate in the shadows. The village mourns another loss.`,
  (params: NightCommentaryParams) =>
    `🌑 Darkness claimed ${params.eliminatedName} in round ${params.round}. The mafia's grip tightens as fear spreads through the village.`,
  (params: NightCommentaryParams) =>
    `🌘 ${params.eliminatedName}'s final moments were spent in darkness. The village wakes to discover another empty home.`,
  (params: NightCommentaryParams) =>
    `🌚 The morning sun reveals a grim truth: ${params.eliminatedName} will not answer the town bell. Round ${params.round} brings fresh sorrow.`,
  (params: NightCommentaryParams) =>
    `🌃 Tragedy struck in the dead of night. ${params.eliminatedName} has been silenced forever. Who will be next?`,
  (params: NightCommentaryParams) =>
    `🌙 Blood on the cobblestones marks where ${params.eliminatedName} fell. The mafia grows bolder with each passing night.`,
  (params: NightCommentaryParams) =>
    `🌑 ${params.eliminatedName}'s screams were swallowed by the darkness. Another soul claimed by the shadows of round ${params.round}.`,
  (params: NightCommentaryParams) =>
    `🌘 Dawn breaks to reveal ${params.eliminatedName}'s lifeless form. The village's hope dims with each fallen friend.`,
  (params: NightCommentaryParams) =>
    `🌚 The mafia struck with ruthless precision. ${params.eliminatedName} never saw it coming... none of them ever do.`,
  (params: NightCommentaryParams) =>
    `🌃 Under the cover of night, ${params.eliminatedName} became the latest victim. The hunt continues at sunrise.`,
];

const NIGHT_SAVED_TEMPLATES = [
  () => `🌙 The doctor's watchful eye saved a life tonight. Dawn breaks with hope still alive in the village.`,
  () => `🌑 A guardian angel worked through the night. Someone lives to see another day.`,
  () => `🌘 The doctor's intervention prevented tragedy. The village breathes a collective sigh of relief.`,
  () => `🌚 Medical expertise saved the day! The doctor's quick thinking kept everyone alive tonight.`,
  () => `🌃 A skilled healer prevented disaster tonight. One more day of hope for the village!`,
  () => `🌙 Fortune favors the protected! The doctor's choice proved life-saving as dawn approaches.`,
  () => `🌑 Death came knocking, but the doctor answered first. A miraculous save in the dead of night!`,
  () => `🌘 The mafia's blade found its mark, but a healer's touch undid their dark work. Victory for the village!`,
  () => `🌚 Someone walks among you who should be dead. Thank the doctor's vigilance for this small miracle.`,
  () => `🌃 The doctor outmaneuvered death itself tonight. One life preserved against the mafia's will.`,
];

const NIGHT_PEACEFUL_TEMPLATES = [
  () => `🌙 The night passed peacefully. The villagers wake to find everyone safe... for now.`,
  () => `🌑 An eerie silence filled the night. No one was harmed... yet.`,
  () => `🌘 The night watch reported no incidents. Perhaps the mafia is planning something bigger...`,
  () => `🌚 A quiet night under the stars. The village remains intact... for now.`,
  () => `🌃 The night creatures sing peacefully. All villagers accounted for at sunrise.`,
  () => `🌙 An unusual calm settled over the village. Too quiet, perhaps? The tension builds...`,
  (params: NightCommentaryParams) =>
    `🌑 Round ${params.round} passes without incident. Is it mercy, or are the mafia plotting their next move?`,
  () => `🌘 Not a single scream pierced the darkness. The mafia's silence is somehow more terrifying than action.`,
  () => `🌚 Everyone sleeps soundly tonight—unaware of how rare such peace has become in this cursed village.`,
  () => `🌃 The stars witness no violence tonight. A brief respite before the storm returns.`,
];

const DAY_MAFIA_ELIMINATED_TEMPLATES = [
  (params: DayCommentaryParams) =>
    `☀️ After intense deliberation, ${params.eliminatedName} received ${params.voteCount} votes and was eliminated. 🟢 The crowd erupts in relief! A member of the mafia has been brought to justice!`,
  (params: DayCommentaryParams) =>
    `☀️ The town square falls silent as ${params.eliminatedName} faces elimination with ${params.voteCount} votes. 🟢 Justice prevails! The mafia's numbers dwindle!`,
  (params: DayCommentaryParams) =>
    `☀️ Democracy has spoken. ${params.eliminatedName} was eliminated by ${params.voteCount} votes in round ${params.round}. 🟢 The village grows safer with each fallen mafia member!`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.voteCount} voices united against ${params.eliminatedName}. The verdict: elimination. 🟢 A criminal exposed! The town breathes easier tonight!`,
  (params: DayCommentaryParams) =>
    `☀️ Round ${params.round}'s tribunal has concluded. ${params.eliminatedName} was eliminated with ${params.voteCount} votes. 🟢 Victory! The mafia's power weakens with this elimination!`,
  (params: DayCommentaryParams) =>
    `☀️ The gallows claim ${params.eliminatedName} as ${params.voteCount} votes seal their fate. 🟢 The mafia's mask slips—justice is served!`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.eliminatedName} faced the angry mob and their ${params.voteCount} votes. 🟢 A killer unmasked! The village celebrates this small victory!`,
  (params: DayCommentaryParams) =>
    `☀️ With ${params.voteCount} votes condemning them, ${params.eliminatedName}'s schemes end here in round ${params.round}. 🟢 One less shadow lurking in the night!`,
  (params: DayCommentaryParams) =>
    `☀️ The people have spoken with ${params.voteCount} votes—${params.eliminatedName} was mafia all along! 🟢 Sweet vindication for the fallen innocents!`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.eliminatedName} tried to blend in, but ${params.voteCount} villagers saw through the disguise. 🟢 The hunt continues, but today we celebrate justice!`,
];

const DAY_INNOCENT_ELIMINATED_TEMPLATES = [
  (params: DayCommentaryParams) =>
    `☀️ After intense deliberation, ${params.eliminatedName} received ${params.voteCount} votes and was eliminated. 🔴 The village realizes too late... an innocent has been condemned.`,
  (params: DayCommentaryParams) =>
    `☀️ The town square falls silent as ${params.eliminatedName} faces elimination with ${params.voteCount} votes. 🔴 Another innocent life lost to paranoia and fear...`,
  (params: DayCommentaryParams) =>
    `☀️ Democracy has spoken. ${params.eliminatedName} was eliminated by ${params.voteCount} votes in round ${params.round}. 🔴 The mafia watches from the shadows as the village tears itself apart.`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.voteCount} voices united against ${params.eliminatedName}. The verdict: elimination. 🔴 Trust erodes as another innocent falls victim to suspicion.`,
  (params: DayCommentaryParams) =>
    `☀️ Round ${params.round}'s tribunal has concluded. ${params.eliminatedName} was eliminated with ${params.voteCount} votes. 🔴 The village's strength diminishes as another ally is lost.`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.eliminatedName} pleaded innocence, but ${params.voteCount} votes didn't listen. 🔴 Blood on the hands of those who voted. The mafia smiles in the crowd.`,
  (params: DayCommentaryParams) =>
    `☀️ With ${params.voteCount} votes, ${params.eliminatedName} meets an unjust end in round ${params.round}. 🔴 The real killers remain hidden while innocents die.`,
  (params: DayCommentaryParams) =>
    `☀️ The mob's fury claimed ${params.eliminatedName} today—${params.voteCount} votes of misplaced anger. 🔴 Exactly what the mafia wanted...`,
  (params: DayCommentaryParams) =>
    `☀️ ${params.eliminatedName} was just trying to survive, but ${params.voteCount} villagers sealed their fate. 🔴 Suspicion kills as surely as a blade in the dark.`,
  (params: DayCommentaryParams) =>
    `☀️ The verdict: guilty. ${params.voteCount} votes for ${params.eliminatedName}. The truth: innocent. 🔴 Another mistake the village can't afford to make.`,
];

export function createNightPrompt(params: NightCommentaryParams): string {
  if (params.eliminatedName) {
    return `In round ${params.round} of a Mafia game, during the night phase, ${params.eliminatedName} (a ${params.eliminatedRole}) was eliminated by the mafia. Create dramatic commentary about this tragic event. Start with a moon emoji.`;
  }
  if (params.savedByDoctor) {
    return `In round ${params.round} of a Mafia game, the doctor successfully saved someone from the mafia during the night. Create hopeful commentary about this save. Start with a moon emoji.`;
  }
  return `In round ${params.round} of a Mafia game, the night passed without any eliminations. Create suspenseful commentary about the peaceful night. Start with a moon emoji.`;
}

export function createDayPrompt(params: DayCommentaryParams): string {
  const isMafia = params.eliminatedRole === "mafia";
  return `In round ${params.round} of a Mafia game, ${params.eliminatedName} (a ${params.eliminatedRole}) was eliminated by public vote during the day with ${params.voteCount} votes. ${
    isMafia
      ? "The village successfully eliminated a mafia member - create celebratory commentary with 🟢"
      : "An innocent villager was wrongly eliminated - create somber commentary with 🔴"
  }. Start with a sun emoji (☀️).`;
}

export function getTemplateCommentary(
  type: "night" | "day",
  params: NightCommentaryParams | DayCommentaryParams
): string {
  if (type === "night") {
    const nightParams = params as NightCommentaryParams;
    const templates = nightParams.eliminatedName
      ? NIGHT_ELIMINATION_TEMPLATES
      : nightParams.savedByDoctor
      ? NIGHT_SAVED_TEMPLATES
      : NIGHT_PEACEFUL_TEMPLATES;

    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex](nightParams);
  }

  const dayParams = params as DayCommentaryParams;
  const isMafia = dayParams.eliminatedRole === "mafia";
  const templates = isMafia ? DAY_MAFIA_ELIMINATED_TEMPLATES : DAY_INNOCENT_ELIMINATED_TEMPLATES;

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex](dayParams);
}
