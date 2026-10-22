export const storageKey = 'twoplace:v1';
export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dayNumber(value) {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}
export function togetherDays(start, today = dateKey()) {
  return dayNumber(today) - dayNumber(start) + 1;
}
export function loadState(storage = localStorage) {
  try {
    const data = JSON.parse(storage.getItem(storageKey));
    return {
      startDate: /^\d{4}-\d{2}-\d{2}$/.test(data?.startDate) ? data.startDate : null,
      events: Array.isArray(data?.events) ? data.events.filter(e => typeof e.id === 'string' && typeof e.date === 'string' && typeof e.title === 'string') : [],
      notes: Array.isArray(data?.notes) ? data.notes.filter(n => typeof n.id === 'string' && typeof n.body === 'string') : [],
    };
  } catch { return { startDate: null, events: [], notes: [] }; }
}
