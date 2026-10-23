import {GRID_SIZE,FLOOR,footprint,toWorld} from './pet-space.js';
// A saved x/y is the CENTER of the floor footprint. (0,0) is the back corner
// of the map. Ground origin, dimensions and visual registration share this grid.
export function furnitureLayout(item){
  const [columns,rows]=footprint(item),position=toWorld(item);
  return {columns,rows,rotation:((item.rotation||0)%360+360)%360,
    origin:{column:position.u*GRID_SIZE-columns/2,row:position.v*GRID_SIZE-rows/2},
    widthPercent:(columns+rows)*FLOOR.halfWidth/GRID_SIZE,
    depthPercent:(columns+rows)*FLOOR.halfHeight/GRID_SIZE};
}

