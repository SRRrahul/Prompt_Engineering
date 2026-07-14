import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GtecLogo from '../../components/GtecLogo';
import { publicApi } from '../../api/client';
import { useExaminerAuth } from '../../context/ExaminerAuthContext';

export default function ExaminerLogin() {
  const { login } = useExaminerAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.post('/auth/examiner/login', form);
      login(res.data.token, res.data.user);
      navigate('/examiner/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '440px', width: '100%', animation: 'slideUp 0.4s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GtecLogo size={96} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '6px' }}>
            Prompt Engineering
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Information Technology Department
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              Student Portal
            </h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label">Username or Email</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your auto-generated username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your auto-generated password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                    style={{ paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light)'
                    }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : '🔐 Sign In to Exam Portal'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--accent-light)', marginTop: '20px', paddingTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                Not registered yet? <Link to="/examiner/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register here</Link>
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/" style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
