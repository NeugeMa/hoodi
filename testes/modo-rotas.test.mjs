// Testes do modo da comparação de rotas (a pé / de carro). Rodam com `npm run test:pet`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVISO_CARRO, corpoDaAvaliacao, modoCarroLiberado, respostaConfirmaModo } from '../src/features/rotas/modo.ts';

const O = { latitude: -23.5646, longitude: -46.652 };
const D = { latitude: -23.5587, longitude: -46.6344 };
const SAIDA = new Date('2026-11-18T20:00:00Z');

test('a pé: corpo idêntico ao contrato v0.6, sem o campo modo', () => {
  const corpo = corpoDaAvaliacao(O, D, SAIDA, 'pe');
  assert.deepEqual(Object.keys(corpo), ['origem', 'destino', 'saidaEm']);
  assert.equal(corpo.saidaEm, '2026-11-18T20:00:00.000Z');
});

test('carro: corpo leva modo "carro" e nada além disso muda', () => {
  const corpo = corpoDaAvaliacao(O, D, SAIDA, 'carro');
  assert.equal(corpo.modo, 'carro');
  assert.deepEqual(corpo.origem, O);
  assert.deepEqual(corpo.destino, D);
});

test('corpo só leva latitude e longitude (nada extra de origem e destino)', () => {
  const corpo = corpoDaAvaliacao({ ...O, nome: 'casa' }, { ...D, endereco: 'rua x' }, SAIDA, 'pe');
  assert.deepEqual(Object.keys(corpo.origem), ['latitude', 'longitude']);
  assert.deepEqual(Object.keys(corpo.destino), ['latitude', 'longitude']);
});

test('carro só vale se a API confirmar o modo', () => {
  assert.equal(respostaConfirmaModo('carro', {}), false);
  assert.equal(respostaConfirmaModo('carro', { modo: 'pe' }), false);
  assert.equal(respostaConfirmaModo('carro', { modo: 'carro' }), true);
});

test('a pé aceita resposta v0.6 sem modo, mas recusa resposta de carro', () => {
  assert.equal(respostaConfirmaModo('pe', {}), true);
  assert.equal(respostaConfirmaModo('pe', { modo: 'pe' }), true);
  assert.equal(respostaConfirmaModo('pe', { modo: 'carro' }), false);
});

test('seletor de carro só aparece com flag ou demo', () => {
  assert.equal(modoCarroLiberado({ flag: undefined, demo: false }), false);
  assert.equal(modoCarroLiberado({ flag: '0', demo: false }), false);
  assert.equal(modoCarroLiberado({ flag: '1', demo: false }), true);
  assert.equal(modoCarroLiberado({ flag: undefined, demo: true }), true);
});

test('aviso de carro não promete risco específico de veículo', () => {
  assert.match(AVISO_CARRO, /não específico de crime contra veículo/);
});
