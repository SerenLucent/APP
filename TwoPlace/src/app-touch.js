const installed=new WeakSet();
export function preventPageGesture(event){if(event.cancelable)event.preventDefault();}
export function installAppTouchPolicy(doc=document){
 if(installed.has(doc))return;installed.add(doc);
 const viewport=doc.querySelector('meta[name="viewport"]');
 if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
 const style=doc.createElement('style');style.id='twoplace-touch-policy';style.textContent=`html,body{touch-action:pan-x pan-y;-webkit-text-size-adjust:100%}.bottom-nav,.bottom-nav *{touch-action:pan-x pan-y}@media(max-width:650px){input,textarea,select{font-size:max(16px,1em)}}`;doc.head.append(style);
 // Do not cancel touchstart, touchmove or pointer events: pet-map pinch and fast button taps use them.
 for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])doc.addEventListener(type,preventPageGesture,{passive:false});
 doc.addEventListener('wheel',event=>{if(event.ctrlKey)preventPageGesture(event);},{passive:false});
 const child=frame=>{try{if(frame.contentDocument)installAppTouchPolicy(frame.contentDocument);}catch{/* External documents keep their own policy. */}};
 doc.addEventListener('load',event=>{if(event.target?.tagName==='IFRAME')child(event.target);},true);
 for(const frame of doc.querySelectorAll('iframe'))child(frame);
}
