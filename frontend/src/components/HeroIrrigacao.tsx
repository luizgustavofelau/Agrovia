import React, { forwardRef } from "react";
import { CloudSun, Droplets, FileText, Radio, Sprout, Waves } from "lucide-react";

// Gerador pseudoaleatório fixo: as gotas ficam sempre nas mesmas posições (sem "pular" a cada render).
function sequencia(semente: number) {
  let s = semente;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Gota = { x: number; y: number; comprimento: number; duracao: number; atraso: number };

function gerarGotas(quantidade: number, semente: number, comprimento: [number, number], duracao: [number, number]): Gota[] {
  const r = sequencia(semente);
  return Array.from({ length: quantidade }, () => ({
    x: Math.round(r() * 1440),
    y: Math.round(-40 - r() * 200),
    comprimento: comprimento[0] + r() * (comprimento[1] - comprimento[0]),
    duracao: duracao[0] + r() * (duracao[1] - duracao[0]),
    atraso: -r() * duracao[1],
  }));
}

// Camada distante: gotas finas, lentas e discretas. Camada próxima: maiores e mais rápidas.
const GOTAS_DISTANTES = gerarGotas(26, 7, [10, 18], [2.6, 3.8]);
const GOTAS_PROXIMAS = gerarGotas(12, 31, [22, 34], [1.5, 2.2]);

const Chuva = ({ gotas, classe }: { gotas: Gota[]; classe: string }) => (
  <>
    {gotas.map((g, i) => (
      <line
        key={i}
        className={classe}
        x1={g.x}
        y1={g.y}
        x2={g.x - g.comprimento * 0.18}
        y2={g.y + g.comprimento}
        style={{ animationDuration: `${g.duracao.toFixed(2)}s`, animationDelay: `${g.atraso.toFixed(2)}s` }}
      />
    ))}
  </>
);

/** Chuva distante, desenhada na camada mais lenta do parallax. */
export const ChuvaDistante = forwardRef<SVGSVGElement>((_props, ref) => (
  <svg ref={ref} className="hero-drops" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="chuvaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(167,243,208,0)" />
        <stop offset="100%" stopColor="rgba(167,243,208,0.75)" />
      </linearGradient>
    </defs>
    <Chuva gotas={GOTAS_DISTANTES} classe="rain-drop rain-drop--far" />
  </svg>
));
ChuvaDistante.displayName = "ChuvaDistante";

// Informações em órbita ao redor do irrigador: três em cada lateral. `pos` define o ponto da órbita
// (esq/dir × cima/meio/baixo), `tom` a cor do destaque e `t` o ponto da cena em que cada uma surge.
const INFORMACOES = [
  { titulo: "Sensores ESP32", detalhe: "Telemetria enviada à plataforma", icone: Radio, pos: "esq-meio", tom: "verde", t: 0.48 },
  { titulo: "Cultura e fase", detalhe: "A necessidade muda com o ciclo", icone: Sprout, pos: "dir-meio", tom: "verde", t: 0.48 },
  { titulo: "Umidade do solo", detalhe: "Leitura por ponto e profundidade", icone: Droplets, pos: "esq-cima", tom: "azul", t: 0.56 },
  { titulo: "Clima", detalhe: "Chuva e temperatura no contexto", icone: CloudSun, pos: "dir-cima", tom: "azul", t: 0.56 },
  { titulo: "Solo e drenagem", detalhe: "A textura muda a retenção de água", icone: Waves, pos: "esq-baixo", tom: "branco", t: 0.64 },
  { titulo: "Histórico", detalhe: "Comparação entre datas e áreas", icone: FileText, pos: "dir-baixo", tom: "branco", t: 0.64 },
];

// Gotas que saem do bocal e se quebram ao longo do jato (atraso negativo = já em voo).
const GOTAS_JATO = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 0.98];

/**
 * Um jato completo, desenhado do centro para a direita: rastro em leque, corpo que afina e some,
 * gotas em voo, spray e névoa onde a água cai. `defasagem` desencontra as gotas entre os jatos.
 */
const Jato = ({ defasagem = 0 }: { defasagem?: number }) => (
  <>
    {/* Rastro em leque atrás do jato (três setores com opacidade decrescente). */}
    <path d="M200 200 L370 200 A170 170 0 0 0 364.2 156 Z" fill="url(#irrRastro)" opacity="0.24" />
    <path d="M200 200 L364.2 156 A170 170 0 0 0 347.2 115 Z" fill="url(#irrRastro)" opacity="0.12" />
    <path d="M200 200 L347.2 115 A170 170 0 0 0 309.3 69.8 Z" fill="url(#irrRastro)" opacity="0.05" />
    <path d="M256 196.6 Q300 197.4 346 199.4 L346 200.6 Q300 202.6 256 203.4 Z" fill="url(#irrJato)" className="irr-jato" />
    {GOTAS_JATO.map((atraso, i) => (
      <circle key={atraso} cx="258" cy={200 + ((i % 3) - 1) * 1.6} r={i % 2 ? 2.1 : 2.8} className="irr-gota-voo" style={{ animationDelay: `${-(atraso + defasagem)}s` }} />
    ))}
    <ellipse cx="362" cy="200" rx="24" ry="15" fill="url(#irrNevoa)" className="irr-nevoa" />
    {[[352, 192], [360, 206], [368, 196], [374, 203], [357, 199], [366, 189]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i % 2 ? 1.3 : 1.8} className="irr-spray" style={{ animationDelay: `${-(i * 0.12 + defasagem)}s` }} />
    ))}
  </>
);

/**
 * Irrigador rotativo visto de cima, com dois jatos opostos e iguais: a cabeça gira equilibrada
 * e a água cobre o círculo de forma contínua.
 */
export const IrrigadorTopo = () => (
  <svg className="cena-irrigador" viewBox="0 0 400 400" focusable="false">
    <defs>
      <radialGradient id="irrSolo">
        <stop offset="0%" stopColor="rgba(0,180,255,0.55)" />
        <stop offset="45%" stopColor="rgba(127,255,106,0.26)" />
        <stop offset="100%" stopColor="rgba(127,255,106,0)" />
      </radialGradient>
      <radialGradient id="irrRastro" gradientUnits="userSpaceOnUse" cx="200" cy="200" r="170">
        <stop offset="20%" stopColor="rgba(56,214,255,0)" />
        <stop offset="100%" stopColor="rgba(127,227,255,1)" />
      </radialGradient>
      <linearGradient id="irrJato" gradientUnits="userSpaceOnUse" x1="256" y1="0" x2="352" y2="0">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor="#38d6ff" />
        <stop offset="100%" stopColor="rgba(0,180,255,0)" />
      </linearGradient>
      <radialGradient id="irrNevoa">
        <stop offset="0%" stopColor="rgba(220,248,255,0.9)" />
        <stop offset="100%" stopColor="rgba(0,180,255,0)" />
      </radialGradient>
      <linearGradient id="irrCupula" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#b9ffb0" />
        <stop offset="70%" stopColor="#7fff6a" />
        <stop offset="100%" stopColor="#2f9a47" />
      </linearGradient>
    </defs>

    <circle cx="200" cy="200" r="200" fill="url(#irrSolo)" className="irr-solo" />
    <circle cx="200" cy="200" r="172" className="irr-alcance" />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx="200" cy="200" r="172" className="irr-onda" style={{ animationDelay: `${i * -1.5}s` }} />
    ))}

    <g className="irr-cabeca">
      <Jato />
      <g transform="rotate(180 200 200)">
        <Jato defasagem={0.07} />
      </g>
      <rect x="140" y="194" width="120" height="12" rx="6" className="irr-braco" />
      <rect x="248" y="192.5" width="14" height="15" rx="4" className="irr-bocal" />
      <rect x="138" y="192.5" width="14" height="15" rx="4" className="irr-bocal" />
    </g>

    {/* Corpo fixo do irrigador. */}
    <circle cx="200" cy="200" r="58" className="irr-marcas" />
    <circle cx="200" cy="200" r="40" className="irr-base" />
    <circle cx="200" cy="200" r="27" fill="url(#irrCupula)" className="irr-cupula" />
    <path d="M200,186 C206,193 209,197.5 209,202 A9,9 0 0 1 191,202 C191,197.5 194,193 200,186Z" className="irr-gota" />
  </svg>
);

/**
 * Cena revelada pela rolagem, por cima da foto do hero: o campo vira uma malha verde e azul,
 * o irrigador surge no centro, uma órbita se desenha ao redor, a linha d'água leva até ela e as
 * informações acendem nas laterais. Tudo deriva de --cena (0 a 1), escrita pelo useLandingMotion.
 */
export const CenaIrrigacao = () => (
  <div className="cena" aria-hidden="true">
    <div className="cena-campo" />
    <div className="cena-orbita">
      <span className="cena-orbita-anel" />
      <span className="cena-orbita-anel cena-orbita-anel--interno" />
    </div>
    <div className="cena-linha" />
    <div className="cena-centro">
      <div className="cena-halo" />
      <IrrigadorTopo />
    </div>
    {INFORMACOES.map(({ titulo, detalhe, icone: Icone, pos, tom, t }) => (
      <div key={titulo} className={`cena-info cena-info--${pos} cena-info--${tom}`} style={{ "--t": t } as React.CSSProperties}>
        <span className="cena-info-ponto" />
        <span className="cena-info-icone"><Icone size={17} /></span>
        <span className="cena-info-texto">
          <strong>{titulo}</strong>
          <small>{detalhe}</small>
        </span>
      </div>
    ))}
    <div className="cena-legenda">
      <span>Irrigação com contexto</span>
      <p>Os dados apoiam; a decisão continua de quem conhece a área.</p>
    </div>
  </div>
);

/** Chuva próxima, maior e mais rápida, numa camada que acompanha o primeiro plano. */
export const ChuvaProxima = forwardRef<SVGSVGElement>((_props, ref) => (
  <svg ref={ref} className="hero-rain-near" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <Chuva gotas={GOTAS_PROXIMAS} classe="rain-drop rain-drop--near" />
  </svg>
));
ChuvaProxima.displayName = "ChuvaProxima";
