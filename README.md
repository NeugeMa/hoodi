# hoodi

Seu "tamagotchi" de segurança!

App mobile do **hoodi**, a CitizenTech da equipe na Global Solution 2026.2 da FIAP (Engenharia de Software, 3º ano). Este repositório contém **só o app mobile**, entregue na disciplina **Mobile Development & IoT**.

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| Nome da CitizenTech | hoodi |
| Cidade e bairro | São Paulo · entorno da FIAP Paulista (Paulista, Bela Vista e Liberdade) |
| Cidadão beneficiado | Estudante do noturno, de 18 a 30 anos, que anda a pé da faculdade até o metrô ou até em casa |
| Problema, em uma frase | Caminhar sozinho à noite é inseguro para a maioria, e tirar o celular do bolso na rua para checar o caminho é justamente o que a pessoa quer evitar |
| Como funciona | O app guarda no celular a grade de risco feita com dados oficiais da SSP-SP, cruza a posição com a célula e a faixa horária e, quando o risco sobe, avisa pelo relógio (notificação) e pelo hoodi Pet (um bichinho de bolso que vibra e mostra uma carinha) |
| O que cada parte faz | **App (este repositório):** a interface do cidadão. **API .NET:** domínio, contas, contatos e rotas. **ML:** grade de risco. **hoodi Pet (ESP32):** o alerta no bolso. **Infra Linux:** hospeda a API |
| Link do repositório | https://github.com/NeugeMa/hoodi |
| Indicador de impacto | A definir pela equipe |
| ODS conectados | A definir pela equipe (sugestões do briefing: ODS 11 e ODS 10) |

> Dados de risco: a grade com dados da SSP-SP ainda não está integrada. Até lá, as telas mostram os estados vazios (por exemplo, "Localizando você"), sem números inventados.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 20 ou mais novo e o app **Expo Go** no celular (Play Store ou App Store), compatível com o **SDK 58**.

```bash
npm install
npx expo start
```

Leia o QR code com o Expo Go (Android) ou com a câmera (iPhone). O celular e o computador precisam estar na mesma rede Wi-Fi; se não conectar, use `npx expo start --tunnel`.

Para ver no navegador: `npx expo start --web`. Os alertas de confirmação (`Alert`) não aparecem no navegador; para testar os fluxos completos, use o celular.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run lint` | Roda o ESLint |
| `npx expo-doctor` | Confere versões e configuração do Expo |

## Stack

- **Expo SDK 58** com **React Native 0.88** e **TypeScript** (modo estrito)
- **Expo Router**: navegação baseada em arquivos, em `src/app/`
- **Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans`): a fonte do design system
- **Phosphor Icons** (`phosphor-react-native`) + **react-native-svg**: ícones com peso suave; peso "fill" na aba ativa. Todos os ícones são importados um a um em [`src/components/icones.ts`](src/components/icones.ts) para não carregar a biblioteca inteira
- **expo-image**: logo
- **expo-sqlite**: banco local, guarda a grade de risco para funcionar sem internet
- **expo-crypto**: SHA-256 para conferir o arquivo da grade antes de usar
- **react-native-maps**: mapa nativo (Google Maps no Android, Apple Maps no iOS)

## Estrutura de pastas

```
src/
├── app/                    # Rotas (cada arquivo é uma tela)
│   ├── _layout.tsx         # Raiz: fonte, tema claro/escuro e estado do trajeto
│   └── (tabs)/             # Barra de navegação
│       ├── _layout.tsx     # Início, Mapa, Histórico e Perfil
│       ├── index.tsx       # Início
│       ├── mapa.tsx        # Em produção
│       ├── historico.tsx   # Em produção
│       └── perfil.tsx      # Em produção
├── components/
│   ├── ui/                 # Peças genéricas do design system (texto, botão, cartão, hachura)
│   ├── pet/                # Telinha animada do hoodi Pet
│   ├── historico/          # Lista de alertas agrupada por dia
│   ├── inicio/             # Componentes da tela Início
│   ├── mapa/               # Mapa nativo, estilo cinza, painel e legenda
│   └── risco/              # "Onde você está agora" e selo do nível (Início e Mapa)
├── db/                     # Banco local SQLite e migrações
├── features/
│   ├── grade/              # Grade de risco: download, checksum, banco local e geometria
│   ├── historico/          # Histórico local de alertas (banco e agrupamento)
│   ├── pet/                # Carinhas em pixel art e seus quadros
│   ├── risco/              # Níveis de risco: nomes, ícones e cores
│   └── trajeto/            # Estado do trajeto, posição e canais de aviso
└── theme/                  # Tokens do design system e hook de tema
```

Regra: só telas ficam em `src/app/`. Componentes, estado e dados ficam fora, para as rotas continuarem simples.

## Design system

O app segue o **design system v3** do hoodi. Os tokens estão em [`src/theme/tokens.ts`](src/theme/tokens.ts), com os mesmos nomes do PDF (`papel`, `grafite`, `capuz`, `seguro`, `atencao`…), para facilitar a conferência.

Regras que o código já aplica:

- **Tema claro e escuro** seguindo o sistema do celular.
- **Vermelho é perigo:** o vermelho `capuz` aparece só no risco alto, na logo e no botão Pedir ajuda. O botão primário é grafite.
- **Cor nunca sozinha:** todo nível de risco tem cor, ícone e nome (Área tranquila, Risco médio, Risco alto, Sem dado).
- **Sem dado não é seguro:** "Sem dado" usa cinza e a carinha confusa, nunca verde nem sorriso, e diz isso em texto.
- **Linguagem honesta:** nada de "rota segura", "local seguro" ou "tempo real".
- **Ações que desligam algo pedem confirmação** (ex.: Encerrar trajeto).

Regras visuais combinadas pela equipe (além do v3):

- **Ícones Phosphor** em vez de Lucide.
- **Sombra sutil e borda limpa** nos cards (token `sombra.suave` + borda de 1px em `linha`). **Nada de gradientes.**
- **Micro-interações com Lottie**, com animações aprovadas antes de entrar.

## Acessibilidade

- Alvos de toque de pelo menos 48px; botões e barra de navegação com 56px.
- Texto corrido com 16px no mínimo, respeitando o tamanho de fonte do sistema (limitado a 1,6× para não quebrar o layout).
- Contraste mínimo de 4,5:1 em todo texto, nos dois temas (valores do design system).
- Rótulos e dicas para leitor de tela (TalkBack e VoiceOver) em botões, indicadores e cards. O status atual é anunciado pelo nome do nível, sem depender da cor (F05 CA5).
- Títulos marcados como cabeçalho para navegação por leitor de tela.

## Telas e status

As features seguem o QA no Azure Boards (v2). A produção do mobile está dividida entre duas pessoas da equipe.

| Feature | Telas | Responsável | Status |
|---|---|---|---|
| F01 · Cadastro e acesso | Criar conta, Entrar | Colega | A fazer |
| F02 · Boas-vindas e permissões | Permissões | Colega | A fazer |
| F03 · Mapa reduzido offline | Mapa, Detalhe da célula | Mari | **Pronto, aguardando a grade da API** |
| F04 · Comparar rotas | Comparar rotas | Colega | A fazer |
| F05 · Trajeto em andamento | **Início** | Mari | **Layout pronto, aguardando dados** |
| F06 · Relógio e hoodi Pet | Configurar o relógio, Parear hoodi Pet, hoodi Pet conectado | Mari | A fazer |
| F07 · Alerta de risco | Alerta no Início, notificação, vibração do Pet | Mari | A fazer |
| F08 · Perfil e privacidade | Perfil, Dados e privacidade | Colega | A fazer |
| F09 · Contatos e pedido de ajuda | Contatos de segurança, Pedir ajuda | Colega | A fazer |
| F10 · Histórico de alertas | Histórico | Mari | **Pronto, aguardando os alertas (F07)** |

### Início (F05)

Mesmo estilo do Mapa: em cima, o que está acontecendo; embaixo, um painel arredondado com os detalhes e o Pedir ajuda.

- **Chip do topo:** logo, saudação e bairro atual (ou "Localizando…").
- **Telinha do hoodi Pet:** a carinha em pixel art (17 × 12), igual à tela OLED do Pet, animada por quadros, com a moldura na cor do nível.
- **Canais de aviso (F05 CA2):** os indicadores **Relógio** e **hoodi Pet**, verdes quando conectados e cinza quando não (nunca vermelho). Sem Pet, o indicador mostra **Conectar** e abre o pareamento.
- **Painel inferior:** "Onde você está agora" com o selo do nível, o bairro e o motivo (o mesmo bloco do Mapa); depois **Seu trajeto** em linhas de lista (tempo até o destino, alertas, próximo trecho de maior risco e **Encerrar**, com confirmação), ou o convite para **Comparar rotas**.
- **Pedir ajuda:** fixo no rodapé do painel, sempre visível, com a quantidade de contatos confirmados.

| Situação | Carinha | Animação |
|---|---|---|
| Área tranquila | tranquila | sorri, respira e pisca |
| Risco médio | atenta | olha para um lado e para o outro |
| Risco alto | preocupada | sobrancelhas franzidas, treme |
| Sem dado | confusa | boca ondulada e "?" (nunca sorri) |
| Posição desconhecida | procurando | olha em volta com pontinhos carregando |

Os desenhos ficam em [`src/features/pet/carinhas.ts`](src/features/pet/carinhas.ts) e a telinha em [`src/components/pet/tela-pet.tsx`](src/components/pet/tela-pet.tsx). Com "Reduzir movimento" ligado no celular, a carinha fica parada.

#### Sem dados (estado atual)

Enquanto GPS, grade de risco, conta e hoodi Pet não estão ligados, o Início abre como no primeiro uso: "Localizando…" no chip, saudação sem nome, carinha **procurando**, Relógio e hoodi Pet desconectados, "Localizando você" no painel, **Nenhum trajeto agora** e o **Pedir ajuda**.

#### Como os dados entram

Todo o estado fica em [`src/features/trajeto/trajeto-context.tsx`](src/features/trajeto/trajeto-context.tsx). Cada integração chama uma função, e a tela se atualiza sozinha:

| Função | Quem chama | O que muda no Início |
|---|---|---|
| `atualizarPosicao` | GPS + grade de risco (F03/F07) | Bairro, carinha, nível e motivo; célula atual no Mapa (`celulaId`) |
| `iniciarTrajeto` | Comparar rotas (F04) | Lista do trajeto e link Encerrar; caminho no Mapa (`caminho`) |
| `atualizarTrajeto` | Acompanhamento do trajeto (F05) | Tempo, alertas e próximo trecho |
| `encerrarTrajeto` | Botão Encerrar trajeto | Volta ao estado sem trajeto |
| `atualizarCanais` | Bluetooth do hoodi Pet (F06) e relógio | Indicadores Relógio e hoodi Pet |
| `atualizarContatosConfirmados` | Contatos de segurança (F09) | Dica do Pedir ajuda |

O nome de tratamento vai vir da conta (F01). Hoje está nulo em `NOME_USUARIO`, em [`src/app/(tabs)/index.tsx`](<src/app/(tabs)/index.tsx>).

Telas que o Início abre e ainda não existem (Pedir ajuda, Parear hoodi Pet, Comparar rotas) mostram um aviso "em produção".

### Mapa (F03)

Mapa real em tons de cinza com o risco por cima: a única cor na tela é a do risco.

- **Células suaves** (verde, amarelo, vermelho; cinza em Sem dado) cobrindo as ruas. Tocar numa célula abre o detalhe no painel.
- **Trajeto colorido trecho a trecho:** cada pedaço do caminho tem a cor da célula por onde passa.
- **Você** como um ponto com halo e o botão para **centralizar** no lugar onde você está.
- **Chip do topo:** "Mapa · Dados de 3 nov., 22h–2h".
- **Painel inferior fixo:** "Onde você está agora" e a legenda; ao tocar numa célula, o **detalhe** com nível, rua, faixa horária, fonte SSP-SP, data e "Melhor dado disponível no período" (X para voltar).
- **Mapa nativo:** `react-native-maps` (Google Maps no Android com estilo cinza; Apple Maps "muted" no iOS). Funciona no Expo Go sem configurar nada; no build de produção do Android vai precisar de uma chave do Google Maps. Na pré-visualização web o mapa não roda e aparece um aviso no lugar dele.

| Situação | O que o Mapa mostra | QA |
|---|---|---|
| Com internet e versão nova | Baixa, confere o SHA-256, salva e mostra a data dos dados | F03 CA1 |
| Sem internet, com dados salvos | Usa os dados salvos e avisa "Você está sem internet" com a data | CA6 |
| Sem internet, nunca baixou | "Precisa de internet uma vez" com **Tentar de novo** | CA7 |
| Arquivo com checksum errado | Recusa e continua com a versão anterior ("Atualização recusada") | CA8 |
| Fora do perímetro | "O hoodi ainda não tem dados para este lugar", sem nível | CA9 |
| Posição ainda desconhecida | "Localizando você", mapa centrado na FIAP Paulista | — |

**Estado atual:** como a API ainda não existe, o Mapa mostra a cidade em cinza e, no painel, "Dados de risco indisponíveis" com **Tentar de novo**.

#### Grade de risco: banco local e download

- **Banco:** a última grade válida fica no **SQLite** do celular, tabela `grade_risco` ([`grade-repo.ts`](src/features/grade/grade-repo.ts)); veja "Banco de dados local" abaixo.
- **Download:** [`grade-api.ts`](src/features/grade/grade-api.ts) busca `GET /grade/manifesto.json` e, se a versão mudou, `GET /grade/{versao}.json`. O app só usa o arquivo se o SHA-256 do texto bater com o do manifesto.
- **Endereço da API:** crie um arquivo `.env` na raiz com `EXPO_PUBLIC_API_URL=http://SEU-IP:PORTA` (no celular, use o IP da máquina, não `localhost`).

Formato esperado (proposta para o contrato v0.6, a confirmar com o Abner e o Nando):

```json
// GET /grade/manifesto.json
{ "versao": "2026-11-03", "sha256": "<hex do arquivo da versão>" }

// GET /grade/2026-11-03.json
{
  "versao": "2026-11-03",
  "publicadoEm": "2026-11-03T12:00:00Z",
  "fonte": "SSP-SP",
  "faixas": [{ "id": "noite", "rotulo": "22h–2h", "inicio": 22, "fim": 2 }],
  "celulas": [
    {
      "id": "6gycfqr",
      "limites": { "norte": -23.5596, "sul": -23.5611, "oeste": -46.6572, "leste": -46.6557 },
      "referencia": "Rua Augusta",
      "niveis": { "noite": "alto" }
    }
  ]
}
```

`limites` (latitude e longitude da célula) deixam o app desenhar a célula no mapa sem depender da escolha entre geohash e H3. O trajeto (F04) precisa mandar os pontos do caminho (`caminho: [{ latitude, longitude }]`) para o Mapa pintar cada trecho. Faixa ausente numa célula vale como **Sem dado**.

### Histórico (F10)

Os alertas recebidos nos trajetos, guardados só no aparelho.

- **Chip do topo** com a quantidade de alertas e um **resumo dos últimos 7 dias** (total, Risco médio e Risco alto).
- **"Guardado só neste aparelho":** o histórico não é enviado para ninguém e abre sem internet (CA2).
- **Lista agrupada por dia** (Hoje, Ontem, "9 nov."), do mais recente para o mais antigo, com ícone do nível, rua e "Risco alto · 23:14" (CA1).
- **Apagar histórico**, com confirmação (CA3). Sem alertas: "Ainda não há alertas" (CA4).

Os alertas ficam na tabela `alertas` do SQLite ([`historico-repo.ts`](src/features/historico/historico-repo.ts)). O alerta de risco (F07) chama `registrarAlerta({ criadoEm, nivel, trecho })` cada vez que dispara, e a exclusão de conta (F08) pode chamar `apagarHistorico()`. **Estado atual:** como o F07 ainda não existe, a tela mostra "Ainda não há alertas".

## Banco de dados local

O app usa **SQLite** (`expo-sqlite`), aberto em [`src/db/banco.ts`](src/db/banco.ts). Cada mudança de schema é uma migração nova no fim da lista (a versão fica em `PRAGMA user_version`).

| Tabela | Para quê | Feature |
|---|---|---|
| `grade_risco` | Última grade de risco válida, para o Mapa e o alerta funcionarem sem internet | F03 |
| `alertas` | Histórico de alertas (data, nível e trecho) | F10 |

Tudo fica só no aparelho. Na pré-visualização web, que não tem SQLite, os repositórios `.web.ts` usam o `localStorage`.

## Como contribuir

- Uma branch por tela ou feature, saindo da `main`: `feat/hoodi-<tela>` (ex.: `feat/hoodi-inicio`).
- Abra um pull request para a `main` e peça revisão de quem cuida da outra metade.
- Antes do PR, rode `npm run typecheck` e `npm run lint`.
- Use os componentes de `src/components/ui` e os tokens de `src/theme` em vez de cores e tamanhos soltos.
- Registre os prompts de IA usados em `prompts.md` (regra da GS).

## Pendências

- **Nome de tratamento:** o cadastro só pede e-mail e senha (QA v2), mas o Início cumprimenta pelo nome. O design system v3 já mostra o campo no Criar conta; falta confirmar com a API.
- **Início sem trajeto:** o design system não desenha esse estado. Hoje ele mostra o status atual, Pedir ajuda e Comparar rotas.
- **Início fora do design system v3:** a régua deu lugar à telinha do Pet, e os cards agora têm borda de 1px e sombra sutil (o v3 pede cards sem borda e sem sombra). Falta levar ao design system.
- **Lottie:** as micro-interações vão usar Lottie (`lottie-react-native`), com animações do LottieFiles escolhidas e aprovadas antes de entrar.
- **Ícone do app e splash:** ainda são os do template do Expo.
- **Integrações:** GPS, grade de risco, API e Bluetooth com o hoodi Pet ainda não estão ligados; por isso o Início mostra só os estados vazios.
- **"Localizando você":** estado novo para quando a posição ainda não é conhecida. Não existe no design system v3; falta validar com quem cuida do design.
