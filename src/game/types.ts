export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Rect {
  speed: number;
  lives: number;
  direction: Direction;
  cooldown: number;
  powerupTime: number;
}

export interface Bullet extends Rect {
  speed: number;
  direction: Direction;
  isPlayer: boolean;
  active: boolean;
  numberValue?: number; // For boss bullet
}

export interface Enemy extends Rect {
  speed: number;
  direction: Direction;
  equation: string;
  isCorrect: boolean;
  enraged: boolean;
  active: boolean;
  type: 'NORMAL' | 'MINION';
  numberValue?: number;
  currentMoveDir?: Direction;
  moveSteps?: number;
}

export interface Boss extends Rect {
  hp: number;
  maxHp: number;
  equation: string;
  targetX: number;
  moveDirection: number;
  active: boolean;
  cooldown: number;
}

export interface Base extends Rect {
  hp: number;
  targetNumber: number;
  shieldTime: number;
}

export type WallType = 'BRICK' | 'STEEL' | 'BUSH' | 'WATER';

export interface Wall extends Rect {
  type: WallType;
  active: boolean;
}

export type PowerUpType = 'PI_BOMB' | 'PROTRACTOR' | 'CALCULATOR' | 'PLUS_LIFE';

export interface PowerUp extends Rect {
  type: PowerUpType;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
