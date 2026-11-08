import { apiFetch } from "../services/http";
import { clearSession } from "../services/session";
import DashboardGreeting from "./DashboardGreeting";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, Check, KeyRound, LogOut, Printer, Radio, RefreshCw, Sprout, Wifi } from "lucide-react";
import { useTituloPagina } from "../hooks/useTituloPagina";
import Sidebar from "./Sidebar";
import AgriculturalStudies from "./AgriculturalStudies";
import ReportAutomation from "./ReportAutomation";
import "../styles/dashboard.css";
import "../styles/dashboard-mobile.css";
import "../styles/dashboard-alerts.css";
import "../styles/dashboard-reports.css";
import "../styles/dashboard-chart.css";
import "../styles/dashboard-status.css";
import "../styles/dashboard-reporting.css";
import "../styles/painel-neon.css";
import Sensores from "./Sensores";
import Campos from "./Campos";

type FazendaResumo = {
  id: string | number;
  nome: string;
  localizacao?: string | null;
  cultura?: string | null;
};

type DispositivoResumo = {
  id: string | number;
  nome: string;
  fazenda?: string | null;
  status?: string;
  online?: boolean;
  ultimaUmidade?: number | null;
  ultimaAtualizacao?: string | null;
  chaveConfigurada?: boolean;
};

type Leitura = { umidade: number; dataHora: string };

type CollectionResult<T> = { records: T[]; demonstracao: boolean };

async function buscarColecao<T>(url: string): Promise<CollectionResult<T>> {
  const response = await apiFetch(url);
  if (!response.ok) throw new Error(`A solicitação falhou (${response.status}).`);
  return {
    records: (await response.json()) as T[],
    demonstracao: response.headers.get("X-Data-Source") === "demo",
  };
}

// Períodos do gráfico. "Recentes" mostra tudo o que a API devolve (até 500 leituras por dispositivo).
type ChartRange = "1 h" | "6 h" | "Recentes";
const RANGE_HORAS: Record<ChartRange, number | null> = { "1 h": 1, "6 h": 6, Recentes: null };
const RANGE_TITULO: Record<ChartRange, string> = { "1 h": "última hora", "6 h": "últimas 6 horas", Recentes: "leituras recentes" };
const LIMITE_LEITURAS = 500;
// Cores das séries, na ordem dos dispositivos (mesma paleta da página inicial).
const CORES_SERIE = ["water", "leaf", "soil", "violet"] as const;
const MAX_SERIES = CORES_SERIE.length;
const ATUALIZACAO_AUTOMATICA_MS = 30000;

const CHART = { esquerda: 34, direita: 620, topo: 20, base: 220 };
const chartX = (t: number, inicio: number, fim: number) =>
  CHART.esquerda + ((t - inicio) / Math.max(fim - inicio, 1)) * (CHART.direita - CHART.esquerda);
const chartY = (umidade: number) => CHART.base - (Math.min(Math.max(umidade, 0), 100) / 100) * (CHART.base - CHART.topo);
const hora = (data: Date) => data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const horaCurta = (valor?: string | null) => (valor ? hora(new Date(valor)) : "—");
const umidadeTexto = (valor: number) => `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

// "há 25 s", "há 4 min", "há 2 h", "há 3 dias": tempo desde a última leitura.
function tempoDesde(valor: string | null, agora: number) {
  if (!valor) return null;
  const s = Math.max(0, Math.round((agora - new Date(valor).getTime()) / 1000));
  if (s < 60) return `há ${s} s`;
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  const d = Math.floor(s / 86400);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

type PontoDestacado = { x: number; y: number; nome: string; umidade: number; t: number; cor: string };

/**
 * Lista guiada para quem está começando: cada passo se marca sozinho conforme os dados
 * chegam da API. Some quando o primeiro ESP32 já enviou leitura.
 */
const PrimeirosPassos: React.FC<{ fazendas: number; dispositivos: DispositivoResumo[] }> = ({ fazendas, dispositivos }) => {
  const passos = [
    { feito: fazendas > 0, titulo: "Cadastre uma fazenda", detalhe: "Nome, localização, cultura e área.", link: "/painel/campos", acao: "Ir para Campos", icone: Sprout },
    { feito: dispositivos.length > 0, titulo: "Vincule o ESP32 pelo MAC", detalhe: "O MAC aparece no Monitor Serial quando o aparelho liga.", link: "/conta?aba=dispositivos", acao: "Vincular dispositivo", icone: Radio },
    { feito: dispositivos.some((d) => d.chaveConfigurada), titulo: "Gere a chave do aparelho", detalhe: "Em Sensores → ⋯ → Gerar chave. Grave em DEVICE_KEY no config.h.", link: "/painel/sensores", acao: "Ir para Sensores", icone: KeyRound },
    { feito: dispositivos.some((d) => d.ultimaUmidade !== null && d.ultimaUmidade !== undefined), titulo: "Receba a primeira leitura", detalhe: "Ligue o ESP32: em até 1 minuto ele aparece como Conectado.", link: "/painel/sensores", acao: "Ver sensores", icone: Wifi },
  ];
  const concluidos = passos.filter((p) => p.feito).length;
  if (concluidos === passos.length) return null;
  const proximo = passos.findIndex((p) => !p.feito);
  return (
    <section className="primeiros-passos" aria-labelledby="primeiros-passos-titulo">
      <div className="primeiros-passos-topo">
        <div>
          <p className="section-kicker">Primeiros passos</p>
          <h2 id="primeiros-passos-titulo">Conecte seu primeiro ESP32</h2>
        </div>
        <span className="primeiros-passos-contagem">{concluidos} de {passos.length}</span>
      </div>
      <div className="primeiros-passos-barra" aria-hidden="true"><span style={{ width: `${(concluidos / passos.length) * 100}%` }} /></div>
      <ol>
        {passos.map(({ feito, titulo, detalhe, link, acao, icone: Icone }, i) => (
          <li key={titulo} className={feito ? "is-feito" : i === proximo ? "is-proximo" : undefined}>
            <span className="primeiros-passos-icone">{feito ? <Check size={16} aria-hidden="true" /> : <Icone size={16} aria-hidden="true" />}</span>
            <div>
              <strong>{titulo}{feito && <span className="sr-only"> (concluído)</span>}</strong>
              <small>{detalhe}</small>
            </div>
            {i === proximo && <Link to={link}>{acao} →</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("usuarioNome") ?? "Usuário";
  const userId = localStorage.getItem("usuarioId");
  const [fazendas, setFazendas] = useState<FazendaResumo[]>([]);
  const [dispositivos, setDispositivos] = useState<DispositivoResumo[]>([]);
  const [leituras, setLeituras] = useState<Record<string, Leitura[]>>({});
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState("");
  const [dadosDemonstracao, setDadosDemonstracao] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Atualizações automáticas acontecem em silêncio, sem trocar os números por "…".
  const atualizacaoSilenciosa = useRef(false);
  const initials = name.slice(0, 2).toUpperCase();
  const comLeitura = dispositivos.filter((d) => d.ultimaUmidade !== null && d.ultimaUmidade !== undefined);
  const umidadeMedia = comLeitura.length
    ? comLeitura.reduce((total, d) => total + Number(d.ultimaUmidade), 0) / comLeitura.length
    : null;
  const conectados = dispositivos.filter((d) => d.online || d.status === "ON").length;
  const ultimaLeituraGeral = dispositivos.reduce<string | null>(
    (maisRecente, d) => (d.ultimaAtualizacao && (!maisRecente || d.ultimaAtualizacao > maisRecente) ? d.ultimaAtualizacao : maisRecente),
    null,
  );
  const activeNav = location.pathname.endsWith("/sensores")
    ? "Sensores"
    : location.pathname.endsWith("/campos")
      ? "Campos"
      : location.pathname.endsWith("/relatorios")
        ? "Relatórios"
        : location.pathname.endsWith("/alertas")
          ? "Alertas"
          : location.pathname.startsWith("/painel/estudos")
            ? "Estudos Agrícolas"
          : "Painel";
  const [range, setRange] = useState<ChartRange>("6 h");
  const [destaque, setDestaque] = useState<PontoDestacado | null>(null);
  useTituloPagina(activeNav);

  // ── Gráfico com as leituras reais dos dispositivos ──
  const agoraMs = atualizadoEm ? atualizadoEm.getTime() : Date.now();
  const series = dispositivos.slice(0, MAX_SERIES).map((d, i) => {
    const horas = RANGE_HORAS[range];
    const pontos = (leituras[String(d.id)] || [])
      .map((l) => ({ t: new Date(l.dataHora).getTime(), umidade: Number(l.umidade) }))
      .filter((p) => Number.isFinite(p.t) && (horas === null || p.t >= agoraMs - horas * 3600000));
    return { id: d.id, nome: d.nome, cor: CORES_SERIE[i], pontos };
  });
  const todosPontos = series.flatMap((s) => s.pontos);
  const temLeituras = todosPontos.length > 0;
  const horasRange = RANGE_HORAS[range];
  const inicioMs = horasRange !== null ? agoraMs - horasRange * 3600000 : Math.min(...todosPontos.map((p) => p.t), agoraMs - 3600000);
  const fimMs = horasRange !== null ? agoraMs : Math.max(...todosPontos.map((p) => p.t), inicioMs + 60000);
  const seriesDesenho = series.map((s) => {
    const coords = s.pontos.map((p) => ({ x: chartX(p.t, inicioMs, fimMs), y: chartY(p.umidade) }));
    return {
      ...s,
      coords,
      linha: coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
      area: coords.length > 1
        ? `M${coords[0].x},${CHART.base} L${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" L")} L${coords[coords.length - 1].x},${CHART.base} Z`
        : "",
      ultimo: s.pontos[s.pontos.length - 1],
      ultimoCoord: coords[coords.length - 1],
    };
  });
  const rotulosX = Array.from({ length: 5 }, (_, i) => {
    const t = inicioMs + ((fimMs - inicioMs) * i) / 4;
    return { x: chartX(t, inicioMs, fimMs), texto: hora(new Date(t)) };
  });

  // Ao passar o mouse, destaca a leitura mais próxima do cursor (em qualquer série).
  const aoMoverNoGrafico = (event: React.MouseEvent<SVGSVGElement>) => {
    const caixa = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - caixa.left) / caixa.width) * 640;
    let melhor: PontoDestacado | null = null;
    let menorDistancia = 28;
    seriesDesenho.forEach((s) => s.coords.forEach((c, i) => {
      const distancia = Math.abs(c.x - x);
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        melhor = { x: c.x, y: c.y, nome: s.nome, umidade: s.pontos[i].umidade, t: s.pontos[i].t, cor: s.cor };
      }
    }));
    setDestaque(melhor);
  };

  // Relógio para o "há X s" da última leitura andar entre as atualizações do painel.
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const dispositivoMaisRecente = dispositivos.find((d) => d.ultimaAtualizacao === ultimaLeituraGeral);

  useEffect(() => {
    let cancelado = false;
    const silencioso = atualizacaoSilenciosa.current;
    atualizacaoSilenciosa.current = false;
    if (!silencioso) setCarregandoResumo(true);
    setErroResumo("");

    if (!userId) {
      setErroResumo("Não foi possível identificar a conta autenticada. Saia e entre novamente.");
      setCarregandoResumo(false);
      return () => { cancelado = true; };
    }

    const query = `id_usuario=${encodeURIComponent(userId)}`;
    Promise.all([
      buscarColecao<FazendaResumo>(`/api/fazendas?${query}`),
      buscarColecao<DispositivoResumo>(`/api/dispositivos?${query}`),
    ]).then(async ([resultadoFazendas, resultadoDispositivos]) => {
      if (cancelado) return;
      setFazendas(resultadoFazendas.records);
      setDispositivos(resultadoDispositivos.records);
      setDadosDemonstracao(resultadoFazendas.demonstracao || resultadoDispositivos.demonstracao);
      // Leituras de cada dispositivo do gráfico; uma falha isolada não derruba o painel.
      const historicos = await Promise.all(
        resultadoDispositivos.records.slice(0, MAX_SERIES).map(async (d) => {
          try {
            const r = await apiFetch(`/api/dispositivos/${d.id}/leituras?limite=${LIMITE_LEITURAS}`);
            return [String(d.id), r.ok ? ((await r.json()) as Leitura[]) : []] as const;
          } catch {
            return [String(d.id), []] as const;
          }
        }),
      );
      if (cancelado) return;
      setLeituras(Object.fromEntries(historicos));
      setAtualizadoEm(new Date());
    }).catch(() => {
      if (!cancelado) setErroResumo("Não foi possível carregar os campos e dispositivos. Verifique a API e tente atualizar.");
    }).finally(() => {
      if (!cancelado) setCarregandoResumo(false);
    });

    return () => { cancelado = true; };
  }, [userId, refreshKey]);

  // No painel, busca novas leituras a cada 30 s (só com a aba visível).
  useEffect(() => {
    if (activeNav !== "Painel") return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      atualizacaoSilenciosa.current = true;
      setRefreshKey((value) => value + 1);
    }, ATUALIZACAO_AUTOMATICA_MS);
    return () => window.clearInterval(timer);
  }, [activeNav]);

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  const banner = dadosDemonstracao
    ? { tipo: "demo", titulo: "Cadastros demonstrativos", texto: "A API retornou registros de demonstração." }
    : dispositivos.length === 0
      ? { tipo: "vazio", titulo: "Nenhum ESP32 cadastrado", texto: "Cadastre um dispositivo em Sensores e gere a chave para começar a receber leituras." }
      : conectados > 0
        ? { tipo: "ativo", titulo: "Telemetria ativa", texto: `${conectados} de ${dispositivos.length} dispositivo(s) conectado(s)${ultimaLeituraGeral ? ` · última leitura às ${horaCurta(ultimaLeituraGeral)}` : ""}.` }
        : !ultimaLeituraGeral
          ? { tipo: "vazio", titulo: "Aguardando o ESP32", texto: "Nenhuma leitura recebida ainda. Gere a chave em Sensores, grave no firmware e ligue o aparelho." }
          : { tipo: "off", titulo: "Dispositivos desconectados", texto: `Nenhum ESP32 enviou leituras nos últimos 3 minutos${ultimaLeituraGeral ? ` · última leitura às ${horaCurta(ultimaLeituraGeral)}` : ""}.` };

  return (
    <div className="dashboard-light painel-neon">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <DashboardGreeting name={name} />
          </div>
          <div className="dashboard-account-actions">
            <button
              type="button"
              className="dashboard-refresh-btn"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={carregandoResumo}
              aria-label="Atualizar campos, dispositivos e leituras"
            >
              <RefreshCw size={15} aria-hidden="true" />
              <span>{carregandoResumo ? "Atualizando" : "Atualizar"}</span>
            </button>
            <div className="dashboard-user-chip">
            <span className="dashboard-avatar">{initials}</span>
            <span>{name}</span>
            </div>
            <button type="button" className="dashboard-logout-btn" onClick={logout}>
              <LogOut size={15} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </header>
        {activeNav === "Painel" && !carregandoResumo && !erroResumo && (
          <div className={`dashboard-demo-banner painel-status painel-status--${banner.tipo}`} role="status">
            <i className="painel-status-ponto" aria-hidden="true" />
            <strong>{banner.titulo}</strong>
            <span>{banner.texto}</span>
            {atualizadoEm && <span className="painel-status-hora">Atualizado às {atualizadoEm.toLocaleTimeString("pt-BR")}</span>}
          </div>
        )}
        {erroResumo && (
          <div className="dashboard-data-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{erroResumo}</span>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>Tentar novamente</button>
          </div>
        )}
        {activeNav === "Sensores" ? (
          <Sensores />
        ) : activeNav === "Campos" ? (
          <Campos />
        ) : activeNav === "Estudos Agrícolas" ? (
          <AgriculturalStudies />
        ) : activeNav === "Relatórios" ? (
          <section className="dashboard-reports-panel">
            <header className="reports-intro">
              <p className="section-kicker">Histórico operacional</p>
              <h2>Relatórios</h2>
              <p className="report-lead">Configure o recebimento periódico de um resumo da sua operação, com propriedades, dispositivos e a situação de conexão.</p>
            </header>
            <div className="dashboard-empty-state">
              <AlertCircle size={22} aria-hidden="true" />
              <div>
                <strong>Leituras disponíveis no painel</strong>
                <p>As leituras de umidade enviadas pelos ESP32 aparecem no gráfico do painel e no cartão de cada dispositivo. A análise automática das condições da lavoura depende de regras por cultura, ainda não configuradas.</p>
              </div>
              <Link to="/painel">Ver leituras no painel</Link>
            </div>
            <ReportAutomation />
          </section>
        ) : activeNav === "Alertas" ? (
          <section className="dashboard-reports-panel">
            <header className="reports-intro">
              <p className="section-kicker">Condições para avaliação</p>
              <h2>Alertas</h2>
              <p className="report-lead">Alertas responsáveis precisam de leituras recentes, faixas configuradas e regras associadas à cultura.</p>
            </header>
            <div className="dashboard-empty-state">
              <AlertCircle size={22} aria-hidden="true" />
              <div>
                <strong>Nenhuma regra de alerta configurada</strong>
                <p>As leituras dos sensores já chegam à plataforma, mas as faixas de umidade por cultura ainda não foram definidas. Por isso nenhum campo ou dispositivo é classificado como crítico.</p>
              </div>
              <Link to="/painel/sensores">Consultar sensores</Link>
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-kpis" aria-label="Resumo da fazenda">
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Campos cadastrados</div>
                <div className="dashboard-kpi-value">{carregandoResumo ? "…" : erroResumo ? "—" : fazendas.length}</div>
                <div className="dashboard-kpi-sub">Propriedades da sua conta</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Dispositivos conectados</div>
                <div className="dashboard-kpi-value">
                  {carregandoResumo ? "…" : erroResumo ? "—" : <>{conectados}<small>/ {dispositivos.length}</small></>}
                </div>
                <div className="dashboard-kpi-sub">Com leitura nos últimos 3 minutos</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Umidade do solo</div>
                {umidadeMedia === null ? (
                  <>
                    <div className="dashboard-kpi-value dashboard-kpi-text">Aguardando sensores</div>
                    <div className="dashboard-kpi-sub">Nenhum dispositivo enviou leituras ainda</div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-kpi-value">{umidadeMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}<small>%</small></div>
                    <div className="dashboard-kpi-sub">Média da última leitura de {comLeitura.length} dispositivo(s)</div>
                  </>
                )}
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Última leitura</div>
                {ultimaLeituraGeral ? (
                  <>
                    <div className="dashboard-kpi-value dashboard-kpi-tempo">{tempoDesde(ultimaLeituraGeral, agora)}</div>
                    <div className="dashboard-kpi-sub">{dispositivoMaisRecente?.nome || "ESP32"} · às {horaCurta(ultimaLeituraGeral)}</div>
                  </>
                ) : (
                  <>
                    <div className="dashboard-kpi-value dashboard-kpi-text">Nenhuma ainda</div>
                    <div className="dashboard-kpi-sub">O ESP32 envia uma leitura por minuto</div>
                  </>
                )}
              </div>
            </section>

            {!carregandoResumo && !erroResumo && !dadosDemonstracao && (
              <PrimeirosPassos fazendas={fazendas.length} dispositivos={dispositivos} />
            )}

            <section className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <h2>Umidade do solo — {RANGE_TITULO[range]}</h2>
                    {seriesDesenho.length > 0 && (
                      <div className="chart-legend">
                        {seriesDesenho.map((s) => (
                          <span key={s.id}>
                            <i className={s.cor} />
                            {s.nome}
                            {s.ultimo && <b className="chart-legend-valor">{umidadeTexto(s.ultimo.umidade)}</b>}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="dashboard-chart-demo-note">
                      Leituras enviadas pelos ESP32{dispositivos.length > MAX_SERIES ? ` · exibindo os ${MAX_SERIES} primeiros dispositivos` : ""}
                    </p>
                  </div>
                  <div className="range-select">
                    {(["1 h", "6 h", "Recentes"] as ChartRange[]).map((item) => (
                      <button
                        type="button"
                        key={item}
                        className={range === item ? "active" : ""}
                        aria-pressed={range === item}
                        onClick={() => setRange(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="painel-chart-wrap">
                  <svg
                    className="moisture-chart"
                    viewBox="0 0 640 250"
                    role="img"
                    aria-label={`Umidade do solo — ${RANGE_TITULO[range]}`}
                    onMouseMove={temLeituras ? aoMoverNoGrafico : undefined}
                    onMouseLeave={() => setDestaque(null)}
                  >
                    <defs>
                      <linearGradient id="painelFillWater" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38d6ff" stopOpacity=".32" />
                        <stop offset="100%" stopColor="#38d6ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <g className="chart-grade">
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <g key={tick}>
                          <line x1={CHART.esquerda} y1={chartY(tick)} x2={CHART.direita} y2={chartY(tick)} />
                          <text x="2" y={chartY(tick) + 4}>{tick}%</text>
                        </g>
                      ))}
                    </g>
                    {seriesDesenho[0]?.area && <path d={seriesDesenho[0].area} fill="url(#painelFillWater)" />}
                    {seriesDesenho.map((s) => s.coords.length > 0 && (
                      <g key={s.id}>
                        {s.coords.length > 1 && <polyline className={`chart-series ${s.cor}`} points={s.linha} />}
                        <circle className={`chart-point ${s.cor}`} cx={s.ultimoCoord.x} cy={s.ultimoCoord.y} r="5" />
                      </g>
                    ))}
                    <g className="chart-rotulos" textAnchor="middle">
                      {temLeituras && rotulosX.map((r, i) => (
                        <text key={i} x={r.x} y="242">{r.texto}</text>
                      ))}
                    </g>
                    {destaque && (
                      <g className="chart-destaque" aria-hidden="true">
                        <line x1={destaque.x} y1={CHART.topo} x2={destaque.x} y2={CHART.base} />
                        <circle className={`chart-destaque-ponto ${destaque.cor}`} cx={destaque.x} cy={destaque.y} r="5.5" />
                      </g>
                    )}
                  </svg>
                  {destaque && (
                    <div
                      className="chart-dica"
                      style={{ left: `${(destaque.x / 640) * 100}%`, top: `${(destaque.y / 250) * 100}%` }}
                      aria-hidden="true"
                    >
                      <strong>{umidadeTexto(destaque.umidade)}</strong>
                      <span>{destaque.nome}</span>
                      <small>{new Date(destaque.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</small>
                    </div>
                  )}
                  {!carregandoResumo && !temLeituras && (
                    <div className="painel-chart-vazio">
                      <Wifi size={22} aria-hidden="true" />
                      <strong>{dispositivos.length ? "Aguardando leituras" : "Nenhum dispositivo cadastrado"}</strong>
                      <span>
                        {dispositivos.length
                          ? `Nenhuma leitura ${range === "Recentes" ? "recebida ainda" : `na ${RANGE_TITULO[range]}`}. Assim que o ESP32 enviar dados, o gráfico se atualiza sozinho.`
                          : "Cadastre um ESP32 em Sensores para acompanhar a umidade aqui."}
                      </span>
                    </div>
                  )}
                </div>
                <div className="sensor-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Dispositivo</th>
                        <th>Fazenda</th>
                        <th>Umidade</th>
                        <th>Última leitura</th>
                        <th>Conexão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispositivos.map((dispositivo) => {
                        const status = dispositivo.status || (dispositivo.online ? "ON" : "OFF");
                        return (
                          <tr key={dispositivo.id}>
                            <td>{dispositivo.nome}</td>
                            <td>{dispositivo.fazenda || "Não vinculada"}</td>
                            <td>{dispositivo.ultimaUmidade !== null && dispositivo.ultimaUmidade !== undefined ? umidadeTexto(Number(dispositivo.ultimaUmidade)) : "—"}</td>
                            <td>{horaCurta(dispositivo.ultimaAtualizacao)}</td>
                            <td>
                              <span className={`table-badge ${status === "ON" ? "good" : status === "OFF" ? "warning" : ""}`}>
                                {status === "ON" ? "Conectado" : status === "OFF" ? "Desconectado" : status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!carregandoResumo && dispositivos.length === 0 && (
                        <tr><td colSpan={5}>{erroResumo ? "Dispositivos indisponíveis no momento." : "Nenhum dispositivo cadastrado."}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <aside className="dashboard-panel ranking-panel">
                <div className="dashboard-panel-head">
                  <h2>Campos cadastrados</h2>
                  <Sprout size={18} aria-hidden="true" />
                </div>
                {carregandoResumo ? <p className="dashboard-empty-note">Carregando campos…</p> : fazendas.length ? (
                  <div className="ranking-list">
                    {fazendas.map((fazenda) => (
                      <div className="ranking-item" key={fazenda.id}>
                        <div className="rank-number"><Sprout size={14} aria-hidden="true" /></div>
                        <div className="rank-info">
                          <strong>{fazenda.nome}</strong>
                          <small>{fazenda.localizacao || "Localização não informada"}</small>
                        </div>
                        <div className="rank-value"><strong>{fazenda.cultura || "—"}</strong><small>Cultura</small></div>
                      </div>
                    ))}
                  </div>
                ) : <p className="dashboard-empty-note">{erroResumo ? "Campos indisponíveis." : "Nenhum campo cadastrado. Comece cadastrando uma propriedade."}</p>}
                <div className="weather-heading">
                  <h2>Ações rápidas</h2>
                </div>
                <div className="dashboard-quick-links">
                  <Link to="/painel/campos"><Sprout size={15} />Campos</Link>
                  <Link to="/painel/sensores"><Wifi size={15} />Sensores</Link>
                  <Link to="/painel/relatorios"><Printer size={15} />Relatórios</Link>
                  <Link to="/painel/estudos"><BookOpen size={15} />Estudos Agrícolas</Link>
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
