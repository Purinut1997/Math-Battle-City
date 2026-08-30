const fs = require('fs');
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(
  'body {\n  background-color: #050505;\n  color: #ffffff;\n}',
  `html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
  position: fixed;
  left: 0;
  top: 0;
  background-color: #050505;
  color: #ffffff;
}`
);

fs.writeFileSync('src/index.css', content);
