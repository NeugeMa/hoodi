// Deixa o Node rodar os .ts do app nos testes: resolve o alias "@/" e imports sem extensão.
// Uso: npm run test:pet (Node 22+, sem dependências novas).
import { register } from 'node:module';

register(new URL('./resolver.mjs', import.meta.url));
