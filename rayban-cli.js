#!/usr/bin/env node

/**
 * Ray-Ban Meta CLI Runner
 * This script allows running the CLI locally without building or installation
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if we're in development mode (src directory exists)
const isDev = fs.existsSync(path.join(__dirname, 'src'));
const tsNodePath = path.join(__dirname, 'node_modules', '.bin', 'ts-node');

if (isDev && !fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('🚀 Running in development mode...');
  console.log('📝 Using ts-node to run TypeScript directly\n');
  
  // Use ts-node for development
  const tsNodeArgs = [
    path.join(__dirname, 'src', 'cli.ts'),
    ...process.argv.slice(2)
  ];
  
  const child = spawn(tsNodePath, tsNodeArgs, {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('❌ ts-node not found. Please run: npm install');
      process.exit(1);
    }
    console.error('❌ Error running CLI:', err.message);
    process.exit(1);
  });
  
} else {
  console.log('🎯 Running built version...');
  
  // Check if dist exists
  const cliPath = path.join(__dirname, 'dist', 'cli.js');
  if (!fs.existsSync(cliPath)) {
    console.error('❌ Built CLI not found. Please run: npm run build');
    process.exit(1);
  }
  
  // Use built version
  const child = spawn('node', [cliPath, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  child.on('error', (err) => {
    console.error('❌ Error running built CLI:', err.message);
    process.exit(1);
  });
}

process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});