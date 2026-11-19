export function clearPlayerSession(storage,pendingKey){
 if(storage.getItem(pendingKey))throw Error('진행 중인 저장을 완료한 뒤 로그아웃해 주세요.');
 for(const key of Object.keys(storage))if(key.startsWith('star-shard-explorers:gas-'))storage.removeItem(key);
}
