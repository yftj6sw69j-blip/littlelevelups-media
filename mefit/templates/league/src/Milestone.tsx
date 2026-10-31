import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate, random} from 'remotion';
import {C} from './data';
import {Backdrop, Fonts, Logo, clamp, ease} from './shared';
import {Avatar, RING} from './Avatar';

/** Member milestone card: 1 month, 3 months, 6 months, 1 year, PB, level-up. One template, data-driven. */
export type MilestoneData = {
  name: string; photo?: string;
  kind: 'month1' | 'month3' | 'month6' | 'year1' | 'pb' | 'levelup';
  headline?: string; // default from kind
  sub: string; // e.g. "Joined 11 Sept · 22 sessions"
  level: number; levelName: string; xpFrac: number; // ring fill 0..1
  stats: [string, string][]; // up to 3: [["22","sessions"],["7","PBs"],["5","week streak"]]
  footer?: string; // e.g. "Here's to month two 👊"
  music?: string;
};
const HEAD: Record<MilestoneData['kind'], string> = {month1: 'ONE MONTH', month3: 'THREE MONTHS', month6: 'SIX MONTHS', year1: 'ONE YEAR', pb: 'NEW PB', levelup: 'LEVEL UP'};
const TINT: Record<MilestoneData['kind'], keyof typeof RING | 0> = {month1: 0, month3: 3, month6: 2, year1: 1, pb: 0, levelup: 1};
const eo = (t: number) => 1 - Math.pow(1 - t, 3);
// 120 bpm: beats at 15f. Logo 0, eyebrow 10, ring 20→80, headline slams 75, stats 110, level pill 140, footer 170, total 270 (9 s)
const T = {ring: 20, head: 75, stats: 110, pill: 140, footer: 170, total: 270};

export const MilestoneStory: React.FC<MilestoneData & {still?: boolean; card?: boolean}> = (d) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const f = d.still ? 400 : frame;
  const H = d.card ? 1350 : 1920; const top = d.card ? 70 : 250; const s = d.card ? 0.86 : 1;
  const tint = TINT[d.kind]; const ring = tint ? RING[tint] : undefined;
  const head = (d.headline ?? HEAD[d.kind]).split(' ');
  const hs = spring({frame: f - T.head, fps, config: {damping: 11, stiffness: 160}});
  const slam = d.still ? 0 : interpolate(f, [T.head, T.head + 3, T.head + 36], [0, 1, 0], clamp);
  const shake = !d.still && f >= T.head && f < T.head + 10 ? Math.sin(f * 3) * (10 - (f - T.head)) * 1.2 : 0;
  const ringY = top + 190 * s;
  const size = 420 * s;
  const pill = spring({frame: f - T.pill, fps, config: {damping: 12, stiffness: 170}});
  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={H} glowY={0.36} still={d.still} />
      {d.music && !d.still ? <Audio src={staticFile(d.music)} /> : null}
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.5}px)`}}>
        <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ease(f, 0, 12)}}><Logo height={58 * s} /></div>
        <div className="cap" style={{position: 'absolute', top: top + 90 * s, left: 0, right: 0, textAlign: 'center', fontSize: 24 * s, color: '#7FE3FF', opacity: ease(f, 10, 22)}}>Member milestone</div>
        {/* ring + portrait */}
        <div style={{position: 'absolute', top: ringY, left: 540 - size / 2, width: size}}>
          <Avatar name={d.name} photo={d.photo} size={size} at={T.ring} ring={ring ?? null} pill={null} still={d.still} pulse />
          <div style={{position: 'absolute', left: '50%', bottom: -34 * s, transform: `translateX(-50%) scale(${pill})`, padding: `${10 * s}px ${26 * s}px`, borderRadius: 999, background: C.grad, color: '#0b0a12', fontFamily: 'Anton', fontSize: 30 * s, letterSpacing: '.08em', whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(124,61,255,.5)'}}>
            LEVEL {String(d.level).padStart(2, '0')} · {d.levelName.toUpperCase()}
          </div>
        </div>
        {/* headline */}
        <div style={{position: 'absolute', top: ringY + size + 110 * s, left: 0, right: 0, textAlign: 'center', opacity: hs, transform: `scale(${1.4 - 0.4 * hs})`}}>
          <div className="anton" style={{fontSize: 96 * s, lineHeight: 0.95, letterSpacing: '.01em'}}>{head.slice(0, -1).join(' ')}</div>
          <div className="anton gradtext" style={{fontSize: 150 * s, lineHeight: 0.95}}>{head[head.length - 1]}</div>
          <div className="anton" style={{fontSize: 64 * s, marginTop: 16 * s, color: ring ? ring.a : C.text, letterSpacing: '.03em'}}>{d.name.toUpperCase()}</div>
          <div style={{fontSize: 26 * s, opacity: 0.65, marginTop: 10 * s, fontWeight: 400}}>{d.sub}</div>
        </div>
        {/* stats */}
        <div style={{position: 'absolute', top: ringY + size + 110 * s + 420 * s, left: 90, right: 90, display: 'flex', gap: 14}}>
          {d.stats.slice(0, 3).map(([v, l], i) => {
            const o = spring({frame: f - (T.stats + i * 6), fps, config: {damping: 15}});
            return (
              <div key={i} style={{flex: 1, height: 110 * s, borderRadius: 24, border: '1.5px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.045)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: o, transform: `translateY(${(1 - o) * 30}px)`}}>
                <div className="anton" style={{fontSize: 48 * s}}>{v}</div>
                <div className="cap" style={{fontSize: 13 * s, opacity: 0.6, marginTop: 4, letterSpacing: '.22em'}}>{l}</div>
              </div>
            );
          })}
        </div>
        {d.footer ? <div className="anton" style={{position: 'absolute', top: H - (d.card ? 90 : 300), left: 0, right: 0, textAlign: 'center', fontSize: 40 * s, letterSpacing: '.04em', opacity: ease(f, T.footer, T.footer + 14), transform: `translateY(${(1 - ease(f, T.footer, T.footer + 14)) * 20}px)`}}>{d.footer}</div> : null}
      </AbsoluteFill>
      {/* burst on the headline slam */}
      {!d.still && f >= T.head && f < T.head + 50 ? new Array(36).fill(0).map((_, i) => {
        const t = (f - T.head) / 50; const ang = random(`ma${i}`) * Math.PI * 2; const sp = 240 + random(`ms${i}`) * 360; const dd = sp * eo(t);
        const col = [C.cyan, C.violet, C.purple, ring?.a ?? '#F5C76B'][i % 4];
        return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(ang) * dd, top: ringY + size / 2 + Math.sin(ang) * dd - t * 120, width: 6 + random(`mw${i}`) * 6, height: 6 + random(`mw${i}`) * 6, borderRadius: '50%', background: col, opacity: 1 - t, boxShadow: `0 0 10px ${col}`}} />;
      }) : null}
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at 540px ${ringY + size / 2}px, rgba(255,255,255,${0.35 * slam}), rgba(124,61,255,${0.2 * slam}) 30%, transparent 65%)`}} />
    </AbsoluteFill>
  );
};
export const MilestoneCard: React.FC<MilestoneData> = (d) => <MilestoneStory {...d} still card />;
export const MILESTONE_FRAMES = T.total;

export const milestoneSample: MilestoneData = {
  name: 'Jess', photo: 'avatar-jess.jpg', kind: 'month1', sub: 'Joined 11 September · 22 sessions in',
  level: 2, levelName: 'Finding Your Feet', xpFrac: 0.42, stats: [['22', 'sessions'], ['7', 'PBs'], ['5', 'week streak']], footer: "Here's to month two 👊", music: 'bed.wav',
};
