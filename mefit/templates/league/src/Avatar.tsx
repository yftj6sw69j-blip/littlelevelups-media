import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {C} from './data';
import {clamp} from './shared';

export type RingStyle = {a: string; b: string; c: string; glow: string};

export const RING: Record<1 | 2 | 3, RingStyle> = {
  1: {a: '#FFE39A', b: '#E0A42C', c: '#FFF5D6', glow: 'rgba(255,200,80,.55)'},
  2: {a: '#F2F5FA', b: '#9AA6B8', c: '#FFFFFF', glow: 'rgba(200,210,230,.45)'},
  3: {a: '#F7B98A', b: '#B8652C', c: '#FFE0C8', glow: 'rgba(230,140,80,.5)'},
};

/**
 * Circular member portrait with a ring that draws itself on.
 * - photo: path inside public/ (e.g. "photos/becky-wells.jpg"). Missing → monogram on a brand gradient.
 * - rank 1-3 → gold/silver/bronze ring + rank pill. Otherwise thin brand ring, or `ring` override (badge tiers).
 */
export const Avatar: React.FC<{
  name: string; photo?: string; rank?: number; size: number; at: number; still?: boolean; pulse?: boolean;
  ring?: RingStyle | null; pill?: string | null;
}> = ({name, photo, rank = 99, size, at, still, pulse, ring, pill}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = still ? at + 100 : frame;
  const s = spring({frame: f - at, fps, config: {damping: 14, stiffness: 150}});
  const draw = interpolate(f, [at + 4, at + 30], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const metal: RingStyle | null = ring !== undefined ? ring : rank <= 3 ? RING[rank as 1 | 2 | 3] : null;
  const sw = metal ? Math.max(5, size * 0.075) : Math.max(3, size * 0.04);
  const r = size / 2 - sw / 2;
  const circ = 2 * Math.PI * r;
  const id = `g${rank}${name.replace(/\W/g, '')}${size}${metal ? metal.a.slice(1) : 'b'}`;
  const breathe = pulse && !still ? 1 + 0.015 * Math.sin((f - at) / 9) : 1;
  const shine = interpolate(f, [at + 26, at + 50], [-0.3, 1.3], clamp);
  const pillText = pill !== undefined ? pill : rank <= 3 ? String(rank) : null;
  const initials = name.replace(/[^A-Za-z .]/g, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{position: 'relative', width: size, height: size, transform: `scale(${s * breathe})`, opacity: Math.min(1, s * 1.5), filter: metal ? `drop-shadow(0 0 ${size * 0.12 * draw}px ${metal.glow})` : 'none'}}>
      <div style={{position: 'absolute', inset: sw * 1.15, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(150deg,#2a1a5e,#0e3a52)'}}>
        {photo ? (
          <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(.85) contrast(1.08) brightness(.98)'}} />
        ) : (
          <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Anton', fontSize: size * 0.36, color: 'rgba(244,242,238,.9)', letterSpacing: '.02em'}}>{initials}</div>
        )}
      </div>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {metal ? (
              <>
                <stop offset="0" stopColor={metal.a} />
                <stop offset="0.45" stopColor={metal.b} />
                <stop offset="0.7" stopColor={metal.c} />
                <stop offset="1" stopColor={metal.b} />
              </>
            ) : (
              <>
                <stop offset="0" stopColor={C.cyan} />
                <stop offset="1" stopColor={C.purple} />
              </>
            )}
          </linearGradient>
          <linearGradient id={id + 'sh'} x1="0" y1="0" x2="1" y2="0">
            <stop offset={Math.max(0, shine - 0.15)} stopColor="#fff" stopOpacity="0" />
            <stop offset={Math.min(1, Math.max(0, shine))} stopColor="#fff" stopOpacity="0.9" />
            <stop offset={Math.min(1, Math.max(0, shine + 0.15))} stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} />
        {metal ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id}sh)`} strokeWidth={sw * 0.5} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} /> : null}
      </svg>
      {metal && pillText ? (
        <div style={{position: 'absolute', left: '50%', bottom: -size * 0.11, transform: 'translateX(-50%)', minWidth: size * 0.28, height: Math.max(18, size * 0.22), padding: `0 ${size * 0.07}px`, borderRadius: size, background: `linear-gradient(135deg, ${metal.a}, ${metal.b})`, color: '#14110c', fontFamily: 'Anton', fontSize: Math.max(12, size * 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 18px ${metal.glow}`, opacity: draw, whiteSpace: 'nowrap'}}>
          {pillText}
        </div>
      ) : null}
    </div>
  );
};
