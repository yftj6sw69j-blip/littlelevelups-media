#!/usr/bin/env bash
# MeFit League renderer. Usage: ./render.sh data.json OUTDIR
# data.json follows src/data.ts (LeagueData). Writes OUTDIR/leaderboard-card.png and OUTDIR/leaderboard-story.mp4.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; DATA="$(realpath "$1")"; OUT="$(mkdir -p "$2" && realpath "$2")"
cd "$HERE"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null
B="${BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
SEED="$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('seed', d.get('week',1)))" "$DATA")"
python3 music.py "$SEED" public/bed.wav
EXTRA=(); [ -n "$B" ] && EXTRA=(--browser-executable="$B")
npx remotion still src/index.ts LeagueCard "$OUT/leaderboard-card.png" --props="$DATA" "${EXTRA[@]}" >/dev/null
npx remotion render src/index.ts LeagueStory "$OUT/leaderboard-story.mp4" --props="$DATA" --codec=h264 --crf=18 --x264-preset=veryfast --concurrency=2 "${EXTRA[@]}" >/dev/null
echo "wrote $OUT/leaderboard-card.png and $OUT/leaderboard-story.mp4"
