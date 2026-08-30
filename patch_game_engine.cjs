const fs = require('fs');
let content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

// 1. Import SpawnWarning
content = content.replace(
  "import { Base, Boss, Bullet, Direction, Enemy, Particle, Player, PowerUp, PowerUpType, Wall } from './types';",
  "import { Base, Boss, Bullet, Direction, Enemy, Particle, Player, PowerUp, PowerUpType, Wall, SpawnWarning } from './types';"
);

// 2. Add spawnWarnings array
content = content.replace(
  "  enemies: Enemy[] = [];",
  "  enemies: Enemy[] = [];\n  spawnWarnings: SpawnWarning[] = [];"
);

// 3. Reset spawnWarnings
content = content.replace(
  "    this.enemies = [];",
  "    this.enemies = [];\n    this.spawnWarnings = [];"
);
// Make sure it catches the second one too
content = content.replace(
  "        this.enemies = [];",
  "        this.enemies = [];\n        this.spawnWarnings = [];"
);

// 4. Update spawnEnemyWave check
content = content.replace(
  "      if (this.enemies.length < 3) {",
  "      if (this.enemies.length + this.spawnWarnings.length < 3) {"
);
content = content.replace(
  "      if (this.enemies.length < this.maxActiveEnemies && this.remainingTanks > 0) {",
  "      if ((this.enemies.length + this.spawnWarnings.length) < this.maxActiveEnemies && this.remainingTanks > 0) {"
);

// 5. Update spawnEnemy check occupied
content = content.replace(
  "    const occupied = this.enemies.some(",
  "    const occupied = this.enemies.some(\n      (e) => e.active && Math.abs(e.x - slot.x) < TILE_SIZE && Math.abs(e.y - slot.y) < TILE_SIZE\n    ) || this.spawnWarnings.some(\n"
);
// We will replace the whole spawnEnemy method.

fs.writeFileSync('src/game/GameEngine.ts', content);
