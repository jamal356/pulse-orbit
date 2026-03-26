import { useState, useEffect, useRef } from 'react'

/* ─── Configuration ─────────────────────────────────────────────
   Phase toggle:
   - 'exclusive'  → "You'll know." (mystery + selectivity)
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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT

   Design philosophy: the typography IS the design.
   One statement. One action. Nothing competes.
   The emptiness creates the gravity.
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [phase, setPhase] = useState(0) // 0: nothing, 1: logo, 2: tagline, 3: cta
  const formRef = useRef<HTMLDivElement>(null)

  /* Cinematic staggered reveal */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 1200)
    const t3 = setTimeout(() => setPhase(3), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setShowForm(true)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 400)
  }

  return (
    <div className="min-h-screen bg-[#060606] relative overflow-hidden cursor-default select-none">
      {/* ─── Single ambient glow — just enough to feel warm ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(224,64,160,0.07) 0%, rgba(224,64,160,0.02) 40%, transparent 70%)',
          }}
        />
      </div>

      {/* ═══ THE PAGE — one screen, nothing else ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        <div className="relative z-10 flex flex-col items-center text-center">

          {/* ── Logo: appears first, then drifts up ── */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >
            <h2
              className="text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.15em] uppercase text-white/70"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Pulse
            </h2>
          </div>

          {/* ── The line: a single heartbeat ── */}
          <div
            className="my-8 transition-all duration-[1.5s] ease-out"
            style={{
              opacity: phase >= 2 ? 0.35 : 0,
              transform: phase >= 2 ? 'scaleX(1)' : 'scaleX(0)',
            }}
          >
            <svg width="120" height="20" viewBox="0 0 120 24" fill="none">
              <path
                d="M0 12h35l4-9 4 18 4-18 4 9h69"
                stroke="#E040A0"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* ── Tagline: the only thing that matters ── */}
          <h1
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(3.5rem, 12vw, 8rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            You'll know.
          </h1>

          {/* ── Spacer ── */}
          <div className="h-16 sm:h-20" />

          {/* ── CTA: fades in last, minimal ── */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    className="w-64 px-5 py-3 rounded-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 text-sm tracking-wide focus:outline-none focus:border-white/20 transition-all text-center sm:text-left"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full border border-white/20 text-white/70 text-sm tracking-wide hover:bg-white/[0.06] hover:text-white transition-all duration-500"
                  >
                    {PHASE === 'exclusive' ? 'Request access' : 'Join waitlist'}
                  </button>
                </div>
                <p className="text-white/15 text-[11px] tracking-[0.2em] uppercase">
                  {PHASE === 'exclusive'
                    ? 'By invitation only'
                    : <><AnimatedCounter target={WAITLIST_COUNT} /> already in line</>
                  }
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <p className="text-white/50 text-sm tracking-wide">
                  You're in.
                </p>
                <div className="w-8 h-px bg-white/10" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ TYPEFORM (appears after email — only content below the fold) ═══ */}
      {showForm && (
        <section ref={formRef} className="relative px-6 py-24 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-white/20 text-[11px] tracking-[0.3em] uppercase mb-10">
              Complete your profile
            </p>

            <div className="rounded-2xl overflow-hidden border border-white/[0.05] bg-white/[0.02]">
              {TYPEFORM_FORM_ID === 'YOUR_TYPEFORM_ID' ? (
                <div className="p-20 text-center">
                  <p className="text-white/30 text-sm mb-2">Typeform ready</p>
                  <p className="text-white/15 text-xs">
                    Replace <code className="text-pulse/40 bg-white/[0.04] px-2 py-0.5 rounded text-[11px]">YOUR_TYPEFORM_ID</code> in WaitlistPage.tsx
                  </p>
                </div>
              ) : (
                <iframe
                  src={`https://form.typeform.com/to/${TYPEFORM_FORM_ID}${email ? `#email=${encodeURIComponent(email)}` : ''}`}
                  style={{ width: '100%', height: '550px', border: 'none' }}
                  allow="camera; microphone"
                  title="Pulse / Orbit"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER — ghost-level presence ═══ */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-white/10 text-[11px] tracking-wider">Dubai 2026</span>
          <a
            href="mailto:jamal@hakadian.com"
            className="text-white/10 text-[11px] tracking-wider hover:text-white/25 transition-colors duration-500"
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
