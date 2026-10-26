// Display aliases only; saved nicknames remain intact.
export function coupleProfiles(s){
 const c=s.characters||{};
 return ['owner','partner'].map(role=>{
  const character=c[role],configured=['momo','kuki'].includes(character);
  return {id:role===s.role?'me':role,name:configured?(character==='momo'?'모모':'쿠키'):s.profiles[role].nickname,color:configured?(character==='momo'?'#f2a9c8':'#9dcff5'):(role==='owner'?'#f5dfd8':'#e6e0ee')};
 });
}
