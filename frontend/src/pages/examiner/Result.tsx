import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import GtecLogo from '../../components/GtecLogo';
import { useExaminerAuth } from '../../context/ExaminerAuthContext';

export default function ExaminerResult() {
  const navigate = useNavigate();
  const { logout } = useExaminerAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '600px', width: '100%', marginTop: '40px' }}>
          <div className="card animate-slide-up" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '36px 28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <GtecLogo size={88} />
              </div>
              <h1 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '4px' }}>Examination Completed</h1>
              <p style={{ color: 'var(--secondary-light)', fontSize: '0.9rem' }}>Prompt Engineering Online Assessment — GTEC</p>
            </div>

            <div className="card-body" style={{ textAlign: 'center', padding: '50px 24px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
              <h2 style={{ color: 'var(--primary-dark)', marginBottom: '16px' }}>Thank You!</h2>
              <p style={{ color: 'var(--text-mid)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
                Your exam has been successfully submitted. Your answers have been recorded securely and will be evaluated by the administrator.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => logout()}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
