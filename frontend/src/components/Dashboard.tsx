import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, LogOut, Printer, RefreshCw, Sprout, Wifi } from "lucide-react";
import Sidebar from "./Sidebar";
import AgriculturalStudies from "./AgriculturalStudies";
import "../styles/dashboard.css";
import "../styles/dashboard-mobile.css";
import "../styles/dashboard-alerts.css";
import "../styles/dashboard-reports.css";
import "../styles/dashboard-chart.css";
import "../styles/dashboard-status.css";
import "../styles/dashboard-reporting.css";
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
};

type CollectionResult<T> = { records: T[]; demonstracao: boolean };

async function buscarColecao<T>(url: string): Promise<CollectionResult<T>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`A solicitação falhou (${response.status}).`);
  return {
    records: (await response.json()) as T[],
    demonstracao: response.headers.get("X-Data-Source") === "demo",
  };
}

type ChartMetric = "Umidade do solo" | "Temperatura" | "Precipitação";
type ChartRange = "Dia" | "Semana" | "7 dias" | "Mês";

const chartMetrics: Record<ChartMetric, {
  unit: string;
  min: number;
  max: number;
  ticks: number[];
  idealRange?: [number, number];
  series: { name: string; color: "water" | "leaf" | "soil"; values: number[] }[];
}> = {
  "Umidade do solo": {
    unit: "%",
    min: 0,
    max: 100,
    ticks: [90, 70, 50, 30, 10],
    idealRange: [40, 65],
    series: [
      { name: "Talhão 1", color: "water", values: [42, 54, 48, 63, 58, 70, 64, 58] },
      { name: "Talhão 2", color: "leaf", values: [51, 58, 53, 66, 60, 56, 51, 46] },
      { name: "Talhão 3", color: "soil", values: [33, 29, 35, 24, 21, 28, 25, 27] },
    ],
  },
  Temperatura: {
    unit: "°C",
    min: 10,
    max: 40,
    ticks: [40, 30, 20, 10],
    idealRange: [20, 30],
    series: [
      { name: "Talhão 1", color: "water", values: [22, 23, 24, 26, 25, 27, 26, 24] },
      { name: "Talhão 2", color: "leaf", values: [24, 25, 25, 27, 26, 24, 25, 25] },
      { name: "Talhão 3", color: "soil", values: [26, 27, 29, 31, 30, 28, 26, 26] },
    ],
  },
  Precipitação: {
    unit: "mm",
    min: 0,
    max: 15,
    ticks: [15, 12, 9, 6, 3, 0],
    series: [
      { name: "Talhão 1", color: "water", values: [0, 2, 1, 7, 3, 0, 5, 1] },
      { name: "Talhão 2", color: "leaf", values: [1, 0, 3, 5, 2, 4, 0, 2] },
      { name: "Talhão 3", color: "soil", values: [0, 4, 2, 1, 6, 3, 1, 0] },
    ],
  },
};

const chartLabels: Record<ChartRange, string[]> = {
  Dia: ["00h", "03h", "06h", "09h", "12h", "15h", "18h", "21h"],
  Semana: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom", "Hoje"],
  "7 dias": ["D-6", "D-5", "D-4", "D-3", "D-2", "Ontem", "Hoje", "Agora"],
  Mês: ["1", "5", "10", "15", "20", "25", "30", "Hoje"],
};

const chartRangeTitles: Record<ChartRange, string> = {
  Dia: "hoje",
  Semana: "esta semana",
  "7 dias": "últimos 7 dias",
  Mês: "últimos 30 dias",
};

const demoRangeAdjustments: Record<ChartRange, number[]> = {
  Dia: [0, 1, -1, 2, 0, -1, 1, 0],
  Semana: [1, -2, 0, 1, -1, 2, 0, -1],
  "7 dias": [-1, 0, 2, -2, 1, 0, -1, 1],
  Mês: [2, 1, -2, 0, 2, -1, 0, -2],
};

function chartY(value: number, min: number, max: number) {
  return 220 - ((value - min) / (max - min)) * 200;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("usuarioNome") ?? "Usuário";
  const userId = localStorage.getItem("usuarioId");
  const [dateTime, setDateTime] = useState("");
  const [greeting, setGreeting] = useState("Bom dia");
  const [fazendas, setFazendas] = useState<FazendaResumo[]>([]);
  const [dispositivos, setDispositivos] = useState<DispositivoResumo[]>([]);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState("");
  const [dadosDemonstracao, setDadosDemonstracao] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const initials = name.slice(0, 2).toUpperCase();
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
  const [activeTab, setActiveTab] = useState<ChartMetric>("Umidade do solo");
  const [range, setRange] = useState<ChartRange>("7 dias");
  const metricChart = chartMetrics[activeTab];
  const periodAdjustment = demoRangeAdjustments[range];
  const chartSeries = metricChart.series.map((series) => {
    const points = series.values.map((baseValue, index) => {
      const value = Math.max(
        metricChart.min,
        Math.min(metricChart.max, baseValue + periodAdjustment[index]),
      );
      const x = 30 + index * (590 / (series.values.length - 1));
      return { x, y: chartY(value, metricChart.min, metricChart.max) };
    });
    return {
      ...series,
      points,
      pointString: points.map((point) => `${point.x},${point.y}`).join(" "),
      lastPoint: points[points.length - 1],
    };
  });
  const firstSeriesPoints = chartSeries[0]?.points ?? [];
  const chartAreaPath = firstSeriesPoints.length
    ? `M${firstSeriesPoints.map((point) => `${point.x},${point.y}`).join(" L")} L620,220 L30,220 Z`
    : "";
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hour = now.getHours();
      setGreeting(hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite");
      const date = now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
      setDateTime(
        `${date.charAt(0).toUpperCase()}${date.slice(1)} · ${now.toLocaleTimeString("pt-BR")}`
      );
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregandoResumo(true);
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
    ]).then(([resultadoFazendas, resultadoDispositivos]) => {
      if (cancelado) return;
      setFazendas(resultadoFazendas.records);
      setDispositivos(resultadoDispositivos.records);
      setDadosDemonstracao(resultadoFazendas.demonstracao || resultadoDispositivos.demonstracao);
      setAtualizadoEm(new Date());
    }).catch(() => {
      if (!cancelado) setErroResumo("Não foi possível carregar os campos e dispositivos. Verifique a API e tente atualizar.");
    }).finally(() => {
      if (!cancelado) setCarregandoResumo(false);
    });

    return () => { cancelado = true; };
  }, [userId, refreshKey]);

  const logout = () => {
    localStorage.removeItem("usuarioNome");
    localStorage.removeItem("usuarioLogado");
    navigate("/login");
  };

  return (
    <div className="dashboard-light">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <h1>{greeting}, {name}</h1>
            <p>Visão geral da operação · {dateTime}</p>
          </div>
          <div className="dashboard-account-actions">
            <button
              type="button"
              className="dashboard-refresh-btn"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={carregandoResumo}
              aria-label="Atualizar campos e dispositivos"
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
        {["Painel", "Relatórios", "Alertas"].includes(activeNav) && (
          <div className="dashboard-demo-banner" role="status">
            <strong>{dadosDemonstracao ? "Cadastros demonstrativos" : "Telemetria não integrada"}</strong>
            <span>
              {dadosDemonstracao
                ? "A API retornou registros de demonstração. Gráficos e alertas também são apenas ilustrativos."
                : "Campos e dispositivos vêm da API; gráficos, leituras do solo e alertas ainda não têm integração de telemetria."}
            </span>
            {atualizadoEm && <span>Atualizado às {atualizadoEm.toLocaleTimeString("pt-BR")}</span>}
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
              <p className="report-lead">Os relatórios de desempenho ficam disponíveis quando houver leituras e operações registradas para o período.</p>
            </header>
            <div className="dashboard-empty-state">
              <AlertCircle size={22} aria-hidden="true" />
              <div>
                <strong>Não há séries históricas conectadas</strong>
                <p>A API atual fornece cadastros de campos e dispositivos, mas ainda não fornece leituras, consumo ou eventos de irrigação.</p>
              </div>
              <Link to="/painel">Voltar ao painel</Link>
            </div>
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
                <strong>Nenhum alerta configurado</strong>
                <p>Não há telemetria nem regras de alerta disponíveis na API atual. Nenhum campo ou dispositivo foi classificado como crítico.</p>
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
                <div className="dashboard-kpi-sub">Contagem retornada pela API</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Dispositivos cadastrados</div>
                <div className="dashboard-kpi-value">{carregandoResumo ? "…" : erroResumo ? "—" : dispositivos.length}</div>
                <div className="dashboard-kpi-sub">Sensores e dispositivos não são leituras</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Leituras de umidade</div>
                <div className="dashboard-kpi-value dashboard-kpi-text">Não integradas</div>
                <div className="dashboard-kpi-sub">A API ainda não disponibiliza telemetria</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Alertas de manejo</div>
                <div className="dashboard-kpi-value dashboard-kpi-text">Não configurados</div>
                <div className="dashboard-kpi-sub">Sem leituras e regras de alerta integradas</div>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="dashboard-panel">
                <div className="dashboard-tabs">
                  {(["Umidade do solo", "Temperatura", "Precipitação"] as ChartMetric[]).map(
                    (tab) => (
                      <button
                        type="button"
                        key={tab}
                        className={activeTab === tab ? "active" : ""}
                        aria-pressed={activeTab === tab}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
                <div className="dashboard-panel-head">
                  <div>
                    <h2>
                      Tendência de {activeTab.toLowerCase()} — {chartRangeTitles[range]}
                    </h2>
                    <div className="chart-legend">
                      <span>
                        <i className="water" />
                        Talhão 1
                      </span>
                      <span>
                        <i className="leaf" />
                        Talhão 2
                      </span>
                      <span>
                        <i className="soil" />
                        Talhão 3
                      </span>
                    </div>
                    <p className="dashboard-chart-demo-note">Amostra demonstrativa · leituras ilustrativas</p>
                  </div>
                  <div className="range-select">
                    {(["Dia", "Semana", "7 dias", "Mês"] as ChartRange[]).map((item) => (
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
                <svg
                  className="moisture-chart"
                  viewBox="0 0 640 260"
                  role="img"
                  aria-label={`Tendência de ${activeTab.toLowerCase()} em ${chartRangeTitles[range]}`}
                >
                  <g stroke="#E2DCC7" strokeWidth="1">
                    <line x1="30" y1="20" x2="30" y2="220" />
                    <line x1="30" y1="220" x2="620" y2="220" />
                  </g>
                  <g stroke="#e9ece3" strokeWidth="1">
                    {metricChart.ticks.map((tick) => {
                      const y = chartY(tick, metricChart.min, metricChart.max);
                      return <line key={tick} x1="30" y1={y} x2="620" y2={y} />;
                    })}
                  </g>
                  <g
                    fill="#8B9482"
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans"
                  >
                    {metricChart.ticks.map((tick) => (
                      <text key={tick} x="2" y={chartY(tick, metricChart.min, metricChart.max) + 4}>
                        {tick}{metricChart.unit}
                      </text>
                    ))}
                  </g>
                  {metricChart.idealRange && (
                    <>
                      <rect
                        x="30"
                        y={chartY(metricChart.idealRange[1], metricChart.min, metricChart.max)}
                        width="590"
                        height={chartY(metricChart.idealRange[0], metricChart.min, metricChart.max) - chartY(metricChart.idealRange[1], metricChart.min, metricChart.max)}
                        fill="#4C7A3B"
                        opacity=".08"
                      />
                      <text x="618" y={chartY(metricChart.idealRange[0], metricChart.min, metricChart.max) - 4} fontSize="10" fill="#5E6A57" textAnchor="end">
                        faixa ideal
                      </text>
                    </>
                  )}
                  <path d={chartAreaPath} fill="url(#fillWater)" />
                  {chartSeries.map((series) => (
                    <g key={series.name}>
                      <polyline className={`chart-series ${series.color}`} points={series.pointString} />
                      <circle className={`chart-point ${series.color}`} cx={series.lastPoint.x} cy={series.lastPoint.y} r="4" />
                    </g>
                  ))}
                  <g
                    fill="#8B9482"
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans"
                    textAnchor="middle"
                  >
                    {chartLabels[range].map((label, index) => (
                      <text key={`${label}-${index}`} x={30 + index * (590 / (chartLabels[range].length - 1))} y="238">
                        {label}
                      </text>
                    ))}
                  </g>
                  <defs>
                    <linearGradient id="fillWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2F7B9C" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#2F7B9C" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="sensor-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Dispositivo</th>
                        <th>Fazenda</th>
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
                            <td>
                              <span className={`table-badge ${status === "ON" ? "good" : status === "OFF" ? "warning" : ""}`}>
                                {status === "ON" ? "Conectado" : status === "OFF" ? "Desconectado" : status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {!carregandoResumo && dispositivos.length === 0 && (
                        <tr><td colSpan={3}>{erroResumo ? "Dispositivos indisponíveis no momento." : "Nenhum dispositivo cadastrado."}</td></tr>
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
