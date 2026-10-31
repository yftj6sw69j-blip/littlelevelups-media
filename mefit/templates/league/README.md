# MeFit League boards (Remotion)

Two board styles, both with ringed member photos:

| Mode | Use for | Command | Files |
|---|---|---|---|
| `league` (default) | Ranked challenges: November Grind | `./render.sh data.json OUT` | leaderboard-card.png, leaderboard-story.mp4 |
| `ladder` | Badge challenges: 12 Days of Strong, Step Up, Christmas Keep-Going, Festive Steps | `./render.sh data.json OUT ladder` | badges-card.png, badges-story.mp4 |

- league data: see `src/data.ts` (`week, daysLeft, teamTotal, climber, entries[{name, workouts, photo?}]`, optional `label, rollText, footer, seed`).
- ladder data: see `src/Ladder.tsx` (`title, season, label, unit, tiers[{name, at}] x5, entries[{name, value, photo?}], daysLeft, footer, seed`).
- Photos: copy into `public/photos/` at render time and set `photo: "photos/<file>.jpg"`. Missing photo → initials in the ring.
- NEVER commit member photos, data files or rendered boards here (this repo is public). `.gitignore` blocks public/photos.
- Music is regenerated per render from `seed` so every board sounds different.
