import fs from 'node:fs';
const files=['shared/adventure-field.js','shared/adventure-skills.js','shared/adventure-mine-field.js','shared/adventure-progression.js'];
const core=files.map(file=>fs.readFileSync(file,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/\bexport /g,'')).join('\n');
fs.writeFileSync('gas/Code.gs','// GENERATED. Run npm run build:gas. StarShardExplorers only.\n'+core+'\n'+fs.readFileSync('gas/Router.gs','utf8')+'\n'+fs.readFileSync('gas/Email.gs','utf8'));
