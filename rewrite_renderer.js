const fs = require('fs');

const content = `import { Direction, WallType, PowerUpType } from './types';

export class PixelRenderer {
  // --- ENVIRONMENT / BLOCKS ---

  static drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const half = size / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const bx = x + c * half;
        const by = y + r * half;
        
        ctx.fillStyle = '#111'; // Mortar
        ctx.fillRect(bx, by, half, half);

        // Gradient brick
        const grad = ctx.createLinearGradient(bx, by, bx, by + half);
        grad.addColorStop(0, '#e65c00');
        grad.addColorStop(1, '#803300');
        ctx.fillStyle = grad;
        if(ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(bx + 1, by + 1, half - 2, half - 2, 2);
            ctx.fill();
        } else {
            ctx.fillRect(bx + 1, by + 1, half - 2, half - 2);
        }

        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(bx + 2, by + 2, half - 4, 1);
      }
    }
  }

  static drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Metal gradient
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, '#d1d5db');
    grad.addColorStop(0.5, '#6b7280');
    grad.addColorStop(1, '#374151');
    
    ctx.fillStyle = grad;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, size - 2, size - 2, 4);
        ctx.fill();
    } else {
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    }

    // Bevel edges
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + size - 2);
    ctx.lineTo(x + 2, y + 2);
    ctx.lineTo(x + size - 2, y + 2);
    ctx.stroke();

    ctx.strokeStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + size - 2);
    ctx.lineTo(x + size - 2, y + size - 2);
    ctx.lineTo(x + size - 2, y + 2);
    ctx.stroke();

    // Rivets
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 6, y + 6, 1.5, 0, Math.PI * 2);
    ctx.arc(x + size - 6, y + 6, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 6, y + size - 6, 1.5, 0, Math.PI * 2);
    ctx.arc(x + size - 6, y + size - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawBush(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    const grad = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, size / 1.5);
    grad.addColorStop(0, '#4ade80');
    grad.addColorStop(0.6, '#16a34a');
    grad.addColorStop(1, '#14532d');

    ctx.fillStyle = grad;
    
    // Draw overlapping leaves (circles)
    const leaves = [
      [-6, -6, 12], [6, -6, 12], [-6, 6, 12], [6, 6, 12],
      [0, -10, 10], [-10, 0, 10], [10, 0, 10], [0, 10, 10],
      [0, 0, 16]
    ];

    ctx.beginPath();
    leaves.forEach(([dx, dy, r]) => {
      ctx.moveTo(cx + dx + r, cy + dy);
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    });
    ctx.fill();
    ctx.restore();
  }

  static drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, animTick: number) {
    // Deep water background
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(x, y, size, size);

    // Animated waves
    const shift = (animTick * 0.5) % 20;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let wy = y + 8; wy < y + size; wy += 12) {
      ctx.beginPath();
      for (let wx = x - 20 + (wy%2===0 ? shift : -shift); wx < x + size + 20; wx += 20) {
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy);
      }
      ctx.stroke();
    }
    
    // Water gradient overlay for depth
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, 'rgba(3, 105, 161, 0.2)');
    grad.addColorStop(1, 'rgba(12, 74, 110, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, size, size);

    ctx.restore();
  }

  static drawBase(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    destroyed: boolean,
    shieldTime: number,
    targetNumber: number
  ) {
    const cx = x + size / 2;
    const cy = y + size / 2;

    if (shieldTime > 0) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5;
      ctx.strokeStyle = \`rgba(34, 211, 238, \${0.5 + pulse * 0.5})\`;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 3;
      if(ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x - 4, y - 4, size + 8, size + 8, 8);
          ctx.stroke();
      } else {
          ctx.strokeRect(x - 4, y - 4, size + 8, size + 8);
      }
      ctx.restore();
    }

    // Base pad
    const padGrad = ctx.createLinearGradient(x, y, x, y + size);
    padGrad.addColorStop(0, '#1f2937');
    padGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = padGrad;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 6);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, size, size);
    }
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x+2, y+2, size-4, size-4, 4);
        ctx.stroke();
    } else {
        ctx.strokeRect(x+2, y+2, size-4, size-4);
    }

    if (destroyed) {
      // Destroyed core
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.arc(cx, cy, size/3, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('X', cx, cy);
      return;
    }

    // High-tech Glowing Core
    ctx.save();
    const corePulse = Math.sin(Date.now() / 200) * 5;
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 15 + corePulse;
    
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2.5);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.3, '#2dd4bf');
    coreGrad.addColorStop(1, '#115e59');
    
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14);
    ctx.lineTo(cx + 12, cy - 4);
    ctx.lineTo(cx + 12, cy + 8);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx - 12, cy + 8);
    ctx.lineTo(cx - 12, cy - 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Floating Target Hologram
    ctx.save();
    const hoverY = cy - 32 + Math.sin(Date.now() / 300) * 3;
    const badgeW = size + 40;
    const badgeH = 24;
    const bx = cx - badgeW / 2;
    
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(8, 51, 68, 0.85)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bx, hoverY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(bx, hoverY, badgeW, badgeH);
        ctx.strokeRect(bx, hoverY, badgeW, badgeH);
    }
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#cffafe';
    ctx.font = '900 12px "Orbitron", "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(\`TARGET: \${targetNumber}\`, cx, hoverY + badgeH / 2);
    ctx.restore();
  }

  // --- ENTITIES ---

  static drawPlayerTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    dir: Direction,
    animTick: number,
    hasShield: boolean
  ) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const trackToggle = Math.floor(animTick / 4) % 2;

    if (hasShield) {
      ctx.save();
      const pulse = Math.sin(animTick * 0.2) * 0.5 + 0.5;
      ctx.strokeStyle = \`rgba(250, 204, 21, \${0.5 + pulse * 0.5})\`;
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);
    if (dir === 'RIGHT') ctx.rotate(Math.PI / 2);
    if (dir === 'DOWN') ctx.rotate(Math.PI);
    if (dir === 'LEFT') ctx.rotate(-Math.PI / 2);

    const s = size;
    const hs = s / 2;

    // Treads
    const drawTread = (tx: number) => {
      const grad = ctx.createLinearGradient(tx, -hs, tx + 10, -hs);
      grad.addColorStop(0, '#1a1a1a');
      grad.addColorStop(0.5, '#333');
      grad.addColorStop(1, '#1a1a1a');
      ctx.fillStyle = grad;
      if(ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(tx, -hs, 10, s, 3);
          ctx.fill();
      } else {
          ctx.fillRect(tx, -hs, 10, s);
      }
      
      // Moving tread lines
      ctx.fillStyle = '#666';
      for (let ty = -hs + (trackToggle * 4); ty < hs; ty += 8) {
        ctx.fillRect(tx + 1, ty, 8, 3);
      }
    };
    drawTread(-hs);
    drawTread(hs - 10);

    // Main Hull (Cyberpunk Yellow/Gold)
    const hullGrad = ctx.createLinearGradient(0, -hs + 4, 0, hs - 4);
    hullGrad.addColorStop(0, '#fbbf24');
    hullGrad.addColorStop(0.5, '#d97706');
    hullGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = hullGrad;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-hs + 6, -hs + 4, s - 12, s - 8, 4);
        ctx.fill();
    } else {
        ctx.fillRect(-hs + 6, -hs + 4, s - 12, s - 8);
    }
    ctx.shadowColor = 'transparent';

    // Armor Details
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-hs + 10, -hs + 6, s - 20, 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-hs + 12, hs - 8, s - 24, 2);

    // Glowing Exhaust
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.fillRect(-hs + 8, hs - 4, 4, 2);
    ctx.fillRect(hs - 12, hs - 4, 4, 2);
    ctx.shadowColor = 'transparent';

    // Turret Dome
    const domeGrad = ctx.createRadialGradient(0, -2, 0, 0, 0, 10);
    domeGrad.addColorStop(0, '#fcd34d');
    domeGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cannon Barrel
    const barrelGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    barrelGrad.addColorStop(0, '#9ca3af');
    barrelGrad.addColorStop(0.5, '#f3f4f6');
    barrelGrad.addColorStop(1, '#6b7280');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(-3, -hs - 8, 6, hs + 8);
    
    // Muzzle flash / glowing tip
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-4, -hs - 8, 8, 4);

    ctx.restore();
  }

  static drawEnemyTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    dir: Direction,
    animTick: number,
    isEnraged: boolean,
    isMinion: boolean,
    numberValue: number | undefined,
    equation: string
  ) {
    const cx = x + size / 2;
    const cy = y + size / 2;
    const trackToggle = Math.floor(animTick / 4) % 2;

    ctx.save();
    ctx.translate(cx, cy);
    if (dir === 'RIGHT') ctx.rotate(Math.PI / 2);
    if (dir === 'DOWN') ctx.rotate(Math.PI);
    if (dir === 'LEFT') ctx.rotate(-Math.PI / 2);

    const s = size;
    const hs = s / 2;

    // Treads
    const treadColor = isEnraged ? '#450a0a' : '#1f2937';
    const treadHighlight = isEnraged ? '#ef4444' : '#6b7280';
    const drawTread = (tx: number) => {
      ctx.fillStyle = treadColor;
      if(ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(tx, -hs, 10, s, 3);
          ctx.fill();
      } else {
          ctx.fillRect(tx, -hs, 10, s);
      }
      ctx.fillStyle = treadHighlight;
      for (let ty = -hs + (trackToggle * 4); ty < hs; ty += 8) {
        ctx.fillRect(tx + 1, ty, 8, 3);
      }
    };
    drawTread(-hs);
    drawTread(hs - 10);

    // Hull Colors
    let color1, color2, color3;
    if (isEnraged) {
      color1 = '#f87171'; color2 = '#dc2626'; color3 = '#7f1d1d';
    } else if (isMinion) {
      color1 = '#67e8f9'; color2 = '#06b6d4'; color3 = '#155e75';
    } else {
      color1 = '#d1d5db'; color2 = '#6b7280'; color3 = '#374151';
    }

    const hullGrad = ctx.createLinearGradient(0, -hs + 4, 0, hs - 4);
    hullGrad.addColorStop(0, color1);
    hullGrad.addColorStop(0.5, color2);
    hullGrad.addColorStop(1, color3);
    ctx.fillStyle = hullGrad;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(-hs + 6, -hs + 4, s - 12, s - 8, 4);
        ctx.fill();
    } else {
        ctx.fillRect(-hs + 6, -hs + 4, s - 12, s - 8);
    }
    ctx.shadowColor = 'transparent';

    // Turret Dome
    const domeGrad = ctx.createRadialGradient(0, -2, 0, 0, 0, 10);
    domeGrad.addColorStop(0, color1);
    domeGrad.addColorStop(1, color3);
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cannon Barrel
    const barrelGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    barrelGrad.addColorStop(0, '#9ca3af');
    barrelGrad.addColorStop(0.5, '#e5e7eb');
    barrelGrad.addColorStop(1, '#4b5563');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(-2, -hs - 6, 4, hs + 6);
    
    ctx.fillStyle = isEnraged ? '#fca5a5' : '#9ca3af';
    ctx.fillRect(-3, -hs - 6, 6, 4);

    ctx.restore();

    // High-Tech Holographic Equation Badge
    ctx.save();
    const text = isMinion ? \`[ \${numberValue} ]\` : equation;
    ctx.font = '900 16px "Orbitron", "Courier New", Courier, monospace';
    const textWidth = ctx.measureText(text).width;
    const badgeW = Math.max(textWidth + 24, 60);
    const badgeH = 26;
    const bx = cx - badgeW / 2;
    const by = y - 32;

    const badgeColor = isEnraged ? '#ef4444' : (isMinion ? '#06b6d4' : '#4ade80');
    const bgColor = isEnraged ? 'rgba(69, 10, 10, 0.85)' : 'rgba(8, 47, 73, 0.85)';
    
    ctx.shadowColor = badgeColor;
    ctx.shadowBlur = isEnraged ? 15 : 8;
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.5;
    
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bx, by, badgeW, badgeH, 13);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(bx, by, badgeW, badgeH);
        ctx.strokeRect(bx, by, badgeW, badgeH);
    }
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, by + badgeH / 2 + 1);
    ctx.restore();
  }

  static drawBossTank(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    animTick: number,
    hp: number,
    maxHp: number,
    equation: string
  ) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const trackToggle = Math.floor(animTick / 4) % 2;

    // Giant Treads
    const drawBossTread = (tx: number) => {
      const grad = ctx.createLinearGradient(tx, y, tx + 20, y);
      grad.addColorStop(0, '#111');
      grad.addColorStop(0.5, '#333');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      if(ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(tx, y, 20, height, 6);
          ctx.fill();
      } else {
          ctx.fillRect(tx, y, 20, height);
      }
      
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      for (let ty = y + (trackToggle * 6); ty < y + height - 8; ty += 12) {
        ctx.fillRect(tx + 2, ty, 16, 4);
      }
      ctx.shadowBlur = 0;
    };
    drawBossTread(x);
    drawBossTread(x + width - 20);

    // Massive Hull
    const hullGrad = ctx.createLinearGradient(0, y, 0, y + height);
    hullGrad.addColorStop(0, '#3f3f46');
    hullGrad.addColorStop(0.5, '#27272a');
    hullGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = hullGrad;
    
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 16, y + 8, width - 32, height - 16, 8);
        ctx.fill();
    } else {
        ctx.fillRect(x + 16, y + 8, width - 32, height - 16);
    }
    ctx.shadowColor = 'transparent';

    // Armor Plating
    ctx.fillStyle = '#52525b';
    ctx.fillRect(x + 24, y + 16, width - 48, height - 32);
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 26, y + 18, width - 52, height - 36);

    // Glowing Core
    const pulse = Math.sin(animTick * 0.1) * 0.5 + 0.5;
    const coreGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 24);
    coreGrad.addColorStop(0, \`rgba(244, 63, 94, \${0.8 + pulse * 0.2})\`);
    coreGrad.addColorStop(1, 'rgba(159, 18, 57, 0.9)');
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 20 + pulse * 10;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dual Heavy Cannons (DOWN)
    const cannonGrad = ctx.createLinearGradient(0, 0, 12, 0);
    cannonGrad.addColorStop(0, '#71717a');
    cannonGrad.addColorStop(0.5, '#d4d4d8');
    cannonGrad.addColorStop(1, '#3f3f46');
    
    ctx.fillStyle = cannonGrad;
    ctx.fillRect(cx - 30, y + height - 10, 12, 24);
    ctx.fillRect(cx + 18, y + height - 10, 12, 24);

    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(cx - 32, y + height + 10, 16, 6);
    ctx.fillRect(cx + 16, y + height + 10, 16, 6);

    // Boss Holographic Banner
    ctx.save();
    const bannerW = width + 80;
    const bannerH = 36;
    const bannerX = cx - bannerW / 2;
    const bannerY = y - 45;

    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(69, 10, 10, 0.9)';
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 18);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '900 20px "Orbitron", "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(\`BOSS: \${equation}\`, cx, bannerY + bannerH / 2);
    ctx.restore();

    // Health Bar
    const barW = width + 20;
    const barH = 8;
    const barX = cx - barW / 2;
    const barY = bannerY - 14;
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();
    } else {
        ctx.fillRect(barX, barY, barW, barH);
    }
    
    ctx.fillStyle = '#22c55e';
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX + 1, barY + 1, (barW - 2) * Math.max(0, hp / maxHp), barH - 2, 3);
        ctx.fill();
    } else {
        ctx.fillRect(barX + 1, barY + 1, (barW - 2) * Math.max(0, hp / maxHp), barH - 2);
    }
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.stroke();
    } else {
        ctx.strokeRect(barX, barY, barW, barH);
    }
  }

  static drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number) {
    ctx.save();
    ctx.translate(x, y);
    
    const radius = 10 + progress * 30;
    
    // Shockwave Ring
    ctx.strokeStyle = \`rgba(56, 189, 248, \${1 - progress})\`;
    ctx.lineWidth = 4 * (1 - progress);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Core Fire
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    grad.addColorStop(0, \`rgba(255, 255, 255, \${1 - progress})\`);
    grad.addColorStop(0.2, \`rgba(250, 204, 21, \${1 - progress})\`);
    grad.addColorStop(0.6, \`rgba(239, 68, 68, \${1 - progress})\`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Debris Particles
    ctx.fillStyle = \`rgba(255, 255, 255, \${1 - progress})\`;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 / 8) * i + (progress * 2);
      const dist = radius * 1.2;
      const px = Math.cos(a) * dist;
      const py = Math.sin(a) * dist;
      ctx.beginPath();
      ctx.arc(px, py, 3 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  static drawPowerUp(ctx: CanvasRenderingContext2D, x: number, y: number, type: PowerUpType, animTick: number) {
    const cx = x + 16;
    const cy = y + 16;
    const hover = Math.sin(animTick * 0.1) * 4;
    const pulse = Math.sin(animTick * 0.15) * 0.5 + 0.5;
    
    ctx.save();
    ctx.translate(0, hover);

    // Glowing Aura
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 15 + pulse * 10;
    
    const grad = ctx.createLinearGradient(x, y, x + 32, y + 32);
    grad.addColorStop(0, '#d8b4fe');
    grad.addColorStop(1, '#9333ea');
    
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#f3e8ff';
    ctx.lineWidth = 2;
    
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, 32, 32, 8);
        ctx.fill();
        ctx.stroke();
    } else {
        ctx.fillRect(x, y, 32, 32);
        ctx.strokeRect(x, y, 32, 32);
    }
    
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let symbol = '⭐';
    if (type === 'PI_BOMB') symbol = 'π';
    if (type === 'PROTRACTOR') symbol = '📐';
    if (type === 'CALCULATOR') symbol = '⏱️';
    if (type === 'PLUS_LIFE') symbol = '❤️';
    
    ctx.fillText(symbol, cx, cy + 2);
    
    // Inner glass reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    if(ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, 24, 10, 4);
        ctx.fill();
    } else {
        ctx.fillRect(x + 4, y + 4, 24, 10);
    }

    ctx.restore();
  }
}
`
fs.writeFileSync('src/game/renderer.ts', content);
