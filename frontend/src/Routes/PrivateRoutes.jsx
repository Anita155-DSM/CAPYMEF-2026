import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoutes() {
  const token = localStorage.getItem('token');
  
  // Si tiene token, lo dejamos ver Noticias, Eventos, etc.
  // Si no tiene token, lo mandamos a loguearse.
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}