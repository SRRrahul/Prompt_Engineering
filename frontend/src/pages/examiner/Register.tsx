import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GtecLogo from '../../components/GtecLogo';
import { publicApi } from '../../api/client';

interface FormState {
  name: string;
  email: string;
  department: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export default function ExaminerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ name: '', email: '', department: '', username: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim())) {
      errs.username = 'Username must be 3–20 characters: letters, numbers, or underscores only.';
    }
    if (form.password.length < 8 || !/\d/.test(form.password)) {
      errs.password = 'Password must be at least 8 characters and contain at least one number.';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    // Clear field-level error on change
    if (fieldErrors[field as keyof FieldErrors]) {
      setFieldErrors(fe => ({ ...fe, [field]: undefined }));
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      await publicApi.post('/auth/examiner/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/examiner/login'), 2500);
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.field === 'username') {
        setFieldErrors(fe => ({ ...fe, username: data.message }));
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center', animation: 'slideUp 0.4s ease both' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E8F5E9', border: '3px solid #2E7D32', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>
            ✅
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', color: 'var(--primary-dark)', marginBottom: '12px' }}>Registration Successful!</h2>
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <strong>Welcome, {form.name.split(' ')[0]}!</strong> Your account has been created.
            You will be redirected to the login page in a moment...
          </div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Use your chosen username <strong>"{form.username}"</strong> and password to log in.
          </p>
          <button className="btn btn-primary w-full" onClick={() => navigate('/examiner/login')}>
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '500px', width: '100%', animation: 'slideUp 0.4s ease both' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GtecLogo size={96} />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '6px' }}>
            Student Registration
          </h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
            Ghana Technology and Engineering College
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
              Register for Prompt Engineering competition
            </h3>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. kamalesh D"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="e.g. kamal@gmail.com"
                  value={form.email}
                  onChange={handleChange('email')}
                  required
                />
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label">Department / Roll Number*</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Information technology"
                  value={form.department}
                  onChange={handleChange('department')}
                />
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--accent-light)', paddingTop: '4px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '12px' }}>
                  Choose your login credentials — you will use these to access the exam portal.
                </p>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. kamalesh2024 (3–20 chars)"
                  value={form.username}
                  onChange={handleChange('username')}
                  autoComplete="username"
                  required
                  style={{ borderColor: fieldErrors.username ? 'var(--error)' : undefined }}
                />
                {fieldErrors.username && <span className="form-error">{fieldErrors.username}</span>}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 chars + at least 1 number"
                    value={form.password}
                    onChange={handleChange('password')}
                    autoComplete="new-password"
                    required
                    style={{ paddingRight: '44px', borderColor: fieldErrors.password ? 'var(--error)' : undefined }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light)' }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
                {/* Strength hint */}
                {form.password && !fieldErrors.password && (
                  <span style={{ fontSize: '0.78rem', color: form.password.length >= 8 && /\d/.test(form.password) ? 'var(--secondary-dark)' : 'var(--text-light)' }}>
                    {form.password.length >= 8 && /\d/.test(form.password) ? '✔ Strong enough' : 'Add at least 8 chars and 1 number'}
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    autoComplete="new-password"
                    required
                    style={{ paddingRight: '44px', borderColor: fieldErrors.confirmPassword ? 'var(--error)' : undefined }}
                  />
                  <button type="button" onClick={() => setShowConfirmPw(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--text-light)' }}>
                    {showConfirmPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="form-error">{fieldErrors.confirmPassword}</span>}
                {form.confirmPassword && !fieldErrors.confirmPassword && form.password === form.confirmPassword && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--secondary-dark)' }}>✔ Passwords match</span>
                )}
              </div>

              <button className="btn btn-mint w-full btn-lg" type="submit" disabled={loading}>
                {loading ? <><span className="spinner" style={{ borderTopColor: 'var(--primary-dark)' }} /> Registering...</> : 'Create Account →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
              Already registered? <Link to="/examiner/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login here</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
          <Link to="/" style={{ color: 'var(--text-light)' }}>← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
