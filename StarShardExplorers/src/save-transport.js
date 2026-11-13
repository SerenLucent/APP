export async function sendSaveRequest({gasUrl,base='/',path,method='GET',body,token,fetcher=fetch}){
 const question=path.indexOf('?'),route=question<0?path:path.slice(0,question),query=Object.fromEntries(new URLSearchParams(question<0?'':path.slice(question+1)));
 const response=await fetcher(gasUrl?gasUrl+'?request='+crypto.randomUUID():base+'api/'+path,gasUrl?{
  method:'POST',credentials:'omit',redirect:'follow',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({path:'/api/'+route,method,token,body,query}),signal:AbortSignal.timeout(90000),
 }:{method,headers:{Authorization:'Bearer '+(token||''),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 let result;try{result=await response.json();}catch{throw Error('개인 저장 서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');}
 const status=gasUrl?result.status:response.status;
 if(!response.ok||status<200||status>=300)throw Object.assign(Error(result.error||'저장에 실패했어요.'),{status});
 return gasUrl?result.data:result;
}
