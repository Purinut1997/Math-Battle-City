const fs = require('fs');
let content = fs.readFileSync('src/game/types.ts', 'utf8');
content += `\nexport interface SpawnWarning {\n  x: number;\n  y: number;\n  enemyToSpawn: Enemy;\n  timer: number;\n  maxTimer: number;\n}\n`;
fs.writeFileSync('src/game/types.ts', content);
