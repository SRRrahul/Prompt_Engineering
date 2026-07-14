import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { examinerApi } from '../../api/client';
import { useExaminerAuth } from '../../context/ExaminerAuthContext';
import GtecLogo from '../../components/GtecLogo';

interface Question { id: string; text: string; rubric: string; marks: number; }
interface Session { id: string; startTime: string; durationMinutes: number; remainingMs: number; violationCount: number; }

export default function ExamInterface() {
  const { user, updateExamStatus } = useExaminerAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [_session, setSession] = useState<Session | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [savedAnswers, setSavedAnswers] = useState<Record<string, boolean>>({});
  const [remainingMs, setRemainingMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationMessage, setViolationMessage] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [settings, setSettings] = useState({ minWordCount: 250, maxViolations: 5 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const violationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  // ── Load exam data ───────────────────────────────────────────
  useEffect(() => {
    const loadExam = async () => {
      try {
        const [sessionRes, settingsRes] = await Promise.all([
          examinerApi.get('/exam/session'),
          examinerApi.get('/exam/settings'),
        ]);
        const s = sessionRes.data;
        setSession(s);
        setRemainingMs(s.remainingMs);
        setViolationCount(s.violationCount);
        setSettings({ minWordCount: settingsRes.data.minWordCount, maxViolations: settingsRes.data.maxViolationsBeforeAutoSubmit });

        // Fetch questions via start (resumes existing session)
        const startRes = await examinerApi.post('/exam/start');
        setQuestions(startRes.data.questions as Question[]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load exam. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, []);

  // ── Fullscreen ───────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !submitted) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [loading, submitted]);

  // ── Timer countdown ──────────────────────────────────────────
  useEffect(() => {
    if (loading || submitted) return;
    timerRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - 1000;
        if (next <= 0) { handleAutoSubmit(); return 0; }
        return next;
      });
    }, 1000);

    // Server sync every 30s
    syncRef.current = setInterval(async () => {
      try {
        const res = await examinerApi.get('/exam/session');
        setRemainingMs(res.data.remainingMs);
        if (res.data.status !== 'in_progress') handleAutoSubmit();
      } catch {}
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [loading, submitted]);

  // ── Lockdown: disable copy/cut/paste/contextmenu ─────────────
  useEffect(() => {
    if (loading || submitted) return;
    const noop = (e: Event) => { e.preventDefault(); return false; };
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'F12') { e.preventDefault(); logViolation('devtools_shortcut'); }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) { e.preventDefault(); logViolation('devtools_shortcut'); }
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); }
    };
    const handleVisibility = () => { if (document.hidden) logViolation('tab_switch'); };
    const handleBlur = () => logViolation('window_blur');
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) logViolation('fullscreen_exit');
    };

    document.addEventListener('copy', noop);
    document.addEventListener('cut', noop);
    document.addEventListener('paste', noop);
    document.addEventListener('contextmenu', noop);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('copy', noop);
      document.removeEventListener('cut', noop);
      document.removeEventListener('paste', noop);
      document.removeEventListener('contextmenu', noop);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [loading, submitted]);

  const logViolation = useCallback(async (type: string) => {
    if (isSubmittingRef.current) return;
    try {
      const res = await examinerApi.post('/exam/violation', { type });
      const newCount = res.data.violationCount;
      setViolationCount(newCount);
      setViolationMessage(getViolationMessage(type));
      setShowViolationAlert(true);
      if (violationTimeoutRef.current) clearTimeout(violationTimeoutRef.current);
      violationTimeoutRef.current = setTimeout(() => setShowViolationAlert(false), 4000);
      if (res.data.autoSubmit) handleAutoSubmit();
    } catch {}
  }, []);

  const getViolationMessage = (type: string): string => {
    const msgs: Record<string, string> = {
      tab_switch: '⚠️ Tab switching detected!',
      window_blur: '⚠️ Window focus lost!',
      fullscreen_exit: '⚠️ Fullscreen exited!',
      devtools_shortcut: '⚠️ DevTools shortcut blocked!',
    };
    return msgs[type] || '⚠️ Violation detected!';
  };

  // ── Save answer ──────────────────────────────────────────────
  const saveCurrentAnswer = useCallback(async (qId: string, text: string) => {
    if (!qId || isSubmittingRef.current) return;
    setSavingAnswer(true);
    try {
      await examinerApi.post('/exam/answer', { questionId: qId, answerText: text });
      setSavedAnswers(prev => ({ ...prev, [qId]: true }));
    } catch {}
    setSavingAnswer(false);
  }, []);

  const handleAnswerChange = (text: string) => {
    const qId = questions[currentIdx]?.id;
    if (!qId) return;
    
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 250) {
      // Prevent typing more than 250 words, unless they are deleting
      const currentWordCount = (answers[qId] || '').trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > currentWordCount) return;
    }

    setAnswers(prev => ({ ...prev, [qId]: text }));
    setSavedAnswers(prev => ({ ...prev, [qId]: false }));
    // Debounced auto-save
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => saveCurrentAnswer(qId, text), 1500);
  };

  // ── Navigate questions ───────────────────────────────────────
  const handleNavigate = async (idx: number) => {
    const qId = questions[currentIdx]?.id;
    if (qId && answers[qId] !== undefined) {
      await saveCurrentAnswer(qId, answers[qId] || '');
    }
    setCurrentIdx(idx);
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (auto = false) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    // Save all answers first
    const qId = questions[currentIdx]?.id;
    if (qId && answers[qId]) await saveCurrentAnswer(qId, answers[qId]);

    try {
      await examinerApi.post('/exam/submit', { autoSubmit: auto });
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncRef.current) clearInterval(syncRef.current);
      setSubmitted(true);
      updateExamStatus('completed');
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
      isSubmittingRef.current = false;
    }
    setSubmitting(false);
  };

  const handleAutoSubmit = async () => {
    if (isSubmittingRef.current) return;
    await handleSubmit(true);
  };

  // ── Timer display ────────────────────────────────────────────
  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerClass = remainingMs <= 60000 ? 'timer danger' : remainingMs <= 300000 ? 'timer warning' : 'timer';

  // ── Word count ───────────────────────────────────────────────
  const currentAnswer = answers[questions[currentIdx]?.id] || '';
  const wordCount = currentAnswer.trim().split(/\s+/).filter(Boolean).length;
  const wordProgress = Math.min((wordCount / 250) * 100, 100);
  const isLimitReached = wordCount >= 250;

  const answeredCount = questions.filter(q => {
    const text = answers[q.id] || '';
    return text.trim().length > 0; // Considered answered if not empty
  }).length;

  // ── States ───────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
      <span className="spinner spinner-brown" style={{ width: '40px', height: '40px' }} />
      <p style={{ color: 'var(--text-light)' }}>Loading your examination...</p>
    </div>
  );

  if (submitted) return (
    <InlineResult
      answeredCount={answeredCount}
      totalQuestions={questions.length}
      violationCount={violationCount}
      onDashboard={() => navigate('/examiner/dashboard')}
    />
  );

  if (error && questions.length === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
          <h3 style={{ color: 'var(--primary-dark)', marginBottom: '12px' }}>Error Loading Exam</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    </div>
  );

  const currentQuestion = questions[currentIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', userSelect: 'none' }}>
      {/* Violation Alert Overlay */}
      {showViolationAlert && (
        <div className="violation-overlay" style={{ zIndex: 3000 }}>
          <div className="violation-box">
            <div className="violation-icon">🚨</div>
            <h3 style={{ color: 'var(--error)', marginBottom: '8px' }}>{violationMessage}</h3>
            <p style={{ color: 'var(--text-mid)', marginBottom: '16px' }}>
              Violation {violationCount} of {settings.maxViolations}. After {settings.maxViolations} violations, your exam will be auto-submitted.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowViolationAlert(false)}>
              I Understand — Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        background: 'var(--primary-dark)',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(78,52,46,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GtecLogo size={64} />
          <div>
            <div style={{ color: 'var(--white)', fontWeight: 700, fontSize: '0.95rem', fontFamily: "'Playfair Display', serif" }}>
              Prompt Engineering Assessment
            </div>
            <div style={{ color: 'var(--secondary-light)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {user?.name} • {user?.username}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {savingAnswer && (
            <span style={{ color: 'var(--secondary-light)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
              Saving...
            </span>
          )}
          {savedAnswers[currentQuestion?.id] && !savingAnswer && (
            <span style={{ color: 'var(--secondary-light)', fontSize: '0.8rem' }}>✓ Saved</span>
          )}

          {/* Violations indicator */}
          {violationCount > 0 && (
            <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>
              ⚠️ {violationCount} violation{violationCount > 1 ? 's' : ''}
            </span>
          )}

          {/* Timer */}
          <div className={timerClass}>
            <div className="timer-dot" style={{
              background: remainingMs <= 60000 ? '#FF8A80' : remainingMs <= 300000 ? '#FFC107' : 'var(--secondary)'
            }} />
            ⏱ {formatTime(remainingMs)}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar — Question Navigator */}
        <div style={{
          width: '220px',
          flexShrink: 0,
          background: 'var(--white)',
          borderRight: '1px solid var(--accent-light)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-light)', marginBottom: '8px' }}>
            Questions
          </div>
          {questions.map((q, idx) => {
            const text = answers[q.id] || '';
            const wc = text.trim().split(/\s+/).filter(Boolean).length;
            const done = wc > 0;
            return (
              <button
                key={q.id}
                onClick={() => handleNavigate(idx)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${idx === currentIdx ? 'var(--primary)' : done ? 'var(--secondary-dark)' : 'var(--accent-light)'}`,
                  background: idx === currentIdx ? 'var(--primary-dark)' : done ? 'var(--secondary-pale)' : 'transparent',
                  color: idx === currentIdx ? 'var(--white)' : done ? 'var(--secondary-dark)' : 'var(--text-mid)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.87rem',
                  fontWeight: idx === currentIdx ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: idx === currentIdx ? 'rgba(255,255,255,0.2)' : done ? 'var(--secondary-dark)' : 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700,
                  color: idx === currentIdx ? 'white' : done ? 'white' : 'var(--text-light)',
                }}>
                  {done ? '✓' : idx + 1}
                </span>
                <span>Q{idx + 1}</span>
                {done && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', opacity: 0.7 }}>✓</span>}
              </button>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--accent-light)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginBottom: '8px', textAlign: 'center' }}>
              {answeredCount} / {questions.length} complete
            </div>
            <button
              className="btn btn-primary w-full btn-sm"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {submitting ? <><span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Submitting</> : '📤 Submit All'}
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {currentQuestion && (
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-light)', fontWeight: 600 }}>
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className="badge badge-brown">📊 {currentQuestion.marks} marks</span>
                    <span className={`badge ${isLimitReached ? 'badge-warning' : 'badge-mint'}`}>
                      {wordCount} / 250 words
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleNavigate(Math.max(0, currentIdx - 1))}
                    disabled={currentIdx === 0}
                  >← Prev</button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleNavigate(Math.min(questions.length - 1, currentIdx + 1))}
                    disabled={currentIdx === questions.length - 1}
                  >Next →</button>
                </div>
              </div>

              {/* Question Text */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                  padding: '6px 20px',
                  fontSize: '0.75rem',
                  color: 'var(--secondary-light)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                }}>
                  Question {currentIdx + 1}
                </div>
                <div style={{ padding: '24px' }}>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-dark)', fontWeight: 500 }}>
                    {currentQuestion.text}
                  </p>
                </div>
              </div>

              {/* Answer Textarea */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text-mid)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '8px',
                }}>
                  Your Answer
                </label>
                <textarea
                  className="form-textarea"
                  value={currentAnswer}
                  onChange={e => handleAnswerChange(e.target.value)}
                  placeholder={`Write your answer here. Maximum 250 words allowed.\n\nBe thorough and detailed — the AI evaluator assesses depth, accuracy, and relevance to the rubric.`}
                  style={{
                    minHeight: '320px',
                    userSelect: 'text',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.95rem',
                    lineHeight: '1.75',
                    resize: 'vertical',
                    borderColor: isLimitReached ? 'var(--warning)' : undefined,
                  }}
                  onCopy={e => e.preventDefault()}
                  onCut={e => e.preventDefault()}
                  onPaste={e => e.preventDefault()}
                />
              </div>

              {/* Word Counter */}
              <div className="word-counter">
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div
                    className={`progress-fill`}
                    style={{
                      width: `${wordProgress}%`,
                      background: isLimitReached ? 'var(--warning)' : 'var(--secondary)',
                    }}
                  />
                </div>
                <span className={`word-count-text ${isLimitReached ? 'limit-reached' : ''}`} style={{ color: isLimitReached ? '#F57C00' : 'var(--text-mid)', fontWeight: 600 }}>
                  {wordCount} / 250 words limit
                </span>
              </div>

              {error && <div className="alert alert-error" style={{ marginTop: '16px' }}>{error}</div>}

              {/* Navigation Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--accent-light)' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleNavigate(Math.max(0, currentIdx - 1))}
                  disabled={currentIdx === 0}
                >← Previous</button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleNavigate(currentIdx + 1)}
                  >
                    Save & Next →
                  </button>
                ) : (
                  <button
                    className="btn btn-mint btn-lg"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                  >
                    {submitting ? <><span className="spinner" style={{ borderTopColor: 'var(--primary-dark)' }} /> Submitting...</> : '📤 Submit Exam'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Inline Result Component ──────────────────────────────────────────────────
interface InlineResultProps {
  answeredCount: number;
  totalQuestions: number;
  violationCount: number;
  onDashboard: () => void;
}

function InlineResult({ answeredCount, totalQuestions, violationCount, onDashboard }: InlineResultProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div className="card animate-slide-up" style={{ marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <GtecLogo size={88} />
            </div>
            <h1 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '4px' }}>Examination Submitted</h1>
            <p style={{ color: 'var(--secondary-light)', fontSize: '0.9rem' }}>Prompt Engineering Online Assessment — GTEC</p>
          </div>

          <div className="card-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h2 style={{ color: 'var(--primary-dark)', marginBottom: '16px' }}>Your exam has been submitted successfully!</h2>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '32px', color: 'var(--text-mid)', fontSize: '0.95rem' }}>
              <span>Answers submitted: <strong>{answeredCount} / {totalQuestions}</strong></span>
              <span>Violations recorded: <strong>{violationCount}</strong></span>
            </div>

            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Your answers have been securely recorded. Your final score and ranking are visible to the examination administrator.
            </p>
            
            <button className="btn btn-primary btn-lg" onClick={onDashboard}>← Return to Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}

