import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudRain, Droplets, LogOut, Sprout, Thermometer, Wifi, Zap } from 'lucide-react';
import Sidebar from './Sidebar';
import '../styles/dashboard.css';
import Sensores from './Sensores';
import Campos from './Campos';

type Crop = 'Soja' | 'Feijão';

const chartPoints = '0,124 38,116 76,130 114,100 152,108 190,92 228,104 266,82 304,96 342,75 380,86 418,68 456,78 494,58 532,70 570,52 608,62 646,45 684,54 722,42 760,50';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem('usuarioNome') ?? 'Usuário';
  const [irrigationOn, setIrrigationOn] = useState(false);
  const [crop, setCrop] = useState<Crop>('Soja');
  const [dateTime, setDateTime] = useState('');
  const [humidity, setHumidity] = useState(52);
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      setDateTime(`${date.charAt(0).toUpperCase()}${date.slice(1)} · ${now.toLocaleTimeString('pt-BR')}`);
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setHumidity(value => Math.round(Math.max(48, Math.min(56, value + (Math.random() - 0.5) * 1.2)))), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const gaugeStyle = useMemo(() => ({ background: `conic-gradient(var(--leaf-deep) ${humidity * 3.6}deg, var(--bg-soft) 0deg)` }), [humidity]);
  const logout = () => { localStorage.removeItem('usuarioNome'); localStorage.removeItem('usuarioLogado'); navigate('/login'); };

  return <div className="dashboard-light">
    <Sidebar />

    <main className="dashboard-main">
      <header className="dashboard-topbar"><div><p className="eyebrow">PAINEL DE CONTROLE · {dateTime}</p><h1>Bom dia, equipe Agrovia</h1><p>Fazenda Santa Rita <span className="connection-status"><i /> ESP32 Online</span></p></div><div className="topbar-actions"><div className="connection-pill"><i /> Sistema conectado</div><button type="button" className="dashboard-user-chip" onClick={logout} title="Sair"><span className="dashboard-avatar">{initials}</span><span>{name}</span><LogOut size={15} /></button></div></header>
      <section className="dashboard-kpis" aria-label="Resumo da fazenda">
        <article className="dashboard-kpi humidity-kpi"><div className="dashboard-kpi-head"><span>Umidade média do solo</span><Droplets size={17} /></div><div className="gauge-row"><div className="gauge" style={gaugeStyle}><div><strong>{humidity}%</strong><small>Ideal</small></div></div><div><span className="status-tag good">Faixa ideal</span><p className="dashboard-kpi-sub">+4% desde ontem</p></div></div></article>
        <article className="dashboard-kpi"><div className="dashboard-kpi-head"><span>Clima do solo</span><Thermometer size={17} /></div><div className="metric-pair"><div><strong>24<small>°C</small></strong><span>Temperatura</span></div><div><strong>55<small>%</small></strong><span>Umidade do ar</span></div></div><div className="dashboard-kpi-sub">Condições estáveis</div></article>
        <article className="dashboard-kpi"><div className="dashboard-kpi-head"><span>Status dos sensores</span><Wifi size={17} /></div><div className="sensor-status"><strong>18<small>/20</small></strong><span className="status-tag good">Ativos</span></div><div className="signal-line"><span><i /><i /><i /><i /></span> Sinal Wi-Fi estável</div></article>
        <article className="dashboard-kpi"><div className="dashboard-kpi-head"><span>Reservatório d'água</span><CloudRain size={17} /></div><div className="water-level"><strong>76<small>%</small></strong><span>Próxima chuva: amanhã</span></div><div className="progress-track"><i style={{ width: '76%' }} /></div><div className="dashboard-kpi-sub">Volume suficiente para 4 dias</div></article>
      </section>
      <section className="dashboard-content-grid">
        <article className="dashboard-panel chart-panel"><div className="dashboard-panel-head"><div><span className="eyebrow">MONITORAMENTO EM TEMPO REAL</span><h2>Histórico de umidade do solo</h2><p className="panel-description">Variação média nas últimas 24 horas</p></div><span className="chart-current"><i /> Agora {humidity}%</span></div><div className="chart-wrap"><svg className="moisture-chart" viewBox="0 0 760 190" role="img" aria-label="Gráfico de umidade do solo nas últimas 24 horas"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c7a3b" /><stop offset="100%" stopColor="#4c7a3b" stopOpacity="0" /></linearGradient></defs><g className="chart-grid"><line x1="0" y1="20" x2="760" y2="20" /><line x1="0" y1="70" x2="760" y2="70" /><line x1="0" y1="120" x2="760" y2="120" /><line x1="0" y1="170" x2="760" y2="170" /></g><path className="chart-area" d={`M${chartPoints} L760,170 L0,170 Z`} /><polyline points={chartPoints} /><circle cx="760" cy="50" r="5" /><g className="chart-labels"><text x="0" y="188">00h</text><text x="190" y="188">06h</text><text x="380" y="188">12h</text><text x="570" y="188">18h</text><text x="735" y="188">Agora</text></g></svg><div className="chart-y-labels"><span>70%</span><span>60%</span><span>50%</span><span>40%</span></div></div><div className="chart-footer"><span><i className="legend-line" /> Umidade média</span><span><i className="legend-dash" /> Faixa ideal: 45% a 65%</span></div></article>
        <aside className="dashboard-panel quick-actions"><div className="dashboard-panel-head"><div><span className="eyebrow">CONTROLE</span><h2>Ações rápidas</h2></div><Zap size={19} /></div><div className="action-block"><div><strong>Irrigação manual</strong><p>Acione a bomba por comando direto</p></div><button type="button" className={`switch ${irrigationOn ? 'on' : ''}`} aria-pressed={irrigationOn} onClick={() => setIrrigationOn(value => !value)}><span /></button></div><div className={`irrigation-feedback ${irrigationOn ? 'visible' : ''}`}><i /> Irrigação ativada agora</div><label className="crop-label" htmlFor="crop">Cultura agrícola</label><select id="crop" value={crop} onChange={event => setCrop(event.target.value as Crop)}><option>Soja</option><option>Feijão</option></select><div className="crop-tip"><Sprout size={16} /><span><strong>{crop}</strong><br />Faixa recomendada: 45% - 65%</span></div></aside>
      </section>
    </main>
  </div>;
};

export default Dashboard;
