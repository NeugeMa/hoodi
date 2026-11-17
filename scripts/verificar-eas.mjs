// Falha se o perfil "production" do eas.json puder ligar o modo demo ou não declarar o ambiente.
// Os perfis são resolvidos com "extends" antes de conferir (ex.: demo estende preview).
import { readFileSync } from 'node:fs';

const eas = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
const perfis = eas.build ?? {};

function resolver(nome, visitados = []) {
  const p = perfis[nome];
  if (!p) throw new Error(`perfil inexistente: ${nome}`);
  if (visitados.includes(nome)) throw new Error(`ciclo em extends: ${nome}`);
  const base = p.extends ? resolver(p.extends, [...visitados, nome]) : { env: {} };
  return { ...base, ...p, env: { ...base.env, ...(p.env ?? {}) } };
}

const erros = [];
const prod = resolver('production');
if (prod.env.EXPO_PUBLIC_AMBIENTE !== 'producao') erros.push('production deve definir EXPO_PUBLIC_AMBIENTE=producao');
if ('EXPO_PUBLIC_DEMO' in prod.env) erros.push('production não pode definir EXPO_PUBLIC_DEMO');
if ('EXPO_PUBLIC_ROTAS_LOCAIS' in prod.env) erros.push('production não pode definir EXPO_PUBLIC_ROTAS_LOCAIS');
const demo = resolver('demo');
if (demo.env.EXPO_PUBLIC_AMBIENTE !== 'demo') erros.push('demo deve definir EXPO_PUBLIC_AMBIENTE=demo');
for (const nome of ['preview', 'development']) {
  const p = resolver(nome);
  if (p.env.EXPO_PUBLIC_AMBIENTE === 'demo' || p.env.EXPO_PUBLIC_DEMO === '1') erros.push(`${nome} não pode ligar o demo`);
}
if (erros.length) {
  console.error(erros.join('\n'));
  process.exit(1);
}
console.log('eas.json ok: production fecha o demo; demo só no perfil demo');
