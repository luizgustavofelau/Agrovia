#!/usr/bin/env node
// Simulador do ESP32 da Agrovia: faz exatamente o que o firmware faz, sem hardware.
//
// Uso (dentro de backend):
//   AGROVIA_API=http://localhost:5000 AGROVIA_DEVICE_KEY=agv_... node tools/simulador-esp32.js
// Opções: --intervalo=10 (segundos entre leituras), --ciclos=0 (0 = infinito),
//         --umidade=45 (umidade inicial em %)
//
// Modelo simples de solo: a umidade cai aos poucos (evapotranspiração) e sobe enquanto a
// "válvula" simulada está aberta. Comandos recebidos são executados e confirmados na API.

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? 'true'];
}));

const API = String(process.env.AGROVIA_API || 'http://localhost:5000').replace(/\/+$/, '');
const CHAVE = process.env.AGROVIA_DEVICE_KEY || '';
const INTERVALO = Math.max(Number(args.intervalo) || 10, 5);
const CICLOS = Number(args.ciclos) || 0;
// Limite de segurança local, igual ao firmware: nunca irrigar mais que isso por comando.
const DURACAO_MAXIMA_LOCAL = 3600;

if (!CHAVE.startsWith('agv_')) {
  console.error('Defina AGROVIA_DEVICE_KEY com a chave gerada em Sensores → Gerar chave do dispositivo.');
  process.exit(1);
}

let umidade = Number(args.umidade) || 45;
let valvulaAteMs = 0;

const valvulaAberta = () => Date.now() < valvulaAteMs;
const log = (...m) => console.log(new Date().toLocaleTimeString('pt-BR'), ...m);

async function chamar(metodo, caminho, corpo) {
  const resposta = await fetch(API + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', 'X-Device-Key': CHAVE },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(`${resposta.status} ${dados.mensagem || ''}`.trim());
  return dados;
}

async function executar(comando) {
  let status = 'EXECUTADO';
  let mensagem;
  if (comando.acao === 'LIGAR') {
    const duracao = Math.min(Number(comando.duracaoSegundos) || 0, DURACAO_MAXIMA_LOCAL);
    if (duracao <= 0) {
      status = 'FALHOU';
      mensagem = 'Duração inválida recebida';
    } else {
      valvulaAteMs = Date.now() + duracao * 1000;
      mensagem = `Válvula aberta por ${duracao} s (simulação)`;
    }
  } else if (comando.acao === 'DESLIGAR') {
    valvulaAteMs = 0;
    mensagem = 'Válvula fechada (simulação)';
  } else {
    status = 'FALHOU';
    mensagem = 'Ação desconhecida';
  }
  log(`Comando #${comando.id} ${comando.acao}: ${mensagem}`);
  await chamar('POST', `/api/iot/comandos/${comando.id}/confirmacao`, { status, mensagem });
}

async function ciclo(n) {
  // Solo seca ~0,4 pp por ciclo; a irrigação repõe ~2,5 pp por ciclo com válvula aberta.
  umidade += valvulaAberta() ? 2.5 : -0.4 + (Math.random() - 0.5) * 0.2;
  umidade = Math.min(Math.max(umidade, 5), 95);
  try {
    const resposta = await chamar('POST', '/api/iot/leituras', { umidade: Number(umidade.toFixed(1)) });
    log(`Leitura ${n}: ${umidade.toFixed(1)}% enviada · válvula ${valvulaAberta() ? 'ABERTA' : 'fechada'}`);
    for (const comando of resposta.comandos || []) await executar(comando);
  } catch (error) {
    log('Falha na comunicação:', error.message, '— o firmware guardaria a leitura para reenviar.');
  }
}

(async () => {
  log(`Simulador ESP32 → ${API} (a cada ${INTERVALO} s)`);
  for (let n = 1; CICLOS === 0 || n <= CICLOS; n += 1) {
    await ciclo(n);
    if (CICLOS === 0 || n < CICLOS) await new Promise((r) => setTimeout(r, INTERVALO * 1000));
  }
})();
