const fs = require('fs');
let content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

const oldSpawnEnemy = `  spawnEnemy(equation: string, isCorrect: boolean, type: 'NORMAL' | 'MINION', numberValue?: number) {
    // 3 Spawning Points at the top
    const spawnSlots = [
      { x: ARENA_OFFSET_X + 0 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
      { x: ARENA_OFFSET_X + 6 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
      { x: ARENA_OFFSET_X + 12 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
    ];

    const slot = spawnSlots[Math.floor(Math.random() * spawnSlots.length)];

    // Check if slot is occupied
    const occupied = this.enemies.some(
      (e) => e.active && Math.abs(e.x - slot.x) < TILE_SIZE && Math.abs(e.y - slot.y) < TILE_SIZE
    ) || this.spawnWarnings.some(

      (e) => e.active && Math.abs(e.x - slot.x) < TILE_SIZE && Math.abs(e.y - slot.y) < TILE_SIZE
    );
    if (occupied) return;

    this.enemies.push({
      x: slot.x + 2,
      y: slot.y + 2,
      width: TILE_SIZE - 4,
      height: TILE_SIZE - 4,
      speed: ENEMY_SPEED,
      direction: 'DOWN',
      equation,
      isCorrect,
      enraged: false,
      active: true,
      type,
      numberValue,
    });

    // Spawn Spark effect
    this.createExplosion(slot.x + TILE_SIZE / 2, slot.y + TILE_SIZE / 2, '#00ffff', 10);
  }`;

const newSpawnEnemy = `  spawnEnemy(equation: string, isCorrect: boolean, type: 'NORMAL' | 'MINION', numberValue?: number) {
    // 3 Spawning Points at the top
    const spawnSlots = [
      { x: ARENA_OFFSET_X + 0 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
      { x: ARENA_OFFSET_X + 6 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
      { x: ARENA_OFFSET_X + 12 * TILE_SIZE, y: ARENA_OFFSET_Y + 0 },
    ];

    const slot = spawnSlots[Math.floor(Math.random() * spawnSlots.length)];

    // Check if slot is occupied by an enemy or a warning
    const occupied = this.enemies.some(
      (e) => e.active && Math.abs(e.x - slot.x) < TILE_SIZE && Math.abs(e.y - slot.y) < TILE_SIZE
    ) || this.spawnWarnings.some(
      (w) => Math.abs(w.x - slot.x) < TILE_SIZE && Math.abs(w.y - slot.y) < TILE_SIZE
    );
    if (occupied) return;

    this.spawnWarnings.push({
      x: slot.x + 2,
      y: slot.y + 2,
      timer: 1.5, // 1.5 seconds warning
      maxTimer: 1.5,
      enemyToSpawn: {
        x: slot.x + 2,
        y: slot.y + 2,
        width: TILE_SIZE - 4,
        height: TILE_SIZE - 4,
        speed: ENEMY_SPEED,
        direction: 'DOWN',
        equation,
        isCorrect,
        enraged: false,
        active: true,
        type,
        numberValue,
      }
    });

    // Spawn Spark effect
    this.createExplosion(slot.x + TILE_SIZE / 2, slot.y + TILE_SIZE / 2, '#00ffff', 10);
  }`;

content = content.replace(oldSpawnEnemy, newSpawnEnemy);
fs.writeFileSync('src/game/GameEngine.ts', content);
