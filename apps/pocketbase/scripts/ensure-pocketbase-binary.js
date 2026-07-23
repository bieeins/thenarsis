import { existsSync, readFileSync, mkdirSync, rmSync, chmodSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const binaryPath = path.join(root, process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
const version = readFileSync(path.join(root, '.pocketbase-version'), 'utf8').trim();

if (existsSync(binaryPath)) {
  console.log(`[pocketbase] Binary already present at ${binaryPath}, skipping download.`);
  process.exit(0);
}

const platformMap = { linux: 'linux', darwin: 'darwin', win32: 'windows' };
const archMap = { x64: 'amd64', arm64: 'arm64' };

const platform = platformMap[process.platform];
const arch = archMap[process.arch];

if (!platform || !arch) {
  console.error(`[pocketbase] Unsupported platform/arch: ${process.platform}/${process.arch}. Download a binary manually from https://pocketbase.io/docs/ and place it at ${binaryPath}.`);
  process.exit(1);
}

const ext = platform === 'windows' ? 'zip' : 'zip';
const fileName = `pocketbase_${version}_${platform}_${arch}.${ext}`;
const url = `https://github.com/pocketbase/pocketbase/releases/download/v${version}/${fileName}`;
const tmpDir = path.join(root, '.pb-download-tmp');
const zipPath = path.join(root, fileName);

console.log(`[pocketbase] Downloading ${url} ...`);
execSync(`curl -fsSL -o "${zipPath}" "${url}"`, { stdio: 'inherit' });

mkdirSync(tmpDir, { recursive: true });
execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'inherit' });

const extractedBinary = path.join(tmpDir, platform === 'windows' ? 'pocketbase.exe' : 'pocketbase');
execSync(`cp "${extractedBinary}" "${binaryPath}"`);
chmodSync(binaryPath, 0o755);

rmSync(tmpDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });

console.log(`[pocketbase] Installed pocketbase v${version} (${platform}/${arch}) at ${binaryPath}.`);
