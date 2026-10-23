import { cleanState, memberState } from '../shared/room-state.js';
import { initialPlaces, changePlaces } from '../shared/places.js';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomInt, createHash, scryptSync } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { initialPetHome, petSnapshot, changePetHome, remodelPetHome, CATALOG } from './pets.js';

const emptyState = () => ({startDate: null, events: [], notes: []});
const hash = value => createHash('sha256').update(value).digest('hex');
class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new ApiError(413, '저장할 내용이 너무 많아요.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
  catch { throw new ApiError(400, '요청 내용을 확인해 주세요.'); }
}
export function createRoomApi({dbPath = process.env.ROOM_DB_PATH || resolve('.data/rooms.sqlite'), allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://localhost,http://localhost,capacitor://localhost').split(',')} = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), {recursive:true});
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS members (token_hash TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pet_homes (room_id TEXT PRIMARY KEY REFERENCES rooms(id), data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS members_room ON members(room_id);
    CREATE TABLE IF NOT EXISTS recovery (room_id TEXT PRIMARY KEY REFERENCES rooms(id), salt TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS recovery_attempts (code TEXT PRIMARY KEY, at INTEGER, count INTEGER);`);
  db.exec('CREATE TABLE IF NOT EXISTS place_maps (room_id TEXT PRIMARY KEY REFERENCES rooms(id), data TEXT NOT NULL)');
  function passwordHash(password,salt){
    if(typeof password!=='string'||password.length<8||password.length>128)throw new ApiError(400,'복구 암호는 8~128자로 입력해 주세요.');
    return scryptSync(password,salt,32).toString('hex');
  }
  function recoveryLimit(code){
    const old=db.prepare('SELECT * FROM recovery_attempts WHERE code=?').get(code),now=Date.now();
    const value=old&&now-old.at<900000?old:{at:now,count:0};
    if(value.count>=10)throw new ApiError(429,'복구 시도가 많아요. 15분 후 다시 시도해 주세요.');
    db.prepare('INSERT OR REPLACE INTO recovery_attempts VALUES (?,?,?)').run(code,value.at,value.count+1);
  }
  const limits = new Map();
  function limit(req, action) {
    const key = `${req.socket.remoteAddress}:${action}`, now = Date.now();
    if (limits.size > 5000) for (const [k,v] of limits) if (v.reset <= now) limits.delete(k);
    let entry = limits.get(key);
    if (!entry || entry.reset <= now) { entry = {count:0, reset:now + 600000}; limits.set(key, entry); }
    if (++entry.count > (action === 'create' ? 20 : 30)) throw new ApiError(429, '잠시 후 다시 시도해 주세요.');
  }
  function snapshot(room, role) {
    const {count} = db.prepare('SELECT count(*) AS count FROM members WHERE room_id = ?').get(room.id);
    db.prepare('INSERT OR IGNORE INTO pet_homes (room_id,data) VALUES (?,?)').run(room.id,JSON.stringify(initialPetHome()));
    const previous=JSON.parse(db.prepare('SELECT data FROM pet_homes WHERE room_id = ?').get(room.id).data),petHome=remodelPetHome(previous);
    if(petHome!==previous)db.prepare('UPDATE pet_homes SET data=? WHERE room_id=?').run(JSON.stringify(petHome),room.id);
    return {code:room.code, role, recoveryEnabled:!!db.prepare('SELECT 1 FROM recovery WHERE room_id=?').get(room.id),memberCount:count, revision:room.revision, state:JSON.parse(room.state),petHome:petSnapshot(petHome),catalog:CATALOG};
  }
  function member(req) {
    const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) throw new ApiError(401, '커플방에 먼저 입장해 주세요.');
    const row = db.prepare('SELECT rooms.*, members.role FROM members JOIN rooms ON rooms.id = members.room_id WHERE token_hash = ?').get(hash(token));
    if (!row) throw new ApiError(401, '입장 정보를 확인할 수 없어요.');
    return row;
  }
  async function handle(req, res, next = () => { res.statusCode = 404; res.end(); }) {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/')) return next();
    const reply = (status, data) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); };
    try {
      const origin = req.headers.origin;
      const ownOrigins = [`http://${req.headers.host}`, `https://${req.headers.host}`];
      if (origin && !ownOrigins.includes(origin) && !allowedOrigins.includes(origin)) throw new ApiError(403, '허용되지 않은 접속 주소예요.');
      if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary','Origin'); }
      res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS');
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      if (path === '/api/rooms' && req.method === 'POST') {
        const body = await readJson(req);
        if (body.requestToken !== undefined && !/^[a-f0-9]{64}$/.test(body.requestToken)) throw new ApiError(400,'요청 정보를 확인해 주세요.');
        const token = body.requestToken || randomBytes(32).toString('hex');
        const existing = db.prepare('SELECT rooms.*, members.role FROM members JOIN rooms ON rooms.id = members.room_id WHERE token_hash = ?').get(hash(token));
        if (existing) {
          if (existing.role !== 'owner') throw new ApiError(409,'이미 다른 방에 사용한 요청이에요.');
          return reply(200,{token,...snapshot(existing,existing.role)});
        }
        limit(req, 'create');
        const id = randomBytes(16).toString('hex');
        let code;
        do { code = String(randomInt(0, 1000000000000)).padStart(12,'0'); } while (db.prepare('SELECT id FROM rooms WHERE code = ?').get(code));
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare('INSERT INTO rooms (id,code,state) VALUES (?,?,?)').run(id,code,JSON.stringify(emptyState()));
          db.prepare('INSERT INTO members (token_hash,room_id,role) VALUES (?,?,?)').run(hash(token),id,'owner');
          if(body.password){const salt=randomBytes(16).toString('hex');db.prepare('INSERT INTO recovery VALUES (?,?,?)').run(id,salt,passwordHash(body.password,salt));}
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
        return reply(201, {token, ...snapshot(db.prepare('SELECT * FROM rooms WHERE id = ?').get(id),'owner')});
      }
      if (path === '/api/rooms/join' && req.method === 'POST') {
        const body = await readJson(req);
        if (body.requestToken !== undefined && !/^[a-f0-9]{64}$/.test(body.requestToken)) throw new ApiError(400,'요청 정보를 확인해 주세요.');
        const code = typeof body.code === 'string' ? body.code.replace(/[\s-]/g,'') : '';
        const token = body.requestToken || randomBytes(32).toString('hex');
        const existing = db.prepare('SELECT rooms.*, members.role FROM members JOIN rooms ON rooms.id = members.room_id WHERE token_hash = ?').get(hash(token));
        if (existing) {
          if (existing.code !== code || existing.role !== 'partner') throw new ApiError(409,'이미 다른 방에 사용한 요청이에요.');
          return reply(200,{token,...snapshot(existing,existing.role)});
        }
        limit(req, 'join');
        if (!/^\d{12}$/.test(code)) throw new ApiError(400,'숫자 12자리 방 코드를 입력해 주세요.');
        db.exec('BEGIN IMMEDIATE');
        let room;
        try {
          room = db.prepare('SELECT * FROM rooms WHERE code = ?').get(code);
          if (!room) throw new ApiError(404,'방 코드를 찾을 수 없어요. 다시 확인해 주세요.');
          if (snapshot(room,'partner').memberCount >= 2) throw new ApiError(409,'이미 두 사람이 입장한 커플방이에요.');
          db.prepare('INSERT INTO members (token_hash,room_id,role) VALUES (?,?,?)').run(hash(token),room.id,'partner');
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
        return reply(200, {token, ...snapshot(room,'partner')});
      }
      if(path==='/api/room/recovery'&&req.method==='PUT'){
        const room=member(req),body=await readJson(req),r=db.prepare('SELECT * FROM recovery WHERE room_id=?').get(room.id);
        if(r){recoveryLimit(room.code);if(passwordHash(body.currentPassword,r.salt)!==r.hash)throw new ApiError(403,'현재 복구 암호를 확인해 주세요.');}
        const salt=randomBytes(16).toString('hex');
        db.prepare('INSERT OR REPLACE INTO recovery VALUES (?,?,?)').run(room.id,salt,passwordHash(body.password,salt));
        db.prepare('DELETE FROM recovery_attempts WHERE code=?').run(room.code);
        return reply(200,snapshot(room,room.role));
      }
      if(path==='/api/rooms/recover'&&req.method==='POST'){
        const body=await readJson(req),code=typeof body.code==='string'?body.code.replace(/[\s-]/g,''):'';
        if(!/^\d{12}$/.test(code)||!['owner','partner'].includes(body.role)||!/^[a-f0-9]{64}$/.test(body.requestToken||''))throw new ApiError(400,'방 코드와 본인 자리를 확인해 주세요.');
        const hashed=hash(body.requestToken),existing=db.prepare('SELECT rooms.*,members.role FROM members JOIN rooms ON rooms.id=members.room_id WHERE token_hash=?').get(hashed);
        if(existing){if(existing.code!==code||existing.role!==body.role)throw new ApiError(409,'다른 연결에 사용한 요청이에요.');return reply(200,{token:body.requestToken,...snapshot(existing,existing.role)});}
        recoveryLimit(code);
        const room=db.prepare('SELECT * FROM rooms WHERE code=?').get(code),r=room&&db.prepare('SELECT * FROM recovery WHERE room_id=?').get(room.id);
        if(!r||passwordHash(body.password,r.salt)!==r.hash)throw new ApiError(403,'방 코드 또는 복구 암호를 확인해 주세요.');
        const changed=db.prepare('UPDATE members SET token_hash=? WHERE room_id=? AND role=?').run(hashed,room.id,body.role);
        if(!changed.changes)throw new ApiError(400,'아직 입장한 적 없는 자리예요. 커플방 입장하기를 이용해 주세요.');
        db.prepare('DELETE FROM recovery_attempts WHERE code=?').run(code);
        return reply(200,{token:body.requestToken,...snapshot(room,body.role)});
      }
      if(path==='/api/room/places'&&['GET','PUT'].includes(req.method)){
        const auth=member(req),body=req.method==='PUT'?await readJson(req):null;
        db.exec('BEGIN IMMEDIATE');
        try{
          const stored=db.prepare('SELECT data FROM place_maps WHERE room_id=?').get(auth.id);
          let data=stored?JSON.parse(stored.data):initialPlaces();
          if(body)data=changePlaces(data,body,auth.role,Date.now());
          if(body||!stored)db.prepare('INSERT OR REPLACE INTO place_maps VALUES (?,?)').run(auth.id,JSON.stringify(data));
          db.exec('COMMIT');
          return reply(200,{code:auth.code,role:auth.role,memberCount:snapshot(auth,auth.role).memberCount,...data});
        }catch(error){db.exec('ROLLBACK');throw error;}
      }
      if (path === '/api/room' && req.method === 'GET') {
        const room = member(req);
        return reply(200, snapshot(room, room.role));
      }
      if (path === '/api/room/pets' && req.method === 'POST') {
        const auth = member(req);
        const action = await readJson(req);
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare('INSERT OR IGNORE INTO pet_homes (room_id,data) VALUES (?,?)').run(auth.id,JSON.stringify(initialPetHome()));
          const current = JSON.parse(db.prepare('SELECT data FROM pet_homes WHERE room_id = ?').get(auth.id).data);
          const updated = changePetHome(current,action,Date.now(),()=>randomBytes(16).toString('hex'));
          db.prepare('UPDATE pet_homes SET data = ? WHERE room_id = ?').run(JSON.stringify(updated),auth.id);
          db.exec('COMMIT');
        } catch(error) { db.exec('ROLLBACK'); throw error; }
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(auth.id);
        return reply(200,snapshot(room,auth.role));
      }
      if (path === '/api/room/state' && req.method === 'PUT') {
        const auth = member(req);
        const body = await readJson(req);
        const data = memberState(JSON.parse(auth.state),body.state,auth.role);
        if (!Number.isSafeInteger(body.revision) || body.revision < 0) throw new ApiError(400,'변경 정보를 확인해 주세요.');
        const result = db.prepare('UPDATE rooms SET state = ?, revision = revision + 1 WHERE id = ? AND revision = ?').run(JSON.stringify(data), auth.id, body.revision);
        if (!result.changes) throw new ApiError(409,'상대가 먼저 내용을 수정했어요. 최신 내용을 확인한 뒤 다시 저장해 주세요.');
        const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(auth.id);
        return reply(200,snapshot(room,auth.role));
      }
      reply(404,{error:'요청한 기능을 찾을 수 없어요.'});
    } catch(error) {
      if (!error.status) console.error('Room API error:', error.message);
      if (!res.headersSent) reply(error.status || 500,{error:error.status ? error.message : '서버에서 처리하지 못했어요. 다시 시도해 주세요.'});
    }
  }
  return {handle, close: () => db.close()};
}
