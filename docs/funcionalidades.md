# Funcionalidades, tela por tela

Como cada feature do QA v2 (F01 a F10) funciona no app, com os critérios de aceite que ela atende.

[← Voltar ao README](../README.md)

## Início (F05)

**Ao abrir o app:** animação de introdução com a logo da Chapeuzinho e o nome "Hoodi" (~2 s, parada com "Reduzir movimento"), e o app cai no Início. **Sem conta, o Pet aparece dormindo**: ainda não está cuidando de ninguém.

Mesmo estilo do Mapa: em cima, o que está acontecendo; embaixo, um painel arredondado com os detalhes e o Pedir ajuda.

- **Topo limpo:** sem título nem saudação; o Início começa pela telinha do Pet.
- **Telinha do Hoodi Pet:** a carinha em pixel art (18 × 12), **a mesma da tela OLED do Pet**: os desenhos vêm do `carinhas.json` gerado pelo firmware (`scripts/gerar_carinhas.py`). O app só anima (pisca com os quadros "piscando" do JSON, respira, olha em volta, treme), com a moldura na cor do nível.
- **Canais de aviso (F05 CA2):** os indicadores **Relógio** e **Hoodi Pet**, verdes quando conectados e cinza quando não (nunca vermelho). Sem Pet, o indicador mostra **Conectar** e abre o pareamento.
- **Painel inferior:** "Onde você está agora" com o selo do nível, o bairro e o motivo (o mesmo bloco do Mapa); depois **Seu trajeto** em linhas de lista (tempo até o destino, alertas, próximo trecho de maior risco e **Encerrar**, com confirmação), ou o convite para **Comparar rotas**.
- **Pedir ajuda:** fixo no rodapé do painel, sempre visível, com a quantidade de contatos confirmados.

| Situação | Carinha | Animação |
|---|---|---|
| Área tranquila | tranquila | sorri, respira e pisca |
| Risco médio | atenta | olha para um lado e para o outro |
| Risco alto | preocupada | sobrancelhas franzidas, treme |
| Sem dado | confusa | boca ondulada e "?" (nunca sorri) |
| Posição desconhecida | procurando | olha em volta com pontinhos carregando |

Os desenhos ficam em [`src/features/pet/carinhas.json`](../src/features/pet/carinhas.json) (cópia do firmware; mudou lá, copie para cá), as animações em [`src/features/pet/carinhas.ts`](../src/features/pet/carinhas.ts) e a telinha em [`src/components/pet/tela-pet.tsx`](../src/components/pet/tela-pet.tsx). Com "Reduzir movimento" ligado no celular, a carinha fica parada.

### Como os dados entram

Todo o estado fica em [`src/features/trajeto/trajeto-context.tsx`](../src/features/trajeto/trajeto-context.tsx). Cada integração chama uma função, e a tela se atualiza sozinha:

| Função | Quem chama | O que muda no Início |
|---|---|---|
| `atualizarPosicao` | GPS + grade de risco (F03/F07) | Bairro, carinha, nível e motivo; célula atual no Mapa (`celulaId`) |
| `iniciarTrajeto` | Comparar rotas (F04) | Lista do trajeto e link Encerrar; caminho no Mapa (`caminho`) |
| `atualizarTrajeto` | Acompanhamento do trajeto (F05) | Tempo, alertas e próximo trecho |
| `encerrarTrajeto` | Botão Encerrar trajeto | Volta ao estado sem trajeto |
| `atualizarCanais` | Bluetooth do Hoodi Pet (F06) e relógio | Indicadores Relógio e Hoodi Pet |
| `atualizarContatosConfirmados` | Contatos de segurança (F09) | Dica do Pedir ajuda |



## Mapa (F03)

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

**A grade vem da API** (contrato v0.6): 279 hexágonos H3 em volta da FIAP Paulista, em 5 faixas de horário, com os registros da SSP-SP de jan. a set. 2026. Enquanto a API não tem a grade publicada, o Mapa mostra a cidade em cinza e, no painel, "Dados de risco ainda não publicados" com **Tentar de novo**. No modo demonstração aparece a grade simulada. Detalhes em [integracoes.md](integracoes.md#grade-de-risco-download-e-banco-local).


## Cadastro e acesso (F01)

Ligado à API .NET (`/v1/auth`). **O app abre sempre no Início**, com ou sem conta: Início, Mapa, Histórico, relógio e Hoodi Pet funcionam sem conta. Só Contatos de segurança e Pedir ajuda pedem para entrar; o Perfil, sem conta, mostra **Entrar** e **Criar conta**. Quem faz esses desvios é o `Stack.Protected` em [`src/app/_layout.tsx`](../src/app/_layout.tsx). A sessão fica salva: depois de entrar uma vez, o app continua logado ao abrir de novo.

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
- **Hoodi Pet como mascote:** Entrar e Criar conta têm a telinha do Pet no topo, que reage: olha em volta no e-mail, **fecha os olhos enquanto você digita a senha** (abre se tocar no olho para mostrar), fica confuso num erro e mostra os pontinhos enquanto entra.
- **Senha:** de 10 a 128 caracteres (regra da API), oculta por padrão, com o ícone de olho para mostrar. Todos os campos têm rótulo visível e lido pelo leitor de tela (CA7).
- **Consentimento:** a data em que a pessoa confirmou os 18 anos e aceitou fica salva no aparelho (`preferencias`). A API ainda não guarda o aceite.
- **Sessão:** o access token dura 60 min e é renovado sozinho com o refresh token, uma renovação por vez ([`sessao.ts`](../src/features/conta/sessao.ts)). Se a renovação for recusada, o app volta para Entrar. Os tokens ficam no **SecureStore**, nunca no SQLite.
- **Link do e-mail no Expo Go:** o `hoodi://` só abre o app no development build. No Expo Go (ou com o e-mail aberto no computador), copie o link e cole no campo **Link do e-mail**.


## Contatos de segurança e Pedir ajuda (F09)

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
- **Pelo Hoodi Pet (decisão da equipe, 18/11):** segurar o botão de ajuda do Pet (botão 3) por 3 s envia o pedido **direto**, sem a tela de confirmação, para não precisar tirar o celular do bolso. O Pet vibra uma vez ao reconhecer os 3 s. Pedido registrado: o Pet vibra rápido 5 vezes e o celular avisa ("Pedido de ajuda registrado") e abre o resultado. Não enviado (sem conta, sem internet ou no limite de 3 por hora): o celular vibra longo duas vezes e avisa que **não foi enviado**. Mesmas regras do botão do app (limite, chave de 120 s, posição aproximada) ([`pedido-pelo-pet.ts`](../src/features/ajuda/pedido-pelo-pet.ts)).
- **Mensagem (CA5):** convite e pedido não pedem login, senha, dinheiro nem instalação e terminam com "Se não reconhece, ignore".
- **Push:** depois de entrar, o app registra o token Expo do aparelho na API (`PUT /v1/push/tokens`), e tocar no aviso abre o pedido. Precisa de development build com projeto EAS (`extra.eas.projectId`); sem isso, o contato vê o pedido em **Contatos > Pedidos de ajuda recebidos**.
- **Estado da API:** contatos, convites, push e o **pânico** (`/v1/panico`, v0.6) já estão na API do Abner. O envio do push vem desligado por padrão na API (`Panico__EnvioExpoHabilitado=false`): para a demo, ligue na VM; desligado, o pedido fica registrado e o contato vê em "Pedidos recebidos". O **Comparar rotas** e a **grade de risco** também vêm da API (v0.6).


## Comparar rotas (F04)

Aberta pelo **Comparar rotas** do Início (precisa de conta, porque a API de rotas exige login).

- **Origem:** sempre a sua posição atual (TC13). Sem permissão de localização, a tela pede antes.
- **Destino:** endereço ou nome do lugar, convertido em coordenada pelo **próprio celular** (`expo-location`); nada disso vai para o servidor do Hoodi além da consulta de rotas. Vazio ou não encontrado: o app explica e não compara (CA4).
- **Resultado** (`POST /v1/rotas/avaliar`, rotas a pé do provedor HeiGIT pontuadas na grade H3 pela API): cartões **Menor risco registrado** e **Rota normal** (a mais rápida), com a diferença em minutos e uma frase como "Esta rota evita 3 células de risco alto" (contada na grade salva no aparelho) ou, sem grade, a diferença percentual de risco registrado (CA1). Se a mais rápida já é a de menor risco, aparece um cartão só.
- **Trecho sem dado (CA2 · TC14), regra dos 70% (decisão da equipe em 16/11, igual ao contrato da API):** o app compara quando **todas** as rotas têm pelo menos 70% do caminho com dado, e cada cartão mostra quanto falta, por exemplo **"10% do caminho sem dado. Sem dado não quer dizer área tranquila."** Se alguma rota tem mais de 30% sem dado (pela API ou pela grade do aparelho, vale a maior), o app diz "Não dá para comparar" e mostra as rotas só como "Rota 1, Rota 2", sem indicar a de menor risco. A regra fica em [`comparar.ts`](../src/features/rotas/comparar.ts) (`COBERTURA_MINIMA`).
- **Fora da área (CA4)** e **sem internet (CA5 · TC34):** avisos próprios; sem internet, o botão **Ver o mapa** leva ao Mapa com os dados salvos.
- **Iniciar trajeto (CA6):** começa o acompanhamento com o caminho da rota escolhida (o Mapa desenha) e volta ao Início. Sem consentimento, pede antes (F08 CA4 · TC38).
- **Linguagem (CA3):** só "menor risco registrado" e "melhor dado disponível no período".

> A parte sem dado de cada cartão soma o "sem dado" e o "fora da grade" que a API mede no caminho. **No Azure, o F04 CA2 e o TC14 precisam ser atualizados para a regra dos 70%.**


## Permissões e tema escuro (F02)

- **Permissões** (`/permissoes`): abre em **Perfil > Permissões do celular** (o app não abre mais nela sozinho: ao iniciar, vai da introdução direto para o Início). No Início, o cartão de localização também explica o motivo antes do pedido. Cada permissão (Localização, Notificações, Bluetooth) tem um cartão com o **motivo**, a situação com ícone e palavra (Permitida, Não permitida, Ainda não pedida, Indisponível aqui) e o botão **Permitir**. O pedido do sistema só aparece depois que a pessoa lê o motivo e toca (CA2).
- **Se negar** (CA3, CA4): o app continua funcionando e o cartão diz o que parou: sem localização, a comparação de rotas e o alerta não funcionam, mas o mapa continua; sem notificações, **o relógio** deixa de receber; sem Bluetooth, **o Hoodi Pet** deixa de receber. O botão vira **Abrir configurações** (o sistema não pergunta de novo).
- **No Expo Go**, o Bluetooth aparece como "Indisponível aqui" (só funciona no development build). No navegador, notificações e Bluetooth também.
- **Tema escuro à noite** (CA5): depois das 18h, se o app estiver claro, o Início mostra "Já é noite" com **Usar tema escuro** (troca na hora) e um X que dispensa até o dia seguinte. A escolha fica em **Perfil > Aparência > Tema**.


## Perfil e Dados e privacidade (F08)

O **Perfil** funciona com ou sem conta; sem conta, mostra o convite para **Entrar** ou **Criar conta**.

| Grupo | Linhas | QA |
|---|---|---|
| Alertas | **Avisar no celular também** (o celular vibra junto com o Pet em todo alerta, para quem leva o Pet na mochila), **Som no celular** (liga e desliga), **Antecedência do aviso** (100, 300 ou 600 m) e **Horário dos alertas** (sempre ou só à noite, 18h–6h). O valor escolhido aparece na linha | CA1 |
| Canais de aviso | **Relógio** (reabre a orientação, F06 CA2) e **Hoodi Pet** (conectado, desconectado ou não pareado) | F05 CA2, F06 |
| Segurança e dados | **Contatos de segurança** e **Dados e privacidade** | F09, CA3 |
| Conta | **Sair**, com confirmação | CA6 |

- As preferências ficam no aparelho (tabela `preferencias`, chave `preferencias_alertas`) e continuam valendo ao abrir o app de novo (CA2).
- **Todas fazem efeito:** **avisar no celular também** (vibra o celular junto com o Pet), o **som** (dois canais de notificação no Android, com e sem som), o **horário** (fora dele, o alerta não dispara) e a **antecedência** (aviso antecipado, abaixo). A antiga "intensidade da vibração" saiu: o Pet v1 não tem intensidade, só o padrão por nível.
- **Aviso antecipado:** durante o trajeto, quando o próximo trecho de maior risco fica a menos da antecedência escolhida (100, 300 ou 600 m), o celular e o relógio avisam "Risco alto à frente · Rua X, em 280 m · Mantenha o celular guardado…". Um aviso por trecho; some sozinho e não entra no Histórico (o alerta de verdade continua sendo ao entrar na área, F07).
- **Tema:** em Aparência, "Igual ao celular", "Escuro" ou "Claro".

**Dados e privacidade** (`/privacidade`):
- O que fica no aparelho e o que sai, e que o risco vem da SSP-SP (CA3 · TC32). Sai do aparelho: o pedido de ajuda (para os contatos), a origem e o destino do Comparar rotas (pela API até o HeiGIT; a API não guarda o trajeto) e, para nomes de rua, o endereço digitado ou o centro da célula do mapa (para o geocodificador do sistema, Google ou Apple), nunca a posição exata.
- **Revogar consentimento** (CA4 · TC38): com confirmação; os alertas param e o app explica como dar de novo (**Dar consentimento**). Sem consentimento, Comparar rotas pede o consentimento antes de iniciar o trajeto.
- **Excluir conta** (CA5 · TC39): abre uma folha que explica o que é apagado e **pede a senha** (`DELETE /v1/conta` com `{ senha }`, v0.6 do Abner). A API apaga conta, sessões, convites, vínculos dos dois lados e tokens de push numa transação, e o app volta ao Início sem conta. Senha errada (403 `SENHA_INVALIDA`): "Senha incorreta. Nada foi apagado."


## Parear Hoodi Pet e Hoodi Pet conectado (F06)

- **Parear** (`/pet/parear`): um **radar em Lottie** roda enquanto procura. Ao abrir, procura os Pets por perto por 15 s e lista com o sinal ("Sinal forte · a menos de 1 m"). Tocar em **Parear** conecta e o celular pede o **código de 6 dígitos que aparece na tela do Pet** (pareamento do sistema); depois abre a tela do Pet.
- **Avisos:** Expo Go sem Bluetooth, permissão negada (**Permitir**), Bluetooth desligado (CA6), nenhum Pet encontrado com dicas e **Procurar de novo** (CA7), e sempre "Só este celular comanda o Pet" (CA9).
- **Hoodi Pet conectado** (`/pet/conectado`): estado da conexão, as três carinhas (tranquila, atenta, preocupada), **Testar vibração** (CA5) e **Desconectar** com confirmação.
- **Início:** o indicador **Hoodi Pet** fica verde quando conectado e mostra **Conectar** quando não há Pet; tocar abre o pareamento ou a tela do Pet.
- O Pet pareado fica salvo na tabela `pet_pareado`; ao abrir o app, ele tenta reconectar sozinho.
- **Se a conexão cair (CA8):** o Início mostra o Pet desconectado; **durante um trajeto**, o celular avisa por notificação (que o relógio espelha) "Hoodi Pet desconectado · Os alertas continuam no celular e no relógio". O app tenta reconectar sozinho (em 3, 6, 12 e 24 s e depois a cada 30 s) e, quando volta, reenvia a carinha do nível atual sem vibrar. Desconectar de propósito para as tentativas.

**Bluetooth e Expo Go:** o Expo Go não tem o módulo de Bluetooth. Para testar o pareamento é preciso um **development build** (veja "Testar o Bluetooth" abaixo). No Expo Go e no navegador a tela mostra um aviso no lugar da busca.

### Animação de busca (Lottie)

"Radar", de Debashish Nabajja, no [LottieFiles](https://lottiefiles.com/10336-radar), sob a Lottie Simple License. O arquivo original usava expressões, que o Lottie nativo não executa; elas foram convertidas em quadros-chave em [`assets/animacoes/busca-radar.json`](../assets/animacoes/busca-radar.json). As cores são trocadas pelas do tema em tempo de execução, e a animação fica parada com "Reduzir movimento" ligado. Na pré-visualização web aparece a carinha "procurando" no lugar.


## Configurar o relógio (F06 CA1, CA2)

- Tela `/relogio`: "Receba o aviso no pulso", três passos (ativar as notificações do hoodi, háptico forte, exceção no modo Foco) e uma observação por plataforma (no iPhone, o aviso só chega ao relógio com o celular bloqueado).
- **Como abrir:** pelo indicador **Relógio** do Início ("Configurar") ou em **Perfil > Canais de aviso > Relógio**. O app não abre mais nela sozinho ao iniciar.
- **Concluí:** marca o relógio como canal de aviso; o indicador **Relógio** do Início fica verde. O app não consegue detectar o relógio, então vale a confirmação da pessoa.
- **Fazer depois:** fecha sem ativar; o indicador **Relógio** mostra **Configurar** e reabre a tela. O Perfil (F08) pode abrir `/relogio` para rever os passos.
- Fica salvo na tabela `preferencias` (`relogio_orientacao_vista` e `relogio_configurado`).


## Alerta de risco (F07)

O "motor" do app. Com a localização permitida e o app aberto, ele segue o GPS, descobre a célula na grade salva e atualiza o Início e o Mapa. **Durante um trajeto**, quando o nível sobe:

1. **Aviso na tela**, por cima de qualquer aba (componente "Alerta de risco" do design system): Risco alto em vermelho com **Ver desvio**, fica até a pessoa agir ou sair da área (CA6); Risco médio em âmbar, some sozinho.
2. **Notificação** do celular, que o **relógio espelha** (o app não fala direto com o relógio).
3. **Hoodi Pet** vibra e mostra a carinha do nível. Sem clique no Pet em 20 s, vibra de novo junto com o celular (reforço). Fora dos alertas, a carinha acompanha o nível sem vibrar, e no fim do trajeto o Pet dorme.
4. **Histórico:** o alerta é salvo na tabela `alertas`.
5. O trajeto soma o alerta e recalcula o **próximo trecho de maior risco** pelo caminho.

| Regra | Como o app faz | QA |
|---|---|---|
| Alerta só quando o nível sobe | Compara com o último nível com dado | CA1, CA2 |
| Intervalo mínimo | 2 minutos entre dois alertas. Subida dentro desse tempo fica pendente e alerta quando o intervalo acaba, se a pessoa ainda estiver acima do nível do último alerta | CA3 |
| Divisa entre células | Só troca de célula depois de entrar 30 m na nova | CA4 |
| Sem dado | Nunca alerta e não conta como nível conhecido | CA5 |
| Texto | o quê + onde + o que fazer, sem "!" | CA7 |
| Sem trajeto | Não alerta | F05 CA4 |

A lógica fica em [`src/features/alerta/motor.ts`](../src/features/alerta/motor.ts), separada da tela, e foi testada com os cenários do QA (TC26, TC37, intervalo, divisa, fora da área). O acompanhamento fica em [`acompanhamento-context.tsx`](../src/features/alerta/acompanhamento-context.tsx).

**Localização:** o Início mostra **Permitir localização**, explicando o motivo antes do pedido do sistema. Se a pessoa negou, o botão abre as configurações. A posição fica só no aparelho.

**Limitação:** o acompanhamento roda com o app aberto. Seguir o trajeto com a tela bloqueada (F05 CA3) exige localização em segundo plano, que só funciona no development build; fica como próximo passo.


## Histórico (F10)

Os alertas recebidos nos trajetos, guardados só no aparelho.

- **Chip do topo** com a quantidade de alertas e um **resumo dos últimos 7 dias** (total, Risco médio e Risco alto).
- **"Guardado só neste aparelho":** o histórico não é enviado para ninguém e abre sem internet (CA2).
- **Lista agrupada por dia** (Hoje, Ontem, "9 nov."), do mais recente para o mais antigo, com ícone do nível, rua e "Risco alto · 23:14" (CA1).
- **Apagar histórico**, com confirmação (CA3). Sem alertas: "Ainda não há alertas" (CA4).

Os alertas ficam na tabela `alertas` do SQLite ([`historico-repo.ts`](../src/features/historico/historico-repo.ts)). O alerta de risco (F07) chama `registrarAlerta({ criadoEm, nivel, trecho })` cada vez que dispara, e a exclusão de conta (F08) pode chamar `apagarHistorico()`. Com a aba aberta, um alerta novo aparece na hora.
