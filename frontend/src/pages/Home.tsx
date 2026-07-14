import { Link } from 'react-router-dom';
import GtecLogo from '../components/GtecLogo';

export default function Home() {
  return (
    <div style={{ minHeight: '40vh', background: 'var(--bg-base)' }}>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <GtecLogo size={88} />
          <div>
            <h1>Information Technology
            </h1>
            <div className="navbar-subtitle"></div>
          </div>
        </div>
        <ul className="navbar-nav">
          <li><Link to="/examiner/login">Student Login</Link></li>
          <li><Link to="/examiner/register">Register</Link></li>
        </ul>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #7B5E56 100%)',
        color: 'white',
        padding: '80px 24px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background circles */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px',
          borderRadius: '50%', background: 'rgba(152,216,200,0.08)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-40px', width: '250px', height: '250px',
          borderRadius: '50%', background: 'rgba(152,216,200,0.06)', pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div className="animate-slide-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>

          </div>
          <p className="animate-slide-up" style={{
            fontSize: '2.3rem', letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'var(--secondary-light)', marginBottom: '16px', animationDelay: '1s',
            fontWeight: 500
          }}>
            Ganadipathy Tulsi's Jain Engineering College
          </p>

          <p className="animate-slide-up" style={{
            fontSize: '2rem', letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'var(--secondary-light)', marginBottom: '16px', animationDelay: '1s',
            fontWeight: 600
          }}>
            Department of Information Technology
          </p>

          <h1 className="animate-slide-up" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: '12px',
            animationDelay: '0.15s',
            lineHeight: 1.2,
          }}>
            Prompt Engineering
          </h1>

          <div className="animate-slide-up" style={{ animationDelay: '0.2s', position: 'relative', display: 'inline-block', marginBottom: '28px' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              color: 'var(--secondary-light)',
              fontWeight: 400,
              fontStyle: 'italic',
            }}>

            </h2>
            {/* Mint underline animation */}
            <div style={{
              height: '3px', background: 'var(--secondary)',
              borderRadius: '2px', marginTop: '6px',
              animation: 'mintUnderline 0.8s 0.6s ease both',
              transformOrigin: 'left',
            }} />
          </div>

          <p className="animate-fade-in" style={{
            color: 'rgba(255,255,255,0.75)', maxWidth: '580px', margin: '0 auto 48px',
            fontSize: '1.05rem', lineHeight: 1.7, animationDelay: '0.3s',
          }}>
            A secure , verified online examination for enrolled students of the Prompt Engineering.
            Credentials are issued automatically upon registration.
          </p>

          <div className="animate-slide-up flex justify-center gap-4" style={{ animationDelay: '0.4s', flexWrap: 'wrap' }}>
            <Link to="/examiner/register" className="btn btn-mint btn-lg">
              Register as Student
            </Link>
            <Link to="/examiner/login" className="btn btn-outline btn-lg"
              style={{ color: 'var(--secondary-light)', borderColor: 'var(--secondary-light)' }}>
              Student Login
            </Link>
            <Link to="/demo" className="btn btn-outline btn-lg"
              style={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.35)', fontSize: '0.95rem' }}>
              See How It Works →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section style={{ background: 'var(--primary)', padding: '28px 24px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '24px', textAlign: 'center' }}>
            {[
              { label: 'Questions', value: '8+', icon: '📋' },
              { label: 'Duration', value: '60 min', icon: '⏱️' },
              { label: 'Min. Words', value: '250', icon: '✍️' },
              { label: 'AI Verified', value: '100%', icon: '🤖' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{stat.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--secondary-light)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-pale)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instructions ── */}
      <section style={{ padding: '72px 24px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '12px' }}>
              Examination Instructions
            </h2>
            <p style={{ color: 'var(--text-light)', maxWidth: '520px', margin: '0 auto' }}>
              Please read the following instructions carefully before proceeding to the examination.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px,1fr))', gap: '24px' }}>
            {/* General Info */}
            <div className="card animate-slide-up">
              <div className="card-header" style={{ background: 'var(--primary-dark)' }}>
                <h3 style={{ fontSize: '1.1rem' }}> General Information</h3>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    'The examination consists of 5 questions drawn from the Prompt Engineering question bank.',
                    'Total duration: 60 minutes from the moment you click "Start Exam".',
                    'Each question carries a maximum of 10 marks (Total: 50 marks).',
                    'Questions are uniquely shuffled per examiner — no two candidates receive the same order.',
                    'Your answers are evaluated by an AI verification system using academic rubrics.',
                    'Login credentials are unique per examiner and are issued automatically upon registration.',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{
                        flexShrink: 0, width: '22px', height: '22px',
                        background: 'var(--secondary)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary-dark)', marginTop: '2px'
                      }}>{i + 1}</span>
                      <span style={{ fontSize: '0.92rem', color: 'var(--text-mid)', lineHeight: 1.55 }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rules */}
            <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="card-header" style={{ background: 'var(--primary)' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Examination Rules & Restrictions</h3>
              </div>
              <div className="card-body">
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { icon: '✍️', text: 'Each answer must be a minimum of 250 words. Submissions below this threshold will not be accepted.' },
                    { icon: '▶️', text: 'Clicking "Start Exam" starts the timer immediately. The timer cannot be paused under any circumstances.' },
                    { icon: '🚫', text: 'Tab switching, window minimising, and exiting the exam window are disabled and monitored.' },
                    { icon: '📋', text: 'Copy, cut, and paste functions are disabled within the examination interface.' },
                    { icon: '🖥️', text: 'The exam runs in fullscreen mode. Exiting fullscreen is logged as a violation.' },
                    { icon: '⚡', text: 'Repeated violations will trigger automatic exam submission. Your answers up to that point will be graded.' },
                  ].map((rule, i) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{rule.icon}</span>
                      <span style={{ fontSize: '0.92rem', color: 'var(--text-mid)', lineHeight: 1.55 }}>{rule.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="alert alert-warning animate-fade-in" style={{ marginTop: '28px', animationDelay: '0.3s' }}>
            <strong>⚠️ Important Notice:</strong> By proceeding to the examination, you confirm that you are the registered examiner
            and agree to adhere to all academic integrity policies of GTEC. Any form of malpractice will result in immediate disqualification.
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: 'var(--accent-light)', padding: '72px 24px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.9rem', marginBottom: '16px' }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '40px', fontSize: '0.95rem' }}>
            New here? Take our step-by-step demo to see exactly what happens before, during, and after the exam.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '24px', textAlign: 'center', marginBottom: '36px' }}>
            {[
              { step: '01', title: 'Register', desc: 'Fill in your details and choose your own username and password.' },
              { step: '02', title: 'Login', desc: 'Log in with your chosen credentials to access the exam portal.' },
              { step: '03', title: 'Start Exam', desc: 'Confirm the warning, enter fullscreen, and begin your timed examination.' },
              { step: '04', title: 'AI Grading', desc: 'Gemini AI scores your answers against academic rubrics. Results shown instantly.' },
            ].map(step => (
              <div key={step.step} className="card animate-slide-up" style={{ padding: '28px 20px', textAlign: 'center' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--primary-dark)', color: 'var(--secondary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.05em',
                  margin: '0 auto 16px',
                }}>{step.step}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-light)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Link to="/demo" className="btn btn-mint btn-lg" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
              <span>▶</span> Interactive Exam Demo
            </Link>
            <p style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-light)' }}>
              No login required — see the full exam experience before you register
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--primary-dark)',
        color: 'var(--primary-pale)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <GtecLogo size={80} light />
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: 'var(--white)', marginBottom: '8px' }}>
            Information technology department
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--secondary-light)', marginBottom: '20px' }}>
            Prompt Engineering — Online Assessment Portal
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <Link to="/admin/login" style={{
              color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
              letterSpacing: '0.05em', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--secondary-light)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              Admin Portal
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 12px' }}>|</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>

            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
