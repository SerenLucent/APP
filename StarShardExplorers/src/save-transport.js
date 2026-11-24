export async function sendSaveRequest({gasUrl,base='/',path,method='GET',body,token,fetcher=fetch}){
 const question=path.indexOf('?'),route=question<0?path:path.slice(0,question),query=Object.fromEntries(new URLSearchParams(question<0?'':path.slice(question+1)));
 const fetchResponse=()=>fetcher(gasUrl?gasUrl+'?request='+crypto.randomUUID():base+'api/'+path,gasUrl?{
  method:'POST',credentials:'omit',redirect:'follow',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({path:'/api/'+route,method,token,body,query}),signal:AbortSignal.timeout(route.startsWith('email/')?15000:30000),
 }:{method,headers:{Authorization:'Bearer '+(token||''),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 let response,result;
 const attempts=gasUrl&&route.startsWith('email/')?2:1;
 for(let attempt=0;attempt<attempts;attempt++){
  try{response=await fetchResponse();result=await response.json();break;}
  catch(error){if(attempt+1<attempts)continue;throw Error(route.startsWith('email/')?'인증 서버 응답을 받지 못했어요. 다시 받기를 눌러 주세요. 같은 요청은 메일을 중복 발송하지 않아요.':'개인 저장 서버의 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.');}
 }

 const status=gasUrl?result.status:response.status;
 if(!response.ok||status<200||status>=300)throw Object.assign(Error(result.error||'저장에 실패했어요.'),{status});
 return gasUrl?result.data:result;
}
