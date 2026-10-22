class StateError extends Error { constructor(status,message){super(message);this.status=status;} }
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
}
export function cleanState(data) {
  const string = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  if (!data || (data.startDate !== null && !validDate(data.startDate)) || !Array.isArray(data.events) || !Array.isArray(data.notes) || data.events.length > 2000 || data.notes.length > 1000) throw new StateError(400, '저장할 내용이 올바르지 않아요.');
  if (data.events.some(e => !e || !string(e.id,64) || !validDate(e.date) || !string(e.title,100)) || data.notes.some(n => !n || !string(n.id,64) || !validDate(n.date) || !string(n.body,5000))) throw new StateError(400, '일정이나 메모 내용을 확인해 주세요.');
  if (new Set(data.events.map(e => e.id)).size !== data.events.length || new Set(data.notes.map(n => n.id)).size !== data.notes.length) throw new StateError(400, '중복된 내용이 있어요.');
  for (const event of data.events) {
    if ((event.kind !== undefined && !['general','work','trip','date'].includes(event.kind)) || (event.time !== undefined && (typeof event.time !== 'string' || (event.time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time)))) || (event.place !== undefined && (typeof event.place !== 'string' || event.place.length > 200)) || (event.details !== undefined && (typeof event.details !== 'string' || event.details.length > 5000))) throw new StateError(400,'일정 분류, 시간, 계획을 확인해 주세요.');
    for(const field of ['startTime','endTime'])if(event[field]!==undefined&&(typeof event[field]!=='string'||(event[field]!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(event[field]))))throw new StateError(400,'시작·종료 시간을 확인해 주세요.');
    if(event.authorRole!==undefined&&!['owner','partner'].includes(event.authorRole))throw new StateError(400,'일정 작성자를 확인해 주세요.');
    if (event.kind === 'work' && (!['leave','shift','off'].includes(event.workType) || (event.workType === 'leave' && !event.time) || (event.workType === 'off' && (event.time||event.startTime||event.endTime)))) throw new StateError(400,'근무 시간 또는 휴무 종류를 확인해 주세요.');
  }
  if(data.characters!==undefined&&(!data.characters||typeof data.characters!=='object'||Array.isArray(data.characters)||Object.entries(data.characters).some(([role,character])=>!['owner','partner'].includes(role)||!['momo','kuki'].includes(character))))throw new StateError(400,'내 캐릭터를 확인해 주세요.');
  return {startDate: data.startDate,...(data.characters?{characters:{...data.characters}}:{}), events: data.events.map(event => {
    const result = {id:event.id,date:event.date,title:event.title};
    for (const field of ['kind','time','place','details','startTime','endTime','authorRole']) if (event[field] !== undefined) result[field] = event[field];
    if (event.kind === 'work') result.workType = event.workType;
    return result;
  }), notes: data.notes.map(({id,date,body}) => ({id,date,body}))};
}
export function memberState(current,input,role){
  const next=cleanState(input),previous=new Map(current.events.map(e=>[e.id,e]));
  if(current.characters||next.characters){const chars={...current.characters};if(next.characters?.[role])chars[role]=next.characters[role];next.characters=chars;}
  next.events=next.events.map(e=>{const old=previous.get(e.id);if(old?.authorRole)return {...e,authorRole:old.authorRole};if(e.authorRole)return {...e,authorRole:role};return e;});
  return next;
}
