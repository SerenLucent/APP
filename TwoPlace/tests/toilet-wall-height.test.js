import test from 'node:test';
import assert from 'node:assert/strict';
import {wallMountY,wallLayer} from '../src/wall-decor-view.js';
import {wallSlotAllowed,wallRows} from '../shared/wall-decor.js';
test('toilet mirrors use the lowered single mounting line for old and new placements',()=>{
 assert.deepEqual(wallRows('toilet'),[1]);
 for(const row of [0,1,2]){assert.equal(wallMountY('toilet',row),15);const html=wallLayer({items:[{id:'mirror',product:'bathMirror',space:'toilet',wallSide:'right',wallCol:2,wallRow:row}]},'toilet');assert.ok(html.includes('translate(23.5 15)'));}
 const item={id:'new',product:'bathMirror'};
 assert.equal(wallSlotAllowed([],item,'toilet','right',2,0),false);
 assert.equal(wallSlotAllowed([],item,'toilet','right',2,1),true);
 assert.equal(wallSlotAllowed([],item,'toilet','right',2,2),false);
 assert.equal(wallMountY('momoRoom',0),1);assert.equal(wallMountY('shower',2),17);
});

test('toilet hanging positions advance one floor cell and prevent overlapping fixtures and the door',()=>{
 const item={id:'new',product:'bathMirror'};
 assert.equal(wallSlotAllowed([],item,'toilet','left',1.2,1),true);
 assert.equal(wallSlotAllowed([],item,'toilet','left',1.4,1),true);
 assert.equal(wallSlotAllowed([],item,'toilet','left',1.3,1),false);
 assert.equal(wallSlotAllowed([],item,'toilet','right',.8,1),false);
 const items=[{id:'old',product:'bathMirror',space:'toilet',wallSide:'left',wallCol:1,wallRow:0}];
 assert.equal(wallSlotAllowed(items,item,'toilet','left',1.2,1),false);
 assert.equal(wallSlotAllowed(items,item,'toilet','left',2,1),true);
});
