import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate, random} from 'remotion';
import {C, LeagueData, rankEntries, Ranked} from './data';
import {Backdrop, Fonts, Logo, clamp, ease} from './shared';
import {Avatar} from './Avatar';

// 120 bpm @ 30fps: a beat every 15 frames. Music follows the same grid.
export const T = {logo: 0, title1: 15, title2: 22, stats: 45, list: [70, 82, 94, 106, 118], third: 150, second: 170, roll: 190, first: 225, footer: 262, total: 330};
const SIDE = 90;
const PODIUM_Y = 900;
const LIST_Y = 1270;
const ROW_H = 54, ROW_GAP = 8, MAX_LIST = 5;

const Count: React.FC<{to: number; start: number; dur?: number}> = ({to, start, dur = 24}) => {
  const f = useCurrentFrame();
  return <>{Math.round(interpolate(f, [start, start + dur], [0, to], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}))}</>;
};

const Podium: React.FC<{e: Ranked; x: number; y: number; size: number; at: number; hero?: boolean}> = ({e, x, y, size, at, hero}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 13, stiffness: 140}});
  const rise = hero ? (1 - s) * -90 : (1 - s) * 60;
  const nameIn = ease(f, at + 10, at + 24);
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, transform: `translateY(${rise}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Avatar name={e.name} photo={(e as any).photo} rank={e.rank} size={size} at={at} pulse={hero} />
      <div className="anton" style={{marginTop: size * 0.16, fontSize: hero ? 60 : 44, opacity: nameIn, transform: `translateY(${(1 - nameIn) * 16}px)`, whiteSpace: 'nowrap', letterSpacing: '.02em'}}>
        {e.name}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 8, opacity: nameIn}}>
        <div className={hero ? 'anton gradtext' : 'anton'} style={{fontSize: hero ? 64 : 46}}>
          <Count to={e.workouts} start={at + 10} dur={hero ? 16 : 20} />
        </div>
        <div className="cap" style={{fontSize: 13, opacity: 0.55, letterSpacing: '.2em'}}>{e.workouts === 1 ? 'workout' : 'workouts'}</div>
      </div>
    </div>
  );
};

const Row: React.FC<{e: Ranked; y: number; at: number}> = ({e, y, at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 160}});
  const sweep = interpolate(f, [at, at + 20], [-30, 130], clamp);
  return (
    <div style={{position: 'absolute', left: SIDE, right: SIDE, top: y, height: ROW_H, transform: `translateX(${(1 - s) * -60}px)`, opacity: Math.min(1, s * 1.4), borderRadius: 18, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', gap: 18, padding: '0 26px 0 10px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep}%`, width: 100, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)', transform: 'skewX(-20deg)'}} />
      <div style={{width: 34, textAlign: 'center', fontFamily: 'Anton', fontSize: 26, opacity: 0.5}}>{e.rank}</div>
      <Avatar name={e.name} photo={(e as any).photo} rank={e.rank} size={46} at={at + 4} />
      <div style={{flex: 1, fontSize: 32, fontFamily: 'Inter', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
      <div className="anton" style={{fontSize: 38}}><Count to={e.workouts} start={at + 4} dur={18} /></div>
    </div>
  );
};

const Particles: React.FC<{at: number; cx: number; cy: number}> = ({at, cx, cy}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + 50) return null;
  const t = (f - at) / 50;
  return (
    <>
      {new Array(28).fill(0).map((_, i) => {
        const ang = random(`a${i}`) * Math.PI * 2;
        const sp = 260 + random(`s${i}`) * 300;
        const d = sp * (1 - Math.pow(1 - t, 3));
        const col = [C.cyan, C.violet, C.purple, '#FFE39A'][i % 4];
        return <div key={i} style={{position: 'absolute', left: cx + Math.cos(ang) * d, top: cy + Math.sin(ang) * d - t * 120, width: 6 + random(`w${i}`) * 6, height: 6 + random(`w${i}`) * 6, borderRadius: '50%', background: col, opacity: 1 - t, boxShadow: `0 0 12px ${col}`}} />;
      })}
    </>
  );
};

export const LeagueStory: React.FC<LeagueData> = (d) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ranked = rankEntries(d.entries);
  const [p1, p2, p3] = ranked;
  const list = ranked.slice(3, 3 + MAX_LIST);
  const more = Math.max(0, ranked.length - 3 - MAX_LIST);
  const words = (d.title ?? 'NOVEMBER GRIND').split(' ');
  const t1 = spring({frame: f - T.title1, fps, config: {damping: 13, stiffness: 160}});
  const t2 = spring({frame: f - T.title2, fps, config: {damping: 12, stiffness: 150}});
  const wipe = interpolate(f, [T.title2, T.title2 + 16], [0, 100], clamp);
  const roll = f >= T.roll && f < T.first ? Math.sin((f - T.roll) * (0.5 + (f - T.roll) * 0.05)) : 0;
  const burst = interpolate(f, [T.first, T.first + 4, T.first + 40], [0, 1, 0], clamp);
  const shake = f >= T.first && f < T.first + 10 ? Math.sin(f * 3.1) * (10 - (f - T.first)) * 1.4 : 0;
  const titleShrink = interpolate(f, [T.third - 20, T.third], [1, 0.72], clamp);
  const titleLift = interpolate(f, [T.third - 20, T.third], [0, -150], clamp);
  const beamOp = interpolate(f, [T.roll, T.roll + 10, T.first, T.first + 20], [0, 0.6, 0.9, 0], clamp);
  const pills: [React.ReactNode, string, boolean][] = [];
  if (d.daysLeft > 0) pills.push([<Count to={d.daysLeft} start={T.stats} />, 'days left', false]);
  pills.push([<Count to={d.teamTotal} start={T.stats + 5} dur={30} />, 'team workouts', false]);
  if (d.climber) pills.push([<>▲ {d.climber.name} +{d.climber.gain}</>, 'climber of the week', true]);

  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1920} glowY={0.46} />
      {d.music ? <Audio src={staticFile(d.music)} /> : null}
      <AbsoluteFill style={{opacity: beamOp, background: `conic-gradient(from ${180 + roll * 6}deg at 50% ${PODIUM_Y / 19.2}%, transparent 0 40%, rgba(184,69,255,.25) 46%, rgba(67,217,255,.18) 50%, rgba(184,69,255,.25) 54%, transparent 60% 100%)`}} />
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
        <div style={{position: 'absolute', top: 270, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ease(f, 0, 12) * (1 - ease(f, T.third - 20, T.third - 6))}}>
          <Logo height={60} />
        </div>
        <div style={{position: 'absolute', top: 360, left: 0, right: 0, transform: `translateY(${titleLift}px) scale(${titleShrink})`, transformOrigin: '50% 0%'}}>
          <div className="cap" style={{textAlign: 'center', fontSize: 24, color: '#7FE3FF', opacity: ease(f, 6, 18)}}>
            {(d.season ?? 'MeFit League · Season 1')} · {d.label ?? `Week ${d.week}`}
          </div>
          <div className="anton" style={{marginTop: 20, textAlign: 'center', fontSize: 150, opacity: t1, transform: `scale(${1.35 - 0.35 * t1})`, filter: `blur(${(1 - t1) * 8}px)`}}>{words[0]}</div>
          <div className="anton gradtext" style={{textAlign: 'center', fontSize: 172, marginTop: -10, opacity: t2, transform: `scale(${1.3 - 0.3 * t2})`, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>{words.slice(1).join(' ')}</div>
          <div style={{marginTop: 36, display: 'flex', justifyContent: 'center', gap: 14, padding: `0 ${SIDE}px`}}>
            {pills.map(([big, small, acc], i) => {
              const s = spring({frame: f - (T.stats + i * 5), fps, config: {damping: 16}});
              return (
                <div key={i} style={{flex: acc ? 1.3 : 1, height: 96, borderRadius: 22, border: `1.5px solid ${acc ? 'rgba(67,217,255,.5)' : 'rgba(255,255,255,.1)'}`, background: acc ? 'rgba(67,217,255,.08)' : 'rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: s, transform: `translateY(${(1 - s) * 30}px)`}}>
                  <div className="anton" style={{fontSize: 42, color: acc ? C.cyan : C.text, whiteSpace: 'nowrap'}}>{big}</div>
                  <div className="cap" style={{fontSize: 13, opacity: 0.6, marginTop: 4, letterSpacing: '.22em'}}>{small}</div>
                </div>
              );
            })}
          </div>
        </div>

        {p3 ? <Podium e={p3} x={850} y={PODIUM_Y + 60} size={210} at={T.third} /> : null}
        {p2 ? <Podium e={p2} x={230} y={PODIUM_Y + 60} size={210} at={T.second} /> : null}
        {f >= T.roll && f < T.first ? (
          <div style={{position: 'absolute', left: 540 - 150, top: PODIUM_Y - 150, width: 300, height: 300, borderRadius: '50%', border: '2px dashed rgba(255,227,154,.55)', transform: `scale(${1 + roll * 0.04}) rotate(${(f - T.roll) * 4}deg)`, boxShadow: `0 0 ${40 + roll * 30}px rgba(255,200,80,.25)`}} />
        ) : null}
        {f >= T.roll && f < T.first ? (
          <div className="cap" style={{position: 'absolute', left: 0, right: 0, top: PODIUM_Y - 16, textAlign: 'center', fontSize: 24, letterSpacing: '.4em', opacity: 0.6 + 0.4 * Math.abs(roll)}}>{d.rollText ?? 'And top of the league…'}</div>
        ) : null}
        {p1 ? <Podium e={p1} x={540} y={PODIUM_Y} size={300} at={T.first} hero /> : null}
        <Particles at={T.first} cx={540} cy={PODIUM_Y} />

        {list.map((e, i) => <Row key={e.name} e={e} y={LIST_Y + i * (ROW_H + ROW_GAP)} at={T.list[i]} />)}
        {more > 0 ? (
          <div className="cap" style={{position: 'absolute', top: LIST_Y + MAX_LIST * (ROW_H + ROW_GAP) + 4, left: 0, right: 0, textAlign: 'center', fontSize: 17, opacity: 0.45 * ease(f, T.list[0], T.list[0] + 12)}}>+ {more} more grafting on the full board</div>
        ) : null}
        <div style={{position: 'absolute', top: 1625, left: 0, right: 0, textAlign: 'center', opacity: ease(f, T.footer, T.footer + 12), transform: `translateY(${(1 - ease(f, T.footer, T.footer + 12)) * 20}px)`}}>
          <span className="anton" style={{fontSize: 40, letterSpacing: '.04em'}}>{d.footer ?? 'Most workouts by 1 Dec wins'}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at 50% ${PODIUM_Y / 19.2}%, rgba(255,214,120,${0.5 * burst}), rgba(124,61,255,${0.25 * burst}) 28%, transparent 60%)`}} />
    </AbsoluteFill>
  );
};
