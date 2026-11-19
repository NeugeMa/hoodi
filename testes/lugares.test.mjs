// Testes de autocomplete de destino e lugares perto (lógica pura). Rodam com `npm run test:pet`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  coordenadaDaEscolha,
  corpoRecomendar,
  corpoSugerir,
  criarControleDePedidos,
  descricaoDoLugar,
  distanciaCurta,
  nivelDoLugar,
  textoParaBuscar,
  textoSemLugares,
} from '../src/features/lugares/lugares.ts';
import { recomendacaoDemo, sugestoesDemo } from '../src/features/lugares/lugares-demo.ts';

const P = { latitude: -23.5646, longitude: -46.652 };

test('só busca com 3 a 80 caracteres e sem caractere de controle', () => {
  assert.equal(textoParaBuscar('ab'), null);
  assert.equal(textoParaBuscar('  ab  '), null);
  assert.equal(textoParaBuscar('  Paulista '), 'Paulista');
  assert.equal(textoParaBuscar('a'.repeat(81)), null);
  assert.equal(textoParaBuscar('a'.repeat(80)), 'a'.repeat(80));
  assert.equal(textoParaBuscar('rua\nx'), null);
});

test('corpos só levam o necessário', () => {
  assert.deepEqual(corpoSugerir('  Paulista '), { texto: 'Paulista' });
  const c = corpoRecomendar({ ...P, nome: 'casa' }, 'farmacia');
  assert.deepEqual(Object.keys(c), ['posicao', 'categoria']);
  assert.deepEqual(Object.keys(c.posicao), ['latitude', 'longitude']);
});

test('sem dado e fora da cobertura nunca viram tranquila', () => {
  assert.equal(nivelDoLugar({ situacao: 'sem_dado', nivel: 0 }), 'sem-dado');
  assert.equal(nivelDoLugar({ situacao: 'fora_cobertura', nivel: 0 }), 'sem-dado');
  assert.equal(nivelDoLugar({ situacao: 'com_dado', nivel: null }), 'sem-dado');
  assert.equal(nivelDoLugar({ situacao: 'com_dado', nivel: 0 }), 'tranquila');
  assert.equal(nivelDoLugar({ situacao: 'com_dado', nivel: 3 }), 'alto');
});

test('descrição nunca diz "seguro"', () => {
  for (const situacao of ['com_dado', 'sem_dado', 'fora_cobertura']) {
    const d = descricaoDoLugar({ id: '1', nome: 'Farmácia X', contexto: 'Bela Vista', coordenada: P, distanciaMetros: 340, situacao, nivel: 0 }, 'Área tranquila');
    assert.doesNotMatch(d, /segur/i);
    assert.match(d, /340 m/);
  }
});

test('distância curta', () => {
  assert.equal(distanciaCurta(4), '10 m');
  assert.equal(distanciaCurta(344), '340 m');
  assert.equal(distanciaCurta(1250), '1,3 km');
});

test('mensagens sem lista por motivo', () => {
  const base = { situacao: 'ok', versaoGrade: null, faixa: null, aviso: '', lugares: [] };
  assert.match(textoSemLugares({ ...base, motivo: 'fora_territorio' }), /fora da área/);
  assert.match(textoSemLugares({ ...base, motivo: 'nenhum_lugar' }), /1,5 km/);
  assert.match(textoSemLugares({ ...base, motivo: null }), /Não deu/);
});

test('resposta antiga não vence a mais nova; cancelar invalida', () => {
  const c = criarControleDePedidos();
  const a = c.proximo();
  const b = c.proximo();
  assert.equal(c.vale(a), false);
  assert.equal(c.vale(b), true);
  c.cancelar();
  assert.equal(c.vale(b), false);
});

test('coordenada da sugestão vale só com o texto igual; editar descarta', () => {
  const escolha = { rotulo: 'Av. Paulista, 1106', coordenada: P };
  assert.deepEqual(coordenadaDaEscolha(escolha, 'Av. Paulista, 1106'), P);
  assert.equal(coordenadaDaEscolha(escolha, 'Av. Paulista, 11'), null);
  assert.equal(coordenadaDaEscolha(null, 'x'), null);
});

test('demo: dados fixos, ordem do menor risco e sem dado por último', () => {
  const s = sugestoesDemo();
  assert.equal(s.situacao, 'ok');
  assert.ok(s.sugestoes.length > 0 && s.sugestoes.length <= 5);
  const r = recomendacaoDemo('farmacia');
  assert.ok(r.lugares.length > 0);
  const niveis = r.lugares.map((l) => (l.situacao === 'com_dado' ? l.nivel : 9));
  assert.deepEqual(niveis, [...niveis].sort((x, y) => x - y));
});
