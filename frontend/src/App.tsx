import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ParallaxDrops from './components/ParallaxDrops';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Conta from './pages/Conta';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page com efeito Parallax */}
        <Route path="/" element={<ParallaxDrops />} />

        {/* Página de Login */}
        <Route path="/login" element={<Login />} />

        {/* Painel — acessível apenas após login */}
        <Route
          path="/painel/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/conta"
          element={
            <PrivateRoute>
              <Conta />
            </PrivateRoute>
          }
        />

        {/* Qualquer rota desconhecida redireciona para Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
