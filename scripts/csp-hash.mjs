/**
 * Calcula el hash sha256 del script inline de index.html (bootstrap del tema)
 * para mantener sincronizada la Content-Security-Policy de vercel.json.
 *
 * Uso:
 *   npm run csp:hash
 *
 * Si el hash cambia, actualiza el valor 'sha256-...' en vercel.json.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

if (scripts.length === 0) {
  console.error('No se encontraron scripts inline en index.html');
  process.exit(1);
}

for (const [index, script] of scripts.entries()) {
  const hash = createHash('sha256').update(script[1]).digest('base64');
  console.log(`script inline #${index + 1}: 'sha256-${hash}'`);
}
