import { execSync } from 'child_process';
import fs from 'fs';

if (!fs.existsSync('./node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Failed to install dependencies:', e.message);
    process.exit(1);
  }
}

// ✅ After install, now import the real bot
import('./start.js');
