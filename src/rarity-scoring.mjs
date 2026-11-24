/**
 * Mythic Pick — Smoothed Live Crowd-Rarity Scoring Reference Implementation
 * Spec: https://mythicpick.com/rarity-score
 */

export const DEFAULT_SMOOTHING_K = 300;
export const QUESTIONS_PER_RUN = 7;
export const BOSS_QUESTION_INDEX = 6; // 0-based Q7

export const RARITY_TIERS = Object.freeze([
  { id: 'mythic', label: 'Mythic', maxShare: 0.0005, floors: 100, emoji: '🟥' },
  { id: 'legendary', label: 'Legendary', maxShare: 0.003, floors: 85, emoji: '🟨' },
  { id: 'epic', label: 'Epic', maxShare: 0.01, floors: 65, emoji: '🟪' },
  { id: 'rare', label: 'Rare', maxShare: 0.03, floors: 45, emoji: '🟦' },
  { id: 'uncommon', label: 'Uncommon', maxShare: 0.08, floors: 25, emoji: '🟩' },
  { id: 'common', label: 'Common', maxShare: 1.0, floors: 10, emoji: '⬜' },
]);

export const MISS_TIER = Object.freeze({
  id: 'miss',
  label: 'Miss',
  maxShare: null,
  floors: 0,
  emoji: '⬛',
});

/**
 * Compute smoothed live pick share for a valid answer on a daily puzzle:
 *   Live Share = (actualPicks + K * priorPopularity) / (totalPlayers + K)
 */
export function computeSmoothedShare({
  actualPicks,
  totalPlayers,
  priorPopularity,
  smoothingK = DEFAULT_SMOOTHING_K,
}) {
  if (actualPicks < 0 || totalPlayers < 0 || smoothingK <= 0) {
    throw new RangeError('Counts must be non-negative and smoothingK must be positive');
  }
  if (priorPopularity < 0 || priorPopularity > 1) {
    throw new RangeError('priorPopularity must be within [0, 1]');
  }
  return (actualPicks + smoothingK * priorPopularity) / (totalPlayers + smoothingK);
}

/** Map a smoothed share in [0, 1] to one of the 6 Mythic Pick rarity tiers. */
export function tierForShare(share) {
  if (typeof share !== 'number' || Number.isNaN(share) || share < 0) {
    return MISS_TIER;
  }
  for (const tier of RARITY_TIERS) {
    if (share < tier.maxShare) return tier;
  }
  return RARITY_TIERS[RARITY_TIERS.length - 1];
}

/**
 * Detect a "Meta Pick": an answer players thought was obscure that went viral
 * (live share > 5x its prior estimate AND > 3% overall pick share).
 */
export function isMetaPick({ liveShare, priorPopularity }) {
  if (priorPopularity <= 0) return liveShare > 0.03;
  return liveShare > 0.03 && liveShare > priorPopularity * 5;
}

/** Score a single question slot (0-based index; index 6 is the 2x Boss round). */
export function scoreQuestion({
  questionIndex,
  valid,
  actualPicks = 0,
  totalPlayers = 0,
  priorPopularity = 0.05,
  smoothingK = DEFAULT_SMOOTHING_K,
}) {
  const isBoss = questionIndex === BOSS_QUESTION_INDEX;
  if (!valid) {
    return {
      questionNumber: questionIndex + 1,
      isBoss,
      liveShare: null,
      tier: MISS_TIER,
      floors: 0,
      metaPick: false,
    };
  }
  const liveShare = computeSmoothedShare({
    actualPicks,
    totalPlayers,
    priorPopularity,
    smoothingK,
  });
  const tier = tierForShare(liveShare);
  const floors = tier.floors * (isBoss ? 2 : 1);
  return {
    questionNumber: questionIndex + 1,
    isBoss,
    liveShare,
    tier,
    floors,
    metaPick: isMetaPick({ liveShare, priorPopularity }),
  };
}

/** Score a full 7-question daily run (max theoretical score = 800 floors). */
export function scoreDailyRun(answers) {
  if (!Array.isArray(answers) || answers.length !== QUESTIONS_PER_RUN) {
    throw new RangeError(`A daily run must contain exactly ${QUESTIONS_PER_RUN} answers`);
  }
  const slots = answers.map((item, idx) =>
    scoreQuestion({ ...item, questionIndex: idx })
  );
  const totalFloors = slots.reduce((sum, s) => sum + s.floors, 0);
  const grid = slots.map((s) => s.tier.emoji).join('');
  return { totalFloors, maxFloors: 800, grid, slots };
}

/** Format a spoiler-free share block for social posts and group chats. */
export function formatShareText({ puzzleNumber, totalFloors, grid, url = 'https://mythicpick.com' }) {
  return [
    `Mythic Pick #${puzzleNumber} — ${totalFloors}/800F`,
    grid,
    url,
  ].join('\n');
}
