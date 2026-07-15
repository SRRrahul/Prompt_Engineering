import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/client';
import { useAdminAuth } from '../../context/AdminAuthContext';
import GtecLogo from '../../components/GtecLogo';
import Navbar from '../../components/Navbar';

/* ═══════════ Types ═══════════ */
interface Stats { totalExaminers: number; totalQuestions: number; completedExams: number; inProgress: number; }
interface Question { _id: string; text: string; modelAnswer: string; rubric: string; marks: number; createdAt: string; }
interface Examiner {
  id: string; name: string; email: string; username: string; plainPassword?: string;
  department?: string; year?: string; registeredAt: string; examStatus: string;
  session?: { status: string; startTime?: string; endTime?: string; violationCount: number; } | null;
}
interface ResultEntry {
  examiner: { id: string; name: string; email: string; username: string; department?: string; year?: string; };
  session: { status: string; startTime?: string; endTime?: string; violationCount: number; durationMinutes: number; } | null;
  totalScore: number; maxScore: number; percentage: number;
  answeredCount: number; gradedCount: number; totalQuestions: number; rank?: number;
}
interface AnswerEntry { id: string; answerText: string; wordCount: number; aiScore: number | null; aiFeedback: string | null; accuracyPercentage?: number; matchedPoints?: string; missingPoints?: string; adminOverrideScore: number | null; adminNotes: string | null; submittedAt: string | null; session: { status: string; user: { id: string; name: string; username: string; email: string; department?: string; } }; question: { id: string; text: string; modelAnswer: string; rubric: string; marks: number; } }
interface ExamSettings { timerDurationMinutes: number; questionsPerExam: number; minWordCount: number; maxViolationsBeforeAutoSubmit: number; }

/* ═══════════ Helpers ═══════════ */
const fmtDate = (d?: string) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const statusBadge = (s: string) => {
  const map: Record<string, string> = { not_started: 'badge-gray', in_progress: 'badge-warning', completed: 'badge-mint', auto_submitted: 'badge-brown', time_expired: 'badge-error' };
  const labels: Record<string, string> = { not_started: '⭕ Not Started', in_progress: '🔄 In Progress', completed: '✅ Completed', auto_submitted: '📤 Auto-Submitted', time_expired: '⏰ Expired' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{labels[s] || s}</span>;
};

/* ═══════════ Main Component ═══════════ */
export default function AdminDashboard() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'questions' | 'examiners' | 'results' | 'settings' | 'answers'>('overview');

  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [results, setResults] = useState<{ leaderboard: ResultEntry[]; winner?: ResultEntry; runnerUp?: ResultEntry; all: ResultEntry[] }>({ leaderboard: [], all: [] });
  const [answersData, setAnswersData] = useState<{ answers: AnswerEntry[], totalCount: number, totalPages: number, currentPage: number }>({ answers: [], totalCount: 0, totalPages: 0, currentPage: 1 });
  const [answersFilter, setAnswersFilter] = useState({ page: 1, limit: 20, examiner: '', department: '', sessionStatus: '', minScore: '', maxScore: '' });
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState({ score: '', notes: '' });
  const [settings, setSettings] = useState<ExamSettings>({ timerDurationMinutes: 60, questionsPerExam: 5, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 });

  // UI states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revealPw, setRevealPw] = useState<Record<string, boolean>>({});

  // Question form
  const [qForm, setQForm] = useState({ text: '', modelAnswer: '', rubric: '', marks: 10 });
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [bulkData, setBulkData] = useState('');
  const [bulkFormat, setBulkFormat] = useState<'json' | 'csv'>('json');
  const [showBulk, setShowBulk] = useState(false);

  const setLoad = (key: string, v: boolean) => setLoading(p => ({ ...p, [key]: v }));
  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(''), 6000); };

  /* ─── Fetch all data ─── */
  const fetchStats = useCallback(async () => { try { const r = await adminApi.get('/admin/dashboard-stats'); setStats(r.data); } catch { } }, []);
  const fetchQuestions = useCallback(async () => { setLoad('q', true); try { const r = await adminApi.get('/admin/questions'); setQuestions(r.data); } catch { } setLoad('q', false); }, []);
  const fetchExaminers = useCallback(async () => { setLoad('ex', true); try { const r = await adminApi.get('/admin/examiners'); setExaminers(r.data); } catch { } setLoad('ex', false); }, []);
  const fetchResults = useCallback(async () => { setLoad('res', true); try { const r = await adminApi.get('/admin/results'); setResults(r.data); } catch { } setLoad('res', false); }, []);
  const fetchSettings = useCallback(async () => { try { const r = await adminApi.get('/admin/settings'); setSettings(r.data); } catch { } }, []);
  const fetchAnswers = useCallback(async () => { setLoad('ans', true); try { const q = new URLSearchParams(answersFilter as any).toString(); const r = await adminApi.get('/admin/answers?' + q); setAnswersData(r.data); } catch { } setLoad('ans', false); }, [answersFilter]);

  useEffect(() => { fetchStats(); fetchSettings(); }, []);
  useEffect(() => {
    if (tab === 'questions') fetchQuestions();
    if (tab === 'examiners') fetchExaminers();
    if (tab === 'results') fetchResults();
    if (tab === 'overview') fetchStats();
    if (tab === 'answers') fetchAnswers();
  }, [tab, answersFilter.page, answersFilter.limit, answersFilter.examiner, answersFilter.department, answersFilter.minScore, answersFilter.maxScore]);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  /* ─── Question CRUD ─── */
  const handleSaveQuestion = async () => {
    if (!qForm.text.trim() || !qForm.modelAnswer.trim() || !qForm.rubric.trim()) {
      showError('Question text, model answer, and rubric are required.'); return;
    }
    setLoad('saveQ', true);
    try {
      if (editingQ) {
        await adminApi.put(`/admin/questions/${editingQ}`, qForm);
        showSuccess('Question updated successfully.');
      } else {
        await adminApi.post('/admin/questions', qForm);
        showSuccess('Question added to the bank.');
      }
      setQForm({ text: '', modelAnswer: '', rubric: '', marks: 10 });
      setEditingQ(null);
      fetchQuestions(); fetchStats();
    } catch (err: any) { showError(err.response?.data?.message || 'Failed to save question.'); }
    setLoad('saveQ', false);
  };

  const handleEditQuestion = (q: Question) => {
    setQForm({ text: q.text, modelAnswer: q.modelAnswer, rubric: q.rubric, marks: q.marks });
    setEditingQ(q._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question from the bank?')) return;
    try { await adminApi.delete(`/admin/questions/${id}`); showSuccess('Question deleted.'); fetchQuestions(); fetchStats(); }
    catch (err: any) { showError(err.response?.data?.message || 'Delete failed.'); }
  };

  const handleBulkUpload = async () => {
    if (!bulkData.trim()) { showError('No data to upload.'); return; }
    setLoad('bulk', true);
    try {
      const r = await adminApi.post('/admin/questions/bulk', { data: bulkData, format: bulkFormat });
      showSuccess(`Bulk upload successful — ${r.data.inserted} question(s) added.`);
      setBulkData(''); setShowBulk(false); fetchQuestions(); fetchStats();
    } catch (err: any) { showError(err.response?.data?.message || 'Bulk upload failed.'); }
    setLoad('bulk', false);
  };

  /* ─── Override save ─── */
  const handleSaveOverride = async (answerId: string) => { setLoad('override', true); try { await adminApi.put('/admin/answers/'+answerId+'/override', { adminOverrideScore: overrideForm.score ? Number(overrideForm.score) : null, adminNotes: overrideForm.notes }); showSuccess('Override saved.'); setExpandedAnswer(null); fetchAnswers(); fetchResults(); } catch (err: any) { showError(err.response?.data?.message || 'Failed to save override.'); } setLoad('override', false); };

  /* ─── Settings save ─── */
  const handleSaveSettings = async () => {
    setLoad('settings', true);
    try { await adminApi.put('/admin/settings', settings); showSuccess('Settings saved.'); }
    catch (err: any) { showError(err.response?.data?.message || 'Failed to save settings.'); }
    setLoad('settings', false);
  };

  /* ─── Evaluate Session ─── */
  const handleEvaluateSession = async (sessionId: string) => {
    setLoad(`eval-${sessionId}`, true);
    try {
      const res = await adminApi.post(`/admin/evaluate/${sessionId}`);
      showSuccess(res.data.message || 'Evaluation successful.');
      fetchResults();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to evaluate session.');
    }
    setLoad(`eval-${sessionId}`, false);
  };

  /* ══════════════ RENDER ══════════════ */
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar variant="admin" adminName={user?.name} onAdminLogout={handleLogout} />

      <div className="page-content">
        <div className="container" style={{ maxWidth: '1200px' }}>

          {/* Toast messages */}
          {error && <div className="alert alert-error animate-slide-down" style={{ marginBottom: '20px' }}>{error}</div>}
          {success && <div className="alert alert-success animate-slide-down" style={{ marginBottom: '20px' }}>✅ {success}</div>}

          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--primary-dark)', marginBottom: '4px' }}>Admin Dashboard</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Prompt Engineering - Examination Management</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GtecLogo size={68} />
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'questions', label: '📋 Questions' },
              { id: 'examiners', label: '👥 Students' },
              { id: 'results', label: '🏆 Results' },
              { id: 'settings', label: '⚙️ Settings' },
              { id: 'answers', label: '📝 Answers' },
            ].map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id as any)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── TAB: Overview ─── */}
          {tab === 'overview' && (
            <div className="animate-fade-in">
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '20px', marginBottom: '32px' }}>
                {[
                  { icon: '👥', label: 'Total Students', value: stats?.totalExaminers ?? '—', color: 'var(--primary-dark)' },
                  { icon: '📋', label: 'Questions in Bank', value: stats?.totalQuestions ?? '—', color: 'var(--primary)' },
                  { icon: '✅', label: 'Completed Exams', value: stats?.completedExams ?? '—', color: 'var(--secondary-dark)' },
                  { icon: '🔄', label: 'In Progress', value: stats?.inProgress ?? '—', color: '#F57C00' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                    }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header"><h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>⚡ Quick Actions</h3></div>
                <div className="card-body">
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => setTab('questions')}> Manage Questions</button>
                    <button className="btn btn-mint" onClick={() => setTab('examiners')}>View Students</button>
                    <button className="btn btn-outline" onClick={() => setTab('results')}> View Leaderboard</button>
                    <button className="btn btn-ghost" onClick={() => setTab('answers')}>📝 Review Answers</button>
                    <button className="btn btn-ghost" onClick={() => setTab('settings')}>Exam Settings</button>
                  </div>
                </div>
              </div>

              {/* Current Settings Preview */}
              <div className="card" style={{ marginTop: '20px' }}>
                <div className="card-header" style={{ background: 'var(--primary)' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>⚙️ Current Exam Configuration</h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '16px' }}>
                    {[
                      { label: 'Timer Duration', value: `${settings.timerDurationMinutes} minutes` },
                      { label: 'Questions per Exam', value: settings.questionsPerExam },
                      { label: 'Min Word Count', value: `${settings.minWordCount} words` },
                      { label: 'Max Violations', value: settings.maxViolationsBeforeAutoSubmit },
                    ].map(c => (
                      <div key={c.label} style={{ padding: '14px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--accent-light)' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{c.label}</div>
                        <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '1.1rem' }}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Questions ─── */}
          {tab === 'questions' && (
            <div className="animate-fade-in">
              {/* Add/Edit Question Form */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                    {editingQ ? '✏️ Edit Question' : '➕ Add Question to Bank'}
                  </h3>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Question Text *</label>
                      <textarea className="form-textarea" style={{ minHeight: '90px' }}
                        placeholder="Enter the exam question text..."
                        value={qForm.text} onChange={e => setQForm(f => ({ ...f, text: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model Answer / Reference Answer *</label>
                      <textarea className="form-textarea" style={{ minHeight: '100px' }}
                        placeholder="Comprehensive model answer for AI grading reference..."
                        value={qForm.modelAnswer} onChange={e => setQForm(f => ({ ...f, modelAnswer: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rubric / Marking Criteria *</label>
                      <textarea className="form-textarea" style={{ minHeight: '80px' }}
                        placeholder="e.g. Award 3 marks for definition, 4 marks for examples, 3 marks for analysis..."
                        value={qForm.rubric} onChange={e => setQForm(f => ({ ...f, rubric: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ maxWidth: '180px' }}>
                      <label className="form-label">Marks</label>
                      <input className="form-input" type="number" min={1} max={100}
                        value={qForm.marks} onChange={e => setQForm(f => ({ ...f, marks: Number(e.target.value) }))} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-primary" onClick={handleSaveQuestion} disabled={loading.saveQ}>
                        {loading.saveQ ? <><span className="spinner" />Saving...</> : editingQ ? '💾 Update Question' : '➕ Add Question'}
                      </button>
                      {editingQ && (
                        <button className="btn btn-ghost" onClick={() => { setEditingQ(null); setQForm({ text: '', modelAnswer: '', rubric: '', marks: 10 }); }}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Upload */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ background: 'var(--primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setShowBulk(s => !s)}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>📁 Bulk Upload (CSV / JSON)</h3>
                  <span style={{ color: 'var(--secondary-light)' }}>{showBulk ? '▲' : '▼'}</span>
                </div>
                {showBulk && (
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                      <button className={`btn btn-sm ${bulkFormat === 'json' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setBulkFormat('json')}>JSON</button>
                      <button className={`btn btn-sm ${bulkFormat === 'csv' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setBulkFormat('csv')}>CSV</button>
                    </div>
                    <div className="alert alert-info" style={{ marginBottom: '12px', fontSize: '0.82rem' }}>
                      {bulkFormat === 'json'
                        ? 'JSON format: array of objects with fields: text, modelAnswer, rubric, marks'
                        : 'CSV format: columns — text, modelAnswer, rubric, marks (first row = header)'}
                    </div>
                    <textarea className="form-textarea" style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                      placeholder={bulkFormat === 'json'
                        ? '[{"text":"Q?","modelAnswer":"A","rubric":"R","marks":10}]'
                        : 'text,modelAnswer,rubric,marks\n"What is...","Answer...","Award...","10"'}
                      value={bulkData} onChange={e => setBulkData(e.target.value)} />
                    <button className="btn btn-mint mt-4" onClick={handleBulkUpload} disabled={loading.bulk}>
                      {loading.bulk ? <><span className="spinner" style={{ borderTopColor: 'var(--primary-dark)' }} />Uploading...</> : '📁 Upload Questions'}
                    </button>
                  </div>
                )}
              </div>

              {/* Question Bank Table */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>📋 Question Bank ({questions.length})</h3>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary-light)' }} onClick={fetchQuestions}>🔄 Refresh</button>
                </div>
                <div className="table-wrapper">
                  {loading.q ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner spinner-brown" /></div>
                  ) : questions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No questions yet. Add some above or use bulk upload.
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Question</th>
                          <th>Marks</th>
                          <th>Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q, i) => (
                          <tr key={q._id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary)', width: '40px' }}>{i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px', fontSize: '0.9rem' }}>
                                {q.text.slice(0, 100)}{q.text.length > 100 ? '…' : ''}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                Rubric: {q.rubric.slice(0, 80)}{q.rubric.length > 80 ? '…' : ''}
                              </div>
                            </td>
                            <td><span className="badge badge-brown">{q.marks}</span></td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{fmtDate(q.createdAt)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => handleEditQuestion(q)}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q._id)}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Examiners ─── */}
          {tab === 'examiners' && (
            <div className="animate-fade-in">
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>👥 Registered Students ({examiners.length})</h3>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary-light)' }} onClick={fetchExaminers}>🔄 Refresh</button>
                </div>
                <div className="table-wrapper">
                  {loading.ex ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner spinner-brown" /></div>
                  ) : examiners.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No examiners registered yet.</div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Password</th>
                          <th>Dept / Year</th>
                          <th>Registered</th>
                          <th>Exam Status</th>
                          <th>Violations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examiners.map((ex, i) => (
                          <tr key={ex.id}>
                            <td style={{ fontWeight: 700, color: 'var(--primary)', width: '40px' }}>{i + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{ex.email}</div>
                            </td>
                            <td><code style={{ background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.83rem' }}>{ex.username}</code></td>
                            <td>
                              {ex.plainPassword ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <code style={{ background: 'var(--accent-light)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.83rem' }}>
                                    {revealPw[ex.id] ? ex.plainPassword : '••••••••'}
                                  </code>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                    onClick={() => setRevealPw(p => ({ ...p, [ex.id]: !p[ex.id] }))}>
                                    {revealPw[ex.id] ? '🙈' : '👁️'}
                                  </button>
                                </div>
                              ) : <span style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>—</span>}
                            </td>
                            <td style={{ fontSize: '0.85rem' }}>
                              {ex.department || '—'}<br/>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{ex.year || ''}</span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>{fmtDate(ex.registeredAt)}</td>
                            <td>{statusBadge(ex.session?.status || ex.examStatus || 'not_started')}</td>
                            <td>
                              {ex.session ? (
                                <span className={`badge ${ex.session.violationCount > 0 ? 'badge-warning' : 'badge-mint'}`}>
                                  {ex.session.violationCount}
                                </span>
                              ) : <span className="badge badge-gray">0</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: Results ─── */}
          {tab === 'results' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button className="btn btn-ghost btn-sm" onClick={fetchResults}>🔄 Refresh</button>
              </div>

              {/* Winner / Runner-Up Podium */}
              {results.leaderboard.length > 0 && (
                <div className="leaderboard-podium" style={{ marginBottom: '28px' }}>
                  {results.winner && (
                    <div className="podium-card winner">
                      <div className="podium-rank">🏆</div>
                      <div className="podium-name">{results.winner.examiner.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--secondary-light)', marginTop: '4px' }}>{results.winner.examiner.username}</div>
                      <div className="podium-score">{results.winner.totalScore} <span>pts</span></div>
                      <div style={{ marginTop: '8px' }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${results.winner.percentage}%`, background: 'var(--secondary)' }} />
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.85rem', color: 'var(--secondary-light)' }}>
                          {results.winner.percentage}%
                        </div>
                      </div>
                    </div>
                  )}
                  {results.runnerUp && (
                    <div className="podium-card runner-up">
                      <div className="podium-rank">🥈</div>
                      <div className="podium-name">{results.runnerUp.examiner.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '4px' }}>{results.runnerUp.examiner.username}</div>
                      <div className="podium-score">{results.runnerUp.totalScore} <span>pts</span></div>
                      <div style={{ marginTop: '8px' }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${results.runnerUp.percentage}%`, background: 'var(--primary)' }} />
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.85rem', color: 'var(--primary)' }}>
                          {results.runnerUp.percentage}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Leaderboard */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>🏅 Full Leaderboard</h3>
                </div>
                <div className="table-wrapper">
                  {loading.res ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner spinner-brown" /></div>
                  ) : results.all.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No results yet. Students need to complete the exam first.
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Name</th>
                          <th>Username</th>
                          <th>Score</th>
                          <th>%</th>
                          <th>Answered</th>
                          <th>Status</th>
                          <th>Violations</th>
                          <th>Submitted</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.all
                          .sort((a, b) => b.totalScore - a.totalScore)
                          .map((r, i) => {
                            const completed = r.session?.status === 'completed' || r.session?.status === 'auto_submitted';
                            return (
                              <tr key={r.examiner.id}>
                                <td>
                                  {completed ? (
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: i === 0 ? '#F57F17' : i === 1 ? '#546E7A' : 'var(--primary)' }}>
                                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </span>
                                  ) : <span className="badge badge-gray">—</span>}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.examiner.name}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                                    {r.examiner.department || r.examiner.email} 
                                    {r.examiner.year && ` • ${r.examiner.year}`}
                                  </div>
                                </td>
                                <td><code style={{ fontSize: '0.82rem' }}>{r.examiner.username}</code></td>
                                <td>
                                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-dark)' }}>
                                    {r.totalScore}
                                  </span>
                                  <span style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}> / {r.maxScore}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="progress-bar" style={{ width: '60px' }}>
                                      <div className="progress-fill" style={{
                                        width: `${r.percentage}%`,
                                        background: r.percentage >= 70 ? 'var(--secondary-dark)' : r.percentage >= 50 ? '#FFC107' : 'var(--error)',
                                      }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{r.percentage}%</span>
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.85rem' }}>{r.answeredCount} / {r.totalQuestions}</td>
                                <td>{statusBadge(r.session?.status || 'not_started')}</td>
                                <td>
                                  <span className={`badge ${(r.session?.violationCount || 0) > 0 ? 'badge-warning' : 'badge-mint'}`}>
                                    {r.session?.violationCount || 0}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>
                                  {fmtDate(r.session?.endTime)}
                                </td>
                                <td>
                                  {completed && r.session?.id && (
                                    <button 
                                      className="btn btn-outline btn-sm" 
                                      onClick={() => handleEvaluateSession(r.session.id)}
                                      disabled={loading[`eval-${r.session.id}`]}
                                    >
                                      {loading[`eval-${r.session.id}`] ? 'Evaluating...' : '🤖 Evaluate with AI'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          
          {/* ─── TAB: Answers ─── */}
          {tab === 'answers' && (
            <div className="animate-fade-in">
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>📝 Answer Review</h3>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--secondary-light)' }} onClick={fetchAnswers}>🔄 Refresh</button>
                </div>
                <div className="card-body">
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <input className="form-input" placeholder="Student Name/Username" value={answersFilter.examiner} onChange={e => setAnswersFilter(f => ({ ...f, examiner: e.target.value, page: 1 }))} style={{ flex: 1, minWidth: '150px' }} />
                    <input className="form-input" placeholder="Department" value={answersFilter.department} onChange={e => setAnswersFilter(f => ({ ...f, department: e.target.value, page: 1 }))} style={{ flex: 1, minWidth: '150px' }} />
                    <input className="form-input" type="number" placeholder="Min Score" value={answersFilter.minScore} onChange={e => setAnswersFilter(f => ({ ...f, minScore: e.target.value, page: 1 }))} style={{ width: '100px' }} />
                    <input className="form-input" type="number" placeholder="Max Score" value={answersFilter.maxScore} onChange={e => setAnswersFilter(f => ({ ...f, maxScore: e.target.value, page: 1 }))} style={{ width: '100px' }} />
                  </div>
                  
                  {/* Table */}
                  <div className="table-wrapper">
                    {loading.ans ? (
                      <div style={{ padding: '40px', textAlign: 'center' }}><span className="spinner spinner-brown" /></div>
                    ) : answersData.answers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No answers match the criteria.</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Question</th>
                            <th>Words</th>
                            <th>Score</th>
                            <th>Time</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {answersData.answers.map(ans => (
                            <tr key={ans.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{ans.session?.user?.name || 'Unknown Student'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{ans.session?.user?.department || ans.session?.user?.username || '—'}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{ans.question?.text?.slice(0, 50) || 'Deleted Question'}...</td>
                              <td>{ans.wordCount}</td>
                              <td>
                                {ans.adminOverrideScore !== null && ans.adminOverrideScore !== undefined ? (
                                  <span className="badge badge-warning">{ans.adminOverrideScore} / {ans.question?.marks || '?'} (Override)</span>
                                ) : ans.accuracyPercentage != null ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span className="badge badge-mint">{ans.aiScore} / {ans.question?.marks || '?'}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Acc: {ans.accuracyPercentage}%</span>
                                  </div>
                                ) : (
                                  <span className="badge badge-gray">Pending</span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{fmtDate(ans.submittedAt || '')}</td>
                              <td>
                                <button className="btn btn-primary btn-sm" onClick={() => {
                                  setExpandedAnswer(expandedAnswer === ans.id ? null : ans.id);
                                  setOverrideForm({ score: ans.adminOverrideScore?.toString() || '', notes: ans.adminNotes || '' });
                                }}>
                                  {expandedAnswer === ans.id ? 'Close' : 'Review'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  
                  {/* Pagination */}
                  {answersData.totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                      <button className="btn btn-outline btn-sm" disabled={answersFilter.page === 1} onClick={() => setAnswersFilter(f => ({ ...f, page: f.page - 1 }))}>Prev</button>
                      <span style={{ padding: '4px 12px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Page {answersFilter.page} of {answersData.totalPages}</span>
                      <button className="btn btn-outline btn-sm" disabled={answersFilter.page === answersData.totalPages} onClick={() => setAnswersFilter(f => ({ ...f, page: f.page + 1 }))}>Next</button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Expanded Detail View */}
              {expandedAnswer && (() => {
                const ans = answersData.answers.find(a => a.id === expandedAnswer);
                if (!ans) return null;
                return (
                  <div className="card animate-fade-in">
                    <div className="card-header" style={{ background: 'var(--primary)' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>Reviewing Answer from {ans.session?.user?.name || 'Unknown'}</h3>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>Question ({ans.question?.marks || 0} marks)</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--bg-base)', padding: '12px', borderRadius: '4px' }}>{ans.question?.text || 'Question missing'}</p>
                          <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>Model Answer</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--bg-base)', padding: '12px', borderRadius: '4px' }}>{ans.question?.modelAnswer || 'Model answer missing'}</p>
                          <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>Rubric</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--bg-base)', padding: '12px', borderRadius: '4px' }}>{ans.question?.rubric || 'Rubric missing'}</p>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>Student\'s Answer ({ans.wordCount} words)</h4>
                          <div style={{ fontSize: '0.95rem', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '4px', border: '1px solid var(--accent-light)', minHeight: '150px' }}>
                            {ans.answerText || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No answer provided</span>}
                          </div>
                          <div style={{ background: 'var(--accent-light)', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
                            <h4 style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>Gemini AI Evaluation</h4>
                            {ans.aiScore !== null ? (
                              <>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary-dark)', marginBottom: '8px' }}>Score: {ans.aiScore} / {ans.question?.marks || '?'} {ans.accuracyPercentage != null && <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginLeft: '8px' }}>(Accuracy: {ans.accuracyPercentage}%)</span>}</div>
                                <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>{ans.aiFeedback}</p>
                                
                                {ans.matchedPoints && (() => {
                                  try {
                                    const parsed = JSON.parse(ans.matchedPoints);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                      return (
                                        <div style={{ marginBottom: '12px' }}>
                                          <h5 style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--secondary-dark)' }}>✅ Matched Points:</h5>
                                          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.85rem' }}>
                                            {parsed.map((p: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>• {p}</li>)}
                                          </ul>
                                        </div>
                                      );
                                    }
                                  } catch (e) {}
                                  return null;
                                })()}
                                
                                {ans.missingPoints && (() => {
                                  try {
                                    const parsed = JSON.parse(ans.missingPoints);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                      return (
                                        <div style={{ marginBottom: '12px' }}>
                                          <h5 style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--error)' }}>❌ Missing/Weak Points:</h5>
                                          <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.85rem' }}>
                                            {parsed.map((p: string, i: number) => <li key={i} style={{ marginBottom: '4px' }}>• {p}</li>)}
                                          </ul>
                                        </div>
                                      );
                                    }
                                  } catch (e) {}
                                  return null;
                                })()}
                              </>
                            ) : (
                              <p style={{ fontStyle: 'italic' }}>Pending AI grading or grading failed.</p>
                            )}
                          </div>
                          <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '4px', border: '1px solid #FFE0B2' }}>
                            <h4 style={{ fontWeight: 700, color: '#E65100', marginBottom: '12px' }}>Admin Override</h4>
                            <div className="form-group">
                              <label className="form-label" style={{ color: '#E65100' }}>Override Score (leave empty to use AI score)</label>
                              <input className="form-input" type="number" min={0} max={ans.question?.marks || 100} step={0.5} style={{ background: 'white', borderColor: '#FFE0B2' }} value={overrideForm.score} onChange={e => setOverrideForm(f => ({ ...f, score: e.target.value }))} />
                            </div>
                            <div className="form-group">
                              <label className="form-label" style={{ color: '#E65100' }}>Admin Notes (visible only to admins)</label>
                              <textarea className="form-textarea" style={{ background: 'white', borderColor: '#FFE0B2' }} value={overrideForm.notes} onChange={e => setOverrideForm(f => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <button className="btn btn-primary" style={{ background: '#E65100', borderColor: '#E65100' }} onClick={() => handleSaveOverride(ans.id)} disabled={loading['override']}>
                              {loading['override'] ? 'Saving...' : '💾 Save Override'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ─── TAB: Settings ─── */}
          {tab === 'settings' && (
            <div className="animate-fade-in">
              <div className="card" style={{ maxWidth: '640px' }}>
                <div className="card-header">
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>⚙️ Exam Configuration</h3>
                </div>
                <div className="card-body">
                  <div className="alert alert-warning" style={{ marginBottom: '24px', fontSize: '0.88rem' }}>
                    ⚠️ Changes take effect for new exam sessions only. Active sessions retain their original settings.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                      <label className="form-label">Timer Duration (minutes)</label>
                      <input className="form-input" type="number" min={10} max={240}
                        value={settings.timerDurationMinutes}
                        onChange={e => setSettings(s => ({ ...s, timerDurationMinutes: Number(e.target.value) }))} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>How long each examiner has to complete the exam.</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Questions per Exam</label>
                      <input className="form-input" type="number" min={1} max={20}
                        value={settings.questionsPerExam}
                        onChange={e => setSettings(s => ({ ...s, questionsPerExam: Number(e.target.value) }))} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Number of questions randomly assigned per examiner session.</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Minimum Word Count per Answer</label>
                      <input className="form-input" type="number" min={50} max={1000}
                        value={settings.minWordCount}
                        onChange={e => setSettings(s => ({ ...s, minWordCount: Number(e.target.value) }))} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Enforced both client-side and server-side on submission.</div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Violations Before Auto-Submit</label>
                      <input className="form-input" type="number" min={1} max={20}
                        value={settings.maxViolationsBeforeAutoSubmit}
                        onChange={e => setSettings(s => ({ ...s, maxViolationsBeforeAutoSubmit: Number(e.target.value) }))} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>After this many violations, the exam is automatically submitted.</div>
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveSettings} disabled={loading.settings}>
                      {loading.settings ? <><span className="spinner" />Saving...</> : '💾 Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
