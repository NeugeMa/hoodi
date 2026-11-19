// Testes da grade H3 da API (contrato v0.6): leitura do CSV, níveis, faixas, célula onde a pessoa está
// e textos do alerta quando a grade não traz o nome da rua. Rodam com `npm run test:pet`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latLngToCell, cellToLatLng } from 'h3-js';
import { distanciaAteCelulaM } from '../src/features/alerta/geo.ts';
import { montarAlerta, avaliarAvisoAntecipado } from '../src/features/alerta/motor.ts';
import { periodoMeses } from '../src/features/grade/datas.ts';
import { CABECALHO_CSV, CsvInvalido, faixaDoIntervalo, gradeDoCsv, nivelDaApi } from '../src/features/grade/grade-h3.ts';
import { celulaEm, faixaAtual, nivelNaFaixa } from '../src/features/grade/recorte.ts';

// Duas células reais do CSV do produtor (primeiras linhas de risco_h3_faixa_v2.csv).
const CSV = [
  CABECALHO_CSV,
  '89a8100c003ffff,0,madrugada,com_dado,0,0.185185,4',
  '89a8100c003ffff,1,manha,com_dado,1,0.314815,13',
  '89a8100c003ffff,2,tarde,com_dado,2,0.666667,24',
  '89a8100c003ffff,3,noite_cedo,com_dado,2,0.851852,15',
  '89a8100c003ffff,4,noite,com_dado,3,1.9,5',
  '89a8100c00bffff,0,madrugada,sem_dado,,,0',
  '89a8100c00bffff,1,manha,sem_dado,,,0',
  '89a8100c00bffff,2,tarde,sem_dado,,,0',
  '89a8100c00bffff,3,noite_cedo,sem_dado,,,0',
  '89a8100c00bffff,4,noite,sem_dado,,,0',
  '',
].join('\n');

const VERSAO = {
  versao: 'nando-v2-2026-jan-set',
  sha256: 'a'.repeat(64),
  publicadoEm: '2026-11-17T12:00:00Z',
  manifest: {
    fonte: { orgao: 'SSP-SP' },
    janela_dados: ['2026-01-01', '2026-09-30'],
    faixas: [
      { faixa: 0, faixa_nome: 'madrugada', intervalo_horas: '[0,6)' },
      { faixa: 1, faixa_nome: 'manha', intervalo_horas: '[6,12)' },
      { faixa: 2, faixa_nome: 'tarde', intervalo_horas: '[12,18)' },
      { faixa: 3, faixa_nome: 'noite_cedo', intervalo_horas: '[18,21)' },
      { faixa: 4, faixa_nome: 'noite', intervalo_horas: '[21,24)' },
    ],
  },
};

test('grade H3: lê o CSV, monta o hexágono e as 5 faixas do manifesto', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  assert.equal(g.versao, 'nando-v2-2026-jan-set');
  assert.equal(g.fonte, 'SSP-SP');
  assert.deepEqual(g.periodo, { inicio: '2026-01-01', fim: '2026-09-30' });
  assert.equal(g.celulas.length, 2);
  assert.equal(g.celulas[0].contorno.length, 6);
  assert.deepEqual(g.faixas.map((f) => f.rotulo), ['0h–6h', '6h–12h', '12h–18h', '18h–21h', '21h–24h']);
  assert.deepEqual(g.celulas[0].niveis, { 0: 'tranquila', 1: 'medio', 2: 'alto', 3: 'alto', 4: 'alto' });
});

test('grade H3: "sem_dado" vira Sem dado, nunca área tranquila', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  const semDado = g.celulas.find((c) => c.id === '89a8100c00bffff');
  for (const f of g.faixas) assert.equal(nivelNaFaixa(semDado, f), 'sem-dado');
});

test('grade H3: nível 3 (ainda sem nome) aparece como Risco alto', () => {
  assert.deepEqual([0, 1, 2, 3].map(nivelDaApi), ['tranquila', 'medio', 'alto', 'alto']);
});

test('grade H3: CSV com formato errado é recusado (a grade anterior continua)', () => {
  assert.throws(() => gradeDoCsv('a,b,c\n1,2,3', VERSAO), CsvInvalido);
  assert.throws(() => gradeDoCsv(CSV.replace('com_dado,0', 'com_dado,7'), VERSAO), CsvInvalido);
  assert.throws(() => gradeDoCsv(CSV.replace('89a8100c003ffff,0', 'xyz,0'), VERSAO), CsvInvalido);
});

test('grade H3: acha a célula onde a pessoa está pelo hexágono, não pelo retângulo', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  const [lat, lng] = cellToLatLng('89a8100c003ffff');
  assert.equal(celulaEm(g, { latitude: lat, longitude: lng })?.id, '89a8100c003ffff');
  // Um canto do retângulo que envolve o hexágono fica fora dele (e fora da grade).
  const c = g.celulas[0];
  const canto = { latitude: c.limites.norte - 1e-7, longitude: c.limites.leste - 1e-7 };
  assert.notEqual(latLngToCell(canto.latitude, canto.longitude, 9), '89a8100c003ffff');
  assert.notEqual(celulaEm(g, canto)?.id, '89a8100c003ffff');
});

test('grade H3: distância até o hexágono (margem de 30 m da divisa)', () => {
  const g = gradeDoCsv(CSV, VERSAO);
  const c = g.celulas[0];
  const [lat, lng] = cellToLatLng(c.id);
  assert.equal(distanciaAteCelulaM({ latitude: lat, longitude: lng }, c), 0);
  // ~0,0009° de latitude ≈ 100 m ao norte do topo do hexágono.
  const fora = { latitude: c.limites.norte + 0.0009, longitude: lng };
  const d = distanciaAteCelulaM(fora, c);
  assert.ok(d > 90 && d < 130, `distância ${d}`);
});

test('faixas: "[18,21)" e a faixa que vale às 22h é a 21h–24h', () => {
  assert.deepEqual(faixaDoIntervalo(3, '[18,21)'), { id: '3', rotulo: '18h–21h', inicio: 18, fim: 21 });
  assert.equal(faixaDoIntervalo(9, 'errado'), null);
  const g = gradeDoCsv(CSV, VERSAO);
  assert.equal(faixaAtual(g.faixas, new Date(2026, 10, 17, 22, 30))?.id, '4');
  assert.equal(faixaAtual(g.faixas, new Date(2026, 10, 17, 0, 10))?.id, '0');
});

test('período dos dados: "jan. a set. 2026", sem trocar o dia pelo fuso', () => {
  assert.equal(periodoMeses('2026-01-01', '2026-09-30'), 'jan. a set. 2026');
  assert.equal(periodoMeses('2025-10-01', '2026-09-30'), 'out. 2025 a set. 2026');
});

test('alerta sem o nome da rua (grade da API): texto continua certo', () => {
  assert.equal(montarAlerta('alto', '').texto, 'Mantenha o celular guardado e siga por ruas movimentadas.');
  assert.equal(montarAlerta('medio', 'Rua X').texto, 'Rua X. Seu relógio e o Hoodi Pet avisam se o risco subir.');
  const avisados = new Set();
  const a = avaliarAvisoAntecipado({ rua: '', nivel: 'alto', distanciaMetros: 200, celulaId: 'c1' }, 'tranquila', 300, avisados);
  assert.match(a.texto, /^Em 200 m\./);
  // Outra célula sem nome também avisa (a chave é a célula, não a rua vazia).
  assert.ok(avaliarAvisoAntecipado({ rua: '', nivel: 'alto', distanciaMetros: 150, celulaId: 'c2' }, 'tranquila', 300, avisados));
  assert.equal(avaliarAvisoAntecipado({ rua: '', nivel: 'alto', distanciaMetros: 100, celulaId: 'c2' }, 'tranquila', 300, avisados), null);
});

test('grade H3: manifesto inválido falha fechado (não cai nas faixas padrão)', () => {
  const comFaixas = (faixas) => ({ ...VERSAO, manifest: { ...VERSAO.manifest, faixas } });
  const ok = VERSAO.manifest.faixas;
  assert.throws(() => gradeDoCsv(CSV, comFaixas([...ok.slice(0, 4), { faixa: 4, intervalo_horas: 'lixo' }])), CsvInvalido);
  assert.throws(() => gradeDoCsv(CSV, comFaixas(ok.slice(0, 4))), CsvInvalido); // não cobre até 24h
  assert.throws(() => gradeDoCsv(CSV, comFaixas([...ok, { faixa: 4, intervalo_horas: '[21,24)' }])), CsvInvalido); // id repetido
  assert.throws(() => gradeDoCsv(CSV, comFaixas([ok[0], { faixa: 1, intervalo_horas: '[5,12)' }, ...ok.slice(2)])), CsvInvalido); // sobreposição
  assert.equal(gradeDoCsv(CSV, { ...VERSAO, manifest: undefined }).faixas.length, 5); // sem manifesto: padrão
});

test('grade H3: CSV com linha duplicada, coluna a mais ou faixa fora do manifesto é recusado', () => {
  const dup = CSV.replace('\n89a8100c00bffff,0,', '\n89a8100c003ffff,0,madrugada,com_dado,0,0.185185,4\n89a8100c00bffff,0,');
  assert.throws(() => gradeDoCsv(dup, VERSAO), CsvInvalido);
  assert.throws(() => gradeDoCsv(CSV.replace('0.185185,4', '0.185185,4,extra'), VERSAO), CsvInvalido);
  assert.throws(() => gradeDoCsv(CSV.replace('89a8100c00bffff,4,', '89a8100c00bffff,9,'), VERSAO), CsvInvalido);
});
