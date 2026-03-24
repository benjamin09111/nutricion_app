const fs = require('fs');
const path = require('path');
const { backendRoot, ensureBackupsDir } = require('./lib/env');

const PROFILE_MAP = {
  localdev: '.env.localdev',
  testing: '.env.testing',
};

function getProfileArg() {
  const profileArg = process.argv.find((arg) => arg.startsWith('--profile='));
  if (!profileArg) {
    throw new Error('Missing --profile=localdev|testing');
  }

  const profile = profileArg.split('=')[1];
  if (!PROFILE_MAP[profile]) {
    throw new Error(`Unknown profile "${profile}". Use localdev or testing.`);
  }

  return profile;
}

function backupCurrentEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return null;
  }

  const backupsDir = ensureBackupsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupsDir, `.env.${timestamp}.bak`);
  fs.copyFileSync(envPath, backupPath);
  return backupPath;
}

function main() {
  const profile = getProfileArg();
  const sourcePath = path.resolve(backendRoot, PROFILE_MAP[profile]);
  const envPath = path.resolve(backendRoot, '.env');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Profile file not found: ${sourcePath}. Create it from ${PROFILE_MAP[profile]}.example first.`,
    );
  }

  const backupPath = backupCurrentEnv(envPath);
  fs.copyFileSync(sourcePath, envPath);

  if (backupPath) {
    fs.copyFileSync(backupPath, path.resolve(backendRoot, '.env.previous'));
    console.log(`Previous .env backed up at ${backupPath}`);
  }

  console.log(`Active database profile switched to "${profile}".`);
  console.log(`Current .env now points to ${sourcePath}`);
}

main();
