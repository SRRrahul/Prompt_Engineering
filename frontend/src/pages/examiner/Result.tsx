import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { examinerApi } from '../../api/client';
import { useExaminerAuth } from '../../context/ExaminerAuthContext';
import GtecLogo from '../../components/GtecLogo';

interface ResultData {
  status: string;
  isGrading: boolean;
  totalScore: number;
  maxScore: number;
  percentage: string;
  rank: number;
  totalStudents: number;
}

export default function ExaminerResult() {
  const { logout } = useExaminerAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examinerApi.get('/exam/result')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: '🥇', label: '1st Place', color: '#F57F17', bg: '#FFF9C4' };
    if (rank === 2) return { icon: '🥈', label: '2nd Place', color: '#546E7A', bg: '#CFD8DC' };
    if (rank === 3) return { icon: '🥉', label: '3rd Place', color: 'var(--primary)', bg: 'var(--accent-light)' };
    return { icon: '🏅', label: `${rank}th Place`, color: 'var(--text-mid)', bg: 'var(--bg-base)' };
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-brown" />
      </div>
    );
  }

  const rankInfo = data ? getRankBadge(data.rank) : null;

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
              <h1 style={{ color: 'white', fontSize: '1.6rem', marginBottom: '4px' }}>Examination Result</h1>
              <p style={{ color: 'var(--secondary-light)', fontSize: '0.9rem' }}>Prompt Engineering Online Assessment — GTEC</p>
            </div>

            <div className="card-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
              {data?.isGrading ? (
                <>
                  <div style={{ padding: '30px' }}>
                    <span className="spinner spinner-brown" />
                    <h3 style={{ marginTop: '20px', color: 'var(--primary-dark)' }}>AI is evaluating your answers...</h3>
                    <p style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.9rem' }}>
                      Please wait a moment and refresh the page.
                    </p>
                    <button className="btn btn-outline" style={{ marginTop: '20px' }} onClick={() => window.location.reload()}>
                      🔄 Refresh
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '8px' }}>Your Final Percentage</div>
                    <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>
                      {data?.percentage}<span style={{ fontSize: '2.5rem', color: 'var(--secondary-dark)' }}>%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
                    {rankInfo && (
                      <div style={{ background: rankInfo.bg, color: rankInfo.color, padding: '16px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px', border: `1px solid ${rankInfo.color}33` }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '4px' }}>{rankInfo.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rankInfo.label}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>out of {data?.totalStudents} students</div>
                      </div>
                    )}
                    
                    <div style={{ background: 'var(--accent-light)', padding: '16px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px', border: '1px solid var(--primary-pale)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{data?.totalScore} / {data?.maxScore}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>Total Points</div>
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={() => navigate('/examiner/dashboard')}>
                    ← Back to Dashboard
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
