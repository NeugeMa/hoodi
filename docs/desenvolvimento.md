# Para desenvolver

Comandos, organização das pastas, banco local e como contribuir.

[← Voltar ao README](../README.md)

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run lint` | Roda o ESLint |
| `npx expo-doctor` | Confere versões e configuração do Expo |
| `npm run test:pet` | Testes das regras sem tela: protocolo do Pet, motor do alerta, aviso antecipado, horário e comparação de rotas (Node 22+) |


## Estrutura de pastas

```
src/
├── app/                    # Rotas (cada arquivo é uma tela)
│   ├── _layout.tsx         # Raiz: fonte, tema, conta (telas protegidas) e estado do trajeto
│   ├── (conta)/            # Sem conta: Entrar (primeira tela), Criar conta, Confirmar, Esqueci a senha
│   └── (tabs)/             # Barra de navegação
│       ├── _layout.tsx     # Início, Mapa, Histórico e Perfil
│       ├── index.tsx       # Início
│       ├── mapa.tsx        # Em produção
│       ├── historico.tsx   # Em produção
│       └── perfil.tsx      # Em produção
├── components/
│   ├── ui/                 # Peças genéricas do design system (texto, botão, cartão, hachura)
│   ├── pet/                # Telinha animada do Hoodi Pet
│   ├── historico/          # Lista de alertas agrupada por dia
│   ├── inicio/             # Componentes da tela Início
│   ├── mapa/               # Mapa nativo, estilo cinza, painel e legenda
│   └── risco/              # "Onde você está agora" e selo do nível (Início e Mapa)
├── db/                     # Banco local SQLite e migrações
├── features/
│   ├── api/                # Cliente HTTP da API (endereço, erros problem+json)
│   ├── conta/              # Sessão, login, cadastro em 2 etapas e renovação do token
│   ├── contatos/           # Contatos de segurança por convite (F09)
│   ├── rotas/              # Comparar rotas: API, geometria e regras da comparação (F04)
│   ├── ajuda/              # Pedido de ajuda: API do pânico, limite por hora, posição aproximada e push
│   ├── grade/              # Grade de risco: download, checksum, banco local e geometria
│   ├── historico/          # Histórico local de alertas (banco e agrupamento)
│   ├── pet/                # Hoodi Pet: protocolo BLE v1, conexão e carinhas (carinhas.json do firmware)
│   ├── demo/               # Modo demonstração: API, grade e caminhada simuladas (só com ?demo=1)
│   ├── risco/              # Níveis de risco: nomes, ícones e cores
│   └── trajeto/            # Estado do trajeto, posição e canais de aviso
└── theme/                  # Tokens do design system e hook de tema
```

Regra: só telas ficam em `src/app/`. Componentes, estado e dados ficam fora, para as rotas continuarem simples.


## Banco de dados local

O app usa **SQLite** (`expo-sqlite`), aberto em [`src/db/banco.ts`](../src/db/banco.ts). Cada mudança de schema é uma migração nova no fim da lista (a versão fica em `PRAGMA user_version`).

| Tabela | Para quê | Feature |
|---|---|---|
| `grade_risco` | Última grade de risco válida, para o Mapa e o alerta funcionarem sem internet | F03 |
| `alertas` | Histórico de alertas (data, nível e trecho) | F10 |
| `pet_pareado` | Hoodi Pet pareado (a coluna `token_hex` fica vazia no protocolo v1) | F06 |
| `preferencias` | Preferências em chave/valor (orientação do relógio; pode ser usada pelo Perfil) | F06, F08 |

Tudo fica só no aparelho. Na pré-visualização web, que não tem SQLite, os repositórios `.web.ts` usam o `localStorage`.


## Como contribuir

- Uma branch por tela ou feature, saindo da `main`: `feat/hoodi-<tela>` (ex.: `feat/hoodi-inicio`).
- Abra um pull request para a `main` e peça revisão de quem cuida da outra metade.
- Antes do PR, rode `npm run typecheck` e `npm run lint`.
- Use os componentes de `src/components/ui` e os tokens de `src/theme` em vez de cores e tamanhos soltos.
- Registre os prompts de IA usados em `prompts.md` (regra da GS).
