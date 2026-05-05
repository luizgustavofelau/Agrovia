import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactElement;
}

/**
 * Protege rotas que exigem autenticação.
 * Se não houver 'usuarioNome' no localStorage, redireciona para /login.
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = Boolean(localStorage.getItem('usuarioNome'));
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
