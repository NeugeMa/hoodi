import type { Coordenada } from '@/features/grade/tipos';
import { nivelDaApi } from '@/features/grade/grade-h3';
import type { NivelRisco } from '@/features/risco/nivel';

/**
 * Autocomplete de destino e lugares próximos (POST /v1/lugares/sugerir e /v1/lugares/recomendar).
 * Lógica pura, sem react-native (testável em Node). O texto digitado e a posição não são guardados em lugar nenhum:
 * vivem no estado da tela e vão só no corpo do pedido (nunca na URL).
 */

export const MIN_CARACTERES = 3;
export const MAX_CARACTERES = 80;
/** Espera depois da última tecla, para não gastar o limite do provedor a cada letra. */
export const ESPERA_DIGITACAO_MS = 300;

export type CategoriaLugar = 'farmacia' | 'mercado' | 'hospital' | 'padaria' | 'cafe' | 'restaurante';
/** Mesma lista que a API aceita; o app não manda termo livre. */
export const CATEGORIAS: { id: CategoriaLugar; rotulo: string }[] = [
  { id: 'farmacia', rotulo: 'Farmácia' },
  { id: 'mercado', rotulo: 'Mercado' },
  { id: 'hospital', rotulo: 'Hospital' },
  { id: 'padaria', rotulo: 'Padaria' },
  { id: 'cafe', rotulo: 'Café' },
  { id: 'restaurante', rotulo: 'Restaurante' },
];

export type Sugestao = { id: string; rotulo: string; contexto: string | null; coordenada: Coordenada };
export type RespostaSugestoes = { situacao: 'ok' | 'indisponivel'; sugestoes: Sugestao[] };

export type SituacaoLugar = 'com_dado' | 'sem_dado' | 'fora_cobertura';
export type LugarRecomendado = {
  id: string;
  nome: string;
  contexto: string | null;
  coordenada: Coordenada;
  distanciaMetros: number;
  situacao: SituacaoLugar;
  nivel: number | null;
};
export type RespostaRecomendacao = {
  situacao: 'ok' | 'indisponivel';
  motivo: string | null;
  versaoGrade: string | null;
  faixa: number | null;
  aviso: string;
  lugares: LugarRecomendado[];
};

/** Texto que já vale a pena enviar para sugestões. */
export function textoParaBuscar(texto: string): string | null {
  const limpo = texto.trim();
  return limpo.length >= MIN_CARACTERES && limpo.length <= MAX_CARACTERES && !/[\u0000-\u001f\u007f]/.test(limpo) ? limpo : null;
}

export const corpoSugerir = (texto: string) => ({ texto: texto.trim() });
export const corpoRecomendar = (posicao: Coordenada, categoria: CategoriaLugar) => ({
  posicao: { latitude: posicao.latitude, longitude: posicao.longitude },
  categoria,
});

/** Nível de risco mostrado no lugar. Sem dado e fora da cobertura nunca viram "tranquila". */
export function nivelDoLugar(l: Pick<LugarRecomendado, 'situacao' | 'nivel'>): NivelRisco {
  return l.situacao === 'com_dado' && l.nivel !== null ? nivelDaApi(l.nivel) : 'sem-dado';
}

export function distanciaCurta(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.max(10, Math.round(m / 10) * 10)} m`;
}

/** Frase do leitor de tela e do cartão. Nunca "seguro": só o risco registrado na área do lugar. */
export function descricaoDoLugar(l: LugarRecomendado, nomeNivel: string): string {
  const area =
    l.situacao === 'fora_cobertura'
      ? 'Fora da área coberta pelo Hoodi'
      : l.situacao === 'sem_dado'
        ? 'Sem dado de risco na área'
        : `${nomeNivel} registrado na área`;
  return `${l.nome}${l.contexto ? `, ${l.contexto}` : ''}. A ${distanciaCurta(l.distanciaMetros)}. ${area}.`;
}

/** Mensagem quando não há lista. */
export function textoSemLugares(r: RespostaRecomendacao): string {
  switch (r.motivo) {
    case 'fora_territorio':
      return 'Você está fora da área que o Hoodi cobre, então não dá para ordenar lugares por risco registrado.';
    case 'grade_indisponivel':
      return 'Os dados de risco não estão disponíveis agora. Tente de novo em instantes.';
    case 'provedor_indisponivel':
      return 'A busca de lugares não respondeu agora. Tente de novo em instantes.';
    case 'nenhum_lugar':
      return 'Não achamos lugares dessa categoria até 1,5 km de você.';
    default:
      return 'Não deu para buscar lugares agora.';
  }
}

/**
 * Evita que uma resposta antiga (de uma tecla anterior) substitua a mais nova.
 * Use: const vez = pedido.proximo(); ...await...; if (!pedido.vale(vez)) return;
 */
export function criarControleDePedidos() {
  let ultimo = 0;
  return { proximo: () => ++ultimo, vale: (n: number) => n === ultimo, cancelar: () => void ++ultimo };
}

/** O destino escolhido numa sugestão só vale enquanto o texto do campo continua igual ao dela. */
export function coordenadaDaEscolha(escolha: { rotulo: string; coordenada: Coordenada } | null, textoDoCampo: string): Coordenada | null {
  return escolha && escolha.rotulo === textoDoCampo ? escolha.coordenada : null;
}
