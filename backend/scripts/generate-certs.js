import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const certDir = join(__dirname, '..', 'certs');

if (!existsSync(certDir)) {
  mkdirSync(certDir, { recursive: true });
}

const cmd = `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout "${join(certDir, 'key.pem')}" -out "${join(certDir, 'cert.pem')}" -subj "/CN=localhost"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('SSL certificates generated successfully in certs/');
} catch {
  console.error('Error: OpenSSL is required. Install it from https://slproweb.com/products/Win32OpenSSL.html');
  process.exit(1);
}
