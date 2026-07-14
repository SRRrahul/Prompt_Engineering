import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useExaminerAuth } from '../../context/ExaminerAuthContext';
import { examinerApi } from '../../api/client';

export default function ExaminerDashboard() {
  const { user, updateExamStatus } = useExaminerAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    examinerApi.get('/exam/settings').then(r => setSettings(r.data)).catch(() => { });

    // If already in_progress, resume
    if (user?.examStatus === 'in_progress') {
      navigate('/examiner/exam');
    }
    // If completed, show results
    if (user?.examStatus === 'completed') {
      navigate('/examiner/result');
    }
  }, [user, navigate]);

  const handleStartConfirm = async () => {
    setStarting(true);
    setError('');
    try {
      await examinerApi.post('/exam/start');
      updateExamStatus('in_progress');
      navigate('/examiner/exam');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start exam. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar />
      <div className="page-content">
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Welcome Header */}
          <div className="animate-slide-up" style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--primary-dark)', marginBottom: '8px' }}>
              Welcome, {user?.name}
            </h1>
            <p style={{ color: 'var(--text-light)' }}>
              You are registered for the Prompt Engineering Online Assessment.
            </p>
          </div>

          {/* Exam Info Card */}
          <div className="card animate-slide-up" style={{ marginBottom: '24px', animationDelay: '0.1s' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                Prompt Engineering — Online Exam
              </h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '20px', marginBottom: '24px' }}>
                {[
                  { icon: '', label: 'Questions', value: settings?.questionsPerExam || 5 },
                  { icon: '', label: 'Duration', value: `${settings?.timerDurationMinutes || 60} min` },
                  { icon: '', label: 'Min Words', value: `${settings?.minWordCount || 250}/answer` },
                  { icon: '', label: 'Grading', value: 'AI Verified' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius)',
                    padding: '16px',
                    textAlign: 'center',
                    border: '1px solid var(--accent-light)',
                  }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Exam Status</div>
                  <span className={`badge ${user?.examStatus === 'not_started' ? 'badge-gray' : 'badge-mint'}`}>
                    {user?.examStatus === 'not_started' ? '⭕ Not Started' : '✅ ' + user?.examStatus}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Student</div>
                  <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>{user?.username}</div>
                </div>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

              {user?.examStatus === 'not_started' && (
                <button className="btn btn-mint btn-lg w-full" onClick={() => setShowModal(true)}>
                  ▶ Start Examination
                </button>
              )}
            </div>
          </div>

          {/* Instructions Recap */}
          <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="card-header" style={{ background: 'var(--primary)' }}>
              <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '1rem' }}> Before You Begin</h3>
            </div>
            <div className="card-body">
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Ensure you have a stable internet connection before starting.',
                  `The timer will start immediately when you click "Start Exam" — you have ${settings?.timerDurationMinutes || 60} minutes.`,
                  `Each answer must be at least ${settings?.minWordCount || 250} words. The Submit button is disabled below this threshold.`,
                  'Tab switching, copy-paste, and right-click are disabled during the exam.',
                  'The exam runs in fullscreen mode. Exiting fullscreen is logged as a violation.',
                  'After 5 violations, the exam is automatically submitted.',
                  'Do NOT refresh or close the browser — your progress is auto-saved.',
                ].map((tip, i) => (
                  <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', color: 'var(--text-mid)' }}>
                    <span style={{ color: 'var(--secondary-dark)', fontWeight: 700, flexShrink: 0 }}>→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-slide-up">
            <div className="modal-header" style={{ background: 'var(--error)' }}>
              <h2>⚠️ Examination Warning</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-mid)', marginBottom: '16px' }}>
                You are about to begin the <strong>Prompt Engineering Online Assessment</strong>.
              </p>
              <div className="alert alert-warning">
                <strong>Please read carefully:</strong>
                <ul style={{ marginTop: '10px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  <li>Once you proceed, the timer will start <strong>immediately and cannot be paused</strong>.</li>
                  <li>Tab switching, copy-paste, and exiting the exam window will be <strong>disabled and monitored</strong>.</li>
                  <li>Repeated violations will trigger <strong>automatic submission</strong>.</li>
                  <li>The exam will be auto-submitted when the timer expires.</li>
                </ul>
              </div>
              <p style={{ marginTop: '16px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                Do you wish to continue?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)} disabled={starting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleStartConfirm} disabled={starting}>
                {starting ? <><span className="spinner" /> Starting...</> : 'I Understand, Start Exam'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
