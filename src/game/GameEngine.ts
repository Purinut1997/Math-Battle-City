import { Base, Boss, Bullet, Direction, Enemy, Particle, Player, PowerUp, PowerUpType, Wall } from './types';
import {
  ARENA_OFFSET_X,
  ARENA_OFFSET_Y,
  ARENA_SIZE,
  BULLET_SPEED,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CORRECT_KILL_SCORE,
  ENEMY_SPEED,
  GRID_SIZE,
  LEVEL_KILLS_REQUIRED,
  MAX_LEVELS,
  MAX_LIVES,
  PLAYER_SPEED,
  SIDEBAR_WIDTH,
  SIDEBAR_X,
  TILE_SIZE,
  WRONG_KILL_PENALTY,
} from './constants';
import {
  BOSS_EQUATION,
  BOSS_TARGET_X,
  generateEquationSet,
  getProblemForLevel,
  getTierForLevel,
  MINION_NUMBERS,
  getKillsRequiredForLevel,
} from './mathLogic';
import { MAP_LAYOUTS } from './mapLayouts';
import { PixelRenderer } from './renderer';
import { sounds } from './sound';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  lastTime: number = 0;
  animTick: number = 0;

  player: Player;
  base: Base;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  walls: Wall[] = [];
  powerups: PowerUp[] = [];
  particles: Particle[] = [];
  boss: Boss | null = null;

  level: number = 1;
  score: number = 0;
  kills: number = 0;
  state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_TRANSITION' | 'TARGET_POPUP' = 'MENU';

  targetNumber: number = 0;
  remainingTanks: number = 0;

  keys: { [key: string]: boolean } = {};
  timeFreeze: number = 0;
  respawnInvulnerability: number = 0;

  spawnTimer: number = 0;
  maxActiveEnemies: number = 4;

  onStateChange?: (state: string) => void;
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onTargetChange?: (target: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;

    // Base at grid (6, 12)
    const baseGridX = 6;
    const baseGridY = 12;
    this.base = {
      x: ARENA_OFFSET_X + baseGridX * TILE_SIZE,
      y: ARENA_OFFSET_Y + baseGridY * TILE_SIZE,
      width: TILE_SIZE,
      height: TILE_SIZE,
      hp: 1,
      targetNumber: 0,
      shieldTime: 0,
    };

    this.player = this.createPlayer();
    this.setupInputs();
  }

  getValidPlayerSpawn(): { x: number, y: number } {
    let spawnCol = 4;
    let spawnRow = 12;
    
    // Find empty spot near the base
    const layout = MAP_LAYOUTS[this.level] || MAP_LAYOUTS[1];
    let found = false;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const colsToTry = [4, 8, 3, 9, 2, 10, 1, 11, 0, 12];
      for (const c of colsToTry) {
        if (layout[r] && layout[r][c] === 0) {
          spawnRow = r;
          spawnCol = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    return {
      x: ARENA_OFFSET_X + spawnCol * TILE_SIZE,
      y: ARENA_OFFSET_Y + spawnRow * TILE_SIZE
    };
  }

  createPlayer(): Player {
    const spawn = this.getValidPlayerSpawn();
    return {
      x: spawn.x,
      y: spawn.y,
      width: TILE_SIZE - 4,
      height: TILE_SIZE - 4,
      speed: PLAYER_SPEED,
      lives: MAX_LIVES,
      direction: 'UP',
      cooldown: 0,
      powerupTime: 0,
    };
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.key] = true;

      if ((e.key === ' ' || e.key === 'Enter') && this.state === 'TARGET_POPUP') {
        e.preventDefault();
        this.resumeFromTarget();
      } else if (e.key === ' ' && this.state === 'PLAYING') {
        e.preventDefault();
        this.shoot();
      } else if ((e.key === 'p' || e.key === 'P') && (this.state === 'PLAYING' || this.state === 'PAUSED')) {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.key] = false;
    });
  }

  // Virtual inputs for mobile and on-screen controls
  setVirtualKey(key: string, pressed: boolean) {
    this.keys[key.toLowerCase()] = pressed;
    this.keys[key] = pressed;

    if (pressed && key === ' ' && this.state === 'TARGET_POPUP') {
      this.resumeFromTarget();
    } else if (pressed && key === ' ' && this.state === 'PLAYING') {
      this.shoot();
    }
  }

  pauseForTarget() {
    if (this.state === 'PLAYING') {
      this.state = 'TARGET_POPUP';
      if (this.onStateChange) this.onStateChange(this.state);
    }
  }

  resumeFromTarget() {
    if (this.state === 'TARGET_POPUP') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      if (this.onStateChange) this.onStateChange(this.state);
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      if (this.onStateChange) this.onStateChange(this.state);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      if (this.onStateChange) this.onStateChange(this.state);
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  startGame(level: number = 1, lives: number = 3, score: number = 0) {
    this.level = Math.max(1, Math.min(level, MAX_LEVELS));
    this.score = score;
    this.player = this.createPlayer();
    this.player.lives = lives;
    this.state = 'TARGET_POPUP';
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.kills = 0;
    this.remainingTanks = getKillsRequiredForLevel(this.level);
    this.timeFreeze = 0;
    this.respawnInvulnerability = 2.5; // 2.5s spawn shield
    this.spawnTimer = 0.5;

    if (this.onLevelChange) this.onLevelChange(this.level);
    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onLivesChange) this.onLivesChange(this.player.lives);
    if (this.onStateChange) this.onStateChange(this.state);

    this.loadLevel();
    sounds.playStageStart();

    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  loadLevel() {
    this.walls = [];
    this.boss = null;
    this.base.hp = 1;
    this.base.shieldTime = 0;
    this.kills = 0;
    this.remainingTanks = getKillsRequiredForLevel(this.level);

    // Load Map Layout
    const layout = MAP_LAYOUTS[this.level] || MAP_LAYOUTS[1];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = layout[r][c];
        const wx = ARENA_OFFSET_X + c * TILE_SIZE;
        const wy = ARENA_OFFSET_Y + r * TILE_SIZE;

        if (val === 1) {
          this.walls.push({ x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE, type: 'BRICK', active: true });
        } else if (val === 2) {
          this.walls.push({ x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE, type: 'STEEL', active: true });
        } else if (val === 3) {
          this.walls.push({ x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE, type: 'BUSH', active: true });
        } else if (val === 4) {
          this.walls.push({ x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE, type: 'WATER', active: true });
        }
      }
    }

    // Set Math Problem for Level
    if (this.level === 10) {
      this.setupBossLevel();
    } else {
      const problem = getProblemForLevel(this.level);
      this.targetNumber = problem.target;
      this.base.targetNumber = this.targetNumber;
      if (this.onTargetChange) this.onTargetChange(this.targetNumber);
    }
  }

  setupBossLevel() {
    this.targetNumber = BOSS_TARGET_X;
    this.base.targetNumber = this.targetNumber;
    if (this.onTargetChange) this.onTargetChange(this.targetNumber);

    this.boss = {
      x: ARENA_OFFSET_X + (ARENA_SIZE - 120) / 2,
      y: ARENA_OFFSET_Y + 16,
      width: 120,
      height: 70,
      hp: 5,
      maxHp: 5,
      equation: BOSS_EQUATION,
      targetX: BOSS_TARGET_X,
      moveDirection: 1,
      active: true,
      cooldown: 1.5,
    };
  }

  spawnEnemyWave() {
    if (this.level === 10) {
      // Boss stage spawns minion tanks with plain numbers
      if (this.enemies.length < 3) {
        const num = MINION_NUMBERS[Math.floor(Math.random() * MINION_NUMBERS.length)];
        this.spawnEnemy(num.toString(), num === BOSS_TARGET_X, 'MINION', num);
      }
    } else {
      if (this.enemies.length < this.maxActiveEnemies && this.remainingTanks > 0) {
        const problem = getProblemForLevel(this.level);
        const eqSet = generateEquationSet(problem);

        // Guarantee at least 1 correct equation if none on screen
        const hasCorrectOnScreen = this.enemies.some((e) => e.active && e.isCorrect);
        const spawnCorrect = !hasCorrectOnScreen || Math.random() < 0.45;

        if (spawnCorrect) {
          this.spawnEnemy(eqSet.correct, true, 'NORMAL');
        } else {
          const wrongEq = eqSet.wrongs[Math.floor(Math.random() * eqSet.wrongs.length)];
          this.spawnEnemy(wrongEq, false, 'NORMAL');
        }
      }
    }
  }

  spawnEnemy(equation: string, isCorrect: boolean, type: 'NORMAL' | 'MINION', numberValue?: number) {
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
    this.createExplosion(slot.x + TILE_SIZE / 2, slot.y + TILE_SIZE / 2, '#ffffff', 8);
  }

  shoot() {
    if (this.player.cooldown > 0 || this.state !== 'PLAYING') return;
    this.player.cooldown = 0.35; // Fire rate cooldown

    const pw = this.player.width;
    const ph = this.player.height;
    let bx = this.player.x + pw / 2 - 3;
    let by = this.player.y + ph / 2 - 3;

    if (this.player.direction === 'UP') by = this.player.y - 6;
    if (this.player.direction === 'DOWN') by = this.player.y + ph + 2;
    if (this.player.direction === 'LEFT') bx = this.player.x - 6;
    if (this.player.direction === 'RIGHT') bx = this.player.x + pw + 2;

    this.bullets.push({
      x: bx,
      y: by,
      width: 6,
      height: 6,
      speed: BULLET_SPEED,
      direction: this.player.direction,
      isPlayer: true,
      active: true,
    });

    sounds.playShoot();
  }

  shootBoss() {
    if (!this.boss || this.boss.cooldown > 0) return;
    this.boss.cooldown = 2.0;

    const bx1 = this.boss.x + 24;
    const bx2 = this.boss.x + this.boss.width - 32;
    const by = this.boss.y + this.boss.height;

    this.bullets.push({
      x: bx1,
      y: by,
      width: 8,
      height: 8,
      speed: BULLET_SPEED * 0.7,
      direction: 'DOWN',
      isPlayer: false,
      active: true,
    });

    this.bullets.push({
      x: bx2,
      y: by,
      width: 8,
      height: 8,
      speed: BULLET_SPEED * 0.7,
      direction: 'DOWN',
      isPlayer: false,
      active: true,
    });

    sounds.playShoot();
  }

  checkCollision(r1: { x: number; y: number; width: number; height: number }, r2: { x: number; y: number; width: number; height: number }): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  createExplosion(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  dropPowerup(x: number, y: number) {
    if (Math.random() > 0.25) return; // 25% drop rate on correct kill
    const types: PowerUpType[] = ['PI_BOMB', 'PROTRACTOR', 'CALCULATOR', 'PLUS_LIFE'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: Math.max(ARENA_OFFSET_X + 10, Math.min(ARENA_OFFSET_X + ARENA_SIZE - 38, x)),
      y: Math.max(ARENA_OFFSET_Y + 10, Math.min(ARENA_OFFSET_Y + ARENA_SIZE - 38, y)),
      width: 28,
      height: 28,
      type,
      active: true,
    });
  }

  applyPowerup(type: PowerUpType) {
    sounds.playPowerup();

    if (type === 'PLUS_LIFE') {
      this.player.lives = Math.min(MAX_LIVES, this.player.lives + 1);
      if (this.onLivesChange) this.onLivesChange(this.player.lives);
    } else if (type === 'PI_BOMB') {
      // Clear all wrong-equation tanks on screen instantly
      this.enemies.forEach((e) => {
        if (!e.isCorrect && e.active) {
          e.active = false;
          this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ff3333');
        }
      });
    } else if (type === 'CALCULATOR') {
      this.timeFreeze = 5.0; // 5 seconds freeze
    } else if (type === 'PROTRACTOR') {
      this.base.shieldTime = 15.0; // 15 seconds shield

      // Surround base with Steel
      const baseCol = 6;
      const baseRow = 12;
      const surroundingCoords = [
        { c: baseCol - 1, r: baseRow },
        { c: baseCol + 1, r: baseRow },
        { c: baseCol - 1, r: baseRow - 1 },
        { c: baseCol, r: baseRow - 1 },
        { c: baseCol + 1, r: baseRow - 1 },
      ];

      surroundingCoords.forEach((coord) => {
        const wx = ARENA_OFFSET_X + coord.c * TILE_SIZE;
        const wy = ARENA_OFFSET_Y + coord.r * TILE_SIZE;
        const existingWall = this.walls.find((w) => w.x === wx && w.y === wy);
        if (existingWall) {
          existingWall.type = 'STEEL';
          existingWall.active = true;
        } else {
          this.walls.push({ x: wx, y: wy, width: TILE_SIZE, height: TILE_SIZE, type: 'STEEL', active: true });
        }
      });
    }
  }

  die() {
    if (this.respawnInvulnerability > 0) return;

    this.player.lives--;
    sounds.playGameOver();
    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#e8a000', 20);

    if (this.onLivesChange) this.onLivesChange(this.player.lives);

    if (this.player.lives <= 0) {
      this.state = 'GAMEOVER';
      if (this.onStateChange) this.onStateChange(this.state);
    } else {
      // Respawn player
      const p = this.createPlayer();
      this.player.x = p.x;
      this.player.y = p.y;
      this.player.direction = 'UP';
      this.respawnInvulnerability = 3.0; // 3 seconds shield on respawn
    }
  }

  update(dt: number) {
    if (this.state !== 'PLAYING') return;

    this.animTick++;

    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    if (this.respawnInvulnerability > 0) this.respawnInvulnerability -= dt;
    if (this.timeFreeze > 0) this.timeFreeze -= dt;
    if (this.base.shieldTime > 0) this.base.shieldTime -= dt;

    // Enemy Spawner
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.6;
      this.spawnEnemyWave();
    }

    // Player Movement
    let dx = 0;
    let dy = 0;
    if (this.keys['arrowup'] || this.keys['w'] || this.keys['w_btn']) {
      dy = -1;
      this.player.direction = 'UP';
    } else if (this.keys['arrowdown'] || this.keys['s'] || this.keys['s_btn']) {
      dy = 1;
      this.player.direction = 'DOWN';
    } else if (this.keys['arrowleft'] || this.keys['a'] || this.keys['a_btn']) {
      dx = -1;
      this.player.direction = 'LEFT';
    } else if (this.keys['arrowright'] || this.keys['d'] || this.keys['d_btn']) {
      dx = 1;
      this.player.direction = 'RIGHT';
    }

    if (dx !== 0 || dy !== 0) {
      // Auto-align logic (Corner slipping)
      if (dx !== 0) {
        const centerY = this.player.y + this.player.height / 2 - ARENA_OFFSET_Y;
        const gridY = Math.floor(centerY / TILE_SIZE);
        const targetY = ARENA_OFFSET_Y + gridY * TILE_SIZE + (TILE_SIZE - this.player.height) / 2;
        const diffY = targetY - this.player.y;
        if (Math.abs(diffY) > 0 && Math.abs(diffY) <= 15) {
          this.player.y += Math.sign(diffY) * Math.min(Math.abs(diffY), this.player.speed * dt);
        }
      } else if (dy !== 0) {
        const centerX = this.player.x + this.player.width / 2 - ARENA_OFFSET_X;
        const gridX = Math.floor(centerX / TILE_SIZE);
        const targetX = ARENA_OFFSET_X + gridX * TILE_SIZE + (TILE_SIZE - this.player.width) / 2;
        const diffX = targetX - this.player.x;
        if (Math.abs(diffX) > 0 && Math.abs(diffX) <= 15) {
          this.player.x += Math.sign(diffX) * Math.min(Math.abs(diffX), this.player.speed * dt);
        }
      }

      let nx = this.player.x + dx * this.player.speed * dt;
      let ny = this.player.y + dy * this.player.speed * dt;

      // Arena bounds
      nx = Math.max(ARENA_OFFSET_X, Math.min(ARENA_OFFSET_X + ARENA_SIZE - this.player.width, nx));
      ny = Math.max(ARENA_OFFSET_Y, Math.min(ARENA_OFFSET_Y + ARENA_SIZE - this.player.height, ny));

      // Wall collision with smaller margin hitbox for slipping
      const margin = 4;
      const pRect = { 
        x: nx + margin, 
        y: ny + margin, 
        width: this.player.width - margin * 2, 
        height: this.player.height - margin * 2 
      };
      
      let hitWall = false;

      for (const w of this.walls) {
        if (w.active && w.type !== 'BUSH' && this.checkCollision(pRect, w)) {
          hitWall = true;
          break;
        }
      }

      // Base collision
      if (this.checkCollision(pRect, this.base)) {
        hitWall = true;
      }

      if (!hitWall) {
        this.player.x = nx;
        this.player.y = ny;
      }
    }

    // Update Bullets
    for (const b of this.bullets) {
      if (!b.active) continue;

      if (b.direction === 'UP') b.y -= b.speed * dt;
      if (b.direction === 'DOWN') b.y += b.speed * dt;
      if (b.direction === 'LEFT') b.x -= b.speed * dt;
      if (b.direction === 'RIGHT') b.x += b.speed * dt;

      // Out of arena bounds
      if (
        b.x < ARENA_OFFSET_X ||
        b.x > ARENA_OFFSET_X + ARENA_SIZE ||
        b.y < ARENA_OFFSET_Y ||
        b.y > ARENA_OFFSET_Y + ARENA_SIZE
      ) {
        b.active = false;
        continue;
      }

      // Bullet hit Walls (Bullets pass freely over water and bush)
      for (const w of this.walls) {
        if (w.active && w.type !== 'WATER' && w.type !== 'BUSH' && this.checkCollision(b, w)) {
          b.active = false;
          sounds.playHit();
          if (w.type === 'BRICK') {
            w.active = false; // Destroy brick
            this.createExplosion(b.x, b.y, '#b84418', 6);
          } else {
            this.createExplosion(b.x, b.y, '#ffffff', 4);
          }
        }
      }

      if (b.isPlayer) {
        // Bullet hit Boss
        if (this.boss && this.boss.active && this.checkCollision(b, this.boss)) {
          b.active = false;
          if (b.numberValue === this.boss.targetX) {
            this.boss.hp--;
            this.score += CORRECT_KILL_SCORE * 2;
            sounds.playCorrectExplosion();
            this.createExplosion(b.x, b.y, '#00ffcc', 16);

            if (this.boss.hp <= 0) {
              this.boss.active = false;
              this.state = 'VICTORY';
              sounds.playStageStart();
              if (this.onStateChange) this.onStateChange(this.state);
            }
          } else {
            sounds.playHit();
            this.createExplosion(b.x, b.y, '#888888', 6);
          }
          if (this.onScoreChange) this.onScoreChange(this.score);
        }

        // Bullet hit Enemy
        for (const e of this.enemies) {
          if (e.active && this.checkCollision(b, e)) {
            b.active = false;

            if (this.level === 10 && e.type === 'MINION') {
              // Collect Number Bullet from minion
              this.bullets.push({
                x: this.player.x + this.player.width / 2 - 4,
                y: this.player.y + this.player.height / 2 - 4,
                width: 10,
                height: 10,
                speed: BULLET_SPEED * 1.1,
                direction: this.player.direction,
                isPlayer: true,
                active: true,
                numberValue: e.numberValue,
              });

              e.active = false;
              sounds.playCorrectExplosion();
              this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#00e5ff', 12);
            } else {
              if (e.isCorrect) {
                // Correct Kill
                e.active = false;
                this.score += CORRECT_KILL_SCORE;
                this.kills++;
                this.remainingTanks = Math.max(0, this.remainingTanks - 1);

                sounds.playCorrectExplosion();
                this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ffcc00', 16);
                this.dropPowerup(e.x, e.y);

                if (this.kills >= getKillsRequiredForLevel(this.level)) {
                  this.levelComplete();
                }
              } else {
                // Wrong Kill: Penalty and Enrage
                e.enraged = true;
                e.speed = ENEMY_SPEED * 2.0; // 2x faster towards player's base
                this.score = Math.max(0, this.score - WRONG_KILL_PENALTY);

                sounds.playWrongHit();
                this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ff1111', 12);
              }
            }

            if (this.onScoreChange) this.onScoreChange(this.score);
          }
        }
      } else {
        // Enemy bullet hit Player
        if (this.checkCollision(b, this.player)) {
          b.active = false;
          this.die();
        }

        // Enemy bullet hit Base
        if (this.checkCollision(b, this.base)) {
          b.active = false;
          if (this.base.shieldTime <= 0) {
            this.base.hp = 0;
            this.state = 'GAMEOVER';
            sounds.playGameOver();
            this.createExplosion(this.base.x + this.base.width / 2, this.base.y + this.base.height / 2, '#ff4400', 25);
            if (this.onStateChange) this.onStateChange(this.state);
          } else {
            sounds.playHit();
            this.createExplosion(b.x, b.y, '#00ffff', 8);
          }
        }
      }
    }

    // Update Enemies
    if (this.timeFreeze <= 0) {
      for (const e of this.enemies) {
        if (!e.active) continue;

        let stepX = 0;
        let stepY = 0;

        if (e.enraged) {
          // Target Base directly if enraged
          const targetX = this.base.x + this.base.width / 2 - e.width / 2;
          const targetY = this.base.y;
          const diffX = targetX - e.x;
          const diffY = targetY - e.y;
          const dist = Math.sqrt(diffX * diffX + diffY * diffY);

          if (dist > 0) {
            stepX = (diffX / dist) * e.speed * dt;
            stepY = (diffY / dist) * e.speed * dt;
          }
        } else {
          // Wander Logic
          if (!e.currentMoveDir || !e.moveSteps || e.moveSteps <= 0) {
            const dirs: ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            
            // Randomly prefer heading DOWN if still in top half
            if (Math.random() < 0.4 && e.y < ARENA_OFFSET_Y + ARENA_SIZE / 2) {
              e.currentMoveDir = 'DOWN';
            } else {
              e.currentMoveDir = dirs[Math.floor(Math.random() * dirs.length)];
            }
            e.moveSteps = Math.random() * 80 + 40; // 40-120 pixels before changing dir
          }

          e.moveSteps -= e.speed * dt;
          if (e.currentMoveDir === 'UP') stepY = -e.speed * dt;
          if (e.currentMoveDir === 'DOWN') stepY = e.speed * dt;
          if (e.currentMoveDir === 'LEFT') stepX = -e.speed * dt;
          if (e.currentMoveDir === 'RIGHT') stepX = e.speed * dt;
        }

        if (stepX !== 0 || stepY !== 0) {
          let nx = e.x + stepX;
          let ny = e.y + stepY;

          // Auto-align logic for enemies to slide into corridors smoothly (Corner slipping)
          if (stepX !== 0) {
            const centerY = e.y + e.height / 2 - ARENA_OFFSET_Y;
            const gridY = Math.floor(centerY / TILE_SIZE);
            const targetY = ARENA_OFFSET_Y + gridY * TILE_SIZE + (TILE_SIZE - e.height) / 2;
            const diffY = targetY - e.y;
            if (Math.abs(diffY) > 0 && Math.abs(diffY) <= 15) {
              e.y += Math.sign(diffY) * Math.min(Math.abs(diffY), e.speed * dt);
            }
          } else if (stepY !== 0) {
            const centerX = e.x + e.width / 2 - ARENA_OFFSET_X;
            const gridX = Math.floor(centerX / TILE_SIZE);
            const targetX = ARENA_OFFSET_X + gridX * TILE_SIZE + (TILE_SIZE - e.width) / 2;
            const diffX = targetX - e.x;
            if (Math.abs(diffX) > 0 && Math.abs(diffX) <= 15) {
              e.x += Math.sign(diffX) * Math.min(Math.abs(diffX), e.speed * dt);
            }
          }

          // Wall collision for enemy with smaller margin - separate X and Y to slide
          const margin = 4;
          let hitX = false;
          for (const w of this.walls) {
            if (w.active && w.type !== 'BUSH' && this.checkCollision({ x: nx + margin, y: e.y + margin, width: e.width - margin * 2, height: e.height - margin * 2 }, w)) {
              hitX = true;
              break;
            }
          }
          
          let hitY = false;
          for (const w of this.walls) {
            if (w.active && w.type !== 'BUSH' && this.checkCollision({ x: e.x + margin, y: ny + margin, width: e.width - margin * 2, height: e.height - margin * 2 }, w)) {
              hitY = true;
              break;
            }
          }

          if (!hitX) e.x = Math.max(ARENA_OFFSET_X, Math.min(ARENA_OFFSET_X + ARENA_SIZE - e.width, nx));
          if (!hitY) e.y = Math.max(ARENA_OFFSET_Y, Math.min(ARENA_OFFSET_Y + ARENA_SIZE - e.height, ny));
          
          // Force a new direction if stuck
          if (!e.enraged && (hitX || hitY || e.x <= ARENA_OFFSET_X || e.x >= ARENA_OFFSET_X + ARENA_SIZE - e.width || e.y <= ARENA_OFFSET_Y || e.y >= ARENA_OFFSET_Y + ARENA_SIZE - e.height)) {
             e.moveSteps = 0; // Trigger recalculation next frame
          }

          // Jiggle if completely stuck in a corner
          if (hitX && hitY) {
            e.x += (Math.random() - 0.5) * 2;
            e.y += (Math.random() - 0.5) * 2;
          }

          // Set direction for sprite
          if (Math.abs(stepX) > Math.abs(stepY)) {
            e.direction = stepX > 0 ? 'RIGHT' : 'LEFT';
          } else {
            e.direction = stepY > 0 ? 'DOWN' : 'UP';
          }
        }

        // Enemy collision with Player
        if (this.checkCollision(e, this.player)) {
          e.active = false;
          this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#ff3300', 16);
          this.die();
        }

        // Enemy collision with Base
        if (this.checkCollision(e, this.base)) {
          e.active = false;
          if (this.base.shieldTime <= 0) {
            this.base.hp = 0;
            this.state = 'GAMEOVER';
            sounds.playGameOver();
            this.createExplosion(this.base.x + this.base.width / 2, this.base.y + this.base.height / 2, '#ff4400', 30);
            if (this.onStateChange) this.onStateChange(this.state);
          } else {
            sounds.playHit();
            this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, '#00ffff', 10);
          }
        }
      }

      // Boss Logic
      if (this.boss && this.boss.active) {
        this.boss.x += this.boss.moveDirection * ENEMY_SPEED * 1.2 * dt;
        if (this.boss.x < ARENA_OFFSET_X + 10) {
          this.boss.x = ARENA_OFFSET_X + 10;
          this.boss.moveDirection = 1;
        }
        if (this.boss.x + this.boss.width > ARENA_OFFSET_X + ARENA_SIZE - 10) {
          this.boss.x = ARENA_OFFSET_X + ARENA_SIZE - 10 - this.boss.width;
          this.boss.moveDirection = -1;
        }

        if (this.boss.cooldown > 0) this.boss.cooldown -= dt;
        if (this.boss.cooldown <= 0) {
          this.shootBoss();
        }
      }
    }

    // Powerup Pickup
    for (const p of this.powerups) {
      if (!p.active) continue;
      if (this.checkCollision(p, this.player)) {
        p.active = false;
        this.applyPowerup(p.type);
      }
    }

    // Particles
    for (const p of this.particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Cleanup
    this.bullets = this.bullets.filter((b) => b.active);
    this.enemies = this.enemies.filter((e) => e.active);
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
    this.powerups = this.powerups.filter((p) => p.active);
  }

  levelComplete() {
    this.state = 'LEVEL_TRANSITION';
    sounds.playStageStart();
    if (this.onStateChange) this.onStateChange(this.state);

    setTimeout(() => {
      this.level++;
      if (this.level > MAX_LEVELS) {
        this.state = 'VICTORY';
        if (this.onStateChange) this.onStateChange(this.state);
      } else {
        this.state = 'TARGET_POPUP';
        this.kills = 0;
        this.remainingTanks = getKillsRequiredForLevel(this.level);
        this.enemies = [];
        this.bullets = [];
        this.powerups = [];
        this.respawnInvulnerability = 2.5;

        // Reset player position for the new level
        const spawn = this.getValidPlayerSpawn();
        this.player.x = spawn.x;
        this.player.y = spawn.y;
        this.player.direction = 'UP';

        if (this.onLevelChange) this.onLevelChange(this.level);
        if (this.onStateChange) this.onStateChange(this.state);
        this.loadLevel();
      }
    }, 2800);
  }

  draw() {
    // 1. Draw NES Outer Arcade Bezel Frame
    this.ctx.fillStyle = '#636363'; // NES Classic Frame Gray
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bevel highlights
    this.ctx.fillStyle = '#8e8e8e';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, 4);
    this.ctx.fillRect(0, 0, 4, CANVAS_HEIGHT);

    this.ctx.fillStyle = '#303030';
    this.ctx.fillRect(0, CANVAS_HEIGHT - 4, CANVAS_WIDTH, 4);
    this.ctx.fillRect(CANVAS_WIDTH - 4, 0, 4, CANVAS_HEIGHT);

    // 2. Draw Pitch Black Game Arena
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(ARENA_OFFSET_X, ARENA_OFFSET_Y, ARENA_SIZE, ARENA_SIZE);

    // 3. Draw Water Tiles (Beneath Tanks)
    for (const w of this.walls) {
      if (w.active && w.type === 'WATER') {
        PixelRenderer.drawWater(this.ctx, w.x, w.y, w.width, this.animTick);
      }
    }

    // 4. Draw Brick & Steel Tiles
    for (const w of this.walls) {
      if (!w.active || w.type === 'WATER' || w.type === 'BUSH') continue;
      if (w.type === 'BRICK') {
        PixelRenderer.drawBrick(this.ctx, w.x, w.y, w.width);
      } else if (w.type === 'STEEL') {
        PixelRenderer.drawSteel(this.ctx, w.x, w.y, w.width);
      }
    }

    // 5. Draw Base (Phoenix Eagle & Bunker)
    PixelRenderer.drawBase(
      this.ctx,
      this.base.x,
      this.base.y,
      this.base.width,
      this.base.hp <= 0,
      this.base.shieldTime,
      this.targetNumber
    );

    // 6. Draw Powerups
    for (const p of this.powerups) {
      PixelRenderer.drawPowerUp(this.ctx, p.x, p.y, p.type, this.animTick);
    }

    // 7. Draw Player Tank
    if (this.player.lives > 0) {
      PixelRenderer.drawPlayerTank(
        this.ctx,
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.direction,
        this.animTick,
        this.respawnInvulnerability > 0
      );
    }

    // 8. Draw Boss
    if (this.boss && this.boss.active) {
      PixelRenderer.drawBossTank(
        this.ctx,
        this.boss.x,
        this.boss.y,
        this.boss.width,
        this.boss.height,
        this.animTick,
        this.boss.hp,
        this.boss.maxHp,
        this.boss.equation
      );
    }

    // 9. Draw Enemies
    for (const e of this.enemies) {
      PixelRenderer.drawEnemyTank(
        this.ctx,
        e.x,
        e.y,
        e.width,
        e.direction,
        this.animTick,
        e.enraged,
        e.type === 'MINION',
        e.numberValue,
        e.equation
      );
    }

    // 10. Draw Bullets
    for (const b of this.bullets) {
      this.ctx.fillStyle = b.isPlayer ? (b.numberValue ? '#00ffff' : '#ffffff') : '#ff3300';
      this.ctx.fillRect(b.x, b.y, b.width, b.height);

      if (b.numberValue !== undefined) {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(b.numberValue.toString(), b.x + b.width / 2, b.y + b.height / 2 + 3);
      }
    }

    // 11. Draw Bush Tiles (Over Tanks for Camouflage)
    for (const w of this.walls) {
      if (w.active && w.type === 'BUSH') {
        PixelRenderer.drawBush(this.ctx, w.x, w.y, w.width);
      }
    }

    // 12. Draw Particles & Explosions
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      PixelRenderer.drawExplosion(this.ctx, p.x, p.y, progress);
    }

    // Time Freeze visual tint
    if (this.timeFreeze > 0) {
      this.ctx.fillStyle = 'rgba(0, 200, 255, 0.15)';
      this.ctx.fillRect(ARENA_OFFSET_X, ARENA_OFFSET_Y, ARENA_SIZE, ARENA_SIZE);
    }

    // 13. Draw Authentic NES Battle City Right Sidebar (Matching User's Image!)
    this.drawSidebar();
  }

  drawSidebar() {
    const sx = SIDEBAR_X;
    const sy = ARENA_OFFSET_Y;

    // 1. Enemy Tank Icons (2x10 grid, 20 total)
    const totalKillsRequired = getKillsRequiredForLevel(this.level);
    for (let i = 0; i < totalKillsRequired; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const iconX = sx + 24 + col * 28;
      const iconY = sy + 16 + row * 20;

      const isAlive = i < this.remainingTanks;

      if (isAlive) {
        // Black Enemy Tank Icon
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(iconX, iconY + 2, 16, 12);
        this.ctx.fillRect(iconX + 6, iconY, 4, 16);
        this.ctx.fillStyle = '#ff2200';
        this.ctx.fillRect(iconX + 6, iconY + 6, 4, 4); // Center red beacon
      } else {
        // Defeated / Grayed icon
        this.ctx.fillStyle = '#484848';
        this.ctx.fillRect(iconX + 4, iconY + 4, 8, 8);
      }
    }

    // 2. IP (Player 1) Lives Section
    const ipY = sy + 250;
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('I P', sx + 24, ipY);

    // Player Tank Icon & Lives Count
    this.ctx.fillStyle = '#e8a000';
    this.ctx.fillRect(sx + 24, ipY + 8, 16, 14);
    this.ctx.fillRect(sx + 30, ipY + 4, 4, 6); // Barrel
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillText(`${this.player.lives}`, sx + 52, ipY + 22);

    // 3. Stage Flag & Level Number
    const flagY = sy + 320;
    // Flag pole & banner
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(sx + 24, flagY, 4, 28);
    this.ctx.fillStyle = '#e86000'; // Orange Flag
    this.ctx.beginPath();
    this.ctx.moveTo(sx + 28, flagY);
    this.ctx.lineTo(sx + 52, flagY + 8);
    this.ctx.lineTo(sx + 28, flagY + 16);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 18px monospace';
    this.ctx.fillText(`${this.level}`, sx + 52, flagY + 30);

    // 4. Target Number Card Badge
    const targetY = sy + 385;
    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(sx + 10, targetY, 100, 36);
    this.ctx.strokeStyle = '#00ffcc';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(sx + 10, targetY, 100, 36);

    this.ctx.fillStyle = '#00ffcc';
    this.ctx.font = 'bold 10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('เป้าหมายฐาน', sx + 60, targetY + 14);
    this.ctx.font = 'bold 16px monospace';
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fillText(`${this.targetNumber}`, sx + 60, targetY + 30);

    // 5. Watermark at Bottom
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 8px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Created by', sx + 60, sy + 495);
    this.ctx.fillStyle = '#111111';
    this.ctx.font = 'bold 9px monospace';
    this.ctx.fillText('MIKPURINUT', sx + 60, sy + 510);
  }

  loop(timestamp: number) {
    if (this.state !== 'PLAYING' && this.state !== 'LEVEL_TRANSITION') return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }
}
