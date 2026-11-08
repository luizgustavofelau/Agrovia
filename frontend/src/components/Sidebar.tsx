import React from 'react';
import { BarChart3, BookOpen, Bell, Gauge, Sprout, UserRound, Wifi } from 'lucide-react';
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
      <img src={`${process.env.PUBLIC_URL}/img/logo-agrovia.png`} alt="" className="brand-logo" width="28" height="28" />
      <div className="dashboard-brand-name">AGRO<span>VIA</span></div>
    </Link>
    <nav className="dashboard-nav" aria-label="Navegação principal">{items.map(({ label, to, icon: Icon }) => <NavLink key={label} to={to} end={to === '/painel'} className={({ isActive }) => `dashboard-nav-item ${isActive ? (label === 'Conta' ? 'account-active' : 'active') : ''}`}><Icon size={17} aria-hidden="true" /><span>{label}</span></NavLink>)}</nav>
    <div className="dashboard-sidebar-footer">© 2026 Agrovia</div>
    {/* Onda com fio neon na borda do menu, como as passagens da página inicial. */}
    <svg className="painel-onda" viewBox="0 0 40 1440" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 0H12C34 260 26 500 8 720C-6 940 30 1180 16 1440H0Z" />
      <path className="painel-onda-linha" d="M12 0C34 260 26 500 8 720C-6 940 30 1180 16 1440" />
    </svg>
  </aside>;
}
