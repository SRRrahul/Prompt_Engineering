import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminPrivateRoute() {
  const { token } = useAdminAuth();
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
