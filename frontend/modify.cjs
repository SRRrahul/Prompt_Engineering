const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'src/pages/admin/Dashboard.tsx'), 'utf8');

// 1. Types
code = code.replace(
  'interface ExamSettings {',
  'interface AnswerEntry { id: string; answerText: string; wordCount: number; aiScore: number | null; aiFeedback: string | null; adminOverrideScore: number | null; adminNotes: string | null; submittedAt: string | null; session: { status: string; user: { id: string; name: string; username: string; email: string; department?: string; } }; question: { id: string; text: string; modelAnswer: string; rubric: string; marks: number; } }\ninterface ExamSettings {'
);

// 2. Tab state
code = code.replace(
  "useState<'overview' | 'questions' | 'examiners' | 'results' | 'settings'>('overview')",
  "useState<'overview' | 'questions' | 'examiners' | 'results' | 'settings' | 'answers'>('overview')"
);

// 3. Data states
code = code.replace(
  "const [settings, setSettings] = useState<ExamSettings>({ timerDurationMinutes: 60, questionsPerExam: 5, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 });",
  "const [answersData, setAnswersData] = useState<{ answers: AnswerEntry[], totalCount: number, totalPages: number, currentPage: number }>({ answers: [], totalCount: 0, totalPages: 0, currentPage: 1 });\n  const [answersFilter, setAnswersFilter] = useState({ page: 1, limit: 20, examiner: '', department: '', sessionStatus: '', minScore: '', maxScore: '' });\n  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);\n  const [overrideForm, setOverrideForm] = useState({ score: '', notes: '' });\n  const [settings, setSettings] = useState<ExamSettings>({ timerDurationMinutes: 60, questionsPerExam: 5, minWordCount: 250, maxViolationsBeforeAutoSubmit: 5 });"
);

// 4. Fetch
code = code.replace(
  "const fetchSettings = useCallback(async () => { try { const r = await adminApi.get('/admin/settings'); setSettings(r.data); } catch { } }, []);",
  "const fetchSettings = useCallback(async () => { try { const r = await adminApi.get('/admin/settings'); setSettings(r.data); } catch { } }, []);\n  const fetchAnswers = useCallback(async () => { setLoad('ans', true); try { const q = new URLSearchParams(answersFilter as any).toString(); const r = await adminApi.get('/admin/answers?' + q); setAnswersData(r.data); } catch { } setLoad('ans', false); }, [answersFilter]);"
);

code = code.replace(
  "if (tab === 'overview') fetchStats();\n  }, [tab]);",
  "if (tab === 'overview') fetchStats();\n    if (tab === 'answers') fetchAnswers();\n  }, [tab, answersFilter.page, answersFilter.limit, answersFilter.examiner, answersFilter.department, answersFilter.minScore, answersFilter.maxScore]);"
);

// 5. Save Override
code = code.replace(
  "/* ─── Settings save ─── */",
  "/* ─── Override save ─── */\n  const handleSaveOverride = async (answerId: string) => { setLoad('override', true); try { await adminApi.put('/admin/answers/'+answerId+'/override', { adminOverrideScore: overrideForm.score ? Number(overrideForm.score) : null, adminNotes: overrideForm.notes }); showSuccess('Override saved.'); setExpandedAnswer(null); fetchAnswers(); fetchResults(); } catch (err: any) { showError(err.response?.data?.message || 'Failed to save override.'); } setLoad('override', false); };\n\n  /* ─── Settings save ─── */"
);

// 6. Tabs Array
code = code.replace(
  "{ id: 'settings', label: '⚙️ Settings' },",
  "{ id: 'settings', label: '⚙️ Settings' },\n              { id: 'answers', label: '📝 Answers' },"
);

// 7. Quick actions
code = code.replace(
  "<button className=\"btn btn-ghost\" onClick={() => setTab('settings')}>Exam Settings</button>",
  "<button className=\"btn btn-ghost\" onClick={() => setTab('answers')}>📝 Review Answers</button>\n                    <button className=\"btn btn-ghost\" onClick={() => setTab('settings')}>Exam Settings</button>"
);

// 8. Answers Tab UI
const answersTabHtml = `
          {/* ─── TAB: Answers ─── */}
          {tab === 'answers' && (
            <div className="animate-fade-in">
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>📝 Answer Review</h3>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--mint-light)' }} onClick={fetchAnswers}>🔄 Refresh</button>
                </div>
                <div className="card-body">
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <input className="form-input" placeholder="Examiner Name/Username" value={answersFilter.examiner} onChange={e => setAnswersFilter(f => ({ ...f, examiner: e.target.value, page: 1 }))} style={{ flex: 1, minWidth: '150px' }} />
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
                            <th>Examiner</th>
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
                                <div style={{ fontWeight: 600 }}>{ans.session.user.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{ans.session.user.department || ans.session.user.username}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>{ans.question.text.slice(0, 50)}...</td>
                              <td>{ans.wordCount}</td>
                              <td>
                                {ans.adminOverrideScore !== null ? (
                                  <span className="badge badge-warning">{ans.adminOverrideScore} / {ans.question.marks} (Override)</span>
                                ) : ans.aiScore !== null ? (
                                  <span className="badge badge-mint">{ans.aiScore} / {ans.question.marks} (AI)</span>
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
                    <div className="card-header" style={{ background: 'var(--brown)' }}>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>Reviewing Answer from {ans.session.user.name}</h3>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h4 style={{ fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Question ({ans.question.marks} marks)</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--cream)', padding: '12px', borderRadius: '4px' }}>{ans.question.text}</p>
                          <h4 style={{ fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Model Answer</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--cream)', padding: '12px', borderRadius: '4px' }}>{ans.question.modelAnswer}</p>
                          <h4 style={{ fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Rubric</h4>
                          <p style={{ fontSize: '0.9rem', marginBottom: '16px', background: 'var(--cream)', padding: '12px', borderRadius: '4px' }}>{ans.question.rubric}</p>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Student\\'s Answer ({ans.wordCount} words)</h4>
                          <div style={{ fontSize: '0.95rem', marginBottom: '20px', background: 'white', padding: '16px', borderRadius: '4px', border: '1px solid var(--cream-dark)', minHeight: '150px' }}>
                            {ans.answerText || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No answer provided</span>}
                          </div>
                          <div style={{ background: 'var(--cream-dark)', padding: '16px', borderRadius: '4px', marginBottom: '20px' }}>
                            <h4 style={{ fontWeight: 700, color: 'var(--brown-dark)', marginBottom: '8px' }}>Gemini AI Evaluation</h4>
                            {ans.aiScore !== null ? (
                              <>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--mint-dark)', marginBottom: '8px' }}>Score: {ans.aiScore} / {ans.question.marks}</div>
                                <p style={{ fontSize: '0.9rem' }}>{ans.aiFeedback}</p>
                              </>
                            ) : (
                              <p style={{ fontStyle: 'italic' }}>Pending AI grading or grading failed.</p>
                            )}
                          </div>
                          <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '4px', border: '1px solid #FFE0B2' }}>
                            <h4 style={{ fontWeight: 700, color: '#E65100', marginBottom: '12px' }}>Admin Override</h4>
                            <div className="form-group">
                              <label className="form-label" style={{ color: '#E65100' }}>Override Score (leave empty to use AI score)</label>
                              <input className="form-input" type="number" min={0} max={ans.question.marks} step={0.5} style={{ background: 'white', borderColor: '#FFE0B2' }} value={overrideForm.score} onChange={e => setOverrideForm(f => ({ ...f, score: e.target.value }))} />
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
`;

code = code.replace(
  "{/* ─── TAB: Settings ─── */}",
  answersTabHtml + "\n          {/* ─── TAB: Settings ─── */}"
);

fs.writeFileSync(path.join(__dirname, 'src/pages/admin/Dashboard.tsx'), code);
console.log('Modification successful!');
