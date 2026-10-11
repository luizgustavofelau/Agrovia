import React from 'react';
import { Bell, BarChart3, Gauge, Leaf, Sprout, UserRound, Wifi } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { label: 'Painel', to: '/painel', icon: Gauge },
  { label: 'Sensores', to: '/painel/sensores', icon: Wifi },
  { label: 'Campos', to: '/painel/campos', icon: Sprout },
  { label: 'Relatórios', to: '/painel/relatorios', icon: BarChart3 },
  { label: 'Alertas', to: '/painel/alertas', icon: Bell },
  { label: 'Conta', to: '/conta', icon: UserRound },
];

export default function Sidebar() {
  return <aside className="dashboard-sidebar !bg-[#0F1A10]">
    <div className="dashboard-brand"><div className="brand-mark"><Leaf size={21} /></div><div><div className="dashboard-brand-name">Agrovia</div><div className="dashboard-brand-sub">MONITORAMENTO DE SOLO</div></div></div>
    <nav className="dashboard-nav" aria-label="Navegação principal">{items.map(({ label, to, icon: Icon }) => <NavLink key={label} to={to} end={to === '/painel'} className={({ isActive }) => `dashboard-nav-item ${isActive ? (label === 'Conta' ? 'account-active' : 'active') : ''}`}><Icon size={17} />{label}{label === 'Alertas' && <span className="alert-count">3</span>}</NavLink>)}</nav>
    <div className="dashboard-sidebar-footer"><span>Previsão demonstrativa</span><br /><strong>Talhão 3 · em 2h 15min</strong></div>
  </aside>;
}
