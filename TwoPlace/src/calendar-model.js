export const eventKinds = ['general', 'work', 'trip', 'date'];
export const categoryNames = {general:'일반', work:'일', trip:'여행', date:'데이트'};
export function eventLabel(event) {
  if (event.kind === 'work') {
    if (event.workType === 'off') return '휴무';
    const time = event.time?.endsWith(':00') ? String(Number(event.time.slice(0,2))) : event.time;
    return time ? `퇴근 ${time}` : '퇴근';
  }
  return event.title;
}
export function eventsOn(events,date) { return events.filter(event => event.date === date); }
