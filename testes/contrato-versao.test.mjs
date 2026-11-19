// Contrato de dados: o app só aceita a versão publicada se o manifesto declarar um contrato que o decoder conhece.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contratoAceito } from '../src/features/grade/contrato.ts';

test('contrato 2 (entrega) e 3 (fase 2) são aceitos', () => {
  assert.equal(contratoAceito({ manifest: { contrato_versao: 2 } }), true);
  assert.equal(contratoAceito({ manifest: { contrato_versao: 3 } }), true);
});

test('contrato desconhecido, ausente ou de outro tipo é recusado', () => {
  assert.equal(contratoAceito({ manifest: { contrato_versao: 1 } }), false);
  assert.equal(contratoAceito({ manifest: { contrato_versao: 4 } }), false);
  assert.equal(contratoAceito({ manifest: {} }), false);
  assert.equal(contratoAceito({ manifest: { contrato_versao: '2' } }), false);
  assert.equal(contratoAceito({}), false);
});
