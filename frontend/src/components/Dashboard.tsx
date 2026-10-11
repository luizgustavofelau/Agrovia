import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Printer } from "lucide-react";
import Sidebar from "./Sidebar";
import "../styles/dashboard.css";
import "../styles/dashboard-mobile.css";
import "../styles/dashboard-alerts.css";
import "../styles/dashboard-reports.css";
import "../styles/dashboard-chart.css";
import "../styles/dashboard-status.css";
import "../styles/dashboard-reporting.css";
import Sensores from "./Sensores";
import Campos from "./Campos";

type SensorResumo = {
  id: string;
  field: string;
  humidity: number;
  temperature: number;
  reading: string;
};

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

const sensors: SensorResumo[] = [
  { id: "S-01", field: "Talhão 1", humidity: 58, temperature: 24, reading: "há 2 min" },
  { id: "S-02", field: "Talhão 2", humidity: 46, temperature: 25, reading: "há 3 min" },
  { id: "S-03", field: "Talhão 3", humidity: 27, temperature: 26, reading: "há 1 min" },
  { id: "S-04", field: "Talhão 4", humidity: 78, temperature: 23, reading: "há 4 min" }
];

const getStatus = (humidity: number) => {
  if (humidity < 30) return { label: "Baixo", className: "bad" };
  if (humidity > 75) return { label: "Alto", className: "warning" };
  return { label: "Ideal", className: "good" };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = localStorage.getItem("usuarioNome") ?? "Usuário";
  const [dateTime, setDateTime] = useState("");
  const [greeting, setGreeting] = useState("Bom dia");
  const [humidity, setHumidity] = useState(52);
  const initials = name.slice(0, 2).toUpperCase();
  const activeNav = location.pathname.endsWith("/sensores")
    ? "Sensores"
    : location.pathname.endsWith("/campos")
      ? "Campos"
      : location.pathname.endsWith("/relatorios")
        ? "Relatórios"
        : location.pathname.endsWith("/alertas")
          ? "Alertas"
          : "Painel";
  const averageHumidity = humidity;
  const [activeTab, setActiveTab] = useState<ChartMetric>("Umidade do solo");
  const [range, setRange] = useState<ChartRange>("7 dias");
  const [mostrarAvisoHistorico, setMostrarAvisoHistorico] = useState(false);
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
  const reportCards = [
    { label: "Irrigação otimizada", value: "94%", accent: "good" },
    { label: "Uso de água", value: "1.280 L", accent: "neutral" },
    { label: "Eficiência energética", value: "87%", accent: "good" },
    { label: "Produtividade prevista", value: "+12.4%", accent: "accent" },
  ];
  const alertCards = [
    { title: "Talhão 3", message: "Umidade crítica em 27% — acionamento recomendado.", severity: "Alta" },
    { title: "Talhão 5", message: "Temperatura acima do limite em 32°C.", severity: "Média" },
    { title: "Bomba principal", message: "Status operacional estável com consumo normal.", severity: "Baixa" },
  ];

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
    const timer = window.setInterval(
      () =>
        setHumidity((value) =>
          Math.round(
            Math.max(48, Math.min(56, value + (Math.random() - 0.5) * 1.2))
          )
        ),
      3000
    );
    return () => window.clearInterval(timer);
  }, []);

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
            <p>
              Fazenda Santa Rita · {dateTime}
            </p>
          </div>
          <div className="dashboard-account-actions">
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
            <strong>Modo demonstração</strong>
            <span>Indicadores, alertas e previsões são ilustrativos e não representam leituras conectadas.</span>
          </div>
        )}
        {activeNav === "Sensores" ? (
          <Sensores />
        ) : activeNav === "Campos" ? (
          <Campos />
        ) : activeNav === "Relatórios" ? (
          <section className="dashboard-reports-panel">
            <div className="dashboard-panel-head reports-head reports-intro">
              <div>
                <p className="section-kicker">Visão de desempenho</p>
                <h2>Relatórios de desempenho</h2>
                <p className="report-lead">
                  Compare consumo hídrico, eficiência da irrigação e produtividade prevista no período selecionado.
                </p>
                <p className="report-meta">Atualizado {dateTime} · Recorte demonstrativo</p>
              </div>
              <button
                type="button"
                className="dashboard-secondary-btn report-export-btn"
                onClick={() => window.print()}
              >
                <Printer size={15} aria-hidden="true" />
                Exportar PDF
              </button>
            </div>

            <div className="report-context" aria-label="Contexto do relatório">
              <div>
                <span>Período analisado</span>
                <strong>Últimos 7 dias</strong>
              </div>
              <div>
                <span>Indicadores acompanhados</span>
                <strong>{reportCards.length} dimensões de desempenho</strong>
              </div>
              <div>
                <span>Escopo do relatório</span>
                <strong>Água, energia e produtividade</strong>
              </div>
            </div>

            <div className="report-grid">
              {reportCards.map((item) => (
                <article key={item.label} className="analysis-card">
                  <span className="analysis-label">{item.label}</span>
                  <strong className={`analysis-value ${item.accent}`}>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className="report-analytics">
              <div className="dashboard-panel compact-panel">
                <div className="dashboard-panel-head mini-head">
                  <h3>Consumo hídrico</h3>
                  <span className="status-tag good">Saudável</span>
                </div>
                <div className="bars-stack" aria-label="Consumo hídrico semanal">
                  {[42, 58, 47, 72, 66, 80, 74].map((value, index) => (
                    <span key={index} style={{ height: `${value}%` }} />
                  ))}
                </div>
              </div>

              <div className="dashboard-panel compact-panel">
                <div className="dashboard-panel-head mini-head">
                  <h3>Resumo executivo</h3>
                </div>
                <ul className="summary-list">
                  <li><span>Umidade média do solo</span><strong>52%</strong></li>
                  <li><span>Área irrigada</span><strong>18 ha</strong></li>
                  <li><span>Tempo médio de irrigação</span><strong>2h 15min</strong></li>
                  <li><span>Desperdício estimado</span><strong>6%</strong></li>
                </ul>
              </div>
            </div>
          </section>
        ) : activeNav === "Alertas" ? (
          <section className="dashboard-reports-panel">
            <div className="dashboard-panel-head reports-head alerts-intro">
              <div>
                <p className="section-kicker">Atenção operacional</p>
                <h2>Central de alertas</h2>
                <p className="alerts-lead">
                  Priorize ocorrências por gravidade e consulte as recomendações para cada área monitorada.
                </p>
              </div>
              <button
                type="button"
                className="dashboard-secondary-btn"
                aria-expanded={mostrarAvisoHistorico}
                onClick={() => setMostrarAvisoHistorico((visible) => !visible)}
              >
                Ver histórico
              </button>
            </div>

            {mostrarAvisoHistorico && (
              <p className="alert-history-note" role="status">
                O histórico completo ficará disponível após a integração com o banco. Os eventos exibidos são demonstrativos.
              </p>
            )}

            <div className="alert-summary" aria-label="Resumo das prioridades">
              <div>
                <span>Eventos ativos</span>
                <strong>{alertCards.length}</strong>
              </div>
              <div className="critical">
                <span>Prioridade alta</span>
                <strong>{alertCards.filter((item) => item.severity === "Alta").length}</strong>
              </div>
              <div className="attention">
                <span>Prioridade média</span>
                <strong>{alertCards.filter((item) => item.severity === "Média").length}</strong>
              </div>
              <div className="low-priority">
                <span>Prioridade baixa</span>
                <strong>{alertCards.filter((item) => item.severity === "Baixa").length}</strong>
              </div>
            </div>

            <div className="alert-grid">
              {alertCards.map((item) => (
                <article key={item.title} className={`alert-card ${item.severity.toLowerCase()}`}>
                  <div className="alert-card-top">
                    <h3>{item.title}</h3>
                    <span className={`severity-pill ${item.severity.toLowerCase()}`}>{item.severity}</span>
                  </div>
                  <p>{item.message}</p>
                </article>
              ))}
            </div>

            <div className="dashboard-panel compact-panel full-width-panel">
              <div className="dashboard-panel-head mini-head">
                <h3>Recomendações automáticas</h3>
              </div>
              <ul className="recommendation-list">
                <li>Reduzir irrigação no Talhão 4 em 12% para evitar excedente hídrico.</li>
                <li>Priorizar inspeção na bomba principal até 18:30, devido a picos de consumo.</li>
                <li>Programar monitoramento manual do Talhão 3 nas próximas 2 horas.</li>
              </ul>
            </div>
          </section>
        ) : (
          <>
            <section className="dashboard-kpis" aria-label="Resumo da fazenda">
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">
                  Umidade média do solo{" "}
                  <span className="status-tag good">Ideal</span>
                </div>
                <div className="dashboard-kpi-value">
                  {averageHumidity}
                  <small>%</small>
                </div>
                <div className="dashboard-kpi-sub">↑ 4% em relação a ontem</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Temperatura do solo</div>
                <div className="dashboard-kpi-value">
                  24<small>°C</small>
                </div>
                <div className="dashboard-kpi-sub">Umidade do ar: 55%</div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">Sensores ativos</div>
                <div className="dashboard-kpi-value">
                  18<small>/20</small>
                </div>
                <div className="mini-bars">
                  {[40, 70, 55, 90, 60, 75, 45, 65].map((height, index) => (
                    <i key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <div className="dashboard-kpi">
                <div className="dashboard-kpi-head">
                  Alertas ativos{" "}
                  <span className="status-tag bad">3 talhões</span>
                </div>
                <div className="dashboard-kpi-value">3</div>
                <div className="dashboard-kpi-sub">Umidade abaixo de 30%</div>
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
                        <th>Sensor</th>
                        <th>Talhão</th>
                        <th>Umidade</th>
                        <th>Temp.</th>
                        <th>Última leitura</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensors.map((sensor) => {
                        const status = getStatus(sensor.humidity);
                        return (
                          <tr key={sensor.id}>
                            <td>{sensor.id}</td>
                            <td>{sensor.field}</td>
                            <td>{sensor.humidity}%</td>
                            <td>{sensor.temperature}°C</td>
                            <td>{sensor.reading}</td>
                            <td>
                              <span
                                className={`table-badge ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <aside className="dashboard-panel ranking-panel">
                <div className="dashboard-panel-head">
                  <h2>Ranking de talhões</h2>
                </div>
                <div className="ranking-list">
                  {[81, 64, 58, 45, 26].map((value, index) => (
                    <div className="ranking-item" key={value}>
                      <div
                        className={`rank-number ${index === 0 ? "top" : ""}`}
                      >
                        {index + 1}
                      </div>
                      <div className="rank-info">
                        <strong>Talhão {[4, 1, 2, 5, 3][index]}</strong>
                        <small>{[5, 6, 4, 3, 2][index]} sensores</small>
                      </div>
                      <div className="rank-value">
                        <strong>{value}%</strong>
                        <small
                          className={
                            value < 30
                              ? "low-text"
                              : value > 75
                                ? "high-text"
                                : "ideal-text"
                          }
                        >
                          {value < 30 ? "Baixo" : value > 75 ? "Alto" : "Ideal"}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="weather-heading">
                  <h2>Previsão do tempo</h2>
                </div>
                <div className="weather-row">
                  {[
                    ["Hoje", "26°"],
                    ["Qui", "24°"],
                    ["Sex", "22°"],
                    ["Sáb", "23°"]
                  ].map(([day, temperature]) => (
                    <div key={day}>
                      <span>{day}</span>
                      <strong>{temperature}</strong>
                    </div>
                  ))}
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
