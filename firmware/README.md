# Integração do ESP32 com a Agrovia

Este guia liga o aparelho físico (ESP32 + sensor de umidade + relé de irrigação) à API da Agrovia.

## Como funciona

```
ESP32 ──(a cada 60 s) POST /api/iot/leituras {umidade}──▶ API ──▶ HISTORICO_UMIDADE
   ▲                                                        │
   └──── resposta traz os comandos pendentes (LIGAR/DESLIGAR)┘
ESP32 executa e confirma: POST /api/iot/comandos/:id/confirmacao {EXECUTADO|FALHOU}

Painel (Sensores → Irrigação) ──POST /api/dispositivos/:id/comandos──▶ COMANDOS_IRRIGACAO
```

- **Autenticação do aparelho:** cabeçalho `X-Device-Key`. A chave é gerada no painel (Sensores → menu ⋯ → *Gerar chave do dispositivo*), aparece uma única vez e só o hash SHA-256 fica no banco. Gerar outra chave invalida a anterior.
- **Conectado/desconectado:** o painel mostra "Conectado" quando o aparelho enviou uma leitura nos últimos 3 minutos (o horário vem do histórico, não da coluna `ultima_atualizacao`, que o banco da instituição atualiza sozinho a cada edição).
- **Comandos:** valem por 2 minutos. Se o aparelho não buscar a tempo, o comando expira e nada é acionado. Uma ordem nova substitui a pendente. A duração aceita vai de 5 s a 60 min.
- **Segurança de campo (no firmware):** o relé começa desligado em todo boot; a válvula fecha pelo relógio do próprio ESP32, mesmo sem internet; nenhuma irrigação passa de `IRRIGACAO_MAXIMA_S`; watchdog reinicia o aparelho travado (e o relé volta desligado).

## Material

| Item | Observação |
| --- | --- |
| ESP32 DevKit (ESP32-WROOM-32) | Qualquer placa ESP32 com Wi-Fi 2,4 GHz |
| Sensor capacitivo de umidade do solo (v1.2 ou similar) | Preferir capacitivo: o resistivo corrói em semanas |
| Módulo relé 1 canal (ou driver MOSFET) | Para acionar válvula solenoide ou contator da bomba |
| Válvula solenoide / bomba + fonte própria | **Nunca** alimentar a carga pelo 3,3 V/5 V do ESP32 |
| Diodo de roda livre (1N4007) | Obrigatório em solenoide DC, se o módulo não tiver |

## Ligações (padrão do `config.example.h`)

| ESP32 | Componente |
| --- | --- |
| 3V3 | VCC do sensor |
| GND | GND do sensor e do módulo relé |
| GPIO 34 (ADC1) | AOUT do sensor — use só pinos 32–39 (ADC2 não funciona com Wi-Fi ligado) |
| GPIO 26 | IN do módulo relé |
| 5V (VIN) | VCC do módulo relé (conforme o módulo) |

Cargas em 127/220 V exigem instalação por profissional habilitado (contator, disjuntor e aterramento).

## Passo a passo

1. **Aplicar a migração 006** no banco (dentro de `backend`):
   ```bash
   npm run db:migrate -- --dry-run --from=006
   npm run db:migrate -- --from=006
   npm run test-db
   ```
2. No painel, cadastre o dispositivo (Conta → Dispositivos) e gere a chave em **Sensores → ⋯ → Gerar chave do dispositivo**.
3. Teste sem hardware com o simulador (dentro de `backend`):
   ```bash
   AGROVIA_API=http://localhost:5000 AGROVIA_DEVICE_KEY=agv_... node tools/simulador-esp32.js --intervalo=10
   ```
   Em **Sensores → Irrigação**, envie "Irrigar por 1 min": o simulador mostra a válvula abrindo e o painel muda o status para *Executado*.
4. Firmware: copie `esp32-agrovia/config.example.h` para `config.h` e preencha **só o Wi-Fi e a `DEVICE_KEY`**: `API_ORIGEM` já aponta para o Render e o `ROOT_CA` já traz os certificados raiz conferidos (GTS Root R4/R1, GlobalSign Root CA e ISRG Root X1). Instale **ArduinoJson 7** e o núcleo **ESP32** na Arduino IDE, selecione *ESP32 Dev Module* e grave.
5. Abra o **Monitor Serial a 115200**. No boot aparecem o **MAC** (é ele que se cadastra no painel) e a API; depois, a cada minuto, `[SENSOR] Umidade x % (valor bruto y)` e `[API] 1 leitura(s) enviada(s) com sucesso`. No painel o dispositivo passa a **Conectado** e o gráfico do Painel mostra as leituras.
6. **Calibre o sensor:** use o *valor bruto* do Monitor Serial com o sensor no ar/solo seco (`LEITURA_SECO`) e em água ou solo saturado (`LEITURA_MOLHADO`). Para leituras em umidade volumétrica real, faça a calibração gravimétrica com o solo da área.

### Se algo der errado no Monitor Serial

| Mensagem | O que fazer |
| --- | --- |
| `[WIFI] Falha ao conectar` | Confira `WIFI_SSID`/`WIFI_PASS`; o ESP32 só usa Wi-Fi **2,4 GHz**. |
| `[API] Envio falhou (-1)` ou negativo | Sem resposta: confira `API_ORIGEM` e o `ROOT_CA`. O Render "dorme" sem uso e leva até ~1 min para acordar; a leitura fica guardada e vai no próximo envio. |
| `[API] Envio falhou (401)` | Chave recusada: copie de novo a `DEVICE_KEY` (sem espaços) ou gere outra no painel. Gerar outra invalida a anterior. |
| `[API] Envio falhou (429)` | Envios com menos de 5 s de intervalo; mantenha `INTERVALO_LEITURA_S` em 60. |
| Umidade sempre 0 % ou 100 % | Calibração: ajuste `LEITURA_SECO`/`LEITURA_MOLHADO` com o valor bruto exibido. |

## Contrato da API do aparelho

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/api/iot/leituras` | `{ "umidade": 41.5 }` ou `{ "leituras": [{ "umidade": 41.5, "timestamp": 1730000000 }] }` (até 50, até 7 dias atrás) | `201 { recebidas, comandos: [{ id, acao, duracaoSegundos }], intervaloSegundos }` |
| GET | `/api/iot/comandos` | — | `{ comandos: [...] }` (também registra contato) |
| POST | `/api/iot/comandos/:id/confirmacao` | `{ "status": "EXECUTADO" \| "FALHOU", "mensagem": "..." }` | `{ ok: true }` |

Erros: `401` chave inválida, `400` dados inválidos (umidade fora de 0–100, horário no futuro), `429` envios com menos de 5 s de intervalo, `503` banco indisponível ou migração 006 não aplicada.

## O que ainda falta para operação real

- **Testar o firmware no hardware.** Ele foi escrito para o núcleo ESP32 2.x/3.x e ArduinoJson 7, mas não pôde ser compilado nem gravado neste ambiente.
- **Calibração do sensor por área:** os limites seco/molhado mudam com o solo e com o modelo do sensor.
- **Irrigação automática por limiar:** hoje a irrigação é manual pelo painel. A regra automática (irrigar quando a umidade cair abaixo do limite da cultura, respeitando RAW = p × TAW) é o próximo passo, usando os limiares de CULTURAS e os parâmetros do capítulo técnico dos estudos.
- **Hidrômetro ou sensor de vazão:** para confirmar que a água realmente passou, não apenas que o relé foi acionado.
- **Alertas** (sensor sem comunicação, umidade fora da faixa, comando com falha) por e-mail, que depende do SMTP.
- **Atualização de firmware pela rede (OTA)**, para não precisar regravar via USB no campo.
- O gráfico do Painel já mostra as leituras reais (até 500 por dispositivo, com filtros de 1 h, 6 h e recentes); um histórico longo por semanas/meses ainda não existe.
