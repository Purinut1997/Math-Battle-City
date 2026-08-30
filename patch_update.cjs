const fs = require('fs');
let content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

const oldUpdate = `    // Enemy Spawner
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.6;
      this.spawnEnemyWave();
    }`;

const newUpdate = `    // Enemy Spawner
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.6;
      this.spawnEnemyWave();
    }

    // Process Spawn Warnings
    for (let i = this.spawnWarnings.length - 1; i >= 0; i--) {
      const warning = this.spawnWarnings[i];
      warning.timer -= dt;
      if (warning.timer <= 0) {
        this.enemies.push(warning.enemyToSpawn);
        this.spawnWarnings.splice(i, 1);
        this.createExplosion(warning.x + TILE_SIZE / 2, warning.y + TILE_SIZE / 2, '#ff0000', 15);
      }
    }`;

content = content.replace(oldUpdate, newUpdate);
fs.writeFileSync('src/game/GameEngine.ts', content);
