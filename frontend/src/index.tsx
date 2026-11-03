import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/metric-summary.css';
import App from './App';

// O app vive em PUBLIC_URL (/tecti/2026/gpec05). Fora desse caminho o roteador não
// renderiza nada, então quem abrir a raiz do servidor é levado ao endereço correto.
const basePath = process.env.PUBLIC_URL || '';
if (basePath && !window.location.pathname.startsWith(basePath)) {
  window.location.replace(`${basePath}/${window.location.search}${window.location.hash}`);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);