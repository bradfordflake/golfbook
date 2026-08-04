# Hosted match UX visual QA

A browser renderer is not available in the implementation container. These screens require visual review on the hosted build at an iPhone-width viewport before release.

## Shared checks on Match Play and Best Ball

- Start All Square and confirm the gray badge is legible in light and dark themes.
- Give each side a lead and confirm the green badge, explicit **Leading** label, and side names agree.
- Confirm long player/team names truncate inside their columns without moving the centered status off-screen.
- Confirm the timeline contains at most three items and reads W/H/L from the left (first displayed) side's perspective.
- Verify `2 UP · Through 16` on an 18-hole match shows `Dormie · 2 holes remaining`.
- Verify an early clinch shows a blue result badge and **Match complete**, while a last-hole win shows `1 UP` rather than `1 & 0`.
- Complete tied and confirm **Match Halved** with no winner label.

## Nassau

- Before Hole 1, confirm Front, Back, and Overall are present and compact.
- During the Front, confirm Front and Overall receive a bordered **Live** emphasis while Back remains compact.
- After Front settles and Back begins, confirm Front becomes visually secondary while Back and Overall are emphasized.
- Test long team names and confirm all three centered status badges remain readable at 320–390 px widths.
- Clinch Front and continue entering Back scores; confirm Front stays frozen while Back and Overall continue.
- Finish with three different segment outcomes and confirm each section explicitly reports its own leader/result.

## Sixes

- During each rotation, confirm the active partner match is the dominant panel and upcoming rotations remain compact.
- Confirm a settled rotation becomes secondary and the next rotation accepts scores normally.
- Confirm round match-point standings are collapsed during live play, can be expanded on demand, and are visible by default in the completed recap.

## Alternate Shot, Chapman, and Scramble

- Confirm **Scoring: Stroke Play** is visible without scrolling within the card.
- Confirm team total and relative-to-par value are the dominant numeric result.
- Confirm holes remaining is accurate and there is no match-play winner or unofficial hole-match comparison.
- Complete each format and verify the lower team total is the same winner in the live card, recap, and payout settlement.

## Regression boundary

- Spot-check Wolf, Nines, Stableford, Stroke Play, Skins, one league quota round, and one saved historical round to confirm their cards and navigation are unchanged.
