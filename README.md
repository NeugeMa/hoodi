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
npm start
```

`npm start` abre no **Expo Go** (equivale a `npx expo start --go`). Leia o QR code com o Expo Go (Android) ou com a câmera (iPhone). O celular e o computador precisam estar na mesma rede Wi-Fi; se não conectar, use `npx expo start --tunnel`.

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
- **expo-crypto**: SHA-256 para conferir o arquivo da grade antes de usar e id desta instalação
- **expo-secure-store**: guarda os tokens da sessão no Keychain (iOS) e no Keystore (Android)
- **react-native-maps**: mapa nativo (Google Maps no Android, Apple Maps no iOS)
- **react-native-ble-plx**: Bluetooth Low Energy com o hoodi Pet (não funciona no Expo Go)
- **expo-location**: posição para o alerta de risco (só no aparelho)
- **expo-notifications**: notificação do alerta, espelhada no relógio
- **lottie-react-native**: micro-interações em Lottie (radar de busca do Pet)

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
│   ├── pet/                # Telinha animada do hoodi Pet
│   ├── historico/          # Lista de alertas agrupada por dia
│   ├── inicio/             # Componentes da tela Início
│   ├── mapa/               # Mapa nativo, estilo cinza, painel e legenda
│   └── risco/              # "Onde você está agora" e selo do nível (Início e Mapa)
├── db/                     # Banco local SQLite e migrações
├── features/
│   ├── api/                # Cliente HTTP da API (endereço, erros problem+json)
│   ├── conta/              # Sessão, login, cadastro em 2 etapas e renovação do token
│   ├── contatos/           # Contatos de segurança por convite (F09)
│   ├── ajuda/              # Pedido de ajuda: API do pânico, limite por hora, posição aproximada e push
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

- **"Hoodi" com H maiúsculo** em todos os textos do app (inclui "Hoodi Pet"). Identificadores técnicos continuam minúsculos: `hoodi://`, chaves de armazenamento e o nome que o Pet anuncia no Bluetooth (`hoodi Pet XXXX`, vem do firmware).

- **Ícones Phosphor** em vez de Lucide.
- **Sombra sutil e borda limpa** nos cards (token `sombra.suave` + borda de 1px em `linha`). **Nada de gradientes.**
- **Micro-interações com Lottie**, com animações aprovadas antes de entrar.
- **Sem título no topo das telas:** a barra de navegação já diz onde você está; telas fora das abas têm só o botão de voltar.

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
| F01 · Cadastro e acesso | Entrar, Criar conta, Confirmar, Esqueci a senha | Mari | **Pronto, ligado à API** |
| F02 · Boas-vindas e permissões | Permissões | Colega | A fazer |
| F03 · Mapa reduzido offline | Mapa, Detalhe da célula | Mari | **Pronto, aguardando a grade da API** |
| F04 · Comparar rotas | Comparar rotas | Colega | A fazer |
| F05 · Trajeto em andamento | **Início** | Mari | **Layout pronto, aguardando dados** |
| F06 · Relógio e hoodi Pet | Configurar o relógio, Parear hoodi Pet, hoodi Pet conectado | Mari | **Pronto** (Parear precisa de development build) |
| F07 · Alerta de risco | Alerta na tela, notificação, vibração do Pet | Mari | **Pronto** (com o app aberto; segundo plano a fazer) |
| F08 · Perfil e privacidade | Perfil, Dados e privacidade | Colega | A fazer |
| F09 · Contatos e pedido de ajuda | Contatos de segurança, Convite, Pedir ajuda, Pedido recebido | Mari | **Pronto** (contatos na API; pedido de ajuda no mock) |
| F10 · Histórico de alertas | Histórico | Mari | **Pronto** |

### Início (F05)

Mesmo estilo do Mapa: em cima, o que está acontecendo; embaixo, um painel arredondado com os detalhes e o Pedir ajuda.

- **Topo limpo:** sem título nem saudação; o Início começa pela telinha do Pet.
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

Enquanto GPS, grade de risco, conta e hoodi Pet não estão ligados, o Início abre como no primeiro uso: carinha **procurando**, Relógio e hoodi Pet desconectados, "Localizando você" no painel, **Nenhum trajeto agora** e o **Pedir ajuda**.

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

### Cadastro e acesso (F01)

Ligado à API .NET (`/v1/auth`). **O app abre sempre no Início**, com ou sem conta: Início, Mapa, Histórico, relógio e Hoodi Pet funcionam sem conta. Só Contatos de segurança e Pedir ajuda pedem para entrar; o Perfil, sem conta, mostra **Entrar** e **Criar conta**. Quem faz esses desvios é o `Stack.Protected` em [`src/app/_layout.tsx`](src/app/_layout.tsx). A sessão fica salva: depois de entrar uma vez, o app continua logado ao abrir de novo.

| Tela | Rota | O que faz | QA |
|---|---|---|---|
| Criar conta | `/criar-conta` | Nome, data de nascimento (calendário), e-mail, senha e o consentimento, que começa desmarcado. Menos de 18 anos não avança | CA1, CA5, CA6, CA7, TC01, TC04 |
| Enviamos um link | `/verificar-email` | Logo depois de Criar conta: avisa que o link foi enviado para o e-mail, pede outro e oferece Entrar | CA2 |
| Confirmar | `/confirmar` | Aberta pelo link `hoodi://confirmar#token=...`: cria a conta com o nome e a senha do Criar conta e já entra. Se o app foi fechado no meio, pede a senha de novo | CA1 |
| Entrar | `/entrar` | Abre por cima do app (Perfil, Pedir ajuda, Contatos). E-mail e senha, "Esqueci a senha" e, embaixo, "Ainda não tem conta? Criar conta". Erro em texto: "E-mail ou senha incorretos". Traz também a frase do que o hoodi faz e que o risco é o melhor dado disponível no período (F02 CA1) | CA3, CA4, TC03 |
| Esqueci a senha | `/esqueci-senha` e `/redefinir-senha` | Link `hoodi://redefinir-senha#token=...` e senha nova | — |
| Sair | Perfil | Com confirmação; avisa o servidor e apaga a sessão do aparelho | F08 CA6 |

- **Cadastro com confirmação por e-mail (como a API faz):** a pessoa preenche tudo em Criar conta; a API manda um link e só cria a conta quando ele é aberto. Até lá, a senha fica **só na memória do app**, nunca no disco.
- **Idade:** a data de nascimento serve só para conferir os 18 anos (CA6) e não é guardada nem enviada; o app guarda apenas a data em que a maioridade foi confirmada.
- **"Já existe conta" (CA2):** a API responde igual exista ou não a conta, para não revelar quem usa o hoodi; por isso o "já existe conta" (CA2) vira o aviso e o botão Entrar da tela "Confira seu e-mail".
- **hoodi Pet como mascote:** Entrar e Criar conta têm a telinha do Pet no topo, que reage: olha em volta no e-mail, **fecha os olhos enquanto você digita a senha** (abre se tocar no olho para mostrar), fica confuso num erro e mostra os pontinhos enquanto entra.
- **Senha:** de 10 a 128 caracteres (regra da API), oculta por padrão, com o ícone de olho para mostrar. Todos os campos têm rótulo visível e lido pelo leitor de tela (CA7).
- **Consentimento:** a data em que a pessoa confirmou os 18 anos e aceitou fica salva no aparelho (`preferencias`). A API ainda não guarda o aceite.
- **Sessão:** o access token dura 60 min e é renovado sozinho com o refresh token, uma renovação por vez ([`sessao.ts`](src/features/conta/sessao.ts)). Se a renovação for recusada, o app volta para Entrar. Os tokens ficam no **SecureStore**, nunca no SQLite.
- **Link do e-mail no Expo Go:** o `hoodi://` só abre o app no development build. No Expo Go (ou com o e-mail aberto no computador), copie o link e cole no campo **Link do e-mail**.

#### Rodar com a API local

1. No PC: `dotnet run --project Hoodi.Api --urls http://0.0.0.0:5000` (repositório da API). Documentação em `http://IP-DO-PC:5000/scalar`.
2. Na raiz deste app, crie o `.env` com `EXPO_PUBLIC_API_URL=http://IP-DO-PC:5000` (o IP da máquina na rede, não `localhost`) e reinicie o `npm start`.
3. O e-mail do cadastro cai no **Mailpit**: `http://localhost:8025` no PC.
4. Partes da API que ainda não existem (grade, pânico, rotas, dispositivos) continuam no mock: `npx @stoplight/prism-cli mock contracts/openapi.yaml`.

### Contatos de segurança e Pedir ajuda (F09)

Segue o modelo da API: os contatos são **outras contas do hoodi**, ligadas por convite (não há SMS). Quem aceita o convite passa a receber os pedidos de ajuda de quem convidou.

| Tela | Rota | O que faz | QA |
|---|---|---|---|
| Contatos de segurança | `/contatos` (Perfil) | Quem recebe seus pedidos (**Confirmado** ou **Aguardando confirmação**), até 5; **Convidar contato**; de quem você é contato, com **Sair**; pedidos recebidos; campo para colar um convite | CA1, CA2, CA3, CA6, CA9 |
| Convite | `/convite` | Aberta pelo link `hoodi://convite#codigo=...`: explica o que muda e oferece **Aceitar** ou **Recusar** | CA1, CA2 |
| Pedir ajuda | `/pedir-ajuda` (Início) | Confirmação com a prévia do que os contatos veem; único botão vermelho | CA4, CA5, CA7, CA8 |
| Pedido recebido | `/ajuda/[id]` | Para o contato: nome, hora, endereço aproximado em texto e **Abrir no Google Maps** | CA4 |

- **Convite:** o app cria o código na API e abre o menu de compartilhar com o link. O código só aparece uma vez (regra da API); se a pessoa sair da tela, cria outro. Convites pendentes podem ser cancelados. A API só mostra o nome de quem convidou depois do aceite.
- **Limites (o app aplica, a API ainda não):** 5 contatos contando os convites pendentes (CA3) e 3 pedidos de ajuda por hora (CA7). No quarto pedido, o app explica e diz que **não foi enviado**.
- **Sem internet (CA8):** o app diz na hora que o pedido não foi enviado, nunca mostra "enviado".
- **Pedido de ajuda:** vai com a posição **arredondada para cerca de 100 m** (endereço aproximado) e uma chave de idempotência reaproveitada por 120 s, para um toque repetido não virar dois pedidos. A tela mostra a situação sem prometer entrega ("o aviso saiu", nunca "recebido").
- **Mensagem (CA5):** convite e pedido não pedem login, senha, dinheiro nem instalação e terminam com "Se não reconhece, ignore".
- **Push:** depois de entrar, o app registra o token Expo do aparelho na API (`PUT /v1/push/tokens`), e tocar no aviso abre o pedido. Precisa de development build com projeto EAS (`extra.eas.projectId`); sem isso, o contato vê o pedido em **Contatos > Pedidos de ajuda recebidos**.
- **Estado da API:** contatos, convites e push já estão na API do Abner; o pânico (`/v1/panico`) ainda está no mock do Prism. Para testar os dois juntos, rode o Prism na porta 4010 (`npx @stoplight/prism-cli mock contracts/openapi.yaml -h 0.0.0.0`) e ponha no `.env` também `EXPO_PUBLIC_PANICO_URL=http://IP-DO-PC:4010`. Sem essa variável, o pânico usa o `EXPO_PUBLIC_API_URL`.

### Parear hoodi Pet e hoodi Pet conectado (F06)

- **Parear** (`/pet/parear`): um **radar em Lottie** roda enquanto procura. Ao abrir, procura os Pets por perto por 15 s e lista com o sinal ("Sinal forte · a menos de 1 m"). Tocar em **Parear** conecta, grava o token deste celular no Pet e abre a tela do Pet.
- **Avisos:** Expo Go sem Bluetooth, permissão negada (**Permitir**), Bluetooth desligado (CA6), nenhum Pet encontrado com dicas e **Procurar de novo** (CA7), e sempre "Só este celular comanda o Pet" (CA9).
- **hoodi Pet conectado** (`/pet/conectado`): estado da conexão, as três carinhas (tranquila, atenta, preocupada), **Testar vibração** (CA5) e **Desconectar** com confirmação.
- **Início:** o indicador **hoodi Pet** fica verde quando conectado e mostra **Conectar** quando não há Pet; tocar abre o pareamento ou a tela do Pet.
- O Pet pareado fica salvo na tabela `pet_pareado`; ao abrir o app, ele tenta reconectar sozinho. Se a conexão cair, o Início volta a mostrar o Pet desconectado (CA8).

**Bluetooth e Expo Go:** o Expo Go não tem o módulo de Bluetooth. Para testar o pareamento é preciso um **development build** (veja "Testar o Bluetooth" abaixo). No Expo Go e no navegador a tela mostra um aviso no lugar da busca.

#### Animação de busca (Lottie)

"Radar", de Debashish Nabajja, no [LottieFiles](https://lottiefiles.com/10336-radar), sob a Lottie Simple License. O arquivo original usava expressões, que o Lottie nativo não executa; elas foram convertidas em quadros-chave em [`assets/animacoes/busca-radar.json`](assets/animacoes/busca-radar.json). As cores são trocadas pelas do tema em tempo de execução, e a animação fica parada com "Reduzir movimento" ligado. Na pré-visualização web aparece a carinha "procurando" no lugar.

#### Protocolo BLE com o hoodi Pet (PROVISÓRIO, a combinar com o Nando)

| Item | Valor |
|---|---|
| Nome anunciado | `hoodi Pet XXXX` (4 últimos dígitos hex do MAC) |
| Serviço | `f3a1c0de-0001-4b6f-8f0d-686f6f646900` |
| Característica de pareamento (write) | `f3a1c0de-0002-4b6f-8f0d-686f6f646900` · recebe o token de 8 bytes |
| Característica de comando (write) | `f3a1c0de-0003-4b6f-8f0d-686f6f646900` · token (8) + comando (1) + argumento (1) |

| Comando | Byte | Argumento | O que o Pet faz |
|---|---|---|---|
| Alerta | `0x01` | `0` tranquila · `1` atenta · `2` preocupada | Mostra a carinha e vibra no padrão do nível |
| Teste | `0x02` | `0` | Passa pelas três carinhas, vibrando em cada uma (F06 CA5) |
| Esquecer | `0x03` | `0` | Apaga o token (desfaz o pareamento) |

**Só este celular comanda o Pet (CA9):** o Pet guarda o token recebido no pareamento (NVS do ESP32) e ignora comandos que não começam com ele. Para parear com outro celular, o Pet precisa ser resetado (por exemplo, segurando o botão). Os valores ficam em [`src/features/pet/protocolo.ts`](src/features/pet/protocolo.ts).

#### Testar o Bluetooth (development build)

1. Crie uma conta gratuita em [expo.dev](https://expo.dev) e entre com `npx eas-cli@latest login`.
2. Gere o app instalável de desenvolvimento para Android: `npx eas-cli@latest build --profile development --platform android` (na primeira vez, o EAS cria o `eas.json`). O build roda na nuvem e devolve um link para instalar o APK.
3. Instale o APK no celular Android e rode `npm run start:dev`. O app instalado lê o QR code no lugar do Expo Go.

No iPhone, o development build exige conta paga da Apple; por isso, o teste de Bluetooth da equipe é no Android.

### Configurar o relógio (F06 CA1, CA2)

- Tela `/relogio`: "Receba o aviso no pulso", três passos (ativar as notificações do hoodi, háptico forte, exceção no modo Foco) e uma observação por plataforma (no iPhone, o aviso só chega ao relógio com o celular bloqueado).
- **Aparece uma vez:** no primeiro acesso o Início abre a tela sozinho. Quando as Permissões (F02) existirem, elas devem abrir `/relogio` logo depois.
- **Concluí:** marca o relógio como canal de aviso; o indicador **Relógio** do Início fica verde. O app não consegue detectar o relógio, então vale a confirmação da pessoa.
- **Fazer depois:** fecha sem ativar; o indicador **Relógio** mostra **Configurar** e reabre a tela. O Perfil (F08) pode abrir `/relogio` para rever os passos.
- Fica salvo na tabela `preferencias` (`relogio_orientacao_vista` e `relogio_configurado`).

### Alerta de risco (F07)

O "motor" do app. Com a localização permitida e o app aberto, ele segue o GPS, descobre a célula na grade salva e atualiza o Início e o Mapa. **Durante um trajeto**, quando o nível sobe:

1. **Aviso na tela**, por cima de qualquer aba (componente "Alerta de risco" do design system): Risco alto em vermelho com **Ver desvio**, fica até a pessoa agir ou sair da área (CA6); Risco médio em âmbar, some sozinho.
2. **Notificação** do celular, que o **relógio espelha** (o app não fala direto com o relógio).
3. **hoodi Pet** vibra e mostra a carinha do nível (comando `0x01` do protocolo).
4. **Histórico:** o alerta é salvo na tabela `alertas`.
5. O trajeto soma o alerta e recalcula o **próximo trecho de maior risco** pelo caminho.

| Regra | Como o app faz | QA |
|---|---|---|
| Alerta só quando o nível sobe | Compara com o último nível com dado | CA1, CA2 |
| Intervalo mínimo | 2 minutos entre dois alertas | CA3 |
| Divisa entre células | Só troca de célula depois de entrar 30 m na nova | CA4 |
| Sem dado | Nunca alerta e não conta como nível conhecido | CA5 |
| Texto | o quê + onde + o que fazer, sem "!" | CA7 |
| Sem trajeto | Não alerta | F05 CA4 |

A lógica fica em [`src/features/alerta/motor.ts`](src/features/alerta/motor.ts), separada da tela, e foi testada com os cenários do QA (TC26, TC37, intervalo, divisa, fora da área). O acompanhamento fica em [`acompanhamento-context.tsx`](src/features/alerta/acompanhamento-context.tsx).

**Localização:** o Início mostra **Permitir localização**, explicando o motivo antes do pedido do sistema. Se a pessoa negou, o botão abre as configurações. A posição fica só no aparelho.

**Limitação:** o acompanhamento roda com o app aberto. Seguir o trajeto com a tela bloqueada (F05 CA3) exige localização em segundo plano, que só funciona no development build; fica como próximo passo.

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
| `pet_pareado` | hoodi Pet pareado e o token deste celular | F06 |
| `preferencias` | Preferências em chave/valor (orientação do relógio; pode ser usada pelo Perfil) | F06, F08 |

Tudo fica só no aparelho. Na pré-visualização web, que não tem SQLite, os repositórios `.web.ts` usam o `localStorage`.

## Como contribuir

- Uma branch por tela ou feature, saindo da `main`: `feat/hoodi-<tela>` (ex.: `feat/hoodi-inicio`).
- Abra um pull request para a `main` e peça revisão de quem cuida da outra metade.
- Antes do PR, rode `npm run typecheck` e `npm run lint`.
- Use os componentes de `src/components/ui` e os tokens de `src/theme` em vez de cores e tamanhos soltos.
- Registre os prompts de IA usados em `prompts.md` (regra da GS).

## Pendências

- **Início sem trajeto:** o design system não desenha esse estado. Hoje ele mostra o status atual, Pedir ajuda e Comparar rotas.
- **Início fora do design system v3:** a régua deu lugar à telinha do Pet, e os cards agora têm borda de 1px e sombra sutil (o v3 pede cards sem borda e sem sombra). Falta levar ao design system.
- **Ícone do app e splash:** ainda são os do template do Expo.
- **Integrações:** GPS, grade de risco, API e Bluetooth com o hoodi Pet ainda não estão ligados; por isso o Início mostra só os estados vazios.
- **"Localizando você":** estado novo para quando a posição ainda não é conhecida. Não existe no design system v3; falta validar com quem cuida do design.
