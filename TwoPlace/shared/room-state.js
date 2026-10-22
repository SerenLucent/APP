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
    if (event.kind === 'work' && (!['leave','off'].includes(event.workType) || (event.workType === 'leave' && !event.time) || (event.workType === 'off' && event.time))) throw new StateError(400,'퇴근 시간 또는 휴무 종류를 확인해 주세요.');
  }
  return {startDate: data.startDate, events: data.events.map(event => {
    const result = {id:event.id,date:event.date,title:event.title};
    for (const field of ['kind','time','place','details']) if (event[field] !== undefined) result[field] = event[field];
    if (event.kind === 'work') result.workType = event.workType;
    return result;
  }), notes: data.notes.map(({id,date,body}) => ({id,date,body}))};
}
