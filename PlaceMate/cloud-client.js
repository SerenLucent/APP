/** Transport for the dedicated PlaceMate Apps Script backend. No GitHub token here. */
export function createPlaceMateClient({endpoint, personalKey, timeoutMs=45000, scriptRun=null}) {
  if(!/^[a-f0-9]{64}$/.test(personalKey||''))throw new Error('INVALID_PERSONAL_KEY');
  if(!scriptRun&&!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint||''))throw new Error('INVALID_ENDPOINT');
  return {async call(action,payload={}) {
    const request={action,payload,personalKey};
    let result;
    if(scriptRun){
      result=await new Promise((resolve,reject)=>scriptRun.withSuccessHandler(resolve).withFailureHandler(reject).placeMateApi(request));
    }else{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
      try{
        // text/plain avoids an application/json CORS preflight. Keep responses readable;
        // never use no-cors, which would hide all save and permission failures.
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(request),signal:controller.signal,credentials:'omit',redirect:'follow'});
        if(!response.ok)throw new Error('HTTP_'+response.status);
        result=await response.json();
      }finally{clearTimeout(timer);}
    }
    if(!result?.ok){const error=new Error(result?.error||'INVALID_RESPONSE');error.code=result?.error;throw error;}
    return result.data;
  }};
}

/** A personal login/recovery key, separate from room invitation keys. */
export function generatePersonalKey(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');}
