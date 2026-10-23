export const PET_POSES=['front','diagonal-front','side','diagonal-back','back'];
export function petImage(id,pose='front'){
 const root=import.meta.env?.BASE_URL||'/';
 if(!PET_POSES.includes(pose))pose='front';
 if(pose==='front')return `${root}pets/${id}-standing-v2.png`;
 const version=pose.startsWith('diagonal')?(id==='kuki'?'v3':'v1'):'v3';
 return `${root}pets/${id}-${pose}-${version}.png`;
}
