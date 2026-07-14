import { useState } from 'react';
import { Link } from 'react-router-dom';
import GtecLogo from '../components/GtecLogo';

const DEMO_STEPS = [
  {
    id: 1,
    title: 'Step 1: Read the Instructions',
    subtitle: 'Home Page — Examination Instructions',
    content: (
      <div>
        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
          Before registering, every examiner reads the instructions on the Home Page. The portal outlines exam duration, rules, and what to expect.
        </p>
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--primary-pale)', borderRadius: 'var(--radius)', padding: '20px' }}>
          <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '14px', fontSize: '0.95rem', borderBottom: '2px solid var(--secondary)', paddingBottom: '8px' }}>
            General Information (Preview)
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              '5 questions drawn from the Prompt Engineering question bank',
              'Total duration: 60 minutes from the moment you click "Start Exam"',
              'Each question carries a maximum of 10 marks (Total: 50 marks)',
              'Questions are uniquely shuffled — no two candidates receive the same order',
              'Answers are evaluated by the Gemini AI using academic rubrics',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: '20px', height: '20px', background: 'var(--secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '2px' }}>{i + 1}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Step 2: Register & Log In',
    subtitle: 'Registration → Login Portal',
    content: (
      <div>
        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
          Click <strong>"Register as Student"</strong> on the Home Page. Fill in your name, email, department, and choose your own username and password. Then log in with those credentials.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Mock Register Form */}
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--primary-pale)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '12px', fontSize: '0.85rem' }}>Registration Form</div>
            {['Full Name', 'Email', 'Department', 'Username', 'Password'].map(f => (
              <div key={f} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{f}</div>
                <div style={{ background: 'white', border: '1px solid var(--primary-pale)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: f === 'Password' ? 'transparent' : 'var(--text-mid)', textShadow: f === 'Password' ? '0 0 8px var(--text-mid)' : 'none' }}>
                  {f === 'Full Name' ? 'Kamalesh D' : f === 'Email' ? 'kamal@gtec.edu' : f === 'Department' ? 'Information Technology' : f === 'Username' ? 'kamalesh2024' : '••••••••'}
                </div>
              </div>
            ))}
            <div style={{ marginTop: '10px', background: 'var(--secondary)', color: 'var(--primary-dark)', borderRadius: '6px', padding: '7px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>Register</div>
          </div>
          {/* Mock Login */}
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--primary-pale)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '12px', fontSize: '0.85rem' }}>Student Login</div>
            {['Username', 'Password'].map(f => (
              <div key={f} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{f}</div>
                <div style={{ background: 'white', border: '1px solid var(--secondary)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', color: 'var(--text-mid)' }}>
                  {f === 'Username' ? 'kamalesh2024' : '••••••••'}
                </div>
              </div>
            ))}
            <div style={{ marginTop: '20px', background: 'var(--primary-dark)', color: 'white', borderRadius: '6px', padding: '7px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>Login →</div>
            <div style={{ marginTop: '8px', background: 'var(--secondary-pale)', borderRadius: '6px', padding: '8px', fontSize: '0.75rem', color: 'var(--primary-dark)', textAlign: 'center' }}>
              ✅ Login successful! Redirecting to dashboard...
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Step 3: Start the Exam',
    subtitle: 'Exam Dashboard → Start Warning',
    content: (
      <div>
        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
          After login you see your Exam Dashboard. Click <strong>"Start Examination"</strong> to get the pre-exam warning. Once you confirm, the 60-minute countdown begins — it cannot be paused.
        </p>
        {/* Mock warning modal */}
        <div style={{ background: 'rgba(46,24,18,0.65)', borderRadius: 'var(--radius-lg)', padding: '12px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', maxWidth: '420px', margin: '0 auto', boxShadow: '0 8px 32px rgba(78,52,46,0.3)' }}>
            <div style={{ background: 'var(--primary-dark)', padding: '16px 20px', color: 'white' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 700 }}>⚠️ Before You Begin</div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', lineHeight: 1.6, marginBottom: '16px' }}>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    '🕐 60-minute timer starts immediately and cannot be paused',
                    '🖥️ Exam runs in fullscreen mode — exiting will be logged',
                    '🚫 Tab switching, copy/paste are disabled and monitored',
                    '⚡ 5 violations will trigger automatic submission',
                  ].map((r, i) => <li key={i} style={{ display: 'flex', gap: '8px' }}><span style={{ flexShrink: 0 }}>{r.split(' ')[0]}</span><span>{r.split(' ').slice(1).join(' ')}</span></li>)}
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, padding: '9px', background: 'var(--bg-base)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', border: '1px solid var(--primary-pale)', cursor: 'pointer' }}>Cancel</div>
                <div style={{ flex: 1, padding: '9px', background: 'var(--secondary)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)', cursor: 'pointer' }}>✔ I Understand — Start</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Step 4: Answer the Questions',
    subtitle: 'Locked Exam Interface',
    content: (
      <div>
        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '16px', fontSize: '0.95rem' }}>
          The exam runs in a locked fullscreen interface. The timer counts down in the top bar. Each question has a word counter — minimum 250 words per answer.
        </p>
        {/* Mock exam interface */}
        <div style={{ background: 'var(--accent-light)', border: '1px solid var(--primary-pale)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{ background: 'var(--primary-dark)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--secondary-light)', fontSize: '0.8rem', fontWeight: 700 }}>Prompt Engineering — Question 2 of 5</div>
            <div style={{ background: 'var(--primary)', border: '2px solid var(--secondary)', borderRadius: '8px', padding: '6px 14px', color: 'var(--secondary-light)', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'monospace' }}>
              ⏱ 47:23
            </div>
          </div>
          {/* Question */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '10px', borderLeft: '3px solid var(--secondary)', fontSize: '0.82rem', color: 'var(--text-dark)', lineHeight: 1.5 }}>
              <strong>Q2.</strong> Compare and contrast zero-shot, one-shot, and few-shot prompting techniques. Provide a concrete example of each applied to a text classification task.
            </div>
            {/* Answer box */}
            <div style={{ background: 'white', border: '2px solid var(--secondary)', borderRadius: 'var(--radius)', padding: '10px', minHeight: '80px', fontSize: '0.8rem', color: 'var(--text-mid)', lineHeight: 1.6 }}>
              Zero-shot prompting involves asking the model to perform a task without any prior examples. For instance, in text classification we can ask: "Classify as positive or negative: The product is amazing." The model uses its pre-trained knowledge...
            </div>
            {/* Word counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '6px 10px', background: 'var(--secondary-pale)', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 600 }}>📝 Word Count: <strong>42</strong> / 250 minimum</span>
              <div style={{ width: '120px', height: '6px', background: 'var(--accent-light)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: '17%', height: '100%', background: 'var(--secondary-dark)', borderRadius: '999px' }} />
              </div>
            </div>
            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {['Q1', 'Q2', 'Q3', 'Q4', 'Q5'].map((q, i) => (
                <div key={q} style={{ width: '34px', height: '34px', borderRadius: '50%', background: i === 1 ? 'var(--secondary)' : i === 0 ? 'var(--primary-dark)' : 'var(--bg-base)', border: `2px solid ${i === 1 ? 'var(--secondary-dark)' : i === 0 ? 'var(--primary)' : 'var(--primary-pale)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: i === 0 ? 'white' : 'var(--primary-dark)', cursor: 'pointer' }}>{q}</div>
              ))}
              <div style={{ marginLeft: 'auto', padding: '6px 14px', background: 'var(--error)', color: 'white', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Submit All</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: 'Step 5: Submit & Get Results',
    subtitle: 'AI Evaluation → Score Announcement',
    content: (
      <div>
        <p style={{ color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '16px', fontSize: '0.95rem' }}>
          After submitting, your answers are sent to the <strong>Gemini AI</strong> for evaluation. Within moments, your score, percentage, and per-answer feedback appear — right there on screen.
        </p>
        {/* Submission + result preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--primary-pale)', borderRadius: 'var(--radius)', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤖</div>
            <div style={{ fontWeight: 700, color: 'var(--primary-dark)', fontSize: '0.85rem', marginBottom: '6px' }}>Evaluating Answers...</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '8px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', animation: `pulse ${0.6 + i * 0.2}s ease-in-out infinite alternate` }} />)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Gemini AI is scoring your responses against academic rubrics</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', borderRadius: 'var(--radius)', padding: '14px', textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary-light)', marginBottom: '8px' }}>Your Result</div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2E7D32', margin: '0 auto 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 6px #2E7D3222' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>A</div>
              <div style={{ fontSize: '0.55rem', opacity: 0.8, textTransform: 'uppercase' }}>Excellent</div>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>42 / 50</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-light)' }}>84% — Well done!</div>
          </div>
        </div>
        <div style={{ marginTop: '12px', background: 'var(--secondary-pale)', border: '1px solid var(--secondary)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--primary-dark)', textAlign: 'center' }}>
          Your final score and ranking are visible to the examination administrator.
        </div>
      </div>
    ),
  },
];

export default function ExamDemo() {
  const [current, setCurrent] = useState(0);
  const step = DEMO_STEPS[current];
  const isFirst = current === 0;
  const isLast = current === DEMO_STEPS.length - 1;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <GtecLogo size={72} />
          <div>
            <h1>Information Technology</h1>
            <div className="navbar-subtitle">Online Examination Portal</div>
          </div>
        </div>
        <ul className="navbar-nav">
          <li><Link to="/">← Back to Home</Link></li>
        </ul>
      </nav>

      <div className="page-content" style={{ paddingTop: '48px', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '780px' }}>

          {/* Demo Banner — always visible */}
          <div style={{
            background: '#FFF8E1', border: '2px solid #F57C00', borderRadius: 'var(--radius)',
            padding: '12px 20px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'slideDown 0.4s ease both',
          }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <strong style={{ color: '#E65100', fontSize: '0.95rem' }}>This is a demo preview only.</strong>
              <span style={{ color: '#BF360C', fontSize: '0.88rem', marginLeft: '6px' }}>
                No real exam session is created. No data is saved. This walkthrough is for informational purposes only.
              </span>
            </div>
          </div>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'slideUp 0.4s ease both' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--primary-dark)', marginBottom: '8px' }}>
              How the Exam Works
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
              A guided walkthrough of the Prompt Engineering Online Assessment
            </p>
          </div>

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
            {DEMO_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? '32px' : '10px',
                  height: '10px',
                  borderRadius: '999px',
                  background: i === current ? 'var(--secondary-dark)' : i < current ? 'var(--secondary)' : 'var(--primary-pale)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Slide Card */}
          <div key={current} className="card animate-slide-up" style={{ marginBottom: '28px' }}>
            <div className="card-header" style={{ background: 'var(--primary-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--secondary)', color: 'var(--primary-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.9rem', flexShrink: 0,
                }}>
                  {step.id}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '2px' }}>{step.title}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--secondary-light)', margin: 0 }}>{step.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="card-body">
              {step.content}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => setCurrent(c => c - 1)}
              disabled={isFirst}
              style={{ opacity: isFirst ? 0.3 : 1 }}
            >
              ← Previous
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {current + 1} of {DEMO_STEPS.length}
            </span>

            {isLast ? (
              <Link to="/examiner/register" className="btn btn-mint">
                Register Now →
              </Link>
            ) : (
              <button className="btn btn-mint" onClick={() => setCurrent(c => c + 1)}>
                Next →
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
