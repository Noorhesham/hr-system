const fs = require('fs');
const path = require('path');

const distMain = path.join(__dirname, '..', 'dist', 'main.js');
const nestedMain = path.join(__dirname, '..', 'dist', 'src', 'main.js');

if (fs.existsSync(distMain) && !fs.existsSync(nestedMain)) {
  fs.mkdirSync(path.dirname(nestedMain), { recursive: true });
  fs.writeFileSync(nestedMain, "require('../main.js');\n");
}

if (fs.existsSync(nestedMain) && !fs.existsSync(distMain)) {
  fs.writeFileSync(distMain, "require('./src/main.js');\n");
}
