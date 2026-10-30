// MeFit "Share your win" form -> Notion "MeFit Wins" database. No dependencies (Node 18+).
// Env: NOTION_TOKEN (internal integration secret, shared with the MeFit Wins page), PORT.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
const DIR = new URL('.', import.meta.url);
const DB = 'd8fdb62803774d689d572c5f1dcaa5da';
const NV = '2022-06-28';
const KINDS = ['PB 🏋️', 'Energy & sleep 😴', 'Confidence 💪', 'Clothes & body 👖', 'Consistency 🔥', 'Something else ✨'];
const SHARE = ['Yes — with my first name', 'Yes — initial only', 'Yes — anonymously', 'No — just for Matt'];
const TYPES = {'.html': 'text/html; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2'};
const H = () => ({Authorization: `Bearer ${process.env.NOTION_TOKEN}`, 'Notion-Version': NV});
const clip = (s, n) => String(s || '').trim().slice(0, n);

async function uploadFile(file) {
  const r1 = await fetch('https://api.notion.com/v1/file_uploads', {method: 'POST', headers: {...H(), 'Content-Type': 'application/json'},
    body: JSON.stringify({mode: 'single_part', filename: file.name || 'win', content_type: file.type || 'application/octet-stream'})});
  const up = await r1.json(); if (!r1.ok) throw new Error('create upload: ' + JSON.stringify(up));
  const fd = new FormData(); fd.append('file', file, file.name || 'win');
  const r2 = await fetch(up.upload_url, {method: 'POST', headers: H(), body: fd});
  if (!r2.ok) throw new Error('send upload: ' + await r2.text());
  return up.id;
}

async function createWin(f) {
  const name = clip(f.get('name'), 60), win = clip(f.get('win'), 1500), kind = f.get('kind'), share = f.get('share');
  if (!name || !win || !SHARE.includes(share)) return {ok: false, status: 400, msg: 'Please fill in your name, your win and the sharing question.'};
  if (f.get('website')) return {ok: true}; // honeypot: bots fill hidden fields
  let fileNote = '';
  const props = {
    'First name': {title: [{text: {content: name}}]},
    'Your win this week': {rich_text: [{text: {content: win}}]},
    'Happy for it to be shared?': {select: {name: share}},
  };
  if (KINDS.includes(kind)) props['What kind of win?'] = {select: {name: kind}};
  const file = f.get('photo');
  if (file && typeof file === 'object' && file.size > 0) {
    try { const id = await uploadFile(file); props['Photo or video (optional)'] = {files: [{type: 'file_upload', file_upload: {id}, name: clip(file.name || 'win', 90)}]}; }
    catch (e) { console.error(e.message); fileNote = 'file'; }
  }
  const r = await fetch('https://api.notion.com/v1/pages', {method: 'POST', headers: {...H(), 'Content-Type': 'application/json'},
    body: JSON.stringify({parent: {database_id: DB}, properties: props})});
  if (!r.ok) { console.error('create page', await r.text()); return {ok: false, status: 502, msg: 'Something went wrong saving your win. Please try again, or send it to Matt on WhatsApp.'}; }
  return {ok: true, fileNote};
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST' && url.pathname === '/submit') {
      if (+req.headers['content-length'] > 30e6) { res.writeHead(413, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({ok: false, msg: 'That file is too big. Try a photo, or send the video to Matt on WhatsApp.'})); }
      const f = await new Request('http://x', {method: 'POST', headers: req.headers, body: Readable.toWeb(req), duplex: 'half'}).formData();
      let out; try { out = await createWin(f); } catch (e) { console.error(e); out = {ok: false, status: 502, msg: 'Something went wrong saving your win. Please try again, or send it to Matt on WhatsApp.'}; }
      res.writeHead(out.status || 200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify(out));
    }
    if (url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
    const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    if (!/^[\w.-]+$/.test(name) || !TYPES[name.slice(name.lastIndexOf('.'))]) { res.writeHead(404); return res.end(); }
    const body = await readFile(new URL(name, DIR));
    res.writeHead(200, {'Content-Type': TYPES[name.slice(name.lastIndexOf('.'))], 'Cache-Control': name.endsWith('.html') ? 'no-cache' : 'max-age=86400'});
    res.end(body);
  } catch (e) { console.error(e); if (!res.headersSent) res.writeHead(500); res.end(); }
}).listen(process.env.PORT || 10000, () => console.log('MeFit wins form up'));
