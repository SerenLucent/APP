let sdk;
export async function loadNaverSDK(key){
  if(window.naver?.maps)return window.naver.maps;
  if(!key)throw new Error('NAVER_MAP_NOT_CONFIGURED');
  if(!sdk)sdk=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const timer=setTimeout(()=>reject(new Error('NAVER_MAP_LOAD_FAILED')),20000);
    window.pmNaverReady=()=>setTimeout(()=>{
      clearTimeout(timer);
      if(window.naver?.maps)resolve(window.naver.maps);
      else reject(new Error('NAVER_MAP_LOAD_FAILED'));
    },0);
    window.navermap_authFailure=()=>{clearTimeout(timer);reject(new Error('NAVER_MAP_AUTH_FAILED'));};
    script.src='https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId='+encodeURIComponent(key)+'&callback=pmNaverReady';
    script.onerror=()=>{clearTimeout(timer);reject(new Error('NAVER_MAP_LOAD_FAILED'));};
    document.head.append(script);
  }).catch(error=>{sdk=null;throw error;});
  return sdk;
}

// Retain one map instance/canvas across app renders, avoiding repeated map loads.
export class NaverMapView{
  constructor(){this.ready=false;this.map=null;this.markers=[];this.loading=null;}
  ensure(getConfig){
    if(!this.loading)this.loading=(async()=>{const config=await getConfig();if(!config.mapClientId)return false;this.api=await loadNaverSDK(config.mapClientId);this.ready=true;return true;})();
    return this.loading;
  }
  mount(el,{center,zoom,places,selected,onSelect,onMove}){
    const n=this.api;
    if(!this.map){
      this.canvas=document.createElement('div');this.canvas.style.cssText='width:100%;height:100%';el.replaceChildren(this.canvas);
      this.map=new n.Map(this.canvas,{center:new n.LatLng(center.lat,center.lng),zoom,zoomControl:false});
      n.Event.addListener(this.map,'idle',()=>{const c=this.map.getCenter();this.onMove?.({lat:c.lat(),lng:c.lng()},this.map.getZoom());});
    }else if(this.canvas.parentNode!==el)el.replaceChildren(this.canvas);
    this.onMove=onMove;
    const current=this.map.getCenter();
    if(Math.abs(current.lat()-center.lat)>1e-7||Math.abs(current.lng()-center.lng)>1e-7)this.map.setCenter(new n.LatLng(center.lat,center.lng));
    if(this.map.getZoom()!==zoom)this.map.setZoom(zoom);
    this.map.setSize(new n.Size(el.clientWidth,el.clientHeight));
    this.markers.forEach(marker=>{n.Event.clearInstanceListeners(marker);marker.setMap(null);});
    this.markers=places.map(p=>{
      const marker=new n.Marker({map:this.map,position:new n.LatLng(p.lat,p.lng),title:p.name,zIndex:p.id===selected?10:1});
      n.Event.addListener(marker,'click',()=>onSelect(p.id));return marker;
    });
  }
}
