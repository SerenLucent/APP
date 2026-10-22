/** Shared by PlaceMate and TwoPlace. Only the map browser ID is returned to clients. */
function pmNaverConfig_(){
  var props=PropertiesService.getScriptProperties();
  return {provider:'naver',mapClientId:props.getProperty('NAVER_MAP_CLIENT_ID')||'',searchReady:!!(props.getProperty('NAVER_SEARCH_CLIENT_ID')&&props.getProperty('NAVER_SEARCH_CLIENT_SECRET'))};
}
function pmNaverFail_(code){var e=new Error(code);e.pmCode=code;e.status=code==='NAVER_SEARCH_RATE_LIMIT'?429:503;throw e;}
function pmNaverText_(text){return String(text||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();}
function pmNaverSearch_(input,identity){
  if(typeof input!=='string'||input.trim().length<2||input.length>100)pmNaverFail_('INVALID_SEARCH_QUERY');
  var query=input.trim(),props=PropertiesService.getScriptProperties();
  var id=props.getProperty('NAVER_SEARCH_CLIENT_ID'),secret=props.getProperty('NAVER_SEARCH_CLIENT_SECRET');
  if(!id||!secret)pmNaverFail_('NAVER_SEARCH_NOT_CONFIGURED');
  var cache=CacheService.getScriptCache();
  var countKey='pm-nav-rate:'+identity+':'+Math.floor(Date.now()/60000);
  var count=Number(cache.get(countKey)||0);if(count>=15)pmNaverFail_('NAVER_SEARCH_RATE_LIMIT');cache.put(countKey,String(count+1),120);
  // Application-local daily cap; the provider console remains the authoritative limit.
  var today=Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd');
  var counter=JSON.parse(props.getProperty('PM_NAVER_SEARCH_USAGE')||'null');
  if(!counter||counter.date!==today)counter={date:today,count:0};
  var limit=Number(props.getProperty('NAVER_SEARCH_DAILY_LIMIT')||1000);
  if(!Number.isFinite(limit)||limit<1||counter.count>=limit)pmNaverFail_('NAVER_SEARCH_DAILY_LIMIT');
  counter.count++;props.setProperty('PM_NAVER_SEARCH_USAGE',JSON.stringify(counter));
  var response=UrlFetchApp.fetch('https://naverapihub.apigw.ntruss.com/search/v1/local?query='+encodeURIComponent(query)+'&display=5&start=1&sort=random&format=json',{
    method:'get',muteHttpExceptions:true,headers:{'X-NCP-APIGW-API-KEY-ID':id,'X-NCP-APIGW-API-KEY':secret}
  });
  var status=response.getResponseCode();
  if(status===401||status===403)pmNaverFail_('NAVER_SEARCH_AUTH_FAILED');
  if(status===429)pmNaverFail_('NAVER_SEARCH_RATE_LIMIT');
  if(status!==200)pmNaverFail_('NAVER_SEARCH_FAILED');
  var result=JSON.parse(response.getContentText());
  return {source:'NAVER',query:query,items:(result.items||[]).slice(0,5).map(function(item){
    var lng=Number(item.mapx),lat=Number(item.mapy);
    // NAVER returns WGS84 either as decimal degrees or scaled integers (1e7).
    if(Math.abs(lng)>180)lng/=10000000;if(Math.abs(lat)>90)lat/=10000000;
    if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>85||Math.abs(lng)>180||(!lat&&!lng))return null;
    var name=pmNaverText_(item.title),address=pmNaverText_(item.roadAddress||item.address),raw=pmNaverText_(item.category);
    var category=/카페|커피|디저트|베이커리/.test(raw)?'카페':/음식|식당|요리|한식|양식|중식|일식|술집/.test(raw)?'맛집':/쇼핑|판매|상점/.test(raw)?'쇼핑':/공원|산책/.test(raw)?'산책':'기타';
    var identityText=JSON.stringify([name,address,lat,lng]);
    var digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,identityText,Utilities.Charset.UTF_8).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join('');
    return {canonicalId:'naver_'+digest,name:name,address:address,category:category,lat:lat,lng:lng};
  }).filter(function(item){return item&&item.name&&item.address;})};
}
