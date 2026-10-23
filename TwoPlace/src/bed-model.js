import {furnishingModel} from './furnishing-model.js';
// Compatibility entry point for the geometric registration checks.
export function bedModel(rotation=0){return furnishingModel('bed',rotation);}
