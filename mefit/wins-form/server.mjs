// MeFit forms -> Notion: "Share your win" (MeFit Wins), waitlist, and the member card form (MeFit Members). No dependencies (Node 18+).
// Env: NOTION_TOKEN (internal integration secret, shared with the MeFit Wins page), PORT.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
const DIR = new URL('.', import.meta.url);
const DB = 'd8fdb62803774d689d572c5f1dcaa5da';
const NV = '2025-09-03';
const DS = '956ccced-2859-4460-a02c-10865f085a4e';
const WL_DS = '7d3b6bfa-af88-4a6e-b7d7-d890c6ba8394'; // MeFit Waitlist
const WL_LISTS = ['Strong at 40', 'Hybrid 8', 'Other'];
const ORIGINS = ['https://mefitacademy.co.uk', 'https://www.mefitacademy.co.uk', 'https://app.mefitacademy.co.uk'];
const KINDS = ['PB 🏋️', 'Energy & sleep 😴', 'Confidence 💪', 'Clothes & body 👖', 'Consistency 🔥', 'Something else ✨'];
const SHARE = ['Yes — with my first name', 'Yes — initial only', 'Yes — anonymously', 'No — just for Matt'];
const MEM_DB = '0a55e8be42694e62ae87928c862f8132', MEM_DS = '203ca24e-dad7-407d-a3b4-00a3c60a52ea'; // MeFit Members
const CARD_SHARE = ['Group + Instagram', 'Group only', 'Just between us'];
const CARD_LB = ['First name', 'Nickname', 'Private'];
const CARD_TRAINS = ['Mornings', 'Lunchtimes', 'Evenings', 'Weekends', 'Whenever I can'];
const FOUNDING_BEFORE = '2026-11-01';
const nid = s => String(s || '').replace(/-/g, '').toLowerCase();
const levelCost = L => L === 1 ? 100 : 75 + 25 * (L - 2); // XP needed to go from level L to L+1
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
    body: JSON.stringify({parent: {type: 'data_source_id', data_source_id: DS}, properties: props})});
  if (!r.ok) { console.error('create page', await r.text()); return {ok: false, status: 502, msg: 'Something went wrong saving your win. Please try again, or send it to Matt on WhatsApp.'}; }
  return {ok: true, fileNote};
}

async function memberPage(m) {
  const id = nid(m); if (!/^[0-9a-f]{32}$/.test(id)) return null;
  const r = await fetch(`https://api.notion.com/v1/pages/${id}`, {headers: H()});
  if (!r.ok) { if (r.status !== 404) console.error('member get', r.status, await r.text()); return null; }
  const p = await r.json(), par = p.parent || {};
  if (p.in_trash || p.archived || (nid(par.data_source_id) !== MEM_DS.replace(/-/g, '') && nid(par.database_id) !== MEM_DB)) return null;
  return p;
}
const txt = v => (v && (v.title || v.rich_text) || []).map(t => t.plain_text).join('');
async function memberInfo(m) {
  const p = await memberPage(m); if (!p) return null;
  const P = p.properties, level = P['Level']?.number || 1, toNext = P['XP to next level']?.number ?? levelCost(level);
  return {first: txt(P['Name']).trim().split(/\s+/)[0], cardName: txt(P['Card name']), level, levelName: P['Level name']?.select?.name || 'The Beginning',
    xp: P['XP']?.number || 50, toNext, pct: Math.max(0, Math.min(1, 1 - toNext / levelCost(level))),
    founding: (P['Joined']?.date?.start || '9999') < FOUNDING_BEFORE, done: !!P['Welcome form done']?.checkbox};
}
async function saveCard(f) {
  if (f.get('website')) return {ok: true};
  const p = await memberPage(f.get('m'));
  if (!p) return {ok: false, status: 404, msg: 'This link doesn\'t look right. Ask Matt for your personal link.'};
  const v = {cardname: clip(f.get('cardname'), 20), goal: clip(f.get('goal'), 30), askme: clip(f.get('askme'), 30), why: clip(f.get('why'), 140), nickname: clip(f.get('nickname'), 20)};
  const share = f.get('share'), lb = f.get('lb'), trains = f.get('trains');
  if (!v.cardname || !v.goal || !v.askme || !v.why || !CARD_SHARE.includes(share) || !CARD_LB.includes(lb) || !CARD_TRAINS.includes(trains) || (lb === 'Nickname' && !v.nickname))
    return {ok: false, status: 400, msg: 'Please answer every question.'};
  const rt = s => ({rich_text: s ? [{text: {content: s}}] : []});
  const props = {'Card name': rt(v.cardname), 'Goal': rt(v.goal), 'Trains': rt(trains), 'Ask me about': rt(v.askme), 'Why I joined': rt(v.why),
    'Sharing choice': {select: {name: share}}, 'Leaderboard': {select: {name: lb}}, 'Nickname': rt(lb === 'Nickname' ? v.nickname : ''),
    'Welcome form done': {checkbox: true}, 'Form submitted': {date: {start: new Date().toISOString().slice(0, 10)}}};
  const file = f.get('photo');
  if (!(file && typeof file === 'object' && file.size > 0)) return {ok: false, status: 400, msg: 'Please add your photo.'};
  try { const id = await uploadFile(file); props['Photo'] = {files: [{type: 'file_upload', file_upload: {id}, name: 'card-photo.jpg'}]}; }
  catch (e) { console.error(e.message); return {ok: false, status: 502, msg: 'Your photo didn\'t upload. Please try a different photo.'}; }
  const r = await fetch(`https://api.notion.com/v1/pages/${p.id}`, {method: 'PATCH', headers: {...H(), 'Content-Type': 'application/json'}, body: JSON.stringify({properties: props})});
  if (!r.ok) { console.error('card save', await r.text()); return {ok: false, status: 502, msg: 'Something went wrong saving your card. Please try again, or message Matt.'}; }
  return {ok: true};
}

async function joinWaitlist(b) {
  const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase(), list = WL_LISTS.includes(b.list) ? b.list : 'Other';
  if (b.website) return {ok: true};
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return {ok: false, status: 400, msg: 'Please add your name and a valid email.'};
  const r = await fetch('https://api.notion.com/v1/pages', {method: 'POST', headers: {...H(), 'Content-Type': 'application/json'},
    body: JSON.stringify({parent: {type: 'data_source_id', data_source_id: WL_DS}, properties: {
      'Name': {title: [{text: {content: name}}]}, 'Email': {email}, 'List': {select: {name: list}}, 'Source': {rich_text: [{text: {content: clip(b.source, 80)}}]}}})});
  if (!r.ok) { console.error('waitlist', await r.text()); return {ok: false, status: 502, msg: 'Could not save that. Please try again.'}; }
  return {ok: true};
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/waitlist') {
      const o = req.headers.origin, cors = ORIGINS.includes(o) ? {'Access-Control-Allow-Origin': o, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'} : {};
      if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
      if (req.method !== 'POST' || +req.headers['content-length'] > 4000) { res.writeHead(400, cors); return res.end(); }
      let raw = ''; for await (const c of req) { raw += c; if (raw.length > 4000) break; }
      let out; try { out = await joinWaitlist(JSON.parse(raw)); } catch (e) { console.error(e); out = {ok: false, status: 400}; }
      res.writeHead(out.status || 200, {...cors, 'Content-Type': 'application/json'}); return res.end(JSON.stringify(out));
    }
    if (req.method === 'POST' && url.pathname === '/submit') {
      if (+req.headers['content-length'] > 30e6) { res.writeHead(413, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({ok: false, msg: 'That file is too big. Try a photo, or send the video to Matt on WhatsApp.'})); }
      const f = await new Request('http://x', {method: 'POST', headers: req.headers, body: Readable.toWeb(req), duplex: 'half'}).formData();
      let out; try { out = await createWin(f); } catch (e) { console.error(e); out = {ok: false, status: 502, msg: 'Something went wrong saving your win. Please try again, or send it to Matt on WhatsApp.'}; }
      res.writeHead(out.status || 200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify(out));
    }
    if (url.pathname === '/api/member') {
      const info = await memberInfo(url.searchParams.get('m'));
      res.writeHead(info ? 200 : 404, {'Content-Type': 'application/json', 'Cache-Control': 'no-store'}); return res.end(JSON.stringify(info || {ok: false}));
    }
    if (req.method === 'POST' && url.pathname === '/card') {
      if (+req.headers['content-length'] > 20e6) { res.writeHead(413, {'Content-Type': 'application/json'}); return res.end(JSON.stringify({ok: false, msg: 'That photo is too big. Try another one.'})); }
      const f = await new Request('http://x', {method: 'POST', headers: req.headers, body: Readable.toWeb(req), duplex: 'half'}).formData();
      let out; try { out = await saveCard(f); } catch (e) { console.error(e); out = {ok: false, status: 502, msg: 'Something went wrong saving your card. Please try again, or message Matt.'}; }
      res.writeHead(out.status || 200, {'Content-Type': 'application/json'}); return res.end(JSON.stringify(out));
    }
    if (url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
    const name = url.pathname === '/' ? 'index.html' : (url.pathname === '/card' || url.pathname === '/welcome') ? 'card.html' : url.pathname.slice(1);
    if (!/^[\w.-]+$/.test(name) || !TYPES[name.slice(name.lastIndexOf('.'))]) { res.writeHead(404); return res.end(); }
    const body = await readFile(new URL(name, DIR));
    res.writeHead(200, {'Content-Type': TYPES[name.slice(name.lastIndexOf('.'))], 'Cache-Control': name.endsWith('.html') ? 'no-cache' : 'max-age=86400'});
    res.end(body);
  } catch (e) { console.error(e); if (!res.headersSent) res.writeHead(500); res.end(); }
}).listen(process.env.PORT || 10000, () => console.log('MeFit wins form up'));
