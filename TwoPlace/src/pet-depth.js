import {project} from '../shared/pet-space.js';
export function actorDepth(point){return Math.round(project(point).y*10)+10;}
export function motionPoint(motion,now){const t=Math.min(1,Math.max(0,(now-motion.startedAt)/motion.duration));return {x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};}
