# MeFit League leaderboard template (Remotion)

`./render.sh data.json OUTDIR` → `leaderboard-card.png` (1080×1350) and `leaderboard-story.mp4` (1080×1920, 10 s, original music).

- data.json shape: see `src/data.ts` (`week`, `daysLeft`, `teamTotal`, `climber`, `entries[{name, workouts}]`, optional `label`, `rollText`, `footer`, `seed`, `music: "bed.wav"`).
- Final standings: `sample-final.json` (label "Final standings", rollText "And your champion is…", daysLeft 0 hides the countdown).
- Music is regenerated each render from `seed` (defaults to week), so every week sounds different.
- Never commit rendered boards or data files here: they contain client first names. Template code only.
