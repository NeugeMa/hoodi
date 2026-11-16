// Testes das regras do F02/F04/F08 que não dependem de tela: aviso antecipado, horário dos alertas
// e comparação de rotas. Rodam com `npm run test:pet` (Node 22+, sem dependências novas).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarAvisoAntecipado } from '../src/features/alerta/motor.ts';
import { horarioPermite, lerPreferenciasDeTexto, PREFERENCIAS_PADRAO } from '../src/features/preferencias/alertas.ts';
import { compararRotas } from '../src/features/rotas/comparar.ts';
import { decodificarPolyline } from '../src/features/rotas/polyline.ts';

const trecho = (rua, nivel, distanciaMetros) => ({ rua, nivel, distanciaMetros });

test('aviso antecipado: só dentro da antecedência e uma vez por trecho', () => {
  const avisados = new Set();
  assert.equal(avaliarAvisoAntecipado(trecho('Rua A', 'alto', 500), 'tranquila', 300, avisados), null);
  const aviso = avaliarAvisoAntecipado(trecho('Rua A', 'alto', 280), 'tranquila', 300, avisados);
  assert.equal(aviso?.titulo, 'Risco alto à frente');
  assert.equal(aviso?.antecipado, true);
  assert.match(aviso.texto, /Rua A, em 280 m/);
  assert.doesNotMatch(aviso.texto, /!/); // F07 CA7: sem ponto de exclamação
  assert.equal(avaliarAvisoAntecipado(trecho('Rua A', 'alto', 120), 'tranquila', 300, avisados), null);
});

test('aviso antecipado: não avisa trecho do mesmo nível de onde a pessoa está', () => {
  assert.equal(avaliarAvisoAntecipado(trecho('Rua B', 'medio', 100), 'medio', 300, new Set()), null);
  assert.equal(avaliarAvisoAntecipado(trecho('Rua B', 'alto', 100), 'medio', 300, new Set())?.nivel, 'alto');
});

test('aviso antecipado: "sem dado" agora não impede o aviso do que vem', () => {
  assert.equal(avaliarAvisoAntecipado(trecho('Rua C', 'medio', 100), 'sem-dado', 300, new Set())?.titulo, 'Risco médio à frente');
});

test('horário dos alertas: "só à noite" vale entre 18h e 6h', () => {
  const as = (h) => new Date(2026, 10, 16, h, 0);
  assert.equal(horarioPermite('sempre', as(12)), true);
  assert.equal(horarioPermite('noite', as(12)), false);
  assert.equal(horarioPermite('noite', as(18)), true);
  assert.equal(horarioPermite('noite', as(23)), true);
  assert.equal(horarioPermite('noite', as(5)), true);
  assert.equal(horarioPermite('noite', as(6)), false);
});

test('preferências: lê o salvo e completa o que faltar (inclui o "vibração" antigo)', () => {
  assert.deepEqual(lerPreferenciasDeTexto(null), PREFERENCIAS_PADRAO);
  const lidas = lerPreferenciasDeTexto(JSON.stringify({ vibracao: 'forte', som: true }));
  assert.equal(lidas.som, true);
  assert.equal(lidas.avisarNoCelular, false);
  assert.equal(lerPreferenciasDeTexto('{quebrado').antecedencia, 300);
});

test('polyline: decodifica o exemplo do Google', () => {
  assert.deepEqual(decodificarPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), [
    { latitude: 38.5, longitude: -120.2 },
    { latitude: 40.7, longitude: -120.95 },
    { latitude: 43.252, longitude: -126.453 },
  ]);
});

const rota = (rotaId, duracaoSegundos, exposicaoRelativa, percentualSemEstimativa, posicao) => ({
  rotaId,
  distanciaMetros: 900,
  duracaoSegundos,
  exposicaoRelativa,
  percentualSemEstimativa,
  geometriaCodificada: 'vxvnCfxs{GnKnK~W~W',
  posicao,
});
const resultado = (situacao, motivo, rotas) => ({ situacao, motivo, versaoGrade: 'v', rotas });

test('comparar rotas (F04 CA2): qualquer trecho sem dado não compara', () => {
  const r = compararRotas(resultado('concluida', null, [rota('r1', 720, 1020, 0, 1), rota('r2', 880, 1300, 10, 2)]), null, null);
  assert.equal(r.tipo, 'sem-dado');
});

test('comparar rotas (F04 CA1): rota normal x menor risco, minutos a mais e frase', () => {
  const r = compararRotas(resultado('concluida', null, [rota('rapida', 600, 1300, 0, 2), rota('calma', 900, 1000, 0, 1)]), null, null);
  assert.equal(r.tipo, 'comparada');
  assert.equal(r.normal.id, 'rapida');
  assert.equal(r.menorRisco.id, 'calma');
  assert.equal(r.diferencaMin, 5);
  assert.doesNotMatch(r.frase, /segur/i); // CA3: nada de "rota segura"
});

test('comparar rotas: a mais rápida já é a de menor risco', () => {
  const r = compararRotas(resultado('concluida', null, [rota('a', 600, 1000, 0, 1), rota('b', 900, 1300, 0, 2)]), null, null);
  assert.equal(r.tipo, 'comparada');
  assert.equal(r.mesma, true);
});

test('comparar rotas (F04 CA4): destino fora da área não compara', () => {
  assert.equal(compararRotas(resultado('indisponivel', 'fora_territorio', []), null, null).tipo, 'fora');
});
