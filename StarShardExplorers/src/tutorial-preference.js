export const TUTORIAL_SKIP_KEY='star-shard-explorers:tutorial-skip:lucenty-v1';
export function skipTutorial(storage){try{return storage.getItem(TUTORIAL_SKIP_KEY)==='1';}catch{return false;}}
export function setTutorialSkip(storage,skip){try{storage.setItem(TUTORIAL_SKIP_KEY,skip?'1':'0');}catch{}}
