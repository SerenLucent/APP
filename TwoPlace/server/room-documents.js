import {randomUUID} from 'node:crypto';
import {partitionLegacyRoom,createRoomDocuments} from '../shared/room-storage.js';
import {initialPetHome} from './pets.js';
export function openSqlRoomDocuments(db,auth){
 db.exec('CREATE TABLE IF NOT EXISTS room_documents (room_id TEXT NOT NULL, path TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(room_id,path))');
 const get=name=>{const row=db.prepare('SELECT data FROM room_documents WHERE room_id=? AND path=?').get(auth.id,name);return row?JSON.parse(row.data):null;};
 const commit=changes=>{for(const [name,data] of Object.entries(changes))db.prepare('INSERT OR REPLACE INTO room_documents VALUES (?,?,?)').run(auth.id,name,JSON.stringify(data));};
 let core=get('room.json');
 if(!core){
  const stored=db.prepare('SELECT data FROM pet_homes WHERE room_id=?').get(auth.id),home=stored?JSON.parse(stored.data):initialPetHome();
  const legacy={code:auth.code,schemaVersion:1,state:JSON.parse(auth.state),revision:auth.revision,petHome:home,members:db.prepare('SELECT role FROM members WHERE room_id=?').all(auth.id),recovery:db.prepare('SELECT 1 FROM recovery WHERE room_id=?').get(auth.id)?{enabled:true}:null};
  const files=partitionLegacyRoom(legacy);files['backups/storage-v2-original.json']=legacy;commit(files);core=files['room.json'];
 }
 // Membership and recovery are owned by their SQL tables, not duplicated snapshots.
 core.members=db.prepare('SELECT role FROM members WHERE room_id=?').all(auth.id);
 core.recovery=db.prepare('SELECT 1 FROM recovery WHERE room_id=?').get(auth.id)?{enabled:true}:null;
 return createRoomDocuments(core,{read:get,commit,idFactory:()=>randomUUID().replaceAll('-','')});
}
