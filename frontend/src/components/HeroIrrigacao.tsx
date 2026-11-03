import { forwardRef } from "react";

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

// Trajetórias dos jatos (parábolas saindo do bocal em 300,206 do viewBox do irrigador).
const JATO_LONGO = "M300,204 Q190,22 26,214";
const JATO_CURTO = "M300,206 Q232,96 128,226";
const GOTAS_JATO = [0, 0.45, 0.9, 1.35, 1.8, 2.25];

/**
 * Irrigador por aspersão no primeiro plano: a cabeça oscila de um lado a outro,
 * a água corre pelos jatos (traço tracejado em movimento), gotas percorrem a
 * trajetória e respingam onde caem. Inclui a chuva próxima, que se move junto
 * desta camada para reforçar a profundidade.
 */
export const IrrigadorAnimado = forwardRef<SVGSVGElement>((_props, ref) => (
  <svg ref={ref} className="hero-sprinkler" viewBox="0 0 400 300" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="jatoGrad" gradientUnits="userSpaceOnUse" x1="300" y1="204" x2="26" y2="214">
        <stop offset="0%" stopColor="rgba(220,255,238,0.95)" />
        <stop offset="70%" stopColor="rgba(167,243,208,0.55)" />
        <stop offset="100%" stopColor="rgba(167,243,208,0)" />
      </linearGradient>
      <linearGradient id="canoGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#0b150d" />
        <stop offset="55%" stopColor="#2c4a32" />
        <stop offset="100%" stopColor="#0b150d" />
      </linearGradient>
      <radialGradient id="nevoaGrad">
        <stop offset="0%" stopColor="rgba(190,250,220,0.45)" />
        <stop offset="100%" stopColor="rgba(190,250,220,0)" />
      </radialGradient>
    </defs>

    {/* Cabeça oscilante: tudo dentro do grupo gira em torno do bocal. */}
    <g className="sprinkler-head">
      <ellipse className="sprinkler-mist" cx="40" cy="206" rx="70" ry="26" fill="url(#nevoaGrad)" />
      {/* Filete contínuo por baixo; o tracejado em movimento por cima simula a água se quebrando. */}
      <path className="sprinkler-stream" d={JATO_LONGO} stroke="url(#jatoGrad)" />
      <path className="sprinkler-stream sprinkler-stream--short" d={JATO_CURTO} stroke="url(#jatoGrad)" />
      <path className="sprinkler-jet" d={JATO_LONGO} stroke="url(#jatoGrad)" />
      <path className="sprinkler-jet sprinkler-jet--short" d={JATO_CURTO} stroke="url(#jatoGrad)" />
      {GOTAS_JATO.map((atraso, i) => (
        <circle key={i} r={i % 2 ? 2.2 : 3} className="sprinkler-droplet">
          <animateMotion dur="2.7s" begin={`${-atraso}s`} repeatCount="indefinite" path={i % 3 === 2 ? JATO_CURTO : JATO_LONGO} />
        </circle>
      ))}
      {[0, 0.9, 1.8].map((atraso, i) => (
        <circle key={i} cx={i === 1 ? 128 : 30} cy={i === 1 ? 226 : 214} r="2" className="sprinkler-splash">
          <animate attributeName="r" values="2;12" dur="2.7s" begin={`${-atraso}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="2.7s" begin={`${-atraso}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <rect x="291" y="198" width="18" height="12" rx="4" className="sprinkler-nozzle" />
      <rect x="305" y="201" width="12" height="5" rx="2" className="sprinkler-nozzle" />
    </g>

    {/* Haste e conexão (fixas). */}
    <rect x="296" y="208" width="8" height="92" rx="2" fill="url(#canoGrad)" />
    <rect x="290" y="236" width="20" height="9" rx="3" className="sprinkler-fitting" />
    <rect x="276" y="288" width="48" height="12" rx="4" className="sprinkler-fitting" />
  </svg>
));
IrrigadorAnimado.displayName = "IrrigadorAnimado";

/** Chuva próxima, maior e mais rápida, numa camada que acompanha o primeiro plano. */
export const ChuvaProxima = forwardRef<SVGSVGElement>((_props, ref) => (
  <svg ref={ref} className="hero-rain-near" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <Chuva gotas={GOTAS_PROXIMAS} classe="rain-drop rain-drop--near" />
  </svg>
));
ChuvaProxima.displayName = "ChuvaProxima";
