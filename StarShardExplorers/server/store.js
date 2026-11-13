import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {initialAdventure,applyAdventureAction} from '../shared/adventure-progression.js';
export const ACTIONS=new Set(['adventureStart','adventureFinish','adventureInvestStardustBatch','adventureSkillInvestStardustBatch','adventureReset','adventurePurchase','adventurePotion']);
export function createPlayerStore(filename){
 if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS players(id INTEGER PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, state TEXT NOT NULL, updated_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS history(player_id INTEGER NOT NULL REFERENCES players(id),run_id TEXT NOT NULL,at INTEGER NOT NULL,entry TEXT NOT NULL,PRIMARY KEY(player_id,run_id)); CREATE INDEX IF NOT EXISTS history_dates ON history(player_id,at);');
 const hash=token=>{if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))throw Object.assign(Error('저장 복구코드를 확인해 주세요.'),{status:401});return createHash('sha256').update(token).digest('hex');};
 const row=token=>{const found=db.prepare('SELECT * FROM players WHERE token_hash=?').get(hash(token));if(!found)throw Object.assign(Error('저장 정보를 찾을 수 없어요.'),{status:401});return found;};
 return {
  create(token,now=Date.now()){const hashed=hash(token);const state={version:0,hearts:0,adventure:initialAdventure()};db.prepare('INSERT OR IGNORE INTO players(token_hash,state,updated_at) VALUES(?,?,?)').run(hashed,JSON.stringify(state),now);return this.get(token);},
  get(token){return JSON.parse(row(token).state);},
  action(token,action,now=Date.now()){
   if(!action||!ACTIONS.has(action.type))throw Object.assign(Error('지원하지 않는 게임 동작이에요.'),{status:400});
   db.exec('BEGIN IMMEDIATE');
   try{
    const saved=row(token),state=JSON.parse(saved.state);
    if(state.adventure.operations?.includes(action.actionId)){db.exec('COMMIT');return state;}
    if(action.version!==state.version)throw Object.assign(Error('다른 화면의 저장 내용을 확인하고 있어요. 다시 시도해 주세요.'),{status:409});
    applyAdventureAction(state,action,now,randomUUID,'player');
    for(const entry of state.adventure.history||[])db.prepare('INSERT OR IGNORE INTO history(player_id,run_id,at,entry) VALUES(?,?,?,?)').run(saved.id,entry.runId,entry.at,JSON.stringify(entry));
    state.adventure.history=[];state.version++;
    db.prepare('UPDATE players SET state=?,updated_at=? WHERE id=?').run(JSON.stringify(state),now,saved.id);db.exec('COMMIT');return state;
   }catch(e){db.exec('ROLLBACK');throw e;}
  },
  history(token,start,end){const p=row(token),from=Date.parse(start+'T00:00:00+09:00'),to=Date.parse(end+'T23:59:59.999+09:00');if(!Number.isFinite(from)||!Number.isFinite(to)||to<from||to-from>32*86400000)throw Object.assign(Error('이력은 한 번에 최대 31일간 조회할 수 있어요.'),{status:400});return {entries:db.prepare('SELECT entry FROM history WHERE player_id=? AND at BETWEEN ? AND ? ORDER BY at DESC').all(p.id,from,to).map(r=>JSON.parse(r.entry)),since:db.prepare('SELECT MIN(at) AS at FROM history WHERE player_id=?').get(p.id).at};},
  close(){db.close();},
 };
}
