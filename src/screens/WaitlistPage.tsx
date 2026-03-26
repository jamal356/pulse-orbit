import { useState, useEffect, useRef } from 'react'

/* ─── Configuration ─────────────────────────────────────────────
   Phase toggle:
   - 'exclusive'  → "Apply for Early Access" (mystery + selectivity)
   - 'fomo'       → counter-driven urgency

   Change when you hit critical mass (~500+ signups)
   ──────────────────────────────────────────────────────────────── */
const PHASE: 'exclusive' | 'fomo' = 'exclusive'

/* Replace with your actual Typeform form ID */
const TYPEFORM_FORM_ID = 'YOUR_TYPEFORM_ID'

/* FOMO phase — update with real numbers */
const WAITLIST_COUNT = 2_437

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (now: number) => {
          const p = Math.min((now - start) / 2000, 1)
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

/* ─── Pulsing rings — the heartbeat visual ───────────────────── */
function PulseRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="absolute rounded-full border border-pulse/[0.06]"
          style={{
            width: `${i * 220}px`,
            height: `${i * 220}px`,
            animation: `ring-pulse ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {/* Central glow */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-pulse/[0.04] blur-[80px]" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setShowForm(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] relative overflow-hidden">
      {/* ─── Ambient background ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pulse/[0.03] blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/[0.04] blur-[120px]" />
      </div>

      {/* ─── Subtle grain texture ─── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ═══ FULL-SCREEN HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <PulseRings />

        <div className={`relative z-10 max-w-xl text-center transition-all duration-[1.4s] ease-out ${
          loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          {/* Logo mark */}
          <div className={`mx-auto mb-12 transition-all duration-[1.8s] delay-200 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-pulse/80 to-pulse-deep/80 flex items-center justify-center shadow-lg shadow-pulse/10">
              <span className="text-white text-lg font-display font-bold tracking-tight">P</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className={`font-display text-[clamp(2.8rem,8vw,5.5rem)] leading-[0.95] text-white mb-6 transition-all duration-[1.6s] delay-300 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            Chemistry
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pulse via-pink-400 to-pulse-bright">
              can't be swiped.
            </span>
          </h1>

          {/* Single line — just enough */}
          <p className={`text-white/40 text-lg sm:text-xl font-light tracking-wide mb-12 transition-all duration-[1.6s] delay-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}>
            Live video speed dating. Launching Summer 2026.
          </p>

          {/* Email capture */}
          <div className={`transition-all duration-[1.6s] delay-700 ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  className="flex-1 px-5 py-3.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-pulse/40 focus:bg-white/[0.08] transition-all"
                />
                <button
                  type="submit"
                  className="px-7 py-3.5 rounded-full bg-white text-[#0A0A0C] font-semibold text-sm hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                >
                  {PHASE === 'exclusive' ? 'Get Early Access' : 'Join Waitlist'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 text-white/50 text-sm animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-pulse/20 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#E040A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                You're in. Complete your profile below.
              </div>
            )}
          </div>

          {/* Subtle proof line */}
          <p className={`mt-6 text-white/20 text-xs tracking-widest uppercase transition-all duration-[1.6s] delay-[900ms] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}>
            {PHASE === 'exclusive'
              ? 'By application only'
              : <><AnimatedCounter target={WAITLIST_COUNT} /> already waiting</>
            }
          </p>
        </div>

        {/* Scroll hint — only if form section exists below */}
        {showForm && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="text-white/15">
              <path d="M8 4v16m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </section>

      {/* ═══ TYPEFORM (appears after email) ═══ */}
      {showForm && (
        <section ref={formRef} className="relative px-6 py-20 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            {/* Minimal section header */}
            <p className="text-center text-white/25 text-xs tracking-[0.3em] uppercase mb-10">
              Tell us about you
            </p>

            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
              {TYPEFORM_FORM_ID === 'YOUR_TYPEFORM_ID' ? (
                <div className="p-16 text-center">
                  <p className="text-white/40 text-sm mb-2">Typeform ready to embed</p>
                  <p className="text-white/20 text-xs">
                    Replace <code className="text-pulse/60 bg-white/[0.04] px-2 py-0.5 rounded text-[11px]">YOUR_TYPEFORM_ID</code> in WaitlistPage.tsx
                  </p>
                </div>
              ) : (
                <iframe
                  src={`https://form.typeform.com/to/${TYPEFORM_FORM_ID}${email ? `#email=${encodeURIComponent(email)}` : ''}`}
                  style={{ width: '100%', height: '550px', border: 'none' }}
                  allow="camera; microphone"
                  title="Pulse/Orbit Application"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER — barely there ═══ */}
      <footer className="relative px-6 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-white/15 text-xs">Pulse / Orbit</span>
          <div className="flex items-center gap-4 text-white/15 text-xs">
            <span>Dubai</span>
            <a href="mailto:jamal@hakadian.com" className="hover:text-white/30 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* ─── Ring pulse animation ─── */}
      <style>{`
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.04); }
        }
      `}</style>
    </div>
  )
}
