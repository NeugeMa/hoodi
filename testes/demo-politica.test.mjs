import test from 'node:test';
import assert from 'node:assert/strict';
import { demoLigado, demoPermitido } from '@/features/demo/demo-politica';

test('fora de desenvolvimento, só o ambiente "demo" permite o modo demo', () => {
  assert.equal(demoPermitido('producao', false), false);
  assert.equal(demoPermitido(undefined, false), false);
  assert.equal(demoPermitido('homologacao', false), false);
  assert.equal(demoPermitido('demo', false), true);
  assert.equal(demoPermitido(undefined, true), true);
});

test('produção ou ambiente ausente nunca liga, nem por variável nem pela web', () => {
  assert.equal(demoLigado({ demo: '1', ambiente: 'producao', dev: false }, true), false);
  assert.equal(demoLigado({ demo: '1', dev: false }, true), false);
});

test('demo e desenvolvimento respeitam a variável ou a web', () => {
  assert.equal(demoLigado({ demo: '1', ambiente: 'demo', dev: false }, false), true);
  assert.equal(demoLigado({ ambiente: 'demo', dev: false }, false), false);
  assert.equal(demoLigado({ dev: true }, true), true);
});
