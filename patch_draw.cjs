const fs = require('fs');
let content = fs.readFileSync('src/game/GameEngine.ts', 'utf8');

const oldDraw = `    // 9. Draw Enemies`;
const newDraw = `    // 8.5 Draw Spawn Warnings
    for (const w of this.spawnWarnings) {
      // Blink logic (5 blinks over 1.5s -> 0.15s per blink state change)
      const flashState = Math.floor(w.timer / 0.15) % 2 === 0;
      if (flashState) {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        this.ctx.fillRect(w.x - 2, w.y - 2, TILE_SIZE, TILE_SIZE);
        
        // Draw crosshair or warning icon
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(w.x - 2 + TILE_SIZE / 2, w.y - 2);
        this.ctx.lineTo(w.x - 2 + TILE_SIZE / 2, w.y - 2 + TILE_SIZE);
        this.ctx.moveTo(w.x - 2, w.y - 2 + TILE_SIZE / 2);
        this.ctx.lineTo(w.x - 2 + TILE_SIZE, w.y - 2 + TILE_SIZE / 2);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(w.x - 2 + TILE_SIZE / 2, w.y - 2 + TILE_SIZE / 2, TILE_SIZE / 3, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }

    // 9. Draw Enemies`;

content = content.replace(oldDraw, newDraw);
fs.writeFileSync('src/game/GameEngine.ts', content);
