# Integrações e como rodar com tudo ligado

API .NET do Abner, modo demonstração, grade de risco, Bluetooth com o Hoodi Pet e o development build (EAS).

[← Voltar ao README](../README.md)

## Rodar com a API local

1. No PC (repositório da API, .NET 10):
   ```bash
   dotnet run --project Hoodi.Api -- --urls http://0.0.0.0:5000 --environment Development --Https:RedirectEnabled=false
   ```
   **O `--Https:RedirectEnabled=false` é obrigatório para o celular:** sem ele, a API responde 307 e manda tudo para `https://…:443`, e o app mostra "Não foi possível falar com o Hoodi". O `--environment Development` deixa a API subir sem as chaves de produção. Documentação em `http://IP-DO-PC:5000/scalar`.
2. Na raiz deste app, crie o `.env` com `EXPO_PUBLIC_API_URL=http://IP-DO-PC:5000` (o IP da máquina na rede, não `localhost`) e reinicie o `npm start`.
3. O e-mail do cadastro cai no **Mailpit** (SMTP em `127.0.0.1:1025`): `http://localhost:8025` no PC.
4. Partes da API que ainda não existem (grade, rotas, dispositivos) continuam no mock: `npx @stoplight/prism-cli mock contracts/openapi.yaml`.


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


## Grade de risco: banco local e download

- **Banco:** a última grade válida fica no **SQLite** do celular, tabela `grade_risco` ([`grade-repo.ts`](../src/features/grade/grade-repo.ts)); veja "Banco de dados local" abaixo.
- **Download:** [`grade-api.ts`](../src/features/grade/grade-api.ts) busca `GET /grade/manifesto.json` e, se a versão mudou, `GET /grade/{versao}.json`. O app só usa o arquivo se o SHA-256 do texto bater com o do manifesto.
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
