const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

const tagNutrinet = `${colors.bold}${colors.yellow}[nutrinet]${colors.reset}`;
const tagBackend = `${colors.bold}${colors.cyan}[backend]${colors.reset}`;
const tagFrontend = `${colors.bold}${colors.green}[frontend]${colors.reset}`;

console.log(`${tagNutrinet} 🚀 Preparando entorno de desarrollo local...`);

// Verificación de dependencias instaladas
const backendModules = path.join(backendDir, 'node_modules');
const frontendModules = path.join(frontendDir, 'node_modules');

if (!fs.existsSync(backendModules)) {
  console.warn(
    `${tagNutrinet} ${colors.yellow}⚠️ Advertencia: 'backend/node_modules' no existe. Ejecuta 'npm install' dentro de /backend.${colors.reset}`,
  );
}

if (!fs.existsSync(frontendModules)) {
  console.warn(
    `${tagNutrinet} ${colors.yellow}⚠️ Advertencia: 'frontend/node_modules' no existe. Ejecuta 'npm install' dentro de /frontend.${colors.reset}`,
  );
}

const backendEnv = path.join(backendDir, '.env');
if (!fs.existsSync(backendEnv)) {
  console.warn(
    `${tagNutrinet} ${colors.yellow}⚠️ Advertencia: 'backend/.env' no encontrado.${colors.reset}`,
  );
}

console.log(
  `${tagNutrinet} Levantando servicios concurrentemente:\n` +
    `  • Backend  (NestJS)  : ${colors.cyan}http://localhost:3001${colors.reset} (npm run start:dev)\n` +
    `  • Frontend (Next.js) : ${colors.green}http://localhost:3000${colors.reset} (npm run dev)\n` +
    `${colors.dim}Presiona Ctrl + C en cualquier momento para detener ambos servicios.${colors.reset}\n`,
);

function streamOutput(child, tag) {
  if (child.stdout) {
    const rlOut = readline.createInterface({ input: child.stdout });
    rlOut.on('line', (line) => {
      console.log(`${tag} ${line}`);
    });
  }
  if (child.stderr) {
    const rlErr = readline.createInterface({ input: child.stderr });
    rlErr.on('line', (line) => {
      console.error(`${tag} ${line}`);
    });
  }
}

// Spawns with shell: true for cross-platform compatibility (Windows npm.cmd / Unix npm)
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const backendProcess = spawn(npmCmd, ['run', 'start:dev'], {
  cwd: backendDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' },
});

const frontendProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: frontendDir,
  shell: true,
  stdio: ['inherit', 'pipe', 'pipe'],
  env: { ...process.env, FORCE_COLOR: '1' },
});

streamOutput(backendProcess, tagBackend);
streamOutput(frontendProcess, tagFrontend);

let isShuttingDown = false;

function terminate(child, name) {
  if (!child || !child.pid) return;
  try {
    if (isWin) {
      // Force kill entire process tree on Windows to prevent orphaned ports
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // Process might have already exited
  }
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${tagNutrinet} 🛑 Deteniendo servicios de Backend y Frontend...`);
  terminate(backendProcess, 'backend');
  terminate(frontendProcess, 'frontend');
  console.log(`${tagNutrinet} Servicios detenidos correctamente.`);
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

backendProcess.on('exit', (code, signal) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(
      `${tagNutrinet} ${colors.red}Backend terminó inesperadamente con código ${code}.${colors.reset}`,
    );
    shutdown(code);
  }
});

frontendProcess.on('exit', (code, signal) => {
  if (!isShuttingDown && code !== 0 && code !== null) {
    console.error(
      `${tagNutrinet} ${colors.red}Frontend terminó inesperadamente con código ${code}.${colors.reset}`,
    );
    shutdown(code);
  }
});
