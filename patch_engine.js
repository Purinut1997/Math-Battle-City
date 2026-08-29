const fs = require('fs');
let content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

// 1. Add TARGET_POPUP to states
content = content.replace(
  "state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_TRANSITION' = 'MENU';",
  "state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY' | 'LEVEL_TRANSITION' | 'TARGET_POPUP' = 'MENU';"
);

// 2. Add methods
content = content.replace(
  "  togglePause() {",
  `  pauseForTarget() {
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

  togglePause() {`
);

fs.writeFileSync('src/game/GameEngine.ts', content);
