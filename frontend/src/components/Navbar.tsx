import { Link, useNavigate } from 'react-router-dom';
import GtecLogo from './GtecLogo';
import { useExaminerAuth } from '../context/ExaminerAuthContext';

interface Props { variant?: 'default' | 'admin'; adminName?: string; onAdminLogout?: () => void; }

export default function Navbar({ variant = 'default', adminName, onAdminLogout }: Props) {
  const { user, logout } = useExaminerAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/examiner/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <GtecLogo size={72} />
        <div>
          <h1>GTEC</h1>
          <div className="navbar-subtitle">Prompt Engineering Assessment</div>
        </div>
      </Link>

      <ul className="navbar-nav">
        {variant === 'admin' ? (
          <>
            <li><span style={{ color: 'var(--secondary-light)', fontSize: '0.9rem', padding: '8px 14px' }}>
              👤 {adminName || 'Admin'}
            </span></li>
            {onAdminLogout && (
              <li>
                <button className="btn btn-outline btn-sm" onClick={onAdminLogout}
                  style={{ color: 'var(--secondary-light)', borderColor: 'var(--secondary-light)' }}>
                  Logout
                </button>
              </li>
            )}
          </>
        ) : user ? (
          <>
            <li>
              <span style={{ color: 'var(--secondary-light)', fontSize: '0.9rem', padding: '8px 14px' }}>
                👤 {user.name}
              </span>
            </li>
            <li>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}
                style={{ color: 'var(--secondary-light)', borderColor: 'var(--secondary-light)' }}>
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/examiner/login">Login</Link></li>
            <li><Link to="/examiner/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
}
