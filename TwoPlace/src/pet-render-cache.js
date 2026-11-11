export function createRenderCache({build,dispose=()=>{},limit=24}){
 const entries=new Map();
 function touch(key,entry){entries.delete(key);entries.set(key,entry);}
 return {
  ready(key){const entry=entries.get(key);if(entry?.value){touch(key,entry);return entry.value;}return null;},
  prepare(key,input){
   if(entries.has(key)){const entry=entries.get(key);touch(key,entry);return entry.promise;}
   const entry={value:null,promise:null};entries.set(key,entry);
   entry.promise=Promise.resolve().then(()=>build(input)).then(value=>{
    entry.value=value;
    while(entries.size>limit){const candidate=[...entries].find(([k,e])=>k!==key&&e.value);if(!candidate)break;entries.delete(candidate[0]);dispose(candidate[1].value);}
    return value;
   }).catch(error=>{if(entries.get(key)===entry)entries.delete(key);throw error;});
   return entry.promise;
  }
 };
}
