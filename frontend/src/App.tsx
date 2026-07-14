import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ExaminerAuthProvider } from './context/ExaminerAuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import Home from './pages/Home';
import ExamDemo from './pages/ExamDemo';
import ExaminerRegister from './pages/examiner/Register';
import ExaminerLogin from './pages/examiner/Login';
import ExaminerDashboard from './pages/examiner/Dashboard';
import ExamInterface from './pages/examiner/ExamInterface';
import ExaminerResult from './pages/examiner/Result';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ExaminerPrivateRoute from './components/ExaminerPrivateRoute';
import AdminPrivateRoute from './components/AdminPrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <ExaminerAuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<ExamDemo />} />
            <Route path="/examiner/register" element={<ExaminerRegister />} />
            <Route path="/examiner/login" element={<ExaminerLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Examiner Protected */}
            <Route element={<ExaminerPrivateRoute />}>
              <Route path="/examiner/dashboard" element={<ExaminerDashboard />} />
              <Route path="/examiner/exam" element={<ExamInterface />} />
              <Route path="/examiner/result" element={<ExaminerResult />} />
            </Route>

            {/* Admin Protected */}
            <Route element={<AdminPrivateRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </ExaminerAuthProvider>
    </BrowserRouter>
  );
}
