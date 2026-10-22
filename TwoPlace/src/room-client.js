let runtimeApiUrl='';
if(import.meta.env.PROD&&!import.meta.env.VITE_GAS_URL&&!import.meta.env.VITE_API_URL){
  try{const r=await fetch(import.meta.env.BASE_URL+'web-config.json',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(r.ok)runtimeApiUrl=(await r.json()).apiUrl||'';}catch{/* Request shows a configuration error if unavailable. */}
}
export const gasUrl = (import.meta.env.VITE_GAS_URL || runtimeApiUrl || '').trim();
export const pollInterval = gasUrl ? 15000 : 3000;
const sessionKey = 'twoplace:room-session:v1';
const pendingKey = 'twoplace:pending-room:v1';
const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(sessionKey));
    return /^[a-f0-9]{64}$/.test(saved?.token) ? saved : null;
  } catch { return null; }
}
export function storeSession(session) { localStorage.setItem(sessionKey, JSON.stringify({token:session.token})); }
export function clearSession() { localStorage.removeItem(sessionKey); }
export function pendingRequest(kind, code) {
  let pending;
  try { pending = JSON.parse(localStorage.getItem(pendingKey)); } catch { /* Start a fresh request. */ }
  if (pending?.kind === kind && pending?.code === code && /^[a-f0-9]{64}$/.test(pending.token)) return pending.token;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
  localStorage.setItem(pendingKey,JSON.stringify({kind,code,token}));
  return token;
}
export function finishRequest() { localStorage.removeItem(pendingKey); }
export async function request(path, {token, method='GET', body} = {}) {
  if (gasUrl) return gasRequest(path,{token,method,body});
  if (import.meta.env.PROD && location.hostname.endsWith('github.io') && !apiBase) throw new Error('저장 서버 연결 설정이 필요해요. GAS 배포 주소를 설정한 뒤 웹을 다시 배포해 주세요.');
  if (Capacitor.isNativePlatform() && !apiBase) throw new Error('앱에 연결할 서버 주소가 아직 설정되지 않았어요. 웹에서 먼저 이용해 주세요.');
  let response;
  try {
    response = await fetch(`${apiBase}/api${path}`, {
      method, cache:'no-store', signal:AbortSignal.timeout(12000),
      headers: {...(token ? {Authorization:`Bearer ${token}`} : {}), ...(body ? {'Content-Type':'application/json'} : {})},
      ...(body ? {body:JSON.stringify(body)} : {}),
    });
  } catch { throw new Error('서버에 연결할 수 없어요. 인터넷 연결과 서버 주소를 확인해 주세요.'); }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('커플방 서버에 연결하지 못했어요. 서버 실행 상태를 확인해 주세요.'); }
  if (!response.ok) { const error = new Error(data.error || '요청을 처리하지 못했어요.'); error.status = response.status; throw error; }
  return data;
}
import { Capacitor } from '@capacitor/core';


export async function gasRequest(path,{token,method='GET',body}={}){
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(gasUrl))throw new Error('GAS 웹 앱 배포 주소를 확인해 주세요.');
  let response,data;
  try {
    // A fresh URL also prevents intermediary caches from reusing a redirected
    // health/previous-response body for a different Apps Script POST request.
    response=await fetch(gasUrl+'?request='+crypto.randomUUID(),{method:'POST',cache:'no-store',redirect:'follow',credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({path,method,token,body}),signal:AbortSignal.timeout(45000)});
    data=await response.json();
  }catch {throw new Error('저장 서버에 연결하지 못했어요. 인터넷 연결과 GAS 배포 설정을 확인해 주세요.');}
  if(!response.ok||!data||!Number.isInteger(data.status))throw new Error('GAS 서버 응답을 확인해 주세요.');
  if(data.status>=400){const error=new Error(data.data?.error||'요청을 처리하지 못했어요.');error.status=data.status;throw error;}
  return data.data;
}
