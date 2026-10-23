import {test} from 'node:test';
import assert from 'node:assert/strict';
import {project,unproject,cellCenter,cellAt,placementAllowed,findPath,walkable,facingForVector,fromWorld,petStepClear,GRID_SIZE} from '../shared/pet-space.js';

test('isometric projection round-trips persisted floor coordinates and cell centers',()=>{
  for(let c=0;c<GRID_SIZE;c++)for(let r=0;r<GRID_SIZE;r++){
    const world=cellCenter(c,r),screen=project(world),result=unproject(screen.x,screen.y);
    assert.ok(Math.abs(world.x-result.x)<1e-8);assert.ok(Math.abs(world.y-result.y)<1e-8);
    assert.deepEqual(cellAt(result),{c,r});
  }
  assert.deepEqual(project({x:10,y:45}),{x:50,y:42});
  assert.deepEqual(project({x:90,y:88}),{x:50,y:86});
});
test('movement selects front, back and mirrored side assets from actual screen direction',()=>{
  assert.deepEqual(facingForVector(0,-10),{pose:'back',flip:1});
  assert.deepEqual(facingForVector(0,10),{pose:'front',flip:1});
  assert.deepEqual(facingForVector(10,3),{pose:'side',flip:1});
  assert.deepEqual(facingForVector(-10,-3),{pose:'side',flip:-1});
});
test('furniture stays inside floor, avoids occupied cells and allows rugs underneath',()=>{
  const plant={id:'plant',product:'plant',space:'home',...cellCenter(3,3)};
  const table={id:'table',product:'table',space:null};
  assert.equal(placementAllowed([plant],table,'home',cellCenter(3,3)),false);
  assert.equal(placementAllowed([plant],table,'home',cellCenter(6,6)),true);
  assert.equal(placementAllowed([],table,'home',cellCenter(0,0)),false);
  assert.equal(placementAllowed([plant],{id:'rug',product:'rug'},'home',cellCenter(3,3)),true);
  const fence={id:'fence',product:'fence'};
  const edge=fromWorld(.045,.5);
  assert.equal(placementAllowed([],fence,'momoRoom',edge,0),false);
  assert.equal(placementAllowed([],fence,'momoRoom',edge,90),true);
  assert.equal(walkable([],'yard',0,0),true);
  assert.equal(placementAllowed([],{id:'plant',product:'plant'},'yard',cellCenter(0,0)),true);
});
test('pets find a route around furniture and never step into blocked cells',()=>{
  const items=[{id:'table',product:'table',space:'home',...cellCenter(3,3)}];
  const path=findPath(items,'home',{c:1,r:1},{c:6,r:6});
  assert.ok(path.length>0);assert.deepEqual(path.at(-1),{c:6,r:6});
  for(const point of path)assert.equal(walkable(items,'home',point.c,point.r),true);
  assert.deepEqual(findPath(items,'home',{c:1,r:1},{c:3,r:3}),[]);
  const rug=[{id:'rug',product:'rug',space:'home',...cellCenter(3,3)}];
  assert.equal(walkable(rug,'home',3,3),true);
});

test('living-room fixtures block furniture and walking while bedrooms stay open',()=>{
  for(const [c,r] of [[GRID_SIZE-4,0],[GRID_SIZE-1,0]]){
    const point=cellCenter(c,r);
    assert.equal(walkable([],'home',c,r),false);
    assert.equal(placementAllowed([],{id:'plant',product:'plant'},'home',point),false);
    assert.equal(walkable([],'momoRoom',c,r),true);
    assert.equal(walkable([],'kukiRoom',c,r),true);
  }
  const path=findPath([],'home',{c:3,r:3},{c:7,r:7});
  assert.ok(path.length);
  for(const {c,r} of path)assert.equal(walkable([],'home',c,r),true);
});


test('pets allow neighboring cells while reserving occupied cells and crossing paths',()=>{
  const p=(c,r)=>cellCenter(c,r);
  assert.equal(petStepClear(p(3,3),p(3,3),[{from:p(3,3),to:p(3,3)}]),false);
  assert.equal(petStepClear(p(3,2),p(3,4),[{from:p(2,3),to:p(4,3)}]),false);
  assert.equal(petStepClear(p(0,0),p(1,0),[{from:p(7,7),to:p(7,7)}]),true);
  const friend={from:p(5,5),to:p(6,5)};
  for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
    const neighbor=p(3+dc,3+dr);
    assert.equal(petStepClear(neighbor,neighbor,[{from:p(3,3),to:p(3,3)}]),true);
    assert.ok(findPath([],'yard',{c:0,r:0},{c:3+dc,r:3+dr},(a,b)=>petStepClear(p(a.c,a.r),p(b.c,b.r),[{from:p(3,3),to:p(3,3)}])).length);
  }
  assert.equal(petStepClear(p(5,4),p(5,5),[friend]),false);
  assert.equal(petStepClear(p(6,4),p(6,5),[friend]),false);
  const canStep=(a,b)=>petStepClear(p(a.c,a.r),p(b.c,b.r),[friend]);
  const route=findPath([],'yard',{c:0,r:0},{c:7,r:0},canStep);
  assert.ok(route.length);
  let previous={c:0,r:0};
  for(const next of route){assert.equal(canStep(previous,next),true);previous=next;}
  assert.ok(findPath([],'yard',{c:0,r:0},{c:4,r:4},canStep).length);
});
test('movement resolves all eight screen directions including projected diagonal axes',()=>{
 const expected=[['side',1],['diagonal-front',1],['front',1],['diagonal-front',-1],['side',-1],['diagonal-back',-1],['back',1],['diagonal-back',1]];
 for(let i=0;i<8;i++){const angle=i*Math.PI/4;assert.deepEqual(facingForVector(Math.cos(angle)*10,Math.sin(angle)*10),{pose:expected[i][0],flip:expected[i][1]});}
 assert.deepEqual(facingForVector(44,22),{pose:'diagonal-front',flip:1});assert.deepEqual(facingForVector(44,-22),{pose:'diagonal-back',flip:1});
});
