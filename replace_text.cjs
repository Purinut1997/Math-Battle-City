const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  ['Operation Number Shield', 'ยุทธการโล่ตัวเลข'],
  ['PRESS START', 'กดเริ่มเกม'],
  ['HOW TO PLAY', 'กติกาการเล่น'],
  ['PC: WASD / Spacebar • Mobile: Joystick / Button', 'PC: WASD / Spacebar • มือถือ: จอยสติ๊ก / ปุ่มยิง'],
  ['Preparing Stage', 'กำลังเตรียมตัวสู่ด่านที่'],
  ['PAUSED', 'หยุดพักเกม'],
  ['RESUME', 'เล่นต่อ'],
  ['NEW TARGET ACQUIRED', 'ได้รับเป้าหมายใหม่'],
  ['SOLVE: ', 'ผลลัพธ์: '],
  ['GAME OVER', 'จบเกม'],
  ['Final Score', 'คะแนนรวม'],
  ['Survived to Stage:', 'ผ่านถึงด่านที่:'],
  ['RESTART', 'เล่นใหม่อีกครั้ง'],
  ['MISSION ACCOMPLISHED', 'ภารกิจสำเร็จ'],
  ['Total Score', 'คะแนนรวมสูงสุด'],
  ['Clear Time:', 'เวลาที่ใช้:'],
  ['PLAY AGAIN', 'เล่นใหม่อีกครั้ง'],
  ['MOVE', 'เคลื่อนที่'],
  ['FIRE', 'ยิง'],
  ['PAUSE', 'พักเกม']
];

for (const [eng, thai] of replacements) {
  appContent = appContent.replace(new RegExp(eng, 'g'), thai);
}

fs.writeFileSync('src/App.tsx', appContent);

let hudContent = fs.readFileSync('src/components/HUD.tsx', 'utf8');
hudContent = hudContent.replace(/>Stage</g, '>ด่าน<');
hudContent = hudContent.replace(/>Target</g, '>เป้าหมาย<');
fs.writeFileSync('src/components/HUD.tsx', hudContent);

let rendererContent = fs.readFileSync('src/game/renderer.ts', 'utf8');
rendererContent = rendererContent.replace(/TARGET:/g, 'เป้าหมาย:');
rendererContent = rendererContent.replace(/BOSS:/g, 'บอส:');
fs.writeFileSync('src/game/renderer.ts', rendererContent);

console.log('Done');
