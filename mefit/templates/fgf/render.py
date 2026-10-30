"""Feel Good Friday renderer. Usage: python3 render.py wins.json OUTDIR
wins.json = {"week": 45, "wins": [{"name": "Emma", "text": "New deadlift PB: 80kg", "kind": "PB"}],
             "feature": {"type": "achievement"|"quote", "title": "First pull-up", "name": "Sarah"}}
name is exactly what the client chose to show (first name, initial, or "A MeFit client").
Writes OUTDIR/board.jpg (if 3+ wins) and OUTDIR/feature.jpg (if feature given)."""
import json, sys, pathlib, random, html
from playwright.sync_api import sync_playwright
D = pathlib.Path(__file__).resolve().parent; U = lambda p: pathlib.Path(p).resolve().as_uri()
E = {"PB": "🏋️", "Energy & sleep": "😴", "Confidence": "💪", "Clothes & body": "👖", "Consistency": "🔥"}
def esc(s): return html.escape(str(s))
random.seed(7)
STARS = "".join(f'<div style="position:absolute;left:{random.randint(0,1080)}px;top:{random.randint(0,1920)}px;width:{s}px;height:{s}px;border-radius:50%;background:#fff;opacity:{random.uniform(.15,.45):.2f}"></div>' for s in [random.choice([3,4,5,7]) for _ in range(46)])
HEAD = f"""<html><head><meta charset="utf-8"><style>
@font-face{{font-family:Anton;src:url({U(D/'anton.woff2')})}}
@font-face{{font-family:Inter;font-weight:400;src:url({U(D/'inter-latin-400-normal.woff2')})}}
@font-face{{font-family:Inter;font-weight:600;src:url({U(D/'inter-latin-600-normal.woff2')})}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1920px;position:relative;overflow:hidden;background:#06070C;color:#F4F2EE;font-family:Inter;font-weight:600}}
.anton{{font-family:Anton;text-transform:uppercase;line-height:.95;text-align:center;font-weight:400}}
.grad{{background:linear-gradient(90deg,#43D9FF,#7C3DFF 60%,#B845FF);-webkit-background-clip:text;color:transparent}}
.cap{{text-transform:uppercase;letter-spacing:.3em;text-align:center}}
</style></head><body>
<div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 38% at 50% 44%,rgba(80,40,170,.45),rgba(6,7,12,0) 100%),radial-gradient(ellipse 45% 25% at 78% 92%,rgba(30,120,130,.22),rgba(6,7,12,0) 100%)"></div>
{STARS}<div style="position:absolute;top:270px;left:0;right:0;text-align:center"><img src="{U(D/'logo.png')}" style="height:110px"></div>"""
def label(t, top=520): return f'<div class="cap" style="position:absolute;top:{top}px;left:0;right:0;font-size:28px;color:#7FE3FF">{esc(t)}</div>'
def board(week, wins):
    rows = "".join(f'''<div style="display:flex;align-items:center;gap:30px;padding:30px 40px;border-radius:30px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1)">
<div style="font-size:56px">{E.get(w.get("kind",""), "✨")}</div><div style="font-size:38px;line-height:1.3"><b>{esc(w["text"])}</b><br><span style="opacity:.6;font-size:30px;font-weight:400">{esc(w["name"])}</span></div></div>''' for w in wins[:6])
    top = 1000 if len(wins) <= 4 else 930
    return HEAD + label(f"Feel Good Friday · Week {week}") + f'''<div style="position:absolute;top:590px;left:0;right:0"><div class="anton" style="font-size:150px">This week's</div><div class="anton grad" style="font-size:170px">wins.</div></div>
<div style="position:absolute;top:{top}px;left:110px;right:110px;display:grid;gap:{26 if len(wins)<=4 else 20}px">{rows}</div></body></html>'''
def achievement(title, name):
    return HEAD + label("Feel Good Friday") + f'''<div style="position:absolute;left:110px;right:110px;top:610px;border-radius:48px;padding:70px 60px;background:linear-gradient(160deg,rgba(124,61,255,.28),rgba(67,217,255,.08));border:2px solid rgba(184,69,255,.45);box-shadow:0 0 80px rgba(124,61,255,.35);text-align:center">
<div style="width:190px;height:190px;margin:0 auto 40px;border-radius:50%;background:linear-gradient(135deg,#43D9FF,#7C3DFF 55%,#B845FF);display:flex;align-items:center;justify-content:center;font-size:100px;box-shadow:0 0 60px rgba(124,61,255,.6)">🏆</div>
<div class="cap" style="font-size:26px;color:#B98CFF;margin-bottom:24px">Achievement unlocked</div>
<div class="anton" style="font-size:{120 if len(title)<=22 else 92}px">{esc(title)}</div>
<div style="margin-top:36px;font-size:36px;opacity:.75;font-weight:400">{esc(name)}</div>
<div style="margin:40px auto 0;width:80%;height:16px;border-radius:8px;background:linear-gradient(90deg,#43D9FF,#7C3DFF 55%,#B845FF)"></div></div></body></html>'''
def quote(title, name):
    fs = 118 if len(title) <= 40 else 96 if len(title) <= 70 else 78
    return HEAD + label("Feel Good Friday · Client win") + f'''<div style="position:absolute;left:100px;right:100px;top:640px">
<div class="grad" style="font-family:Georgia,serif;font-weight:700;font-size:300px;line-height:.7;height:170px">&ldquo;</div>
<div class="anton" style="font-size:{fs}px;line-height:1;text-align:left">{esc(title)}</div>
<div style="width:200px;height:8px;border-radius:4px;margin:56px 0 30px;background:linear-gradient(90deg,#43D9FF,#7C3DFF 55%,#B845FF)"></div>
<div style="font-size:38px;opacity:.8;font-weight:400">— {esc(name)}</div></div></body></html>'''
if __name__ == "__main__":
    data = json.load(open(sys.argv[1])); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    pages = []
    if len(data.get("wins", [])) >= 3: pages.append(("board", board(data["week"], data["wins"])))
    f = data.get("feature")
    if f: pages.append(("feature", (achievement if f["type"] == "achievement" else quote)(f["title"], f["name"])))
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1080, "height": 1920})
        for n, h in pages:
            t = out / f"_{n}.html"; t.write_text(h, encoding="utf-8"); pg.goto(t.as_uri()); pg.wait_for_timeout(500)
            pg.screenshot(path=str(out / f"{n}.jpg"), type="jpeg", quality=92); t.unlink(); print("wrote", out / f"{n}.jpg")
        b.close()
