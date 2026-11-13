let locks=0,restore;

// Nested character/skill dialogs share one lock and restore the original position.
export function lockDialogScroll(dialog){
 if(locks++===0){
  const body=document.body,root=document.documentElement,x=window.scrollX,y=window.scrollY;
  const saved=body.getAttribute('style'),overflow=root.style.overflow;
  body.style.position='fixed';body.style.top=-y+'px';body.style.left=-x+'px';body.style.width='100%';body.style.overflow='hidden';
  root.style.overflow='hidden';
  restore=()=>{if(saved===null)body.removeAttribute('style');else body.setAttribute('style',saved);root.style.overflow=overflow;window.scrollTo({left:x,top:y,behavior:'instant'});};
 }
 dialog.style.overscrollBehavior='contain';
 let released=false;
 dialog.addEventListener('close',()=>{if(released)return;released=true;if(--locks===0){restore();restore=null;}},{once:true});
}
