# Match logic audit

## Scope and reusable architecture

The cloud branch contains a single-file React application; no second local working-tree implementation or configured Git remote was available to diff. The existing Sixes scoring engine (`sixesBoard`) was retained. Its normalized segment data now feeds the same `MatchStatus` presentation component as Match Play, Best Ball, and each Nassau bet.

`MatchStatus` receives side names plus the engine-owned `diff`, `thru`, `remaining`, `clinched`, and `perHole` fields. It derives only presentation labels (All Square, N UP, Match Halved, or N & N), names the leader in text, and renders no more than the three most recent hole results. Its status badge distinguishes a live lead, tie, and completed match, while a small progress line reports holes remaining or Dormie. It never decides a winner.

## Winner, recap, and payout basis

| Game | Official basis | Live display | Recap / payout audit |
| --- | --- | --- | --- |
| Match Play | Hole-by-hole match result | Shared match hero | `casualRoundOutcome` uses the same frozen `matchSegment` result. |
| Best Ball | Best team ball on each hole, match play | Shared team hero | `casualRoundOutcome` uses the same frozen `bestBallMatch` result. |
| Nassau | Independent Front, Back, and Overall match-play bets | Three compact shared match panels | Outcome counts the same independently frozen segments; a halved bet awards neither side a win. |
| Sixes | Three rotating best-ball match segments | Shared match panels; live match-point standings are collapsed | Outcome uses the same `sixesBoard.playerPoints`. A completed or clinched segment awards one point to each winner or one-half to every player in a halved segment. |
| Alternate Shot | Team stroke total | Team total and relative to par; explicitly labeled **Scoring: Stroke Play** | Outcome and payout use the lower `teamScoreBoard` total. The potentially confusing unofficial match comparison was removed. |
| Chapman | Team stroke total | Team total and relative to par; explicitly labeled **Scoring: Stroke Play** | Outcome and payout use the lower `teamScoreBoard` total. The potentially confusing unofficial match comparison was removed. |
| Scramble | Team stroke total | Team total and relative to par; explicitly labeled **Scoring: Stroke Play** | Outcome and payout use the lower `teamScoreBoard` total. The potentially confusing unofficial match comparison was removed. |

No match-play winner was introduced for Alternate Shot, Chapman, or Scramble because their existing `teamscore` engine, recap, and payout all settle by stroke total.

The recent-hole timeline is always from the first displayed side's perspective: **W** means that side won, **H** means the hole was halved, and **L** means that side lost. It never changes perspective with the current leader.

## Tie handling

- A tied hole is recorded as `halved`; it does not alter the existing lead.
- A completed Match Play or Best Ball match with no lead is displayed as **Match Halved**.
- Each Nassau segment settles independently. A tied Front, Back, or Overall segment remains halved; there are no invented presses, carryovers, playoffs, or tiebreakers.
- A completed Sixes segment with no lead splits its match point equally.
- Team-stroke games retain their existing shared-winner behavior when team totals tie.

## Clinch handling

- Match Play, Best Ball, each Nassau segment, and each Sixes segment now stop changing their official `diff`, `thru`, and result as soon as the lead exceeds the holes remaining.
- Score entry itself is unchanged, so later scores remain available to statistics, trash, skins, stroke totals, and other Nassau segments.
- Nassau computes Front, Back, and Overall separately. Clinching Front therefore does not stop Back or Overall.
- Sixes computes each rotation separately. Clinching one rotation does not stop later rotations.

## Compatibility notes

No persistence keys, saved-round schemas, GHIN snapshots, historical quota snapshots, league calculations, or non-match scoring engines were changed. The presentation consumes fields derived at runtime from the existing stored hole scores.

## Final consistency validation

- Match Play live and recap both consume `matchSegment`; settlement consumes the recap's `winnerIds`.
- Best Ball live and recap both consume `bestBallMatch`; settlement consumes the recap's `winnerIds`.
- Nassau live and recap independently invoke the same singles/team segment engines for Front, Back, and Overall; settlement consumes the combined recap result without recalculating holes.
- Sixes live and recap both consume `sixesBoard.playerPoints`; settlement consumes the recap leaders.
- Alternate Shot, Chapman, and Scramble live and recap both consume `teamScoreBoard`, whose lower stroke total supplies the winner IDs used by settlement.

`MatchStatus` receives calculated fields and derives display wording only. It neither calculates a clinch or winner nor reads/writes stored scores, snapshots, or payout data.
