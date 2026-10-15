import React from 'react';
import { BarChart3, BookOpen, Bell, Gauge, Leaf, Sprout, UserRound, Wifi } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

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
    <Link
      to="/"
      aria-label="Voltar para a página inicial"
      title="Ir para a página inicial"
      className="dashboard-brand group cursor-pointer rounded-lg no-underline text-inherit transition duration-200 ease-out hover:scale-[1.02] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1A10] motion-reduce:transition-none motion-reduce:hover:scale-100"
    >
      <div className="brand-mark"><Leaf size={21} className="transition-transform duration-200 ease-out group-hover:rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" /></div>
      <div>
        <div className="dashboard-brand-name">Agrovia</div>
        <div className="dashboard-brand-sub">MONITORAMENTO DE SOLO</div>
      </div>
    </Link>
    <nav className="dashboard-nav" aria-label="Navegação principal">{items.map(({ label, to, icon: Icon }) => <NavLink key={label} to={to} end={to === '/painel'} className={({ isActive }) => `dashboard-nav-item ${isActive ? (label === 'Conta' ? 'account-active' : 'active') : ''}`}><Icon size={17} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
    <div className="dashboard-sidebar-footer">Organização agrícola<br /><strong>Campos · Sensores · Estudos</strong></div>
  </aside>;
}
