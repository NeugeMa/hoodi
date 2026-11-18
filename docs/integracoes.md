# Integrações e como rodar com tudo ligado

API .NET do Abner, modo demonstração, grade de risco, Bluetooth com o Hoodi Pet e o development build (EAS).

[← Voltar ao README](../README.md)

## Rodar com a API local

Para testar com **conta de verdade** (criar conta, confirmar pelo e-mail, entrar e continuar logado), duas coisas rodam no PC: a **API** e o **Mailpit** (recebe os e-mails). O app (este repositório) roda à parte, com o `npm start`. Para só ver o app funcionando, sem nada disso, use o [modo demonstração](#modo-demonstração-no-navegador-vídeo-e-prints).

**Pré-requisitos:** [.NET 10 SDK](https://dotnet.microsoft.com/download), [Node.js](https://nodejs.org/) 20+ e o Mailpit (passo 2). Celular e PC na mesma rede Wi-Fi.

### 1. Baixar e subir a API

A API fica no repositório do Abner: **https://github.com/APB-Abner/Hoodi**

```bash
git clone https://github.com/APB-Abner/Hoodi.git
cd Hoodi
dotnet run --project Hoodi.Api -- --urls http://0.0.0.0:5000 --environment Development --Https:RedirectEnabled=false
```

- **O `--Https:RedirectEnabled=false` é obrigatório para o celular:** sem ele, a API responde 307 e manda tudo para `https://…:443`, e o app mostra "Não foi possível falar com o Hoodi".
- O `--environment Development` deixa a API subir sem as chaves de produção. Nesse modo, as chaves de login mudam toda vez que a API sobe: se ela reiniciar, é preciso entrar de novo no app.
- Documentação da API em `http://IP-DO-PC:5000/scalar`.

### 2. Receber o e-mail do cadastro (Mailpit)

Em desenvolvimento, **a API não manda e-mail de verdade** (nada chega no Gmail). Ela entrega o e-mail a um servidor de e-mail de teste no próprio PC, na porta `1025`. O **Mailpit** faz esse papel e mostra os e-mails numa página.

Com Docker:

```bash
docker run -d --name mailpit -p 8025:8025 -p 1025:1025 axllent/mailpit
```

Sem Docker: baixe o executável em [github.com/axllent/mailpit/releases](https://github.com/axllent/mailpit/releases) e rode `mailpit`.

Os e-mails aparecem em **http://localhost:8025**, no PC.

### 3. Publicar a grade de risco (uma vez)

A API sobe **sem grade**: até alguém publicar, o Mapa mostra "Dados de risco ainda não publicados". Só uma conta de **operador** publica:

1. Crie uma conta para isso (pelo app ou pela API) e pegue o id dela (o `sub` do token de login).
2. Suba a API com esse id em `Risk__ImporterUserIds__0` (variável de ambiente).
3. Entre com essa conta e publique os arquivos do ML que estão no repositório da API:

```bash
curl --fail-with-body "http://localhost:5000/v1/admin/risco/importar" \
  -H "Authorization: Bearer TOKEN-DO-OPERADOR" \
  -F 'versao=nando-v2-2026-jan-set' \
  -F 'csv=@data/risk/v2/risco_h3_faixa_v2.csv' \
  -F 'sha256=@data/risk/v2/risco_h3_faixa_v2.csv.sha256' \
  -F 'manifest=@data/risk/v2/manifest.json' \
  -F 'fixture=@data/risk/v2/fixture_v2.json'
```

Resposta 201: publicada. A grade fica salva no banco da API; não precisa repetir. Detalhes em `docs/risk-snapshot-v2-integration.md`, no repositório da API.

**Rotas:** o Comparar rotas usa o provedor HeiGIT pela API, com a chave em `Rotas__ApiKey` (variável de ambiente, nunca no repositório nem no app). Sem a chave, a API responde "indisponível" e o app diz que não deu para comparar agora. Detalhes em `docs/routes-v0.6.md`, no repositório da API.

### 4. Apontar o app para o PC

Na raiz **deste** repositório, crie o arquivo `.env` com o IP do PC na rede (no Windows, `ipconfig`). Não use `localhost`: no celular, `localhost` é o próprio celular.

```
EXPO_PUBLIC_API_URL=http://IP-DO-PC:5000
```

Depois rode (ou reinicie) o `npm start` e abra o app no celular pelo Expo Go. Se o Windows perguntar, permita o acesso do .NET e do Node na rede privada.

### 5. Criar a conta e confirmar pelo link

1. No app, toque em **Criar conta**, preencha e envie. O app mostra **Confira seu e-mail**.
2. No PC, abra **http://localhost:8025** e abra o e-mail "Confirme seu e-mail".
3. Copie o link inteiro, que começa com `hoodi://confirmar#token=`. Ele vale por **30 minutos**.
4. Mande o link para o celular (por exemplo, pelo WhatsApp para você mesma) e cole no campo **Link do e-mail** da tela Confira seu e-mail.
5. Pronto: a conta é confirmada e o app já entra. Nas próximas vezes, é só **Entrar** com o e-mail e a senha.

O mesmo vale para **Esqueci a senha** (link `hoodi://redefinir-senha#token=`) e para os **convites de contato** (link `hoodi://convite#codigo=`).

### O que vem da API

| Parte | Situação |
|---|---|
| Contas, contatos, convites, pedido de ajuda, excluir conta | **Na API** |
| Grade de risco do Mapa (`/v1/risco/versao-atual` e `/v1/risco/grade`) | **Na API**, depois de publicada (passo 3). Pública: não precisa de login |
| Comparar rotas (`/v1/rotas/avaliar`) | **Na API**, com o provedor HeiGIT. Precisa da chave do provedor na API |

## Modo demonstração no navegador (vídeo e prints)

Para gravar o vídeo (por exemplo com o Claude Motion) ou tirar prints no **localhost**, o app tem um modo com **dados simulados**, sempre sinalizado na tela com o selo **"Demonstração · dados simulados"**.

```bash
npx expo start --web --port 8081
```

Depois abra **http://localhost:8081/?demo=1**. O modo fica ligado até abrir com `?demo=0`.

| No modo demonstração | Como funciona |
|---|---|
| Conta | `demo@hoodi.dev` / `Teste@2026` (a tela Entrar tem o botão **Preencher**). Criar conta também funciona; o botão "Abrir o link do e-mail (demonstração)" faz o papel do e-mail |
| API | Uma API simulada dentro do app responde no mesmo formato da API do Abner (contas, contatos, convites, pedido de ajuda, rotas, excluir conta). Tudo em memória: some ao recarregar a página |
| Grade de risco | Grade simulada em volta da FIAP Paulista, com Área tranquila, Risco médio, Risco alto e Sem dado. **Não são registros da SSP-SP** |
| Posição | Fica na FIAP Paulista. Ao **Iniciar trajeto**, "anda" sozinha pela rota escolhida (a rota inteira em ~1 min): aparecem o aviso antecipado, os alertas, a carinha mudando e o histórico |
| Comparar rotas | Qualquer destino vira a Estação Liberdade (o exemplo do TC13): **Menor risco registrado** (evita 3 células de risco alto) x **Rota normal** |
| Contatos | Ana (confirmada), um convite pendente e Bruno (de quem você é contato, com um pedido de ajuda recebido) |
| Mapa | No navegador, a grade é desenhada em SVG (mapa esquemático, sem ruas); no celular aparece o mapa de verdade |

Roteiro sugerido para o vídeo: Permissões → Configurar o relógio → Início → Mapa → Entrar (Preencher) → Comparar rotas → Iniciar trajeto → esperar o aviso e o alerta → Mapa com o trajeto → Histórico → Perfil → Contatos → Pedir ajuda. Para o tema escuro: Perfil > Aparência > Tema. **Navegue pelas abas e botões do app** (recarregar a página recomeça a demonstração e encerra o trajeto).

Fora do modo demonstração nada disso existe: o app usa a API, o GPS e o Bluetooth de verdade.


## Grade de risco: download e banco local

A grade vem do ML (Nando), publicada pela API (contrato v0.6, snapshot H3 v2): **279 células H3** (resolução 9, hexágonos de cerca de 170 m) em volta da FIAP Paulista, com o nível em **5 faixas de horário**, a partir dos registros da SSP-SP de jan. a set. de 2026.

1. **Versão:** [`grade-api.ts`](../src/features/grade/grade-api.ts) busca `GET /v1/risco/versao-atual` (versão, SHA-256 do CSV e manifesto do produtor).
2. **CSV:** se a versão mudou, baixa `GET /v1/risco/grade` e confere o **SHA-256 dos bytes** com o da versão (F03 CA8). Não bateu: busca a versão de novo e tenta mais uma vez (uma publicação pode ter saído no meio); continuou errado, recusa e fica com a grade anterior.
3. **Conversão:** [`grade-h3.ts`](../src/features/grade/grade-h3.ts) lê o CSV e calcula o contorno de cada hexágono com o `h3-js` (no próprio celular).
4. **Banco:** a última grade válida fica no **SQLite**, tabela `grade_risco` ([`grade-repo.ts`](../src/features/grade/grade-repo.ts)): o Mapa e o alerta funcionam sem internet (F03 CA6).

| No CSV da API | No app |
|---|---|
| `com_dado`, nível 0 | Área tranquila |
| `com_dado`, nível 1 | Risco médio |
| `com_dado`, nível 2 | Risco alto |
| `com_dado`, nível 3 | **Risco alto** (o nome do nível 3 ainda não foi decidido pela equipe) |
| `sem_dado` (0 a 2 registros, suprimidos por privacidade) | Sem dado, **nunca** área tranquila |
| Fora das 279 células | Sem dado (fora da área coberta) |

| Faixa | Horário |
|---|---|
| 0 madrugada | 0h–6h |
| 1 manhã | 6h–12h |
| 2 tarde | 12h–18h |
| 3 noite cedo | 18h–21h |
| 4 noite | 21h–24h |

- **Onde a pessoa está:** o app acha o hexágono que contém a posição; a margem de 30 m na divisa (F07 CA4) é medida até a borda do hexágono.
- **Nome da rua:** a grade só traz o código H3. Para os textos ("Onde você está agora", alertas, detalhe da célula), o **celular** converte o centro da célula em rua com o geocodificador do sistema, uma vez por célula ([`referencia.ts`](../src/features/grade/referencia.ts)). Até chegar (ou sem internet), os textos aparecem sem a rua.
- **"Dados de":** o Mapa mostra o período dos registros ("Registros de jan. a set. 2026"), não a data de publicação.

## Comparar rotas: formato da API

`POST /v1/rotas/avaliar` (com login), corpo `{ origem, destino, saidaEm }`. A API busca até 3 rotas a pé no HeiGIT, pontua cada uma na grade H3 da faixa da saída e devolve, por rota, `geometria` (lista de pontos), `duracaoSegundos`, `posicao` (1 = menor risco acumulado) e `pontuacao` (`acumulada`, `coberturaPercentual`, `percentualSemDado`, `percentualForaCobertura`, `dadoInsuficiente`...). [`comparar.ts`](../src/features/rotas/comparar.ts) aplica a regra dos 70%: se alguma rota tem dado insuficiente ou mais de 30% do caminho sem dado (sem dado + fora da grade), o app não indica a de menor risco.

Recusas com texto próprio no app ([`rotas-api.ts`](../src/features/rotas/rotas-api.ts)): `ROTA_EXTENSA` (destino longe demais a pé), `ROTA_INVALIDA` e `SAIDA_FORA_JANELA` (horário do celular errado). A API aceita 15 comparações por minuto por conta.


## Protocolo BLE com o Hoodi Pet (v1, o do firmware)

Especificação completa no repositório da API: `iot/hoodi-pet/docs/PROTOCOLO_BLE.md`. Os valores ficam em [`src/features/pet/protocolo.ts`](../src/features/pet/protocolo.ts).

| Item | Valor |
|---|---|
| Nome anunciado | `hoodi Pet XXXX` |
| Serviço | `a70ab40e-599a-4803-89db-3b1667e7d753` |
| Comando (write) | `ad7790b4-bf5d-4ee2-a6b2-5faac8195117` · 9 bytes: versão, tipo, sequência (u32 LE), nível, padrão, carinha |
| Status (read/notify) | `147dca7f-bc45-4789-85bb-adc57bc40124` |
| Evento (notify) | `6e9d9b1f-3aef-4015-a8ab-162399270a78` · clique ou pressão longa no botão do Pet |

| Nível no app | Nível no Pet | Vibração | Carinha |
|---|---|---|---|
| Tranquila | 0 | curta | tranquila |
| Médio | 1 | dupla | atenta |
| Alto | 3 | longa | preocupada |
| Sem dado | sem dado | nunca vibra | `?` |

**Só este celular comanda o Pet (CA9):** o pareamento é o do sistema (bonding com código). Na primeira conexão o Pet mostra um código de 6 dígitos e o celular pede para digitar. Depois disso o Pet só aceita este celular. Para trocar de celular: segurar o botão do Pet enquanto liga (modo pareamento por 2 min). **Desconectar** no app esquece o Pet só do lado do app.

**Reforço do alerta:** quando o Pet vibra por risco, o app espera o "vi" (um clique no botão do Pet). Sem clique em 20 s, o Pet vibra de novo e o celular também (uma vez). Fora dessa espera, o clique só acende a tela do Pet. **Pet desconectado na hora do alerta:** o celular vibra direto. **"Avisar no celular também"** (Perfil): o celular vibra junto com o Pet em todo alerta.


## Development build (Bluetooth e push)

O Expo Go não tem Bluetooth nem recebe push no Android; para o Pet e o pedido de ajuda por notificação é preciso o **development build**. O `eas.json` já está no projeto (perfis `development`, `preview` e `production`, com APK no Android).

1. Crie uma conta gratuita em [expo.dev](https://expo.dev) e entre:
   ```bash
   npx eas-cli@latest login
   ```
2. Ligue o projeto ao EAS (uma vez). Isso grava o `extra.eas.projectId` no `app.json`, que o app usa para pedir o token de push:
   ```bash
   npx eas-cli@latest init
   ```
3. **Push no Android:** o Expo precisa da chave do Firebase (FCM V1). Crie um projeto no Firebase, gere a chave da conta de serviço e envie com `npx eas-cli@latest credentials` (Android > Push Notifications: FCM V1). Sem isso, o app funciona, mas o contato só vê o pedido em "Pedidos recebidos".
4. Gere o APK de desenvolvimento (roda na nuvem e devolve um link para instalar):
   ```bash
   npx eas-cli@latest build --profile development --platform android
   ```
5. Instale o APK no celular Android e rode `npm run start:dev`. O app instalado lê o QR code no lugar do Expo Go e usa o `.env` do PC.
6. **APK para a demonstração sem o PC** (perfil `preview`): o `.env` não vai para a nuvem (está no `.gitignore`), então cadastre o endereço da API no EAS antes do build, por exemplo `npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value http://IP-DA-VM --environment preview`, e rode `npx eas-cli@latest build --profile preview --platform android`.

No iPhone, o development build exige conta paga da Apple; por isso, o teste de Bluetooth da equipe é no Android.
