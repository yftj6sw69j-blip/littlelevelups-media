import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, LeagueData, Ranked, rankEntries} from './data';
import {Backdrop, Fonts, Logo} from './shared';
import {Avatar} from './Avatar';

const Podium: React.FC<{e: Ranked; x: number; y: number; size: number; hero?: boolean}> = ({e, x, y, size, hero}) => (
  <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <Avatar name={e.name} photo={(e as any).photo} rank={e.rank} size={size} at={0} still />
    <div className="anton" style={{marginTop: size * 0.17, fontSize: hero ? 54 : 40, whiteSpace: 'nowrap', letterSpacing: '.02em'}}>{e.name}</div>
    <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
      <div className={hero ? 'anton gradtext' : 'anton'} style={{fontSize: hero ? 60 : 44}}>{e.workouts}</div>
      <div className="cap" style={{fontSize: 12, opacity: 0.55, letterSpacing: '.2em'}}>workouts</div>
    </div>
  </div>
);

export const LeagueCard: React.FC<LeagueData> = (d) => {
  const ranked = rankEntries(d.entries);
  const [p1, p2, p3] = ranked;
  const rest = ranked.slice(3, 13);
  const more = ranked.length - 3 - rest.length;
  const perCol = Math.ceil(rest.length / 2);
  const cols = [rest.slice(0, perCol), rest.slice(perCol)];
  const [w1, ...wRest] = (d.title ?? 'NOVEMBER GRIND').split(' ');
  const pills: [string, string, boolean][] = [];
  if (d.daysLeft > 0) pills.push([`${d.daysLeft}`, 'days left', false]);
  pills.push([`${d.teamTotal}`, 'team workouts', false]);
  if (d.climber) pills.push([`▲ ${d.climber.name} +${d.climber.gain}`, 'climber of the week', true]);
  const PY = 560;
  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1350} glowY={0.42} still />
      <div style={{position: 'absolute', top: 56, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><Logo height={52} /></div>
      <div className="cap" style={{position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center', fontSize: 19, color: '#7FE3FF'}}>
        {(d.season ?? 'MeFit League · Season 1')} · {d.label ?? `Week ${d.week}`}
      </div>
      <div className="anton" style={{position: 'absolute', top: 166, left: 0, right: 0, textAlign: 'center', fontSize: 112}}>
        {w1} <span className="gradtext">{wRest.join(' ')}</span>
      </div>
      <div style={{position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12}}>
        {pills.map(([big, small, acc], i) => (
          <div key={i} style={{padding: '10px 26px', borderRadius: 18, border: `1.5px solid ${acc ? 'rgba(67,217,255,.5)' : 'rgba(255,255,255,.1)'}`, background: acc ? 'rgba(67,217,255,.08)' : 'rgba(255,255,255,.04)', textAlign: 'center'}}>
            <div className="anton" style={{fontSize: 32, color: acc ? C.cyan : C.text}}>{big}</div>
            <div className="cap" style={{fontSize: 11, opacity: 0.6, marginTop: 3, letterSpacing: '.22em'}}>{small}</div>
          </div>
        ))}
      </div>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% ${(PY / 13.5)}%, rgba(255,214,120,.16), transparent 32%)`}} />
      {p2 ? <Podium e={p2} x={225} y={PY + 50} size={190} /> : null}
      {p3 ? <Podium e={p3} x={855} y={PY + 50} size={190} /> : null}
      {p1 ? <Podium e={p1} x={540} y={PY} size={270} hero /> : null}
      <div style={{position: 'absolute', top: 905, left: 70, right: 70, height: 2, background: C.grad, opacity: 0.7}} />
      <div style={{position: 'absolute', top: 928, left: 70, right: 70, display: 'flex', gap: 20}}>
        {cols.map((c, ci) => (
          <div key={ci} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
            {c.map((e) => (
              <div key={e.name} style={{height: 52, borderRadius: 14, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', padding: '0 18px 0 8px', gap: 12}}>
                <div style={{width: 26, fontFamily: 'Anton', fontSize: 22, opacity: 0.5, textAlign: 'center'}}>{e.rank}</div>
                <Avatar name={e.name} photo={(e as any).photo} rank={e.rank} size={38} at={0} still />
                <div style={{flex: 1, fontSize: 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
                <div className="anton" style={{fontSize: 28}}>{e.workouts}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center'}}>
        {more > 0 ? <div className="cap" style={{fontSize: 13, opacity: 0.45, marginBottom: 8}}>+ {more} more on the board</div> : null}
        <span className="anton" style={{fontSize: 30, letterSpacing: '.04em'}}>{d.footer ?? 'Most workouts by 1 Dec wins'}</span>
      </div>
    </AbsoluteFill>
  );
};
