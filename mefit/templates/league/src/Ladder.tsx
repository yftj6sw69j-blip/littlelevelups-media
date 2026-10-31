import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, random} from 'remotion';
import {C} from './data';
import {Backdrop, Fonts, Logo, clamp, ease} from './shared';
import {Avatar, RingStyle} from './Avatar';

/** Badge / milestone challenges (12 Days of Strong, Step Up, Christmas Keep-Going, Festive Steps). */
export type Tier = {name: string; at: number};
export type LadderEntry = {name: string; value: number; photo?: string};
export type LadderData = {
  title: string; // e.g. "12 DAYS OF STRONG"
  season?: string; // eyebrow, e.g. "MeFit League · December"
  label?: string; // e.g. "Day 6 of 12"
  unit: string; // "workouts" | "steps"
  tiers: Tier[]; // 5 ascending badges
  entries: LadderEntry[];
  daysLeft?: number;
  footer?: string;
  music?: string;
  still?: boolean;
};

// Five tier ring colours, cool → gold. Top tier is the gold "legend" ring.
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

// Mountain area (story coordinates)
const BASE_Y = 1560, TOP_Y = 700, LEFT = 150, RIGHT = 990;

export const LadderStory: React.FC<LadderData> = (d) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = d.still ? 330 : frame;
  const max = d.tiers[d.tiers.length - 1].at;
  const ents = [...d.entries].filter((e) => e.value > 0).sort((a, b) => a.value - b.value || a.name.localeCompare(b.name));
  const yFor = (v: number) => BASE_Y - (Math.min(v, max * 1.04) / (max * 1.04)) * (BASE_Y - TOP_Y);
  const n = ents.length;
  const size = n > 14 ? 74 : n > 9 ? 86 : 100;
  // spread climbers left→right in value order so higher climbers sit to the right, like a ridge line
  const xFor = (i: number) => LEFT + 30 + (n <= 1 ? 0.5 : i / (n - 1)) * (RIGHT - LEFT - 60);
  const legends = ents.filter((e) => e.value >= max).length;
  const total = ents.reduce((s, e) => s + e.value, 0);
  const climbStart = 95;
  const t1 = spring({frame: f - 12, fps, config: {damping: 13, stiffness: 160}});
  const wipe = interpolate(f, [18, 34], [0, 100], clamp);
  const words = d.title.split(' ');
  const last = words.pop();
  const summitBurst = interpolate(f, [climbStart + 100, climbStart + 104, climbStart + 140], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1920} glowY={0.3} still={d.still} />
      {d.music && !d.still ? <Audio src={staticFile(d.music)} /> : null}
      {/* mountain silhouette */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(124,61,255,.28)" />
            <stop offset="1" stopColor="rgba(6,7,12,0)" />
          </linearGradient>
          <linearGradient id="ridge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="0.6" stopColor={C.violet} />
            <stop offset="1" stopColor={C.purple} />
          </linearGradient>
        </defs>
        {(() => {
          const draw = ease(f, 40, 90);
          const pts = `0,${BASE_Y + 80} 160,${BASE_Y - 40} 260,${BASE_Y - 10} 470,${BASE_Y - 380} 560,${BASE_Y - 330} 760,${TOP_Y + 200} 840,${TOP_Y + 120} 950,${TOP_Y - 70} 1080,${TOP_Y + 160} 1080,1920 0,1920`;
          return (
            <g opacity={draw}>
              <polygon points={pts} fill="url(#mtn)" />
              <polyline points={pts.split(' ').slice(0, 9).join(' ')} fill="none" stroke="url(#ridge)" strokeWidth={3} strokeDasharray={3000} strokeDashoffset={3000 * (1 - draw)} opacity={0.7} />
            </g>
          );
        })()}
      </svg>

      {/* header */}
      <div style={{position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ease(f, 0, 12)}}><Logo height={56} /></div>
      <div className="cap" style={{position: 'absolute', top: 346, left: 0, right: 0, textAlign: 'center', fontSize: 22, color: '#7FE3FF', opacity: ease(f, 6, 18)}}>
        {d.season ?? 'MeFit League'}{d.label ? ` · ${d.label}` : ''}
      </div>
      <div className="anton" style={{position: 'absolute', top: 384, left: 0, right: 0, textAlign: 'center', fontSize: 104, opacity: t1, transform: `scale(${1.3 - 0.3 * t1})`}}>{words.join(' ')}</div>
      <div className="anton gradtext" style={{position: 'absolute', top: 486, left: 0, right: 0, textAlign: 'center', fontSize: 132, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>{last}</div>

      {/* tier ledges */}
      {d.tiers.map((t, i) => {
        const y = yFor(t.at);
        const a = ease(f, 50 + i * 7, 66 + i * 7);
        const reached = ents.some((e) => e.value >= t.at) && f > climbStart + 60;
        return (
          <div key={t.name} style={{position: 'absolute', left: 60, right: 60, top: y, height: 0, opacity: a}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1.5, background: `linear-gradient(90deg, ${TIER_COL[i]}00, ${TIER_COL[i]}${reached ? 'cc' : '55'} 18%, ${TIER_COL[i]}${reached ? 'cc' : '55'} 82%, ${TIER_COL[i]}00)`, transform: `scaleX(${a})`}} />
            <div style={{position: 'absolute', left: 0, top: -34, display: 'flex', alignItems: 'baseline', gap: 10, padding: '4px 12px', borderRadius: 10, background: 'rgba(6,7,12,.6)'}}>
              <span className="cap" style={{fontSize: 15, letterSpacing: '.24em', color: TIER_COL[i]}}>{t.name}</span>
              <span className="anton" style={{fontSize: 22, opacity: 0.7}}>{fmt(t.at, d.unit)}</span>
            </div>
          </div>
        );
      })}

      {/* climbers */}
      {ents.map((e, i) => {
        const at = climbStart + i * Math.max(3, Math.floor(60 / Math.max(1, n)));
        const prog = interpolate(f, [at, at + 50], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
        const shown = e.value * prog;
        const ti = tierIndex(shown, d.tiers);
        const y = yFor(shown);
        const x = xFor(i);
        const jitter = (random(`j${e.name}`) - 0.5) * 30;
        return (
          <div key={e.name} style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + jitter, width: size, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 + i}}>
            <Avatar name={e.name} photo={e.photo} size={size} at={at - 6} ring={ti >= 0 ? TIER_RING[ti] : null} pill={null} still={d.still} pulse={e.value >= max} />
            <div style={{marginTop: 8, fontSize: size * 0.24, whiteSpace: 'nowrap', textShadow: '0 2px 10px #000'}}>{e.name}</div>
            <div className="anton" style={{fontSize: size * 0.26, color: ti >= 0 ? TIER_COL[ti] : '#ffffffaa', lineHeight: 1}}>{fmt(Math.round(shown), d.unit)}</div>
          </div>
        );
      })}

      {/* stats */}
      <div style={{position: 'absolute', top: 1640, left: 90, right: 90, display: 'flex', gap: 14, opacity: ease(f, 200, 214)}}>
        {[
          [String(legends), `${d.tiers[d.tiers.length - 1].name}s`, true],
          [fmt(total, d.unit), `team ${d.unit}`, false],
          ...(d.daysLeft !== undefined && d.daysLeft > 0 ? [[String(d.daysLeft), 'days left', false]] : []),
        ].map(([big, small, gold], i) => (
          <div key={i} style={{flex: 1, height: 88, borderRadius: 22, border: `1.5px solid ${gold ? 'rgba(245,199,107,.55)' : 'rgba(255,255,255,.1)'}`, background: gold ? 'rgba(245,199,107,.08)' : 'rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <div className="anton" style={{fontSize: 38, color: gold ? '#F5C76B' : C.text}}>{big as string}</div>
            <div className="cap" style={{fontSize: 12, opacity: 0.6, marginTop: 4, letterSpacing: '.22em'}}>{small as string}</div>
          </div>
        ))}
      </div>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse 60% 20% at 50% ${TOP_Y / 19.2}%, rgba(255,214,120,${0.35 * summitBurst}), transparent 70%)`}} />
    </AbsoluteFill>
  );
};

// 4:5 feed / WhatsApp still uses the same scene scaled into a 1080x1350 frame
export const LadderCard: React.FC<LadderData> = (d) => (
  <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
    <Backdrop w={1080} h={1350} glowY={0.4} still />
    <div style={{position: 'absolute', left: 0, top: -190, width: 1080, height: 1920, transform: 'scale(.82)', transformOrigin: '50% 0%'}}>
      <LadderStory {...d} still music={undefined} />
    </div>
  </AbsoluteFill>
);

export const ladderSample: LadderData = {
  title: '12 DAYS OF STRONG',
  season: 'MeFit League · December',
  label: 'Day 6 of 12',
  unit: 'workouts',
  daysLeft: 6,
  music: 'bed.wav',
  tiers: [
    {name: 'Warrior', at: 3},
    {name: 'Knight', at: 5},
    {name: 'Gladiator', at: 8},
    {name: 'Champion', at: 10},
    {name: 'Legend', at: 12},
  ],
  entries: [
    {name: 'Sophie', value: 12, photo: 'avatar-sophie.jpg'},
    {name: 'Dan', value: 10, photo: 'avatar-dan.jpg'},
    {name: 'Jess', value: 9, photo: 'avatar-jess.jpg'},
    {name: 'Kerry', value: 8, photo: 'avatar-kerry.jpg'},
    {name: 'Mark', value: 6, photo: 'avatar-mark.jpg'},
    {name: 'Laura', value: 5, photo: 'avatar-laura.jpg'},
    {name: 'Becky', value: 5, photo: 'avatar-becky.jpg'},
    {name: 'Tom', value: 4, photo: 'avatar-tom.jpg'},
    {name: 'Nat', value: 3, photo: 'avatar-nat.jpg'},
    {name: 'Rich', value: 2},
    {name: 'Gemma', value: 1, photo: 'avatar-gemma.jpg'},
  ],
};

export const stepsSample: LadderData = {
  title: 'STEP UP',
  season: 'MeFit League · Season 1',
  label: 'Week 2',
  unit: 'steps',
  daysLeft: 15,
  music: 'bed.wav',
  tiers: [
    {name: 'Base Camp', at: 150000},
    {name: 'Ridge', at: 200000},
    {name: 'High Camp', at: 250000},
    {name: 'Summit Push', at: 300000},
    {name: 'Summit', at: 350000},
  ],
  entries: [
    {name: 'Kelly', value: 171000, photo: 'avatar-sophie.jpg'},
    {name: 'Phil', value: 158000, photo: 'avatar-dan.jpg'},
    {name: 'Sarah', value: 132000, photo: 'avatar-jess.jpg'},
    {name: 'Becky', value: 120000, photo: 'avatar-becky.jpg'},
    {name: 'Adam', value: 104000, photo: 'avatar-mark.jpg'},
    {name: 'Lorna', value: 88000, photo: 'avatar-laura.jpg'},
    {name: 'Steph', value: 76000},
    {name: 'Sophie K.', value: 64000, photo: 'avatar-kerry.jpg'},
  ],
};
