import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeSmoothedShare,
  formatShareText,
  isMetaPick,
  scoreDailyRun,
  scoreQuestion,
  tierForShare,
} from '../src/rarity-scoring.mjs';

test('smoothed share starts at prior when totalPlayers is 0 and converges with volume', () => {
  const cold = computeSmoothedShare({ actualPicks: 0, totalPlayers: 0, priorPopularity: 0.02 });
  assert.equal(cold, 0.02);

  const warm = computeSmoothedShare({ actualPicks: 1, totalPlayers: 3000, priorPopularity: 0.02 });
  assert.ok(warm < 0.003, `expected warm share < 0.003, got ${warm}`);
});

test('tier boundaries map Common through Mythic cleanly', () => {
  assert.equal(tierForShare(0.12).id, 'common');
  assert.equal(tierForShare(0.05).id, 'uncommon');
  assert.equal(tierForShare(0.02).id, 'rare');
  assert.equal(tierForShare(0.005).id, 'epic');
  assert.equal(tierForShare(0.001).id, 'legendary');
  assert.equal(tierForShare(0.0002).id, 'mythic');
});

test('Question 7 Boss round doubles floors up to 200F and 800F max run', () => {
  const perfect = Array.from({ length: 7 }, () => ({
    valid: true,
    actualPicks: 0,
    totalPlayers: 1000,
    priorPopularity: 0.0001,
  }));
  const run = scoreDailyRun(perfect);
  assert.equal(run.totalFloors, 800);
  assert.equal(run.grid, '🟥🟥🟥🟥🟥🟥🟥');
  assert.equal(run.slots[6].isBoss, true);
  assert.equal(run.slots[6].floors, 200);
});

test('Meta Pick detects viral cheat-sheet picks exceeding 5x prior and 3% share', () => {
  assert.equal(isMetaPick({ liveShare: 0.06, priorPopularity: 0.005 }), true);
  assert.equal(isMetaPick({ liveShare: 0.02, priorPopularity: 0.001 }), false);
  assert.equal(isMetaPick({ liveShare: 0.15, priorPopularity: 0.1 }), false);
});

test('miss slots yield 0 floors and black square in spoiler-free share text', () => {
  const miss = scoreQuestion({ questionIndex: 2, valid: false });
  assert.equal(miss.floors, 0);
  assert.equal(miss.tier.emoji, '⬛');

  const text = formatShareText({
    puzzleNumber: 37,
    totalFloors: 465,
    grid: '⬜🟩🟦🟪🟨🟥⬛',
  });
  assert.equal(text, 'Mythic Pick #37 — 465/800F\n⬜🟩🟦🟪🟨🟥⬛\nhttps://mythicpick.com');
});
