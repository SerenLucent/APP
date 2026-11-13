export const CLEAR_MINIMUM_MS=3000;
export async function prepareClearReward(prepare,remainingMs=CLEAR_MINIMUM_MS,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms))){
 const [reward]=await Promise.all([prepare(),wait(Math.max(0,remainingMs))]);
 return reward;
}
