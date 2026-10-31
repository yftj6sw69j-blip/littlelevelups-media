#!/usr/bin/env bash
# MeFit League renderer.
#   ./render.sh data.json OUTDIR            → ranked board (November Grind): leaderboard-card.png + leaderboard-story.mp4
#   ./render.sh data.json OUTDIR ladder     → badge mountain (12 Days of Strong, Step Up, Keep-Going, Festive Steps): badges-card.png + badges-story.mp4
# Photos: put member photos in public/photos/ (never commit them) and set "photo": "photos/<file>.jpg" on each entry.
# A missing photo falls back to the member's initials inside the ring.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; DATA="$(realpath "$1")"; OUT="$(mkdir -p "$2" && realpath "$2")"; MODE="${3:-league}"
cd "$HERE"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null
B="${BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
SEED="$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('seed', d.get('week', len(d.get('title','x')))))" "$DATA")"
python3 music.py "$SEED" public/bed.wav >/dev/null
EXTRA=(); [ -n "$B" ] && EXTRA=(--browser-executable="$B")
if [ "$MODE" = "ladder" ]; then STORY=LadderStory; CARD=LadderCard; NAME=badges; else STORY=LeagueStory; CARD=LeagueCard; NAME=leaderboard; fi
npx remotion still src/index.ts "$CARD" "$OUT/$NAME-card.png" --props="$DATA" "${EXTRA[@]}" >/dev/null
npx remotion render src/index.ts "$STORY" "$OUT/$NAME-story.mp4" --props="$DATA" --codec=h264 --crf=18 --x264-preset=veryfast --concurrency=2 "${EXTRA[@]}" >/dev/null
echo "wrote $OUT/$NAME-card.png and $OUT/$NAME-story.mp4"
