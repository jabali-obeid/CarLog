import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const modelsDistDir = path.join(root, 'dist', 'models');

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('1/3 Building web bundle for Android...');
execSync(`${npx} vite build`, { stdio: 'inherit', cwd: root });

if (fs.existsSync(modelsDistDir)) {
  console.log('2/3 Removing dist/models/ so 141 MB of GLBs stay on R2/CDN instead of inside the APK/AAB...');
  fs.rmSync(modelsDistDir, { recursive: true, force: true });
}

console.log('3/3 Syncing Capacitor Android project...');
execSync(`${npx} cap sync android`, { stdio: 'inherit', cwd: root });

console.log('Done! Android assets synced cleanly without bundled .glb models.');
