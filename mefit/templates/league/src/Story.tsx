import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate} from 'remotion';
import {C, LeagueData, rankEntries} from './data';
import {Backdrop, Fonts, Logo, MedalBadge, clamp, ease} from './shared';

// 120 bpm at 30 fps = one beat every 15 frames. The music is built on the same grid.
export const T = {title1: 15, title2: 22, stats: 45, lowSlots: [75, 90, 105, 120, 135], third: 150, second: 165, roll: 180, first: 210, footer: 228, total: 300};
const W = 1080;
const SIDE = 90;
const TOP_H = 100, TOP_GAP = 12, TOP_Y = 880;
const LOW_H = 60, LOW_GAP = 9, LOW_Y = TOP_Y + 3 * (TOP_H + TOP_GAP) + 6;
const MAX_LOW = 5;

const Count: React.FC<{to: number; start: number; dur?: number}> = ({to, start, dur = 24}) => {
  const f = useCurrentFrame();
  const v = Math.round(interpolate(f, [start, start + dur], [0, to], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}));
  return <>{v}</>;
};

const Row: React.FC<{name: string; workouts: number; rank: number; top: boolean; y: number; at: number; hero?: boolean}> = ({name, workouts, rank, top, y, at, hero}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: hero ? 11 : 15, stiffness: hero ? 140 : 170}});
  const h = top ? TOP_H : LOW_H;
  const medal = top && rank <= 3;
  const col = medal ? C.medal[rank - 1] : '#ffffff';
  const glow = hero ? interpolate(f, [at, at + 6, at + 40], [0, 1, 0.55], clamp) : 0;
  const sweep = interpolate(f, [at, at + 18], [-40, 140], clamp);
  return (
    <div
      style={{
        position: 'absolute', left: SIDE, right: SIDE, top: y, height: h,
        transform: hero
          ? `translateY(${(1 - s) * -70}px) scale(${1.18 - 0.18 * s})`
          : `translateY(${(1 - s) * 140}px) scale(${0.94 + 0.06 * s})`,
        opacity: Math.min(1, s * 1.4), zIndex: hero ? 5 : 1,
        borderRadius: top ? 30 : 20,
        background: hero
          ? 'linear-gradient(100deg, rgba(67,217,255,.20), rgba(124,61,255,.30) 55%, rgba(184,69,255,.24))'
          : top ? `linear-gradient(100deg, ${col}1f, rgba(255,255,255,.04) 60%)` : 'rgba(255,255,255,.045)',
        border: `1.5px solid ${hero ? 'rgba(184,69,255,.75)' : top ? col + '55' : 'rgba(255,255,255,.09)'}`,
        boxShadow: hero ? `0 0 ${40 + glow * 70}px rgba(124,61,255,${0.35 + glow * 0.4})` : 'none',
        display: 'flex', alignItems: 'center', gap: top ? 26 : 22, padding: top ? '0 34px 0 22px' : '0 30px 0 26px', overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep}%`, width: 120, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent)', transform: 'skewX(-20deg)'}} />
      {medal ? (
        <MedalBadge rank={rank} size={64} />
      ) : (
        <div style={{width: 44, textAlign: 'center', fontFamily: 'Anton', fontSize: 32, opacity: 0.55}}>{rank}</div>
      )}
      <div className={top ? 'anton' : ''} style={{flex: 1, fontSize: top ? 54 : 34, fontFamily: top ? 'Anton' : 'Inter', fontWeight: 600, letterSpacing: top ? '.02em' : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
        {name}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
        <div className={hero ? 'anton gradtext' : 'anton'} style={{fontSize: top ? 64 : 40}}>
          <Count to={workouts} start={at} dur={hero ? 14 : 18} />
        </div>
        <div className="cap" style={{fontSize: top ? 16 : 13, opacity: 0.55, letterSpacing: '.2em'}}>{workouts === 1 ? 'workout' : 'workouts'}</div>
      </div>
    </div>
  );
};

const Pill: React.FC<{at: number; big: React.ReactNode; small: string; accent?: boolean}> = ({at, big, small, accent}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 16}});
  return (
    <div style={{flex: 1, height: 100, borderRadius: 24, border: `1.5px solid ${accent ? 'rgba(67,217,255,.5)' : 'rgba(255,255,255,.1)'}`, background: accent ? 'rgba(67,217,255,.08)' : 'rgba(255,255,255,.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: s, transform: `translateY(${(1 - s) * 30}px)`}}>
      <div className="anton" style={{fontSize: 44, color: accent ? C.cyan : C.text, whiteSpace: 'nowrap'}}>{big}</div>
      <div className="cap" style={{fontSize: 14, opacity: 0.6, marginTop: 6, letterSpacing: '.22em'}}>{small}</div>
    </div>
  );
};

export const LeagueStory: React.FC<LeagueData> = (d) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ranked = rankEntries(d.entries);
  const top3 = ranked.slice(0, 3);
  const low = ranked.slice(3, 3 + MAX_LOW);
  const more = Math.max(0, ranked.length - 3 - MAX_LOW);
  const title = (d.title ?? 'NOVEMBER GRIND').split(' ');
  const t1 = spring({frame: f - T.title1, fps, config: {damping: 13, stiffness: 160}});
  const t2 = spring({frame: f - T.title2, fps, config: {damping: 12, stiffness: 150}});
  const wipe = interpolate(f, [T.title2, T.title2 + 16], [0, 100], clamp);
  // Drumroll: anticipation pulse before #1 lands, then a light burst.
  const roll = f >= T.roll && f < T.first ? Math.sin((f - T.roll) * (0.6 + (f - T.roll) * 0.05)) : 0;
  const burst = interpolate(f, [T.first, T.first + 4, T.first + 36], [0, 1, 0], clamp);
  const shake = f >= T.first && f < T.first + 10 ? Math.sin(f * 3.1) * (10 - (f - T.first)) * 1.2 : 0;
  const lowSlots = T.lowSlots.slice(MAX_LOW - low.length);

  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1920} glowY={0.4} />
      {d.music ? <Audio src={staticFile(d.music)} /> : null}
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.4}px)`}}>
        <div style={{position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: ease(f, 0, 12)}}>
          <Logo height={62} />
        </div>
        <div className="cap" style={{position: 'absolute', top: 358, left: 0, right: 0, textAlign: 'center', fontSize: 24, color: '#7FE3FF', opacity: ease(f, 6, 18)}}>
          {(d.season ?? 'MeFit League · Season 1')} · {d.label ?? `Week ${d.week}`}
        </div>
        <div className="anton" style={{position: 'absolute', top: 404, left: 0, right: 0, textAlign: 'center', fontSize: 150, opacity: t1, transform: `scale(${1.35 - 0.35 * t1})`, filter: `blur(${(1 - t1) * 8}px)`}}>
          {title[0]}
        </div>
        <div className="anton gradtext" style={{position: 'absolute', top: 546, left: 0, right: 0, textAlign: 'center', fontSize: 172, opacity: t2, transform: `scale(${1.3 - 0.3 * t2})`, clipPath: `inset(0 ${100 - wipe}% 0 0)`}}>
          {title.slice(1).join(' ')}
        </div>
        <div style={{position: 'absolute', top: 742, left: SIDE, right: SIDE, display: 'flex', gap: 16}}>
          {d.daysLeft > 0 ? <Pill at={T.stats} big={<Count to={d.daysLeft} start={T.stats} />} small="days left" /> : null}
          <Pill at={T.stats + 5} big={<Count to={d.teamTotal} start={T.stats + 5} dur={30} />} small="team workouts" />
          {d.climber ? <Pill at={T.stats + 10} accent big={<>▲ {d.climber.name}</>} small={`+${d.climber.gain} this week`} /> : null}
        </div>

        {/* Rows from the bottom up, #1 last */}
        {low.map((e, i) => (
          <Row key={e.name} {...e} top={false} y={LOW_Y + i * (LOW_H + LOW_GAP)} at={lowSlots[low.length - 1 - i]} />
        ))}
        {top3[2] ? <Row {...top3[2]} top y={TOP_Y + 2 * (TOP_H + TOP_GAP)} at={T.third} /> : null}
        {top3[1] ? <Row {...top3[1]} top y={TOP_Y + (TOP_H + TOP_GAP)} at={T.second} /> : null}
        {f >= T.roll && f < T.first ? (
          <div style={{position: 'absolute', left: SIDE, right: SIDE, top: TOP_Y, height: TOP_H, borderRadius: 30, border: '1.5px dashed rgba(184,69,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + roll * 0.02})`, boxShadow: `0 0 ${30 + roll * 25}px rgba(124,61,255,.35)`}}>
            <div className="cap" style={{fontSize: 26, letterSpacing: '.4em', opacity: 0.6 + 0.4 * Math.abs(roll)}}>{d.rollText ?? 'And top of the league…'}</div>
          </div>
        ) : null}
        {top3[0] ? <Row {...top3[0]} top hero y={TOP_Y} at={T.first} /> : null}

        {more > 0 ? (
          <div className="cap" style={{position: 'absolute', top: LOW_Y + MAX_LOW * (LOW_H + LOW_GAP) + 4, left: 0, right: 0, textAlign: 'center', fontSize: 18, opacity: 0.45 * ease(f, T.lowSlots[0], T.lowSlots[0] + 12)}}>
            + {more} more grafting on the full board
          </div>
        ) : null}
        <div style={{position: 'absolute', top: 1616, left: 0, right: 0, textAlign: 'center', opacity: ease(f, T.footer, T.footer + 12), transform: `translateY(${(1 - ease(f, T.footer, T.footer + 12)) * 20}px)`}}>
          <span className="anton" style={{fontSize: 40, letterSpacing: '.04em'}}>{d.footer ?? 'Most workouts by 1 Dec wins'}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at 50% ${(TOP_Y + 50) / 19.2}%, rgba(184,69,255,${0.55 * burst}), rgba(67,217,255,${0.18 * burst}) 30%, transparent 62%)`}} />
    </AbsoluteFill>
  );
};
