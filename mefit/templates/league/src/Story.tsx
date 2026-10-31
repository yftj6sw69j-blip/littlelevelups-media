import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, spring, useVideoConfig, interpolate, random} from 'remotion';
import {C, LeagueData, rankEntries, Ranked} from './data';
import {Backdrop, Fonts, Logo, clamp, ease} from './shared';
import {Avatar, RING} from './Avatar';

// 120 bpm @ 30 fps: a beat every 15 frames. Field 70→135, 3rd 150, 2nd 175, drumroll 200→225, #1 slams on the drop at 225.
export const T = {title1: 15, title2: 22, stats: 45, list: [70, 84, 98, 112], third: 150, second: 175, roll: 200, first: 225, footer: 268, total: 330};
const SIDE = 90;
const FLOOR = 1195;
const PILLAR_MAX = 215;
const PX = [540, 230, 850]; // #1 centre, #2 left, #3 right
const LIST_Y = 1335;
const ROW_H = 52, ROW_GAP = 8, MAX_LIST = 4;
const eo = (t: number) => 1 - Math.pow(1 - t, 3);

const Count: React.FC<{to: number; start: number; dur?: number}> = ({to, start, dur = 24}) => {
  const f = useCurrentFrame();
  return <>{Math.round(interpolate(f, [start, start + dur], [0, to], {...clamp, easing: eo}))}</>;
};

/** Podium pillar: a glass column in the medal colour that rises from the floor, portrait riding on top. */
const Pillar: React.FC<{e: Ranked; x: number; h: number; at: number; still?: boolean}> = ({e, x, h, at, still}) => {
  const frame = useCurrentFrame();
  const f = still ? 999 : frame;
  const rank = e.rank as 1 | 2 | 3;
  const m = RING[rank];
  const hero = rank === 1;
  const dur = hero ? 20 : 28;
  const prog = interpolate(f, [at, at + dur], [0, 1], {...clamp, easing: hero ? (t) => 1 - Math.pow(1 - t, 4) : eo});
  const ph = h * prog;
  const w = hero ? 150 : 120;
  const size = hero ? 230 : 172;
  const topY = FLOOR - ph;
  const landed = ease(f, at + dur - 2, at + dur + 8);
  const wave = still ? 0 : interpolate(f, [at + dur - 2, at + dur + 32], [0, 1], clamp);
  const sweep = interpolate(f, [at + dur, at + dur + 22], [-30, 130], clamp);
  return (
    <div style={{position: 'absolute', left: x - 200, width: 400, top: 0, height: 1920}}>
      {/* column */}
      <div style={{position: 'absolute', left: 200 - w / 2, width: w, top: topY, height: ph, borderRadius: '14px 14px 0 0', background: `linear-gradient(180deg, ${m.a}55, ${m.b}22 60%, ${m.b}08)`, border: `1.5px solid ${m.a}66`, borderBottom: 'none', boxShadow: `0 0 ${hero ? 60 : 30}px ${m.glow}`, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: `${100 - sweep}%`, height: '30%', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,.35), transparent)'}} />
        <div className="anton" style={{position: 'absolute', left: 0, right: 0, bottom: 10, textAlign: 'center', fontSize: hero ? 54 : 42, color: `${m.a}cc`, opacity: landed}}>{rank}</div>
      </div>
      {/* shockwave */}
      {wave > 0 && wave < 1 ? <div style={{position: 'absolute', left: 200 - (size / 2) * (1 + wave * 2.6), top: topY - size / 2 - 10 - (size / 2) * (1 + wave * 2.6), width: size * (1 + wave * 2.6), height: size * (1 + wave * 2.6), borderRadius: '50%', border: `${3 * (1 - wave)}px solid ${m.a}`, opacity: (1 - wave) * 0.9}} /> : null}
      {/* portrait */}
      <div style={{position: 'absolute', left: 200 - size / 2, top: topY - size - 10, width: size}}>
        <Avatar name={e.name} photo={(e as any).photo} rank={rank} size={size} at={at + (hero ? 0 : 6)} still={still} pulse={hero} />
      </div>
      {/* name + count, inside the column's footprint under the floor */}
      <div style={{position: 'absolute', left: 60, right: 60, top: FLOOR + 12, textAlign: 'center', opacity: landed, transform: `translateY(${(1 - landed) * 12}px)`}}>
        <div className="anton" style={{fontSize: hero ? 46 : 36, color: m.a, letterSpacing: '.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8}}>
          <div className={hero ? 'anton gradtext' : 'anton'} style={{fontSize: hero ? 56 : 42, lineHeight: 1.05}}>{still ? e.workouts : <Count to={e.workouts} start={at} dur={dur} />}</div>
          <div className="cap" style={{fontSize: 12, opacity: 0.55, letterSpacing: '.2em'}}>{e.workouts === 1 ? 'workout' : 'workouts'}</div>
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{e: Ranked; y: number; at: number; dim: number}> = ({e, y, at, dim}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - at, fps, config: {damping: 16, stiffness: 160}});
  const sweep = interpolate(f, [at, at + 20], [-30, 130], clamp);
  return (
    <div style={{position: 'absolute', left: SIDE, right: SIDE, top: y, height: ROW_H, transform: `translateX(${(1 - s) * -60}px)`, opacity: Math.min(1, s * 1.4) * dim, borderRadius: 16, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px 0 10px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 0, bottom: 0, left: `${sweep}%`, width: 100, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent)', transform: 'skewX(-20deg)'}} />
      <div style={{width: 32, textAlign: 'center', fontFamily: 'Anton', fontSize: 24, opacity: 0.5}}>{e.rank}</div>
      <Avatar name={e.name} photo={(e as any).photo} rank={e.rank} size={40} at={at + 4} />
      <div style={{flex: 1, fontSize: 29, fontFamily: 'Inter', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
      <div className="anton" style={{fontSize: 34}}><Count to={e.workouts} start={at + 4} dur={18} /></div>
    </div>
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
  const lead = p1?.workouts ?? 1;
  const hFor = (e?: Ranked) => (e ? Math.max(70, (e.workouts / lead) * PILLAR_MAX) : 0);
  const roll = f >= T.roll && f < T.first ? Math.sin((f - T.roll) * (0.5 + (f - T.roll) * 0.06)) : 0;
  const rollOp = interpolate(f, [T.roll, T.roll + 6, T.first - 2, T.first], [0, 1, 1, 0], clamp);
  const slam = interpolate(f, [T.first, T.first + 3, T.first + 40], [0, 1, 0], clamp);
  const shake = f >= T.first && f < T.first + 12 ? Math.sin(f * 2.9) * (12 - (f - T.first)) * 1.3 : 0;
  const titleShrink = interpolate(f, [T.third - 20, T.third], [1, 0.72], clamp);
  const titleLift = interpolate(f, [T.third - 20, T.third], [0, -150], clamp);
  const push = interpolate(f, [T.third - 10, T.first + 10, T.first + 60], [1, 1.06, 1.025], clamp);
  const dim = interpolate(f, [T.third - 10, T.third + 5, T.first + 30, T.first + 50], [1, 0.45, 0.45, 0.9], clamp);
  const h1 = hFor(p1);
  const pills: [React.ReactNode, string, boolean][] = [];
  if (d.daysLeft > 0) pills.push([<Count to={d.daysLeft} start={T.stats} />, 'days left', false]);
  pills.push([<Count to={d.teamTotal} start={T.stats + 5} dur={30} />, 'team workouts', false]);
  if (d.climber) pills.push([<>▲ {d.climber.name} +{d.climber.gain}</>, 'climber of the week', true]);

  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1920} glowY={0.5} />
      {d.music ? <Audio src={staticFile(d.music)} /> : null}
      <AbsoluteFill style={{transform: `translate(${shake}px, ${shake * 0.5}px) scale(${push})`, transformOrigin: `540px ${FLOOR - h1 / 2}px`}}>
        {/* stadium light sweep */}
        <AbsoluteFill style={{opacity: 0.5, background: `conic-gradient(from ${f * 0.4}deg at 50% ${FLOOR / 19.2}%, transparent 0 70%, rgba(124,61,255,.10) 78%, transparent 86%, rgba(67,217,255,.08) 94%, transparent 100%)`}} />
        {/* spotlight cone on the #1 slot */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <polygon points={`500,300 580,300 760,${FLOOR} 320,${FLOOR}`} fill="rgba(255,214,120,.14)" opacity={Math.max(rollOp * (0.6 + 0.4 * Math.abs(roll)), slam)} />
        </svg>

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

        {/* floor + slam pulse */}
        <div style={{position: 'absolute', left: 60, right: 60, top: FLOOR, height: 2, background: C.grad, opacity: 0.85 * ease(f, T.third - 30, T.third - 10)}} />
        <div style={{position: 'absolute', left: 540 - 600 * slam, width: 1200 * slam, top: FLOOR - 4, height: 10, borderRadius: 5, background: `radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,214,120,${0.7 * (1 - slam)}), transparent 70%)`}} />
        {/* drumroll slot */}
        <div style={{position: 'absolute', left: 540 - 85, width: 170, top: FLOOR - h1 - 250, height: h1 + 250, borderRadius: 28, border: '2px dashed rgba(255,227,154,.6)', opacity: rollOp, transform: `scale(${1 + roll * 0.03})`, boxShadow: `0 0 ${30 + roll * 30}px rgba(255,200,80,.25)`}}>
          <div className="cap" style={{position: 'absolute', top: -44, left: -200, right: -200, textAlign: 'center', fontSize: 18, letterSpacing: '.4em', color: '#FFE39A', opacity: 0.7 + 0.3 * Math.abs(roll)}}>{d.rollText ?? 'And top of the league…'}</div>
        </div>

        {p3 ? <Pillar e={p3} x={PX[2]} h={hFor(p3)} at={T.third} /> : null}
        {p2 ? <Pillar e={p2} x={PX[1]} h={hFor(p2)} at={T.second} /> : null}
        {p1 ? <Pillar e={p1} x={PX[0]} h={h1} at={T.first} /> : null}

        {/* burst from #1 */}
        {f >= T.first && f < T.first + 50 ? new Array(30).fill(0).map((_, i) => {
          const t = (f - T.first) / 50; const ang = random(`ga${i}`) * Math.PI * 2; const sp = 220 + random(`gs${i}`) * 340; const dd = sp * eo(t);
          const col = [C.cyan, C.violet, '#FFE39A', '#F5C76B'][i % 4];
          return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(ang) * dd, top: FLOOR - h1 - 120 + Math.sin(ang) * dd - t * 140, width: 5 + random(`gw${i}`) * 6, height: 5 + random(`gw${i}`) * 6, borderRadius: '50%', background: col, opacity: 1 - t, boxShadow: `0 0 10px ${col}`}} />;
        }) : null}

        {list.map((e, i) => <Row key={e.name} e={e} y={LIST_Y + i * (ROW_H + ROW_GAP)} at={T.list[i]} dim={dim} />)}
        {more > 0 ? <div className="cap" style={{position: 'absolute', top: LIST_Y + MAX_LIST * (ROW_H + ROW_GAP) + 2, left: 0, right: 0, textAlign: 'center', fontSize: 16, opacity: 0.45 * ease(f, T.list[0], T.list[0] + 12) * dim}}>+ {more} more grafting on the full board</div> : null}
        <div style={{position: 'absolute', top: 1618, left: 0, right: 0, textAlign: 'center', opacity: ease(f, T.footer, T.footer + 12), transform: `translateY(${(1 - ease(f, T.footer, T.footer + 12)) * 20}px)`}}>
          <span className="anton" style={{fontSize: 38, letterSpacing: '.04em'}}>{d.footer ?? 'Most workouts by 1 Dec wins'}</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at 540px ${FLOOR - h1 - 100}px, rgba(255,230,160,${0.55 * slam}), rgba(124,61,255,${0.2 * slam}) 30%, transparent 65%)`}} />
    </AbsoluteFill>
  );
};
