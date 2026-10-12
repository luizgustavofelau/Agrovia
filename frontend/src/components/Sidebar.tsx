import React from 'react';
import { BarChart3, BookOpen, Bell, Gauge, Leaf, Sprout, UserRound, Wifi } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { label: 'Painel', to: '/painel', icon: Gauge },
  { label: 'Sensores', to: '/painel/sensores', icon: Wifi },
  { label: 'Campos', to: '/painel/campos', icon: Sprout },
  { label: 'Estudos Agrícolas', to: '/painel/estudos', icon: BookOpen },
  { label: 'Relatórios', to: '/painel/relatorios', icon: BarChart3 },
  { label: 'Alertas', to: '/painel/alertas', icon: Bell },
  { label: 'Conta', to: '/conta', icon: UserRound },
];

export default function Sidebar() {
  return <aside className="dashboard-sidebar !bg-[#0F1A10]">
    <div className="dashboard-brand"><div className="brand-mark"><Leaf size={21} /></div><div><div className="dashboard-brand-name">Agrovia</div><div className="dashboard-brand-sub">MONITORAMENTO DE SOLO</div></div></div>
    <nav className="dashboard-nav" aria-label="Navegação principal">{items.map(({ label, to, icon: Icon }) => <NavLink key={label} to={to} end={to === '/painel'} className={({ isActive }) => `dashboard-nav-item ${isActive ? (label === 'Conta' ? 'account-active' : 'active') : ''}`}><Icon size={17} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
    <div className="dashboard-sidebar-footer">Organização agrícola<br /><strong>Campos · Sensores · Estudos</strong></div>
  </aside>;
}
