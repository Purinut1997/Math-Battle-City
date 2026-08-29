const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/'หยุดพักเกม'/g, "'PAUSED'");
fs.writeFileSync('src/App.tsx', appContent);
