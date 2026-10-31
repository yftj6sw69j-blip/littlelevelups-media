import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, random} from 'remotion';
import {C} from './data';
import {Backdrop, Fonts, Logo, clamp, ease} from './shared';
import {Avatar, RingStyle} from './Avatar';

/** Badge / milestone challenges. Two scenes share one data shape:
 *  - "stack"  (12 Days of Strong, Christmas Keep-Going): plate-stack strength board
 *  - "summit" (Step Up, Festive Steps): climbers on one clean mountain ridge          */
export type Tier = {name: string; at: number};
export type LadderEntry = {name: string; value: number; photo?: string};
export type LadderData = {
  title: string; season?: string; label?: string; unit: string;
  tiers: Tier[]; entries: LadderEntry[]; daysLeft?: number; footer?: string; music?: string;
  scene?: 'stack' | 'summit';
};

export const TIER_RING: RingStyle[] = [
  {a: '#9FF0FF', b: '#2FB8DC', c: '#E2FBFF', glow: 'rgba(67,217,255,.45)'},
  {a: '#A9B8FF', b: '#5468F0', c: '#E3E8FF', glow: 'rgba(100,120,255,.45)'},
  {a: '#C6A3FF', b: '#7C3DFF', c: '#EEE3FF', glow: 'rgba(124,61,255,.5)'},
  {a: '#F0A8FF', b: '#B845FF', c: '#FBE6FF', glow: 'rgba(184,69,255,.5)'},
  {a: '#FFE39A', b: '#E0A42C', c: '#FFF5D6', glow: 'rgba(255,200,80,.6)'},
];
const TIER_COL = ['#43D9FF', '#6C7CFF', '#7C3DFF', '#B845FF', '#F5C76B'];
const fmt = (n: number, unit: string) => (unit === 'steps' ? (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`) : `${n}`);
const tierIndex = (v: number, tiers: Tier[]) => tiers.reduce((acc, t, i) => (v >= t.at ? i : acc), -1);
const eo = (t: number) => 1 - Math.pow(1 - t, 3);

type Layout = {W: number; H: number; top: number; areaTop: number; areaBottom: number; statsY: number; scale: number};
const STORY: Layout = {W: 1080, H: 1920, top: 262, areaTop: 760, areaBottom: 1490, statsY: 1625, scale: 1};
const CARD: Layout = {W: 1080, H: 1350, top: 54, areaTop: 470, areaBottom: 1110, statsY: 1220, scale: 0.9};

const Header: React.FC<{d: LadderData; L: Layout; f: number; fps: number}> = ({d, L, f, fps}) => {
  const words = d.title.split(' '); const last = words.pop();
  const t1 = spring({frame: f - 12, fps, config: {damping: 13, stiffness: 160}});
  const wipe = interpolate(f, [18, 34], [0, 100], clamp);
  const s = L.scale;
  return (
    <>
      <div style={{position: 'absolute', top: L.top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ease(f, 0, 12)}}><Logo height={54 * s} /></div>
      <div className="cap" style={{position: 'absolute', top: L.top + 84 * s, left: 0, right: 0, textAlign: 'center', fontSize: 21 * s, color: '#7FE3FF', opacity: ease(f, 6, 18)}}>
        {d.season ?? 'MeFit League'}{d.label ? ` · ${d.label}` : ''}
      </div>
      <div className="anton" style={{position: 'absolute', top: L.top + 122 * s, left: 0, right: 0, textAlign: 'center', fontSize: 100 * s, opacity: t1, transform: `scale(${1.3 - 0.3 * t1})`}}>{words.join(' ')}</div>
      <div className="anton gradtext" style={{position: 'absolute', top: L.top + 218 * s, left: 0, right: 0, textAlign: 'center', fontSize: 128 * s, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>{last}</div>
    </>
  );
};

const Stats: React.FC<{d: LadderData; L: Layout; f: number; ents: LadderEntry[]; at: number}> = ({d, L, f, ents, at}) => {
  const max = d.tiers[d.tiers.length - 1];
  const legends = ents.filter((e) => e.value >= max.at).length;
  const total = ents.reduce((s, e) => s + e.value, 0);
  const items: [string, string, boolean][] = [[String(legends), `${max.name}${legends === 1 ? '' : 's'}`, true], [fmt(total, d.unit), `team ${d.unit}`, false]];
  if (d.daysLeft && d.daysLeft > 0) items.push([String(d.daysLeft), 'days left', false]);
  const s = L.scale;
  return (
    <div style={{position: 'absolute', top: L.statsY, left: 90, right: 90, display: 'flex', gap: 14}}>
      {items.map(([big, small, gold], i) => {
        const o = ease(f, at + i * 5, at + 12 + i * 5);
        return (
          <div key={i} style={{flex: 1, height: 86 * s, borderRadius: 22, border: `1.5px solid ${gold ? 'rgba(245,199,107,.55)' : 'rgba(255,255,255,.1)'}`, background: gold ? 'rgba(245,199,107,.08)' : 'rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 20}px)`}}>
            <div className="anton" style={{fontSize: 38 * s, color: gold ? '#F5C76B' : C.text}}>{big}</div>
            <div className="cap" style={{fontSize: 12 * s, opacity: 0.6, marginTop: 4, letterSpacing: '.22em'}}>{small}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────── STACK (strength) ───────────────────────── */
const StackScene: React.FC<{d: LadderData; L: Layout; f: number; still?: boolean}> = ({d, L, f, still}) => {
  const max = d.tiers[d.tiers.length - 1].at;
  const all = [...d.entries].filter((e) => e.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const MAXBARS = 9;
  const ents = all.slice(0, MAXBARS);
  const more = all.length - ents.length;
  const n = ents.length;
  // Top 3 in the middle (2,1,3) like a podium; the rest fan outwards by rank.
  const seq = [0, -1, 1, -2, 2, -3, 3, -4, 4];
  const raw = ents.map((_, i) => seq[i]);
  const minPos = Math.min(...raw);
  const pos = raw.map((p) => p - minPos);
  const left = 90, right = L.W - 90;
  const slotW = (right - left) / n;
  const plateH = Math.min(34 * L.scale, (L.areaBottom - L.areaTop - 150 * L.scale) / max);
  const baseY = L.areaBottom;
  const START = 70;
  const gap = Math.max(3, Math.floor(40 / n));
  const cx = L.W / 2, cy = (L.areaTop + L.areaBottom) / 2 - 20, R = (L.areaBottom - L.areaTop) * 0.62;
  return (
    <>
      {/* strength backdrop: a giant faint weight plate behind the board */}
      <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0, opacity: ease(f, 20, 60)}}>
        <defs>
          <radialGradient id="plate" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(124,61,255,.0)" />
            <stop offset="0.62" stopColor="rgba(124,61,255,.14)" />
            <stop offset="0.66" stopColor="rgba(67,217,255,.22)" />
            <stop offset="0.7" stopColor="rgba(124,61,255,.08)" />
            <stop offset="0.96" stopColor="rgba(184,69,255,.12)" />
            <stop offset="1" stopColor="rgba(6,7,12,0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="url(#plate)" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={2} strokeDasharray="6 14" transform={`rotate(${f * 0.15} ${cx} ${cy})`} />
      </svg>
      {/* tier lines */}
      {d.tiers.map((t, i) => {
        const y = baseY - t.at * plateH;
        const o = ease(f, 40 + i * 6, 56 + i * 6);
        const lit = ents.some((e) => e.value >= t.at) && f > START + 40 + t.at * 4;
        return (
          <div key={t.name} style={{position: 'absolute', left: 60, right: 60, top: y, opacity: o}}>
            <div style={{height: 1.5, background: `linear-gradient(90deg, ${TIER_COL[i]}00, ${TIER_COL[i]}${lit ? 'aa' : '40'} 12%, ${TIER_COL[i]}${lit ? 'aa' : '40'} 88%, ${TIER_COL[i]}00)`, transform: `scaleX(${o})`}} />
            <div style={{position: 'absolute', left: 0, top: -28, display: 'flex', alignItems: 'baseline', gap: 8, padding: '3px 10px', borderRadius: 8, background: 'rgba(6,7,12,.7)'}}>
              <span className="cap" style={{fontSize: 13 * L.scale, letterSpacing: '.24em', color: TIER_COL[i], opacity: lit ? 1 : 0.7}}>{t.name}</span>
              <span className="anton" style={{fontSize: 20 * L.scale, opacity: 0.7}}>{t.at}</span>
            </div>
          </div>
        );
      })}
      {/* floor */}
      <div style={{position: 'absolute', left: 60, right: 60, top: baseY + 4, height: 2, background: C.grad, opacity: 0.8 * ease(f, 30, 44)}} />
      {/* bars */}
      {ents.map((e, i) => {
        const rank = i + 1;
        const x = left + (pos[i] + 0.5) * slotW;
        const top3 = rank <= 3;
        const barW = Math.min(top3 ? 84 : 64, slotW - 14);
        const at = START + (n - 1 - i) * gap; // lowest first, leader last
        const prog = interpolate(f, [at, at + 40], [0, 1], {...clamp, easing: eo});
        const plates = e.value * prog;
        const ti = tierIndex(plates, d.tiers);
        const h = plates * plateH;
        const size = (top3 ? [120, 96, 96][rank - 1] : 64) * L.scale;
        const topY = baseY - h;
        const landed = ease(f, at + 38, at + 46);
        return (
          <div key={e.name} style={{position: 'absolute', left: x - slotW / 2, width: slotW, top: 0, height: L.H}}>
            {new Array(Math.ceil(plates)).fill(0).map((_, k) => {
              const vis = Math.min(1, plates - k);
              const t = tierIndex(k + 1, d.tiers);
              const col = t >= 0 ? TIER_COL[t] : '#8A93A8';
              return <div key={k} style={{position: 'absolute', left: slotW / 2 - barW / 2, width: barW, top: baseY - (k + 1) * plateH + 2, height: plateH - 4, borderRadius: 6, background: `linear-gradient(180deg, ${col}cc, ${col}66)`, boxShadow: `inset 0 1px 0 #fff4, 0 2px 6px #0006`, opacity: vis, transform: `scaleX(${0.6 + 0.4 * vis})`}} />;
            })}
            <div style={{position: 'absolute', left: slotW / 2 - size / 2, top: topY - size - 8, width: size}}>
              <Avatar name={e.name} photo={e.photo} size={size} at={at} ring={ti >= 0 ? TIER_RING[ti] : null} pill={top3 ? String(rank) : null} still={still} pulse={rank === 1} />
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: baseY + 14, textAlign: 'center', opacity: landed}}>
              <div style={{fontSize: (top3 ? 24 : 19) * L.scale, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
              <div className="anton" style={{fontSize: (top3 ? 34 : 26) * L.scale, color: ti >= 0 ? TIER_COL[ti] : C.text, lineHeight: 1.1}}>{Math.round(plates)}</div>
            </div>
            {rank === 1 ? <div style={{position: 'absolute', left: slotW / 2 - barW, width: barW * 2, top: topY - 40, height: h + 60, background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,214,120,${0.12 * landed}), transparent 70%)`, pointerEvents: 'none'}} /> : null}
          </div>
        );
      })}
      {more > 0 ? <div className="cap" style={{position: 'absolute', top: baseY + 80 * L.scale, left: 0, right: 0, textAlign: 'center', fontSize: 14, opacity: 0.45 * ease(f, START + 60, START + 72)}}>+ {more} more stacking plates</div> : null}
    </>
  );
};

/* ───────────────────────── SUMMIT (mountain) ───────────────────────── */
// One monotonic ridge from bottom-left to the peak at top-right. Everything sits exactly on it.
const ridgePts = (L: Layout): [number, number][] => {
  const x0 = 110, x1 = L.W - 150, y0 = L.areaBottom, y1 = L.areaTop + 40;
  const bumps = [0, 0.18, 0.3, 0.46, 0.55, 0.72, 0.82, 0.93, 1];
  const ys = [0, 0.2, 0.26, 0.47, 0.5, 0.72, 0.78, 0.94, 1];
  return bumps.map((b, i) => [x0 + b * (x1 - x0), y0 - ys[i] * (y0 - y1)]);
};
const ridgeY = (pts: [number, number][], x: number) => {
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) { const [xa, ya] = pts[i - 1], [xb, yb] = pts[i]; const t = (x - xa) / (xb - xa); return ya + (yb - ya) * t; }
  }
  return pts[pts.length - 1][1];
};

const SummitScene: React.FC<{d: LadderData; L: Layout; f: number; still?: boolean}> = ({d, L, f, still}) => {
  const max = d.tiers[d.tiers.length - 1].at;
  const all = [...d.entries].filter((e) => e.value > 0).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const ents = all.slice(0, 10); const more = all.length - ents.length;
  const pts = ridgePts(L);
  const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
  // Axis runs to the first camp above the leader (so early weeks aren't squashed at the bottom), capped at the summit.
  const lead = ents[0]?.value ?? 0;
  const nextCamp = d.tiers.find((t) => t.at > lead * 1.05)?.at ?? max;
  const domain = Math.min(max, Math.max(nextCamp, lead * 1.15));
  const xFor = (v: number) => x0 + Math.min(1, v / domain) * (x1 - x0);
  const visibleTiers = d.tiers.filter((t) => t.at <= domain);
  const futureTiers = d.tiers.filter((t) => t.at > domain);
  const START = 80;
  const draw = ease(f, 40, 95);
  const poly = pts.map((p) => p.join(',')).join(' ');
  const fill = `${poly} ${x1 + 60},${L.areaTop + 120} ${L.W},${L.areaBottom + 40} ${L.W},${L.H} 0,${L.H} 0,${L.areaBottom + 60}`;
  const summitReached = ents.some((e) => e.value >= max);
  const flare = summitReached ? interpolate(f, [START + 60, START + 66, START + 110], [0, 1, 0.25], clamp) : 0;
  return (
    <>
      <svg width={L.W} height={L.H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(124,61,255,.30)" /><stop offset="1" stopColor="rgba(6,7,12,0)" /></linearGradient>
          <linearGradient id="ridge2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={C.cyan} /><stop offset="0.6" stopColor={C.violet} /><stop offset="1" stopColor="#F5C76B" /></linearGradient>
        </defs>
        <g opacity={draw}>
          <polygon points={fill} fill="url(#mtn2)" />
          <polyline points={poly} fill="none" stroke="url(#ridge2)" strokeWidth={4} strokeLinejoin="round" strokeDasharray={4000} strokeDashoffset={4000 * (1 - draw)} />
          <polyline points={pts.slice(-3).map((p) => p.join(',')).join(' ')} fill="none" stroke="#fff" strokeWidth={6} strokeOpacity={0.5 * draw} strokeLinecap="round" />
        </g>
        <circle cx={x1} cy={pts[pts.length - 1][1]} r={140 * flare} fill="rgba(255,214,120,.25)" />
      </svg>
      {visibleTiers.map((t) => {
        const i = d.tiers.indexOf(t);
        const x = xFor(t.at); const y = ridgeY(pts, x);
        const o = ease(f, 60 + i * 6, 74 + i * 6);
        const lit = ents.some((e) => e.value >= t.at) && f > START + 30 + i * 8;
        const s = L.scale;
        return (
          <div key={t.name} style={{position: 'absolute', left: x, top: y, opacity: o}}>
            <div style={{position: 'absolute', left: -1, top: -58 * s, width: 2, height: 58 * s, background: `${TIER_COL[i]}${lit ? 'ff' : '66'}`}} />
            <div style={{position: 'absolute', left: 1, top: -58 * s, width: 0, height: 0, borderTop: `${11 * s}px solid transparent`, borderBottom: `${11 * s}px solid transparent`, borderLeft: `${22 * s}px solid ${TIER_COL[i]}${lit ? 'ff' : '66'}`}} />
            <div style={{position: 'absolute', left: -30, top: 140 * s, width: 170, textAlign: 'center', whiteSpace: 'nowrap', padding: '3px 0', borderRadius: 8, background: 'rgba(6,7,12,.55)'}}>
              <span className="cap" style={{fontSize: 12 * s, letterSpacing: '.2em', color: TIER_COL[i]}}>{t.name}</span>
              <span className="anton" style={{fontSize: 16 * s, opacity: 0.7, marginLeft: 6}}>{fmt(t.at, d.unit)}</span>
            </div>
          </div>
        );
      })}
      {futureTiers.length ? (
        <div style={{position: 'absolute', right: 70, top: L.areaTop - 130 * L.scale, textAlign: 'right', opacity: ease(f, 90, 110), display: 'flex', flexDirection: 'column', gap: 6 * L.scale}}>
          <div className="cap" style={{fontSize: 11 * L.scale, opacity: 0.5, letterSpacing: '.24em'}}>Still to climb</div>
          {futureTiers.map((t) => (
            <div key={t.name} style={{display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap'}}>
              <span className="cap" style={{color: TIER_COL[d.tiers.indexOf(t)], fontSize: 11 * L.scale, letterSpacing: '.18em'}}>{t.name}</span>
              <span className="anton" style={{opacity: 0.75, fontSize: 16 * L.scale}}>{fmt(t.at, d.unit)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {ents.map((e, i) => {
        const rank = i + 1;
        const top3 = rank <= 3;
        const size = (top3 ? [112, 92, 92][rank - 1] : 62) * L.scale;
        const at = START + (ents.length - 1 - i) * 5;
        const prog = interpolate(f, [at, at + 55], [0, 1], {...clamp, easing: eo});
        const v = e.value * prog;
        let x = xFor(v);
        for (let k = 0; k < i; k++) { const xk = xFor(ents[k].value * prog); if (Math.abs(xk - x) < size * 0.75) x = Math.min(x, xk - size * 0.75); }
        const y = ridgeY(pts, x);
        const ti = tierIndex(v, d.tiers);
        const side = i % 2 === 0 ? 1 : -1;
        const landed = ease(f, at + 50, at + 60);
        return (
          <div key={e.name} style={{position: 'absolute', left: x - size / 2, top: y - size + 6, width: size, zIndex: 50 - i}}>
            <Avatar name={e.name} photo={e.photo} size={size} at={at - 4} ring={ti >= 0 ? TIER_RING[ti] : null} pill={top3 ? String(rank) : null} still={still} pulse={rank === 1} />
            <div style={{position: 'absolute', top: size + (top3 ? 22 : 10) * L.scale, left: size / 2 + side * (top3 ? 0 : 26 * L.scale), transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', opacity: landed, padding: '4px 10px', borderRadius: 10, background: 'rgba(6,7,12,.72)'}}>
              <div style={{fontSize: (top3 ? 24 : 18) * L.scale, textShadow: '0 2px 10px #000'}}>{e.name}</div>
              <div className="anton" style={{fontSize: (top3 ? 32 : 22) * L.scale, color: ti >= 0 ? TIER_COL[ti] : '#ffffffcc', lineHeight: 1.05}}>{fmt(Math.round(v), d.unit)}</div>
            </div>
          </div>
        );
      })}
      {!still ? new Array(24).fill(0).map((_, i) => {
        const sp = 0.6 + random(`sn${i}`) * 1.2;
        const yy = ((random(`sy${i}`) * L.H + f * sp) % (L.H + 40)) - 20;
        const xx = random(`sx${i}`) * L.W + Math.sin(f / 30 + i) * 12;
        return <div key={i} style={{position: 'absolute', left: xx, top: yy, width: 3, height: 3, borderRadius: '50%', background: '#fff', opacity: 0.25}} />;
      }) : null}
      {more > 0 ? <div className="cap" style={{position: 'absolute', top: L.areaBottom + 50, left: 0, right: 0, textAlign: 'center', fontSize: 15, opacity: 0.45 * ease(f, START + 60, START + 72)}}>+ {more} more on the climb</div> : null}
    </>
  );
};

/* ───────────────────────── compositions ───────────────────────── */
const Scene: React.FC<LadderData & {L: Layout; still?: boolean}> = (d) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const f = d.still ? 400 : frame;
  const ents = d.entries.filter((e) => e.value > 0);
  const scene = d.scene ?? (d.unit === 'steps' ? 'summit' : 'stack');
  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={d.L.W} h={d.L.H} glowY={scene === 'summit' ? 0.3 : 0.55} still={d.still} />
      {d.music && !d.still ? <Audio src={staticFile(d.music)} /> : null}
      {scene === 'stack' ? <StackScene d={d} L={d.L} f={f} still={d.still} /> : <SummitScene d={d} L={d.L} f={f} still={d.still} />}
      <Header d={d} L={d.L} f={f} fps={fps} />
      <Stats d={d} L={d.L} f={f} ents={ents} at={230} />
      {d.footer ? <div className="anton" style={{position: 'absolute', top: d.L.statsY + 110 * d.L.scale, left: 0, right: 0, textAlign: 'center', fontSize: 34 * d.L.scale, opacity: ease(f, 250, 262)}}>{d.footer}</div> : null}
    </AbsoluteFill>
  );
};
export const LadderStory: React.FC<LadderData> = (d) => <Scene {...d} L={STORY} />;
export const LadderCard: React.FC<LadderData> = (d) => <Scene {...d} L={CARD} still />;

export const ladderSample: LadderData = {
  title: '12 DAYS OF STRONG', season: 'MeFit League · December', label: 'Day 6 of 12', unit: 'workouts', daysLeft: 6, music: 'bed.wav', scene: 'stack',
  tiers: [{name: 'Warrior', at: 3}, {name: 'Knight', at: 5}, {name: 'Gladiator', at: 8}, {name: 'Champion', at: 10}, {name: 'Legend', at: 12}],
  entries: [
    {name: 'Sophie', value: 12, photo: 'avatar-sophie.jpg'}, {name: 'Dan', value: 10, photo: 'avatar-dan.jpg'}, {name: 'Jess', value: 9, photo: 'avatar-jess.jpg'},
    {name: 'Kerry', value: 8, photo: 'avatar-kerry.jpg'}, {name: 'Mark', value: 6, photo: 'avatar-mark.jpg'}, {name: 'Laura', value: 5, photo: 'avatar-laura.jpg'},
    {name: 'Becky', value: 5, photo: 'avatar-becky.jpg'}, {name: 'Tom', value: 4, photo: 'avatar-tom.jpg'}, {name: 'Nat', value: 3, photo: 'avatar-nat.jpg'},
    {name: 'Rich', value: 2}, {name: 'Gemma', value: 1, photo: 'avatar-gemma.jpg'},
  ],
};
export const stepsSample: LadderData = {
  title: 'STEP UP', season: 'MeFit League · Season 1', label: 'Week 2', unit: 'steps', daysLeft: 15, music: 'bed.wav', scene: 'summit',
  tiers: [{name: 'Base Camp', at: 150000}, {name: 'Ridge', at: 200000}, {name: 'High Camp', at: 250000}, {name: 'Summit Push', at: 300000}, {name: 'Summit', at: 350000}],
  entries: [
    {name: 'Kelly', value: 171000, photo: 'avatar-sophie.jpg'}, {name: 'Phil', value: 158000, photo: 'avatar-dan.jpg'}, {name: 'Sarah', value: 132000, photo: 'avatar-jess.jpg'},
    {name: 'Becky', value: 120000, photo: 'avatar-becky.jpg'}, {name: 'Adam', value: 104000, photo: 'avatar-mark.jpg'}, {name: 'Lorna', value: 88000, photo: 'avatar-laura.jpg'},
    {name: 'Steph', value: 76000}, {name: 'Sophie K.', value: 64000, photo: 'avatar-kerry.jpg'},
  ],
};
