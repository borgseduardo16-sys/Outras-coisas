// Monta a pasta "publicar/" só com os arquivos do app (o resto do repositório não vai para o ar).
import { cpSync, rmSync, mkdirSync } from 'node:fs';
const ITENS = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons'];
rmSync('publicar', { recursive: true, force: true });
mkdirSync('publicar');
for (const i of ITENS) cpSync(i, `publicar/${i}`, { recursive: true });
console.log('publicar/ pronto:', ITENS.join(', '));
