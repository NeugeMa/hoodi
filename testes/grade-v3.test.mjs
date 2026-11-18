// Grade do contrato v3 (semestral abr–set/2026, 5×5 km): o app lê o pacote real do produtor sem tratar a janela como fixa.
// Os arquivos em testes/fixtures são cópias do pacote ml/dados/snapshot_v3 (hoodi-ml); o job de contrato do CI confere a cópia.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { periodoMeses } from '../src/features/grade/datas.ts';
import { gradeDoCsv } from '../src/features/grade/grade-h3.ts';

const CSV = readFileSync(new URL('./fixtures/risco_h3_faixa_v3.csv', import.meta.url), 'utf8');
const MANIFEST = JSON.parse(readFileSync(new URL('./fixtures/manifest_v3.json', import.meta.url), 'utf8'));
const SHA_V3 = 'e33bd004ffcf0c47378ef0c9518bdf19a9ea84ca007222d798a2003a7c71c0da';
const VERSAO = { versao: 'nando-v3-2026-abr-set', sha256: SHA_V3, publicadoEm: '2026-11-18T12:00:00Z', manifest: MANIFEST };

test('v3: o CSV da fixture é o aprovado (SHA-256 do manifest e fixo)', () => {
  assert.equal(createHash('sha256').update(CSV).digest('hex'), SHA_V3);
  assert.equal(MANIFEST.csv_sha256, SHA_V3);
  assert.equal(MANIFEST.contrato_versao, 3);
});

test('v3: 279 células × 5 faixas, janela abr–set/2026 vinda do manifest', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  assert.equal(g.celulas.length, 279);
  assert.equal(g.faixas.length, 5);
  assert.deepEqual(g.periodo, { inicio: '2026-04-01', fim: '2026-09-30' });
  assert.equal(periodoMeses(g.periodo.inicio, g.periodo.fim), 'abr. a set. 2026');
});

test('v3: 824 chaves com dado e 571 sem dado; sem dado nunca vira área tranquila', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  const todas = g.celulas.flatMap((c) => Object.values(c.niveis));
  assert.equal(todas.length, 1395);
  assert.equal(todas.filter((n) => n === 'sem-dado').length, 571);
  assert.equal(todas.filter((n) => n !== 'sem-dado').length, 824);
  // cada linha sem_dado do CSV continua sem-dado na grade
  const semDado = CSV.split('\n').filter((l) => l.includes(',sem_dado,'));
  assert.equal(semDado.length, 571);
  for (const l of semDado) {
    const [id, faixa] = l.split(',');
    assert.equal(g.celulas.find((c) => c.id === id).niveis[faixa], 'sem-dado');
  }
});

test('v3: a janela mostrada vem do manifest, não de texto fixo no app', () => {
  const g = gradeDoCsv(CSV, { ...VERSAO, manifest: { ...MANIFEST, janela_dados: ['2026-01-01', '2026-09-30'] } });
  assert.deepEqual(g.periodo, { inicio: '2026-01-01', fim: '2026-09-30' });
});

// Camada consumidora: rota inteira sobre células sem_dado do v3 não pode virar comparação "mais tranquila".
import { cellToLatLng } from 'h3-js';
import { celulasDoCaminho, compararRotas } from '../src/features/rotas/comparar.ts';

test('v3: rotas só sobre células sem dado terminam em "sem-dado", não em comparação', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  const faixa = g.faixas[0];
  const vazia = g.celulas.find((c) => c.niveis[faixa.id] === 'sem-dado');
  assert.ok(vazia, 'a fixture v3 tem célula sem dado na primeira faixa');
  const [latitude, longitude] = cellToLatLng(vazia.id);
  const caminho = [{ latitude, longitude }, { latitude, longitude }];
  assert.equal(celulasDoCaminho(g, faixa, caminho).semDadoPct, 100);
  const rota = (rotaId, duracaoSegundos, posicao) => ({
    rotaId, duracaoSegundos, posicao, faixa: 0, geometria: caminho,
    pontuacao: { metrosTotal: 500, percentualSemDado: 0, percentualForaCobertura: 0, dadoInsuficiente: false, acumulada: 0 },
  });
  const r = compararRotas({ situacao: 'concluida', motivo: null, versaoGrade: 'v3', rotas: [rota('a', 600, 1), rota('b', 700, 2)] }, g, faixa);
  assert.equal(r.tipo, 'sem-dado');
});
