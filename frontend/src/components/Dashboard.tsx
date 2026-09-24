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
<<<<<<< HEAD
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
=======
      <header className="dashboard-topbar"><div><h1>Bom dia, equipe Agrovia</h1><p>Fazenda Santa Rita · atualizado há 4 minutos <span>{dateTime}</span></p></div><button type="button" className="dashboard-user-chip" onClick={logout}><span className="dashboard-avatar">{initials}</span><span>{name}</span></button></header>
      {activeNav === 'Sensores' ? (
        <Sensores />
      ) : activeNav === 'Campos' ? (
        <Campos />
      ) : (
        <>
          <section className="dashboard-kpis" aria-label="Resumo da fazenda">
            <div className="dashboard-kpi"><div className="dashboard-kpi-head">Umidade média do solo <span className="status-tag good">Ideal</span></div><div className="dashboard-kpi-value">{averageHumidity}<small>%</small></div><div className="dashboard-kpi-sub">↑ 4% em relação a ontem</div></div>
            <div className="dashboard-kpi"><div className="dashboard-kpi-head">Temperatura do solo</div><div className="dashboard-kpi-value">24<small>°C</small></div><div className="dashboard-kpi-sub">Umidade do ar: 55%</div></div>
            <div className="dashboard-kpi"><div className="dashboard-kpi-head">Sensores ativos</div><div className="dashboard-kpi-value">18<small>/20</small></div><div className="mini-bars">{[40, 70, 55, 90, 60, 75, 45, 65].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
            <div className="dashboard-kpi"><div className="dashboard-kpi-head">Alertas ativos <span className="status-tag bad">3 talhões</span></div><div className="dashboard-kpi-value">3</div><div className="dashboard-kpi-sub">Umidade abaixo de 30%</div></div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-panel">
              <div className="dashboard-tabs">{['Umidade do solo', 'Temperatura', 'Precipitação'].map(tab => <button type="button" key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
              <div className="dashboard-panel-head"><div><h2>Tendência de {activeTab.toLowerCase()} — últimos 7 dias</h2><div className="chart-legend"><span><i className="water" />Talhão 1</span><span><i className="leaf" />Talhão 2</span><span><i className="soil" />Talhão 3</span></div></div><div className="range-select">{['Dia', 'Semana', '7 dias', 'Mês'].map(item => <button type="button" key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
              <svg className="moisture-chart" viewBox="0 0 640 260" role="img" aria-label="Tendência dos níveis dos talhões"><g stroke="#E2DCC7" strokeWidth="1"><line x1="30" y1="20" x2="30" y2="220" /><line x1="30" y1="220" x2="620" y2="220" /></g><g fill="#8B9482" fontSize="11" fontFamily="Plus Jakarta Sans"><text x="6" y="24">90</text><text x="6" y="74">70</text><text x="6" y="124">50</text><text x="10" y="174">30</text><text x="14" y="224">10</text></g><rect x="30" y="86" width="590" height="56" fill="#4C7A3B" opacity=".08" /><text x="622" y="118" fontSize="10" fill="#5E6A57" textAnchor="end">faixa ideal</text><path d="M30,150 L120,120 L210,132 L300,96 L390,110 L480,86 L570,100 L620,92 L620,220 L30,220 Z" fill="url(#fillWater)" /><polyline points="30,150 120,120 210,132 300,96 390,110 480,86 570,100 620,92" fill="none" stroke="#2F7B9C" strokeWidth="2.5" strokeLinecap="round" /><polyline points="30,110 120,100 210,118 300,104 390,122 480,108 570,96 620,112" fill="none" stroke="#4C7A3B" strokeWidth="2.5" strokeLinecap="round" /><polyline points="30,168 120,178 210,160 300,190 390,200 480,182 570,196 620,188" fill="none" stroke="#B97A3D" strokeWidth="2.5" strokeLinecap="round" /><circle cx="390" cy="200" r="4.5" fill="#B97A3D" stroke="#fff" strokeWidth="1.5" /><g fill="#8B9482" fontSize="11" fontFamily="Plus Jakarta Sans" textAnchor="middle">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Hoje'].map((day, index) => <text key={day} x={30 + index * 84.3} y="238">{day}</text>)}</g><defs><linearGradient id="fillWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2F7B9C" stopOpacity=".22" /><stop offset="100%" stopColor="#2F7B9C" stopOpacity="0" /></linearGradient></defs></svg>
              <div className="sensor-table-wrap"><table><thead><tr><th>Sensor</th><th>Talhão</th><th>Umidade</th><th>Temp.</th><th>Última leitura</th><th>Status</th></tr></thead><tbody>{sensors.map(sensor => { const status = getStatus(sensor.humidity); return <tr key={sensor.id}><td>{sensor.id}</td><td>{sensor.field}</td><td>{sensor.humidity}%</td><td>{sensor.temperature}°C</td><td>{sensor.reading}</td><td><span className={`table-badge ${status.className}`}>{status.label}</span></td></tr>; })}</tbody></table></div>
            </div>
            <aside className="dashboard-panel ranking-panel"><div className="dashboard-panel-head"><h2>Ranking de talhões</h2></div><div className="ranking-list">{[81, 64, 58, 45, 26].map((value, index) => <div className="ranking-item" key={value}><div className={`rank-number ${index === 0 ? 'top' : ''}`}>{index + 1}</div><div className="rank-info"><strong>Talhão {[4, 1, 2, 5, 3][index]}</strong><small>{[5, 6, 4, 3, 2][index]} sensores</small></div><div className="rank-value"><strong>{value}%</strong><small className={value < 30 ? 'low-text' : value > 75 ? 'high-text' : 'ideal-text'}>{value < 30 ? 'Baixo' : value > 75 ? 'Alto' : 'Ideal'}</small></div></div>)}</div><div className="weather-heading"><h2>Previsão do tempo</h2></div><div className="weather-row">{[['Hoje', '26°'], ['Qui', '24°'], ['Sex', '22°'], ['Sáb', '23°']].map(([day, temperature]) => <div key={day}><span>{day}</span><strong>{temperature}</strong></div>)}</div></aside>
          </section>
        </>
      )}
>>>>>>> f6ee545 (sensores-eduardo)
    </main>
  </div>;
};

export default Dashboard;
