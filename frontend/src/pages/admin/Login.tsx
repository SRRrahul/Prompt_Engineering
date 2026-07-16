import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GtecLogo from '../../components/GtecLogo';
import { publicApi } from '../../api/client';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Link } from 'react-router-dom';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await publicApi.post('/auth/admin/login', form);
      login(res.data.token, res.data.user);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-dark) 0%, #3E2723 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '440px', width: '100%', animation: 'slideUp 0.4s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GtecLogo size={100} light />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.9rem',
            color: 'var(--white)',
            marginBottom: '6px',
          }}>
            Admin Portal
          </h1>
          <p style={{ color: 'var(--secondary-light)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>
            GTEC — Examination Management System
          </p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255,255,255,0.12)',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'var(--secondary-light)', fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 600 }}>
              🔒 Administrator Login
            </h3>
          </div>
          <div style={{ padding: '28px' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--secondary-light)' }}>Username or Email</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="admin"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--white)', borderColor: 'rgba(255,255,255,0.15)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--secondary-light)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Admin password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--white)', borderColor: 'rgba(255,255,255,0.15)', paddingRight: '44px' }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button className="btn btn-mint w-full btn-lg" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" style={{ borderTopColor: 'var(--primary-dark)' }} /> Authenticating...</> : '🔒 Access Admin Dashboard'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>← Back to Home</Link>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
