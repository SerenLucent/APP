export const eventKinds = ['general', 'work', 'trip', 'date'];
export const categoryNames = {general:'일반', work:'일', trip:'여행', date:'데이트'};
export function eventLabel(event) {
  const compact=value=>value?.endsWith(':00')?String(Number(value.slice(0,2))):value;
  const start=compact(event.startTime||((event.kind!=='work')?event.time:''));
  const end=compact(event.endTime||((event.kind==='work')?event.time:''));
  if (event.kind === 'work') {
    if (event.workType === 'off') return '휴무';
    if(start&&end)return `근무 ${start}~${end}`;
    if(start)return `출근 ${start}`;
    if(end)return `퇴근 ${end}`;
    return event.workType==='leave'?'퇴근':'근무';
  }
  return event.title+(start||end?` ${start||''}~${end||''}`:'');
}
export function eventsOn(events,date) { return events.filter(event => event.date === date); }
export function dateSpan(start,end){
  const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!valid(start)||!valid(end)||end<start)throw new Error('종료일은 시작일 이후로 선택해 주세요.');
  const count=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
  if(count>366)throw new Error('한 번에 최대 366일을 등록할 수 있어요.');
  return Array.from({length:count},(_,i)=>new Date(Date.parse(start)+i*86400000).toISOString().slice(0,10));
}
export function readRewardAvailable(event,role,rewards){
 return !!event?.authorRole&&!!role&&event.authorRole!==role&&!rewards?.reads?.[event.date]&&!rewards?.seen?.includes(role+':'+event.date+':'+event.id);
}

export function registrationRewardAvailable(home,state,date){return !home?.calendarRewards?.registration?.[date]&&!state.events.some(event=>event.date===date);}
