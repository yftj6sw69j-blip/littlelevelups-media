import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, random, interpolate} from 'remotion';
import {C} from './data';

export const Fonts: React.FC = () => (
  <style>{`
@font-face{font-family:Anton;src:url(${staticFile('anton.woff2')})}
@font-face{font-family:Inter;font-weight:400;src:url(${staticFile('inter-latin-400-normal.woff2')})}
@font-face{font-family:Inter;font-weight:600;src:url(${staticFile('inter-latin-600-normal.woff2')})}
.anton{font-family:Anton;text-transform:uppercase;line-height:.92;font-weight:400}
.gradtext{background:${C.grad};-webkit-background-clip:text;background-clip:text;color:transparent}
.cap{text-transform:uppercase;letter-spacing:.32em;font-family:Inter;font-weight:600}
`}</style>
);

// Near-black base, slow drifting violet glow, twinkling stars, fine grain lines.
export const Backdrop: React.FC<{w: number; h: number; glowY?: number; still?: boolean}> = ({w, h, glowY = 0.42, still}) => {
  const f = still ? 40 : useCurrentFrame();
  const drift = Math.sin(f / 60) * 40;
  const stars = new Array(54).fill(0).map((_, i) => {
    const s = [2, 3, 3, 4, 6][Math.floor(random(`s${i}`) * 5)];
    const tw = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(f / 18 + random(`p${i}`) * 6.28));
    return (
      <div key={i} style={{position: 'absolute', left: random(`x${i}`) * w, top: random(`y${i}`) * h, width: s, height: s, borderRadius: '50%', background: '#fff', opacity: tw}} />
    );
  });
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 34% at ${50 + drift / 20}% ${glowY * 100}%, rgba(92,44,190,.42), rgba(6,7,12,0) 100%),
radial-gradient(ellipse 50% 22% at 85% 96%, rgba(30,140,160,.20), rgba(6,7,12,0) 100%),
radial-gradient(ellipse 45% 20% at 8% 6%, rgba(184,69,255,.14), rgba(6,7,12,0) 100%)`,
        }}
      />
      {stars}
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(255,255,255,.012) 0 2px, transparent 2px 6px)'}} />
    </AbsoluteFill>
  );
};

export const Logo: React.FC<{height: number; style?: React.CSSProperties}> = ({height, style}) => (
  <Img src={staticFile('logo.png')} style={{height, ...style}} />
);

export const MedalBadge: React.FC<{rank: number; size: number}> = ({rank, size}) => {
  const col = C.medal[rank - 1];
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `radial-gradient(circle at 35% 30%, #fff8 0%, ${col} 35%, ${col}88 100%)`,
        boxShadow: `0 0 ${size * 0.45}px ${col}55, inset 0 -4px 10px #0004`,
        color: '#14110c', fontFamily: 'Anton', fontSize: size * 0.52,
      }}
    >
      {rank}
    </div>
  );
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
