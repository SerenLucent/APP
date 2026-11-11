export const MAP_MUSIC={explore:'bgm_explore.mp3',offense:'bgm_offense.mp3',defense:'bgm_defence.mp3'};
export function shouldPauseGameMusic({loading=false,loadError=false,paused=false,won=false,hidden=false}){return loading||loadError||hidden||(paused&&!won);}
export function createGameMusic({base='/',mode='explore',audioFactory=()=>new Audio()}={}){
 const audio=audioFactory();audio.src=base+'audio/'+(MAP_MUSIC[mode]||MAP_MUSIC.explore);audio.preload='auto';audio.loop=true;audio.volume=.25;
 let ready=false,paused=false,muted=false,pending=false;
 const active=()=>ready&&!paused&&!muted;
 function sync(){
  if(!active()){audio.pause();return;}
  if(pending||!audio.paused)return;
  pending=true;
  try{Promise.resolve(audio.play()).then(()=>{if(!active())audio.pause();}).catch(()=>{/* iOS may require the next user gesture. */}).finally(()=>pending=false);}catch{pending=false;}
 }
 audio.load();
 return {
  setReady(value){ready=value;sync();},
  setPaused(value){paused=value;sync();},
  setMuted(value){muted=value;sync();},
  unlock(){sync();},
  stop(){ready=false;audio.pause();try{audio.currentTime=0;}catch{}}
 };
}
