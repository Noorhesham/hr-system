const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '..', 'dist', 'main.js'),
  path.join(__dirname, '..', 'dist', 'src', 'main.js'),
];
const entry = candidates.find((file) => fs.existsSync(file));

if (!entry) {
  console.error('Cannot find Nest build output. Looked in:');
  for (const file of candidates) console.error(`  ${file}`);
  process.exit(1);
}

require(entry);
