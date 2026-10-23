import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PET_POSES,petImage} from '../src/pet-sprites.js';
test('all eight-direction source sprites exist with PNG alpha, preserving original cardinal assets',()=>{
 for(const id of ['mochi','kuki'])for(const pose of PET_POSES){const data=fs.readFileSync(new URL('../public'+petImage(id,pose),import.meta.url));assert.equal(data.subarray(1,4).toString(),'PNG');assert.equal(data[25],6);}
 assert.match(petImage('kuki','front'),/standing-v2/);assert.match(petImage('kuki','side'),/side-v3/);assert.match(petImage('kuki','back'),/back-v3/);assert.match(petImage('kuki','diagonal-front'),/diagonal-front-v3/);
});
