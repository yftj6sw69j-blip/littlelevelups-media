#!/usr/bin/env bash
# ./render-milestone.sh data.json OUTDIR → milestone-card.png (1080x1350) + milestone-story.mp4 (1080x1920, 9 s)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; DATA="$(realpath "$1")"; OUT="$(mkdir -p "$2" && realpath "$2")"; cd "$HERE"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null
B="${BROWSER:-$(ls /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1)}"
SEED="$(python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('seed', sum(map(ord,d.get('name','x')+d.get('kind','')))))" "$DATA")"
python3 music.py "$SEED" public/bed.wav >/dev/null
EXTRA=(); [ -n "$B" ] && EXTRA=(--browser-executable="$B")
npx remotion still src/index.ts MilestoneCard "$OUT/milestone-card.png" --props="$DATA" "${EXTRA[@]}" >/dev/null
npx remotion render src/index.ts MilestoneStory "$OUT/milestone-story.mp4" --props="$DATA" --codec=h264 --crf=18 --x264-preset=veryfast --concurrency=2 "${EXTRA[@]}" >/dev/null
echo "wrote $OUT/milestone-card.png and $OUT/milestone-story.mp4"
