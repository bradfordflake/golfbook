const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
function source(name, nextName) {
  const start = html.indexOf(`function ${name}(`);
  const end = html.indexOf(`function ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `found ${name}`);
  return html.slice(start, end);
}

const context = {
  console,
  immutableFinalSnapshot: () => null,
  roundHoles: (_round, course) => course.holes,
  strokesThisHole: () => 0,
  localRanks: (holes) => holes.map((_, i) => i + 1),
  strokesOnHole: () => 0,
  courseHandicapFor: () => 0,
};
vm.createContext(context);
vm.runInContext([
  source('grossOf', 'strokePlayBoard'),
  source('matchSegment', 'matchLabel'),
  source('matchLabel', 'bestBallTeams'),
  source('bestBallTeams', 'teamMatchSegment'),
  source('teamMatchSegment', 'teamMatchLabel'),
  source('teamMatchLabel', 'bestBallMatch'),
  source('bestBallMatch', 'bestBallLabel'),
  source('effectiveHoleScore', 'vegasBoard'),
  source('sixesBoard', 'rabbitBoard'),
  source('matchPresentationState', 'MatchStatus'),
].join('\n'), context);

const players = ['A', 'B', 'C', 'D'].map((name) => ({ id: name, name }));
const course = { holes: Array.from({ length: 18 }, () => ({ par: 4 })) };
const round = (scores, pairing) => ({
  playerData: Object.fromEntries(Object.entries(scores).map(([id, holeScores]) => [id, { holeScores }])),
  gameData: pairing ? { pairing } : {},
});

// Match Play: all square, either leader, halved hole, completion, and frozen clinch.
let seg = context.matchSegment(round({ A: [4], B: [4] }), course, players.slice(0, 2), 0, 18);
assert.equal(seg.diff, 0); assert.equal(seg.perHole[0].winner, 'halved');
seg = context.matchSegment(round({ A: [4, 4], B: [5, 5] }), course, players.slice(0, 2), 0, 18);
assert.equal(seg.diff, 2);
seg = context.matchSegment(round({ A: [5], B: [4] }), course, players.slice(0, 2), 0, 18);
assert.equal(seg.diff, -1);
seg = context.matchSegment(round({ A: Array(18).fill(4), B: Array.from({ length: 18 }, (_, i) => i < 16 && [0, 2, 4].includes(i) ? 5 : i >= 16 ? 3 : 4) }), course, players.slice(0, 2), 0, 18);
assert.deepEqual({ diff: seg.diff, thru: seg.thru, remaining: seg.remaining, clinched: seg.clinched }, { diff: 3, thru: 16, remaining: 2, clinched: true });
seg = context.matchSegment(round({ A: Array(18).fill(4), B: Array(18).fill(4) }), course, players.slice(0, 2), 0, 18);
assert.equal(context.matchLabel(seg), 'All Square · thru 18');
seg = context.matchSegment(round({ A: Array(18).fill(4), B: Array(17).fill(4).concat(5) }), course, players.slice(0, 2), 0, 18);
assert.deepEqual({ diff: seg.diff, remaining: seg.remaining, clinched: seg.clinched }, { diff: 1, remaining: 0, clinched: false });

// Dormie is presentation-only and requires a non-zero lead exactly equal to holes remaining.
assert.equal(context.matchPresentationState({ diff: 2, thru: 16, remaining: 2, clinched: false }).dormie, true);
assert.equal(context.matchPresentationState({ diff: 1, thru: 17, remaining: 1, clinched: false }).dormie, true);
assert.equal(context.matchPresentationState({ diff: 2, thru: 17, remaining: 1, clinched: true }).dormie, false);
assert.equal(context.matchPresentationState({ diff: 0, thru: 16, remaining: 2, clinched: false }).dormie, false);
assert.equal(context.matchPresentationState({ diff: 1, thru: 18, remaining: 0, clinched: false }).dormie, false);

// Best Ball and team Nassau use the same independent, frozen segment result.
const pairing = { team1Ids: ['A', 'B'], team2Ids: ['C', 'D'] };
const clinchScores = { A: Array(18).fill(4), B: Array(18).fill(6), C: Array.from({ length: 18 }, (_, i) => i < 16 && [0, 2, 4].includes(i) ? 5 : i >= 16 ? 3 : 4), D: Array(18).fill(6) };
const bb = context.bestBallMatch(round(clinchScores, pairing), course, players, false);
assert.deepEqual({ diff: bb.diff, thru: bb.thru, remaining: bb.remaining, clinched: bb.clinched }, { diff: 3, thru: 16, remaining: 2, clinched: true });
const front = context.teamMatchSegment(round({ A: Array(18).fill(4), B: Array(18).fill(6), C: Array(18).fill(5), D: Array(18).fill(6) }, pairing), course, players, 0, 9);
const back = context.teamMatchSegment(round({ A: Array(9).fill(4).concat(Array(9).fill(5)), B: Array(18).fill(6), C: Array(9).fill(5).concat(Array(9).fill(4)), D: Array(18).fill(6) }, pairing), course, players, 9, 18);
assert.equal(front.clinched, true); assert.equal(back.clinched, true); assert.equal(front.diff > 0, true); assert.equal(back.diff < 0, true);
const tiedFront = context.teamMatchSegment(round({ A: Array(9).fill(4), B: Array(9).fill(6), C: Array(9).fill(4), D: Array(9).fill(6) }, pairing), course, players, 0, 9);
assert.deepEqual({ diff: tiedFront.diff, remaining: tiedFront.remaining }, { diff: 0, remaining: 0 });

// Nassau lifecycle: Front and Overall can be live before Back starts, and settle independently.
const fourPlayed = { A: [4, 4, 4, 4], B: [6, 6, 6, 6], C: [4, 4, 5, 5], D: [6, 6, 6, 6] };
const frontActive = context.teamMatchSegment(round(fourPlayed, pairing), course, players, 0, 9);
const backNotStarted = context.teamMatchSegment(round(fourPlayed, pairing), course, players, 9, 18);
const overallActive = context.teamMatchSegment(round(fourPlayed, pairing), course, players, 0, 18);
assert.equal(frontActive.thru > 0 && frontActive.remaining > 0, true);
assert.equal(backNotStarted.thru, 0);
assert.equal(overallActive.thru, frontActive.thru);

const frontTiedBackActiveScores = {
  A: Array(12).fill(4), B: Array(12).fill(6),
  C: Array(9).fill(4).concat([5, 5, 5]), D: Array(12).fill(6),
};
const completedFront = context.teamMatchSegment(round(frontTiedBackActiveScores, pairing), course, players, 0, 9);
const activeBack = context.teamMatchSegment(round(frontTiedBackActiveScores, pairing), course, players, 9, 18);
const continuingOverall = context.teamMatchSegment(round(frontTiedBackActiveScores, pairing), course, players, 0, 18);
assert.deepEqual({ diff: completedFront.diff, remaining: completedFront.remaining }, { diff: 0, remaining: 0 });
assert.equal(activeBack.thru, 3);
assert.equal(continuingOverall.thru, 12);

const splitNassauScores = {
  A: Array(18).fill(4), B: Array(18).fill(6),
  C: [5].concat(Array(8).fill(4), 3, Array(8).fill(4)), D: Array(18).fill(6),
};
const splitFront = context.teamMatchSegment(round(splitNassauScores, pairing), course, players, 0, 9);
const splitBack = context.teamMatchSegment(round(splitNassauScores, pairing), course, players, 9, 18);
const splitOverall = context.teamMatchSegment(round(splitNassauScores, pairing), course, players, 0, 18);
assert.equal(splitFront.diff, 1);
assert.equal(splitBack.diff, -1);
assert.equal(splitOverall.diff, 0);

// Sixes settles a clinched segment, awards only that segment, and leaves later segments active/upcoming.
const six = context.sixesBoard(round({ A: Array(18).fill(4), B: Array(18).fill(4), C: Array(18).fill(5), D: Array(18).fill(5) }), course, players, false);
assert.equal(six.segments[0].clinched, true);
assert.equal(six.segments[0].settled, true);
assert.equal(six.playerPoints.A >= 1, true);
assert.equal(six.playerPoints.B >= 1, true);
assert.equal(six.segments[1].thru > 0, true);

// UX guardrails: recent history stays compact and live Sixes standings stay secondary.
assert.match(html, /perHole\.slice\(-3\)/);
assert.match(html, /Dormie ·/);
assert.match(html, /Round match-point standings/);
assert.match(html, /W means won, H means halved, L means lost/);
assert.match(html, /hole\.winner === 'sideA' \? 'W' : 'L'/);
assert.match(html, /showFinalStandings = readOnly \|\| board\.segments\.every/);

// The recap and settlement paths continue to call the same authoritative engines as the live cards.
const outcomeSource = source('casualRoundOutcome', 'casualMoneyForRound');
assert.match(outcomeSource, /if \(scoring === 'match' && players\.length === 2\)[\s\S]*?matchSegment\(/);
assert.match(outcomeSource, /if \(scoring === 'bestball'\)[\s\S]*?bestBallMatch\(/);
assert.match(outcomeSource, /if \(scoring === 'nassau'\)[\s\S]*?teamMatchSegment\(/);
assert.match(outcomeSource, /if \(scoring === 'sixes'\)[\s\S]*?sixesBoard\(/);
assert.match(outcomeSource, /if \(scoring === 'teamscore'\)[\s\S]*?teamScoreBoard\(/);
assert.match(source('casualMoneyForRound', 'RoundSummary'), /casualRoundOutcome\(settings, round, course, players\)/);
assert.doesNotMatch(html, /Hole-by-hole comparison \(not official\)/);

console.log('match logic scenarios passed');
