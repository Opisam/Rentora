import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

function Sparkle({ style, size = 10, delay = 0 }) {
  return (
    <span className="sparkle" style={{ ...style, '--size': `${size}px`, '--delay': `${delay}s` }}>
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
        <path
          d="M80 0C80 0 84.2 41.2 97.9 62.1C111.6 83 160 80 160 80C160 80 111.6 77 97.9 97.9C84.2 118.8 80 160 80 160C80 160 75.8 118.8 62.1 97.9C48.4 77 0 80 0 80C0 80 48.4 83 62.1 62.1C75.8 41.2 80 0 80 0Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function FloatingShape({ className }) {
  return <div className={`floating-shape ${className}`} />;
}

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="stat-counter">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    const el = ref.current;
    if (el) {
      el.querySelectorAll('.reveal-on-scroll').forEach((child) => observer.observe(child));
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

const sparkles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 14 + 6,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 5,
  duration: Math.random() * 3 + 2,
}));

const features = [
  {
    icon: 'bi-building',
    title: 'Property Listings & Browse',
    desc: 'Landlords list properties and units. Tenants browse available rentals and apply with a single click.',
  },
  {
    icon: 'bi-cash-stack',
    title: 'Easy Rent Payments',
    desc: 'Tenants pay rent online anytime. Landlords track payments, send reminders, and view detailed history.',
  },
  {
    icon: 'bi-tools',
    title: 'Maintenance Requests',
    desc: 'Tenants submit repair requests with details. Landlords receive, track, and resolve them in real time.',
  },
  {
    icon: 'bi-file-earmark-text',
    title: 'Digital Leases',
    desc: 'Landlords create and manage leases. Tenants view their lease terms, upload documents, and stay organized.',
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Insights & Reports',
    desc: 'Landlords get profitability reports and occupancy analytics. Tenants access their full payment history.',
  },
  {
    icon: 'bi-shield-lock',
    title: 'Secure & Private',
    desc: 'Enterprise-grade security protects all users — role-based access, JWT auth, and data encryption.',
  },
];

const steps = [
  {
    num: '01',
    icon: 'bi-person-plus',
    title: 'Create Account',
    desc: 'Sign up as a landlord or tenant in seconds — it\'s completely free.',
  },
  {
    num: '02',
    icon: 'bi-house-add',
    title: 'List or Discover',
    desc: 'Landlords list their properties. Tenants browse and find the perfect home.',
  },
  {
    num: '03',
    icon: 'bi-handshake',
    title: 'Connect & Agree',
    desc: 'Tenants apply, landlords approve, and both parties sign the lease digitally.',
  },
  {
    num: '04',
    icon: 'bi-rocket-takeoff',
    title: 'Manage & Thrive',
    desc: 'Pay rent, submit requests, track finances — everything runs smoothly from day one.',
  },
];

export default function Landing() {
  const scrollRef = useScrollReveal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page" ref={scrollRef}>
      {/* ── Navbar ── */}
      <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container d-flex align-items-center justify-content-between py-3">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <span className="brand-icon-badge">
              <i className="bi bi-house-heart" />
            </span>
            <span className="brand-text">Rentora</span>
          </Link>
          <div className="d-flex align-items-center gap-3">
            <Link to="/login" className="btn btn-ghost">Log in</Link>
            <Link to="/register" className="btn btn-glow">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-gradient-orb orb-1" />
          <div className="hero-gradient-orb orb-2" />
          <div className="hero-gradient-orb orb-3" />
          <FloatingShape className="shape-1" />
          <FloatingShape className="shape-2" />
          <FloatingShape className="shape-3" />
          <FloatingShape className="shape-4" />
          {sparkles.map((s) => (
            <Sparkle
              key={s.id}
              size={s.size}
              delay={s.delay}
              style={{
                position: 'absolute',
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDuration: `${s.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row justify-content-center text-center">
            <div className="col-lg-9">
              <div className="hero-badge reveal-on-scroll">
                <i className="bi bi-stars" /> Built for Landlords & Tenants
              </div>
              <h1 className="hero-title reveal-on-scroll">
                Rental Life,<br />
                <span className="hero-gradient-text">Simplified for Everyone</span>
              </h1>
              <p className="hero-subtitle reveal-on-scroll">
                Whether you own properties or rent one, Rentora has you covered.
                Landlords manage units, collect rent, and track finances.
                Tenants find homes, pay rent, and submit maintenance requests — all in one place.
              </p>
              <div className="hero-actions reveal-on-scroll">
                <Link to="/register" className="btn btn-glow btn-lg px-5">
                  Start Free <i className="bi bi-arrow-right ms-2" />
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-5">
                  Live Demo
                </Link>
              </div>
              <div className="hero-trust reveal-on-scroll">
                <div className="trust-avatars">
                  <span className="trust-avatar" style={{background:'#818cf8'}}>A</span>
                  <span className="trust-avatar" style={{background:'#f472b6'}}>B</span>
                  <span className="trust-avatar" style={{background:'#34d399'}}>C</span>
                  <span className="trust-avatar" style={{background:'#fbbf24'}}>D</span>
                  <span className="trust-avatar" style={{background:'#60a5fa'}}>E</span>
                </div>
                <span className="trust-text">Trusted by <strong>2,500+</strong> landlords & tenants</span>
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="hero-preview reveal-on-scroll">
            <div className="preview-window">
              <div className="preview-dots">
                <span /><span /><span />
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="preview-nav-item active" />
                  <div className="preview-nav-item" />
                  <div className="preview-nav-item" />
                  <div className="preview-nav-item" />
                  <div className="preview-nav-item" />
                </div>
                <div className="preview-main">
                  <div className="preview-topbar">
                    <div className="preview-search" />
                    <div className="preview-notif" />
                  </div>
                  <div className="preview-stats">
                    <div className="preview-stat-card" />
                    <div className="preview-stat-card" />
                    <div className="preview-stat-card" />
                    <div className="preview-stat-card" />
                  </div>
                  <div className="preview-chart-area">
                    <div className="preview-chart-bar" style={{height:'60%'}} />
                    <div className="preview-chart-bar" style={{height:'80%'}} />
                    <div className="preview-chart-bar" style={{height:'45%'}} />
                    <div className="preview-chart-bar" style={{height:'90%'}} />
                    <div className="preview-chart-bar" style={{height:'70%'}} />
                    <div className="preview-chart-bar" style={{height:'55%'}} />
                    <div className="preview-chart-bar" style={{height:'85%'}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-fade" />
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <div className="container">
          <div className="text-center mb-5 reveal-on-scroll">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything you need, for both sides</h2>
            <p className="section-subtitle">
              Powerful tools built for landlords and tenants alike
            </p>
          </div>
          <div className="row g-4">
            {features.map((f, i) => (
              <div className="col-md-6 col-lg-4 reveal-on-scroll" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="feature-card">
                  <div className="feature-icon">
                    <i className={`bi ${f.icon}`} />
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="steps-section">
        <div className="container">
          <div className="text-center mb-5 reveal-on-scroll">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Up and running in minutes</h2>
            <p className="section-subtitle">
              Four simple steps to get started — whether you're renting out or moving in
            </p>
          </div>
          <div className="row g-4 justify-content-center">
            {steps.map((s, i) => (
              <div className="col-md-6 col-lg-3 reveal-on-scroll" key={i} style={{ transitionDelay: `${i * 0.12}s` }}>
                <div className="step-card">
                  <div className="step-num">{s.num}</div>
                  <div className="step-icon">
                    <i className={`bi ${s.icon}`} />
                  </div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                  {i < steps.length - 1 && <div className="step-connector d-none d-lg-block" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-bg">
          {sparkles.slice(0, 10).map((s) => (
            <Sparkle
              key={s.id}
              size={s.size * 0.8}
              delay={s.delay}
              style={{
                position: 'absolute',
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDuration: `${s.duration}s`,
                color: 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row text-center g-4">
            <div className="col-6 col-md-3 reveal-on-scroll">
              <div className="stat-block">
                <div className="stat-number"><AnimatedCounter target={2500} suffix="+" /></div>
                <div className="stat-text">Active Users</div>
              </div>
            </div>
            <div className="col-6 col-md-3 reveal-on-scroll" style={{ transitionDelay: '0.1s' }}>
              <div className="stat-block">
                <div className="stat-number"><AnimatedCounter target={15000} suffix="+" /></div>
                <div className="stat-text">Properties Managed</div>
              </div>
            </div>
            <div className="col-6 col-md-3 reveal-on-scroll" style={{ transitionDelay: '0.2s' }}>
              <div className="stat-block">
                <div className="stat-number"><AnimatedCounter target={98} suffix="%" /></div>
                <div className="stat-text">Uptime</div>
              </div>
            </div>
            <div className="col-6 col-md-3 reveal-on-scroll" style={{ transitionDelay: '0.3s' }}>
              <div className="stat-block">
                <div className="stat-number"><AnimatedCounter target={4} suffix=".9★" duration={1500} /></div>
                <div className="stat-text">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card reveal-on-scroll">
            <div className="cta-sparkles">
              {sparkles.slice(0, 8).map((s) => (
                <Sparkle
                  key={s.id}
                  size={s.size * 0.7}
                  delay={s.delay}
                  style={{
                    position: 'absolute',
                    left: `${s.left}%`,
                    top: `${s.top}%`,
                    animationDuration: `${s.duration}s`,
                    color: 'rgba(129,140,248,0.5)',
                  }}
                />
              ))}
            </div>
            <h2 className="cta-title">Ready to simplify your rental experience?</h2>
            <p className="cta-subtitle">
              Join thousands of landlords and tenants already using Rentora to make renting effortless for everyone.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-glow btn-lg px-5">
                Get Started Free <i className="bi bi-arrow-right ms-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="brand-icon-badge">
                  <i className="bi bi-house-heart" />
                </span>
                <span className="brand-text">Rentora</span>
              </div>
              <p className="footer-desc">
                The modern rental platform where landlords manage properties and tenants find their perfect home.
              </p>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="footer-heading">Product</h6>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="footer-heading">Company</h6>
              <ul className="footer-links">
                <li><a href="#about">About</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="footer-heading">Support</h6>
              <ul className="footer-links">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#status">Status</a></li>
              </ul>
            </div>
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className="footer-heading">Legal</h6>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy</a></li>
                <li><a href="#terms">Terms</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
          </div>
          <hr className="footer-divider" />
          <div className="d-flex flex-wrap justify-content-between align-items-center py-3">
            <p className="footer-copy mb-0">&copy; 2026 Rentora. All rights reserved.</p>
            <div className="d-flex gap-3">
              <a href="#github" className="footer-social"><i className="bi bi-github" /></a>
              <a href="#twitter" className="footer-social"><i className="bi bi-twitter-x" /></a>
              <a href="#linkedin" className="footer-social"><i className="bi bi-linkedin" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
