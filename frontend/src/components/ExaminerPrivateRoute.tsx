import { Navigate, Outlet } from 'react-router-dom';
import { useExaminerAuth } from '../context/ExaminerAuthContext';

export default function ExaminerPrivateRoute() {
  const { token } = useExaminerAuth();
  return token ? <Outlet /> : <Navigate to="/examiner/login" replace />;
}
