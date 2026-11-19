// Testes do motor de alerta (pendente) e do protocolo v1 do Pet. Rodar: npm run test:pet
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { ESTADO_INICIAL, INTERVALO_MINIMO_MS, processarPosicao, proximoTrechoDeRisco } from '../src/features/alerta/motor.ts';
import { lerEvento, montarEstado, montarSimples, NIVEL_PET, PADRAO, EXPRESSAO, Sequencia, TIPO, paraBase64, deBase64 } from '../src/features/pet/protocolo.ts';

// Grade de teste: 3 células lado a lado (oeste→leste), uma faixa que vale o dia todo.
const faixa = { id: 'dia', rotulo: '0h–0h', inicio: 0, fim: 0 };
const cel = (id, oeste, nivel) => ({
  id, referencia: `Rua ${id}`, niveis: { dia: nivel }, limites: { norte: -23.56, sul: -23.57, oeste, leste: oeste + 0.01 },
});
const grade = { versao: 't', publicadoEm: '', fonte: 'SSP-SP', faixas: [faixa], celulas: [cel('A', -46.70, 'tranquila'), cel('B', -46.69, 'medio'), cel('C', -46.68, 'alto'), cel('D', -46.67, 'sem-dado')] };
const em = (lon) => ({ latitude: -23.565, longitude: lon });
// Centros bem dentro de cada célula (longe da margem de 30 m).
const A = em(-46.695), B = em(-46.685), C = em(-46.675), D = em(-46.665);

function andar(passos) {
  let e = ESTADO_INICIAL;
  return passos.map(([p, t]) => {
    const r = processarPosicao(grade, faixa, p, e, t, true);
    e = r.estado;
    return r.alerta?.nivel ?? null;
  });
}

test('motor: subida alerta, descida não', () => {
  assert.deepEqual(andar([[A, 0], [B, 10_000], [A, 200_000], [B, 400_000]]), [null, 'medio', null, 'medio']);
});

test('motor: subida dentro dos 2 min fica pendente e alerta quando o intervalo acaba', () => {
  // A → B (alerta médio) → C 30 s depois (bloqueado) → ainda em C após 2 min → alerta alto
  assert.deepEqual(andar([[A, 0], [B, 1_000], [C, 31_000], [C, 1_000 + INTERVALO_MINIMO_MS]]), [null, 'medio', null, 'alto']);
});

test('motor: pendente cancela se voltar ao nível do último alerta', () => {
  assert.deepEqual(andar([[A, 0], [B, 1_000], [C, 31_000], [B, 60_000], [B, 1_000 + INTERVALO_MINIMO_MS]]), [null, 'medio', null, null, null]);
});

test('motor: pendente sobrevive a "sem dado" no meio', () => {
  assert.deepEqual(andar([[A, 0], [B, 1_000], [C, 31_000], [D, 60_000], [C, 1_000 + INTERVALO_MINIMO_MS]]), [null, 'medio', null, null, 'alto']);
});

test('motor: sem permissão para alertar (consentimento/horário) nunca alerta nem deixa pendente', () => {
  let e = ESTADO_INICIAL;
  for (const [p, t] of [[A, 0], [B, 1_000], [C, 2_000]]) {
    const r = processarPosicao(grade, faixa, p, e, t, false);
    assert.equal(r.alerta, null);
    e = r.estado;
  }
  assert.equal(e.pendente, false);
});

test('motor: alerta ambiente não depende de trajeto (a permissão é o único gate)', () => {
  // andar() já passa podeAlertar=true sem nenhum trajeto: a subida alerta.
  assert.deepEqual(andar([[A, 0], [C, 5_000]]), [null, 'alto']);
});

test('motor: alerta barrado por permissão não deixa pendente e o estado segue a posição', () => {
  let e = ESTADO_INICIAL;
  const r1 = processarPosicao(grade, faixa, A, e, 0, false);
  e = r1.estado;
  const r2 = processarPosicao(grade, faixa, C, e, 5_000, false);
  assert.equal(r2.alerta, null);
  assert.equal(r2.estado.pendente, false);
  assert.equal(r2.estado.ultimoNivelConhecido, 'alto');
  // Permitido de novo, ainda em C: não repete (a subida já passou); sobe para um novo nível só ao descer e subir.
  const r3 = processarPosicao(grade, faixa, C, r2.estado, 10_000, true);
  assert.equal(r3.alerta, null);
});

test('motor: primeira leitura já em Risco alto alerta uma vez; em médio não', () => {
  const a = processarPosicao(grade, faixa, C, ESTADO_INICIAL, 0, true);
  assert.equal(a.alerta?.nivel, 'alto');
  const b = processarPosicao(grade, faixa, C, a.estado, 1_000, true);
  assert.equal(b.alerta, null);
  assert.equal(processarPosicao(grade, faixa, B, ESTADO_INICIAL, 0, true).alerta, null);
});

test('proximoTrechoDeRisco: médio mais perto não é escondido por um alto mais longe', () => {
  const caminho = [A, B, C];
  const prox = proximoTrechoDeRisco(grade, faixa, caminho, A);
  assert.equal(prox?.nivel, 'medio');
  assert.equal(prox?.celulaId, 'B');
  // Já em B, o próximo trecho passa a ser o alto.
  assert.equal(proximoTrechoDeRisco(grade, faixa, caminho, B)?.nivel, 'alto');
});

test('protocolo v1: estado do nível alto = mesmos bytes que o firmware espera', () => {
  const p = NIVEL_PET.alto;
  assert.deepEqual([...montarEstado(258, p.nivel, p.padrao, p.expressao)], [1, 1, 2, 1, 0, 0, 3, 3, 2]);
  assert.deepEqual([...montarEstado(1, null, PADRAO.nenhum, EXPRESSAO.semDado)], [1, 1, 1, 0, 0, 0, 0xff, 0, 4]);
  assert.deepEqual([...montarSimples(TIPO.fimTrajeto, 7)], [1, 4, 7, 0, 0, 0, 0, 0, 0]);
  // nRF Connect usado no teste de bancada: 010101000000020202 (nível 2)
  assert.equal(Buffer.from(montarEstado(1, 2, 2, 2)).toString('hex'), '010101000000020202');
});

test('protocolo v1: evento de clique e pressão longa', () => {
  assert.deepEqual(lerEvento(Uint8Array.from([1, 1, 5, 0, 0, 0])), { tipo: 'clique', contador: 5 });
  assert.deepEqual(lerEvento(Uint8Array.from([1, 2, 0, 1, 0, 0])), { tipo: 'pressao-longa', contador: 256 });
  assert.equal(lerEvento(Uint8Array.from([2, 1, 0, 0, 0, 0])), null);
  assert.equal(lerEvento(Uint8Array.from([1, 9, 0, 0, 0, 0])), null);
});

test('protocolo v1: sequência recomeça a cada conexão; base64 ida e volta', () => {
  const s = new Sequencia();
  assert.deepEqual([s.proxima(), s.proxima()], [1, 2]);
  s.reiniciar();
  assert.equal(s.proxima(), 1);
  const f = montarEstado(9, 1, 2, 1);
  assert.equal(paraBase64(f), Buffer.from(f).toString('base64'));
  assert.deepEqual([...deBase64(paraBase64(f))], [...f]);
});
