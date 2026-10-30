// Draws a client's win as a branded 1080x1350 card and lets them save it to their phone.
window.WinCard = (() => {
  const W = 1080, H = 1350;
  const logo = new Image(); logo.src = 'logo.png';
  const ready = Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => { if (logo.complete) r(); else { logo.onload = r; logo.onerror = r; } })]);
  const fmtDate = d => new Date(d).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
  const displayName = w => {
    const n = (w.name || '').trim();
    if (/initial/i.test(w.share || '')) return n ? n[0].toUpperCase() + '.' : 'A MeFit member';
    if (/anonym/i.test(w.share || '')) return 'A MeFit member';
    return n || 'A MeFit member';
  };
  function wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split(/\n+/)) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const t = line ? line + ' ' + word : word;
        if (ctx.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
      }
      if (line) out.push(line);
    }
    return out;
  }
  function grad(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#43D9FF'); g.addColorStop(.55, '#7C3DFF'); g.addColorStop(1, '#B845FF'); return g;
  }
  async function draw(canvas, w) {
    await ready;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    // background: deep navy, violet glow, stars
    ctx.fillStyle = '#06070C'; ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W / 2, 330, 40, W / 2, 330, 760);
    g.addColorStop(0, 'rgba(110,55,230,.55)'); g.addColorStop(1, 'rgba(110,55,230,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * .85, H, 20, W * .85, H, 620);
    g.addColorStop(0, 'rgba(30,140,160,.35)'); g.addColorStop(1, 'rgba(30,140,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 90; i++) { ctx.globalAlpha = .15 + rnd() * .5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 2.2 + .4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // frame
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(40, 40, W - 80, H - 80, 36); ctx.stroke();
    // logo
    if (logo.naturalWidth) { const lh = 64, lw = logo.naturalWidth * lh / logo.naturalHeight; ctx.drawImage(logo, (W - lw) / 2, 100, lw, lh); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    // eyebrow
    ctx.fillStyle = '#7FE3FF'; ctx.font = '600 26px Inter, sans-serif';
    ctx.letterSpacing = '8px'; ctx.fillText('FEEL GOOD FRIDAY · WIN', W / 2 + 4, 236); ctx.letterSpacing = '0px';
    // kind chip
    let y = 300;
    if (w.kind) {
      ctx.font = '600 30px Inter, sans-serif'; const tw = ctx.measureText(w.kind).width + 56;
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.strokeStyle = grad(ctx, (W - tw) / 2, (W + tw) / 2); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect((W - tw) / 2, y - 42, tw, 60, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#F4F2EE'; ctx.fillText(w.kind, W / 2, y - 2); y += 50;
    }
    // their photo, if they added one: framed under the chip, cover-cropped
    if (w.photoImg) {
      const px = 120, py = y + 10, pw = W - 240, ph = 520, im = w.photoImg;
      const iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight, k = Math.max(pw / iw, ph / ih);
      ctx.save(); ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 30); ctx.clip();
      ctx.drawImage(im, px + (pw - iw * k) / 2, py + (ph - ih * k) / 2, iw * k, ih * k); ctx.restore();
      ctx.strokeStyle = grad(ctx, px, px + pw); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 30); ctx.stroke();
      y = py + ph - 40;
    }
    // the win: largest size that fits
    const boxTop = y + 70, boxBottom = 1080, maxW = 860, maxSize = w.photoImg ? 52 : 70;
    let size = maxSize, lines;
    for (; size >= 26; size -= 2) {
      ctx.font = `600 ${size}px Inter, sans-serif`; lines = wrap(ctx, w.win, maxW);
      if (lines.length * size * 1.28 + (w.photoImg ? 0 : 120) <= boxBottom - boxTop) break;
    }
    const lh = size * 1.28, blockH = lines.length * lh + (w.photoImg ? 0 : 120), top = boxTop + (boxBottom - boxTop - blockH) / 2;
    let ty = top;
    if (!w.photoImg) { ctx.font = '400 190px Anton, Impact, sans-serif'; ctx.fillStyle = grad(ctx, W / 2 - 60, W / 2 + 60); ctx.fillText('“', W / 2, top + 130); ty = top + 120; }
    ctx.font = `600 ${size}px Inter, sans-serif`; ctx.fillStyle = '#F4F2EE';
    lines.forEach((l, i) => ctx.fillText(l, W / 2, ty + size + i * lh));
    // name + date
    ctx.font = '400 66px Anton, Impact, sans-serif'; const nm = displayName(w).toUpperCase(); const nw = ctx.measureText(nm).width;
    ctx.fillStyle = grad(ctx, W / 2 - nw / 2, W / 2 + nw / 2); ctx.fillText(nm, W / 2, 1160);
    ctx.font = '400 28px Inter, sans-serif'; ctx.fillStyle = 'rgba(244,242,238,.62)'; ctx.fillText(fmtDate(w.date || Date.now()), W / 2, 1210);
    // footer line
    ctx.fillStyle = grad(ctx, W / 2 - 120, W / 2 + 120); ctx.fillRect(W / 2 - 120, 1252, 240, 4);
    return canvas;
  }
  async function save(w, btn) {
    const c = await draw(document.createElement('canvas'), w);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'mefit-win.png', {type: 'image/png'});
    try {
      if (navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: 'My MeFit win'}); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mefit-win.png'; document.body.appendChild(a); a.click(); a.remove();
    if (btn) btn.textContent = 'Saved ✓';
  }
  return {draw, save, displayName, fmtDate};
})();
