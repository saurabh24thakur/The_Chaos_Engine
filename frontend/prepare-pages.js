const fs = require('fs');
const path = require('path');

const openNextDir = '.open-next';
const assetsDir = path.join(openNextDir, 'assets');

console.log("Preparing Cloudflare Pages output...");

// Cloudflare Pages expects the worker to be named _worker.js inside the assets dir
fs.copyFileSync(
  path.join(openNextDir, 'worker.js'),
  path.join(assetsDir, '_worker.js')
);

// Copy all the backend dependencies the worker relies on into the assets dir
const dirsToCopy = ['cloudflare', 'middleware', '.build', 'server-functions'];
for (const dir of dirsToCopy) {
  const src = path.join(openNextDir, dir);
  const dest = path.join(assetsDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Copied ${dir} to assets directory.`);
  }
}

console.log("Pages output preparation complete!");
