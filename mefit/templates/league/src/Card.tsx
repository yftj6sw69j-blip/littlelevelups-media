import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, LeagueData, Ranked, rankEntries} from './data';
import {Backdrop, Fonts, Logo, MedalBadge} from './shared';

const PODIUM_BASE = 850;
const COL_W = 290;
const HEIGHTS = [250, 185, 140];

const Podium: React.FC<{e: Ranked; place: number; x: number}> = ({e, place, x}) => {
  const h = HEIGHTS[Math.min(e.rank, 3) - 1];
  const col = C.medal[e.rank - 1] ?? '#ffffff';
  const first = place === 0;
  return (
    <div style={{position: 'absolute', left: x, width: COL_W, top: PODIUM_BASE - h - (first ? 150 : 130), height: h + (first ? 150 : 130), display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <MedalBadge rank={e.rank} size={first ? 66 : 54} />
      <div className="anton" style={{marginTop: 10, marginBottom: 14, fontSize: first ? 54 : 42, maxWidth: COL_W, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
      <div
        style={{
          width: '100%', height: h, borderRadius: '26px 26px 6px 6px',
          background: first ? 'linear-gradient(180deg, rgba(124,61,255,.55), rgba(67,217,255,.10))' : `linear-gradient(180deg, ${col}40, rgba(255,255,255,.03))`,
          border: `1.5px solid ${first ? 'rgba(184,69,255,.8)' : col + '66'}`, borderBottom: 'none',
          boxShadow: first ? '0 0 70px rgba(124,61,255,.45)' : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22,
        }}
      >
        <div className={first ? 'anton gradtext' : 'anton'} style={{fontSize: first ? 96 : 76}}>{e.workouts}</div>
        <div className="cap" style={{fontSize: 14, opacity: 0.6, letterSpacing: '.22em', marginTop: 4}}>workouts</div>
      </div>
    </div>
  );
};

export const LeagueCard: React.FC<LeagueData> = (d) => {
  const ranked = rankEntries(d.entries);
  const [p1, p2, p3] = ranked;
  const rest = ranked.slice(3);
  const shown = rest.slice(0, 12);
  const more = rest.length - shown.length;
  const perCol = Math.ceil(shown.length / 2);
  const cols = [shown.slice(0, perCol), shown.slice(perCol)];
  const [w1, ...wRest] = (d.title ?? 'NOVEMBER GRIND').split(' ');
  const cx = 540 - COL_W / 2;
  return (
    <AbsoluteFill style={{color: C.text, fontFamily: 'Inter', fontWeight: 600}}>
      <Fonts />
      <Backdrop w={1080} h={1350} glowY={0.5} still />
      <div style={{position: 'absolute', top: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <Logo height={54} />
      </div>
      <div className="cap" style={{position: 'absolute', top: 138, left: 0, right: 0, textAlign: 'center', fontSize: 20, color: '#7FE3FF'}}>
        {(d.season ?? 'MeFit League · Season 1')} · {d.label ?? `Week ${d.week}`}
      </div>
      <div className="anton" style={{position: 'absolute', top: 176, left: 0, right: 0, textAlign: 'center', fontSize: 116}}>
        {w1} <span className="gradtext">{wRest.join(' ')}</span>
      </div>
      <div style={{position: 'absolute', top: 318, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14}}>
        {[
          ...(d.daysLeft > 0 ? [[`${d.daysLeft}`, 'days left']] : []),
          [`${d.teamTotal}`, 'team workouts'],
          ...(d.climber ? [[`▲ ${d.climber.name} +${d.climber.gain}`, 'climber of the week']] : []),
        ].map(([big, small], i) => (
          <div key={i} style={{padding: '12px 30px', borderRadius: 20, border: `1.5px solid ${big.startsWith('▲') ? 'rgba(67,217,255,.5)' : 'rgba(255,255,255,.1)'}`, background: big.startsWith('▲') ? 'rgba(67,217,255,.08)' : 'rgba(255,255,255,.04)', textAlign: 'center'}}>
            <div className="anton" style={{fontSize: 36, color: big.startsWith('▲') ? C.cyan : C.text}}>{big}</div>
            <div className="cap" style={{fontSize: 12, opacity: 0.6, marginTop: 4, letterSpacing: '.22em'}}>{small}</div>
          </div>
        ))}
      </div>
      {p2 ? <Podium e={p2} place={1} x={cx - COL_W - 16} /> : null}
      {p1 ? <Podium e={p1} place={0} x={cx} /> : null}
      {p3 ? <Podium e={p3} place={2} x={cx + COL_W + 16} /> : null}
      <div style={{position: 'absolute', top: PODIUM_BASE, left: 70, right: 70, height: 2, background: C.grad, opacity: 0.8}} />
      <div style={{position: 'absolute', top: PODIUM_BASE + 26, left: 70, right: 70, display: 'flex', gap: 22}}>
        {cols.map((c, ci) => (
          <div key={ci} style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 8}}>
            {c.map((e) => (
              <div key={e.name} style={{height: 50, borderRadius: 14, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16}}>
                <div style={{width: 30, fontFamily: 'Anton', fontSize: 24, opacity: 0.5, textAlign: 'center'}}>{e.rank}</div>
                <div style={{flex: 1, fontSize: 25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{e.name}</div>
                <div className="anton" style={{fontSize: 28}}>{e.workouts}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', bottom: 46, left: 0, right: 0, textAlign: 'center'}}>
        {more > 0 ? <div className="cap" style={{fontSize: 14, opacity: 0.45, marginBottom: 10}}>+ {more} more on the board</div> : null}
        <span className="anton" style={{fontSize: 32, letterSpacing: '.04em'}}>{d.footer ?? 'Most workouts by 1 Dec wins'}</span>
      </div>
    </AbsoluteFill>
  );
};
