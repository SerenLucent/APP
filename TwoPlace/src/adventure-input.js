export function bindImmediateAction(button,action){
 // A second touch may never produce a click while the first finger holds the stick.
 button.addEventListener('pointerdown',event=>{if(button.disabled||event.pointerType==='mouse'&&event.button!==0)return;event.preventDefault();action();});
 // Keyboard and assistive activation still use click, without firing twice after a pointer press.
 button.addEventListener('click',event=>{if(event.detail===0&&!button.disabled)action();});
}
export function bindMovementPointer(element,move,release){
 let pointer=null;
 element.addEventListener('pointerdown',event=>{if(pointer!==null||event.pointerType==='mouse'&&event.button!==0)return;event.preventDefault();pointer=event.pointerId;element.setPointerCapture(pointer);move(event);});
 element.addEventListener('pointermove',event=>{if(event.pointerId===pointer)move(event);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(type,event=>{if(event.pointerId!==pointer)return;pointer=null;release();});
}
// Keep browser gestures out of gameplay, while allowing long dialogs to scroll normally.
export function installGameTouchGuards(doc){
 const controller=new AbortController();
 const guard=event=>{if(event.target?.closest?.('dialog'))return;if(event.cancelable)event.preventDefault();};
 for(const type of ['touchmove','gesturestart','gesturechange','gestureend','contextmenu'])doc.addEventListener(type,guard,{passive:false,signal:controller.signal});
 return ()=>controller.abort();
}
