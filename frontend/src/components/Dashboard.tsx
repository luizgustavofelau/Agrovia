import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/dashboard.css';
import Sensores from './Sensores';
import Campos from './Campos';

type Sensor = { id: string; field: string; humidity: number; temperature: number; reading: string };

const initialSensors: Sensor[] = [
  { id: 'SEN-04', field: 'Talhão 1', humidity: 64, temperature: 23, reading: 'há 2 min' },
  { id: 'SEN-11', field: 'Talhão 2', humidity: 58, temperature: 24, reading: 'há 3 min' },
  { id: 'SEN-07', field: 'Talhão 3', humidity: 27, temperature: 27, reading: 'há 1 min' },
  { id: 'SEN-15', field: 'Talhão 3', humidity: 24, temperature: 28, reading: 'há 4 min' },
  { id: 'SEN-02', field: 'Talhão 4', humidity: 81, temperature: 22, reading: 'há 2 min' },
];
const navItems = ['Painel', 'Sensores', 'Campos', 'Relatórios', 'Alertas', 'Conta'];
const iconTypes = ['dashboard', 'sensor', 'field', 'report', 'alert', 'user'] as const;
const getStatus = (value: number) => value < 30 ? { label: 'Baixa', className: 'low' } : value > 75 ? { label: 'Alta', className: 'high' } : { label: 'Normal', className: 'ok' };

const Icon = ({ type }: { type: typeof iconTypes[number] }) => {
  const content = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="12" width="8" height="9" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></>,
    sensor: <><path d="M12 2v6M12 16v6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" /><circle cx="12" cy="12" r="3" /></>,
    field: <><path d="M3 10L12 4l9 6-9 6-9-6z" /><path d="M7 12.5V18c0 1.1 2.2 2 5 2s5-.9 5-2v-5.5" /></>,
    report: <><path d="M12 3v10M12 13l7-4M12 13l-7-4" /><path d="M5 9v6c0 3 3 6 7 6s7-3 7-6V9" /></>,
    alert: <><path d="M12 3l9 4.5v5c0 5-3.8 8.6-9 9.5-5.2-.9-9-4.5-9-9.5v-5L12 3z" /><path d="M12 8v5M12 16.5h.01" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" /></>,
  }[type];
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{content}</svg>;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const name = localStorage.getItem('usuarioNome') ?? 'Usuário';
  const [activeNav, setActiveNav] = useState('Painel');
  const [activeTab, setActiveTab] = useState('Umidade do solo');
  const [range, setRange] = useState('7 dias');
  const [dateTime, setDateTime] = useState('');
  const [sensors, setSensors] = useState(initialSensors);
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    const updateClock = () => { const now = new Date(); const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); setDateTime(`${date.charAt(0).toUpperCase()}${date.slice(1)} · ${now.toLocaleTimeString('pt-BR')}`); };
    updateClock(); const timer = window.setInterval(updateClock, 1000); return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setSensors(current => current.map(sensor => ({ ...sensor, humidity: Math.round(Math.max(0, Math.min(100, sensor.humidity + (Math.random() - 0.5) * 1.4))) }))), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const averageHumidity = useMemo(() => Math.round(sensors.reduce((total, sensor) => total + sensor.humidity, 0) / sensors.length), [sensors]);
  const logout = () => { localStorage.removeItem('usuarioNome'); localStorage.removeItem('usuarioLogado'); navigate('/login'); };

  return <div className="dashboard-light">
    <aside className="dashboard-sidebar">
      <div className="dashboard-brand"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M15 27C15 27 5 21.5 5 13.2C5 8.5 8.6 5 13 5C14.5 5 16 5.5 17.2 6.6C15.6 8.4 15 10.7 15 13C15 15.3 15.6 17.6 17.2 19.4C16 20.5 14.5 21 13 21" stroke="#8FB37B" strokeWidth="1.6" strokeLinecap="round" /><path d="M15 27C15 27 25 21.5 25 13.2C25 8.5 21.4 5 17 5C15.5 5 14 5.5 12.8 6.6C14.4 8.4 15 10.7 15 13C15 15.3 14.4 17.6 12.8 19.4C14 20.5 15.5 21 17 21" fill="#5B8C4A" stroke="#5B8C4A" strokeWidth="1.6" strokeLinecap="round" /></svg><div><div className="dashboard-brand-name">Agrovia</div><div className="dashboard-brand-sub">MONITORAMENTO DE SOLO</div></div></div>
      <nav className="dashboard-nav" aria-label="Navegação principal">{navItems.map((item, index) => <button key={item} type="button" className={`dashboard-nav-item ${activeNav === item ? 'active' : ''}`} onClick={() => setActiveNav(item)}><Icon type={iconTypes[index]} />{item}{item === 'Alertas' && <span className="alert-count">3</span>}</button>)}</nav>
      <div className="dashboard-sidebar-footer">Próxima irrigação<br /><strong>Talhão 3 · em 2h 15min</strong></div>
    </aside>

    <main className="dashboard-main">
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
    </main>
  </div>;
};

export default Dashboard;
