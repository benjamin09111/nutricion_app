const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const backendRoot = path.resolve(__dirname, '..', '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Env file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const env = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    env[key] = value;
  }

  return env;
}

function loadEnvFile(relativeFileName = '.env') {
  const filePath = path.resolve(backendRoot, relativeFileName);
  const env = parseEnvFile(filePath);

  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }

  return { filePath, env };
}

function redactDbUrl(rawUrl) {
  if (!rawUrl) {
    return '(missing)';
  }

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname || 'unknown-host';
    const port = parsed.port || 'default';
    const database = parsed.pathname.replace(/^\//, '') || 'unknown-db';
    return `${parsed.protocol}//***@${host}:${port}/${database}`;
  } catch (error) {
    return '(invalid url)';
  }
}

function getDbSummary(rawUrl) {
  if (!rawUrl) {
    return {
      kind: 'missing',
      host: null,
      database: null,
      isRemote: false,
      isLocal: false,
    };
  }

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname || '';
    const database = parsed.pathname.replace(/^\//, '') || '';
    const isLocal = ['localhost', '127.0.0.1'].includes(host);
    return {
      kind: 'ok',
      host,
      database,
      isRemote: !isLocal,
      isLocal,
    };
  } catch (error) {
    return {
      kind: 'invalid',
      host: null,
      database: null,
      isRemote: false,
      isLocal: false,
    };
  }
}

function ensureSafeRemoteFlag(rawUrl, args) {
  const summary = getDbSummary(rawUrl);
  const allowRemote = args.includes('--allow-remote');

  if (summary.isRemote && !allowRemote) {
    throw new Error(
      'This command targets a remote database. Re-run with --allow-remote only when you are intentionally touching the tester database.',
    );
  }

  return summary;
}

function ensureBackupsDir() {
  const backupDir = path.resolve(backendRoot, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  return backupDir;
}

module.exports = {
  backendRoot,
  ensureBackupsDir,
  ensureSafeRemoteFlag,
  getDbSummary,
  loadEnvFile,
  parseEnvFile,
  redactDbUrl,
};
