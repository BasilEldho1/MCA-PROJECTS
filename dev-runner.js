#!/usr/bin/env node
const path = require('path');
const { spawn } = require('child_process');

// Ensure Windows system directories are in PATH so any sub-tools can find cmd.exe / system utilities
if (process.platform === 'win32') {
  const winPaths = [
    'C:\\Windows\\system32',
    'C:\\Windows',
    'C:\\Windows\\System32\\Wbem',
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0'
  ];
  const currentPath = process.env.PATH || '';
  const toAdd = winPaths.filter(p => !currentPath.toLowerCase().includes(p.toLowerCase()));
  if (toAdd.length > 0) {
    process.env.PATH = `${toAdd.join(';')};${currentPath}`;
  }
}

const rootDir = __dirname;
const clientDir = path.resolve(rootDir, '3d-house-designer');
const serverDir = path.resolve(rootDir, 'server');
const viteBin = path.resolve(clientDir, 'node_modules', 'vite', 'bin', 'vite.js');

console.log('\x1b[32m%s\x1b[0m', '==================================================');
console.log('\x1b[1m\x1b[36m%s\x1b[0m', '🏠 3D House Designer - Development Environment');
console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');
console.log('🌐 Frontend: \x1b[4m\x1b[34mhttp://localhost:5173\x1b[0m');
console.log('🚀 Backend:  \x1b[4m\x1b[35mhttp://localhost:5000\x1b[0m');
console.log('\x1b[32m%s\x1b[0m', '==================================================\n');

// Spawn Server
const serverProcess = spawn(
  process.execPath,
  ['--watch', '--watch-path=src', 'src/server.js'],
  {
    cwd: serverDir,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['pipe', 'pipe', 'pipe']
  }
);

// Spawn Client (Vite)
const clientProcess = spawn(
  process.execPath,
  [viteBin],
  {
    cwd: clientDir,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['pipe', 'pipe', 'pipe']
  }
);

function prefixOutput(stream, prefix, colorCode) {
  let buffer = '';
  stream.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep partial line
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${colorCode}${prefix}\x1b[0m ${line}`);
      } else {
        console.log('');
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      console.log(`${colorCode}${prefix}\x1b[0m ${buffer}`);
    }
  });
}

prefixOutput(serverProcess.stdout, '[SERVER]', '\x1b[35m');
prefixOutput(serverProcess.stderr, '[SERVER]', '\x1b[31m');
prefixOutput(clientProcess.stdout, '[CLIENT]', '\x1b[36m');
prefixOutput(clientProcess.stderr, '[CLIENT]', '\x1b[33m');

const cleanExit = () => {
  try {
    serverProcess.kill();
  } catch (e) {}
  try {
    clientProcess.kill();
  } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
process.on('exit', cleanExit);

serverProcess.on('exit', code => {
  if (code && code !== 0) {
    console.error(`\x1b[31m[SERVER] exited with code ${code}\x1b[0m`);
  }
});

clientProcess.on('exit', code => {
  if (code && code !== 0) {
    console.error(`\x1b[31m[CLIENT] exited with code ${code}\x1b[0m`);
  }
});
