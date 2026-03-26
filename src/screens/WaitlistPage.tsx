import { useState, useEffect, useRef } from 'react'

/* ─── Configuration ─────────────────────────────────────────────
   Phase toggle:
   - 'exclusive'  → mystery + selectivity
   - 'fomo'       → counter-driven urgency
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

/* ─── Animated heartbeat SVG — draws itself ──────────────────── */
function HeartbeatLine({ visible }: { visible: boolean }) {
  return (
    <svg
      width="140"
      height="24"
      viewBox="0 0 140 24"
      fill="none"
      className="transition-opacity duration-[2s]"
      style={{ opacity: visible ? 0.45 : 0 }}
    >
      <path
        d="M0 12h42l5-10 5 20 5-20 5 10h78"
        stroke="#E040A0"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="200"
        strokeDashoffset={visible ? '0' : '200'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT

   Logo → heartbeat → tagline = one unified composition.
   Warm deep background. Typography is the design.
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [phase, setPhase] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  /* Cinematic staggered reveal */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 1400)
    const t3 = setTimeout(() => setPhase(3), 2800)
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
    <div
      className="min-h-screen relative overflow-hidden cursor-default select-none"
      style={{ background: 'linear-gradient(170deg, #1C1A22 0%, #16141C 40%, #12111A 100%)' }}
    >
      {/* ─── Warm ambient light — not a glow, a presence ─── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Soft warm bloom behind the composition */}
        <div
          className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '900px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(224,64,160,0.06) 0%, rgba(160,50,180,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Subtle top-left warmth */}
        <div
          className="absolute top-[-10%] left-[-5%]"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(80,50,120,0.08) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* ═══ THE PAGE ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">

        {/* ── One unified composition: logo + line + tagline ── */}
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo — part of the sentence, not a header */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: phase >= 1 ? 0.55 : 0,
              transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <span
              className="text-[clamp(0.75rem,1.8vw,0.9rem)] font-normal tracking-[0.35em] uppercase"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Pulse / Orbit
            </span>
          </div>

          {/* Heartbeat line — the connective tissue */}
          <div className="my-5">
            <HeartbeatLine visible={phase >= 1} />
          </div>

          {/* Tagline — the gravitational center */}
          <h1
            className="transition-all duration-[2.2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(3.2rem, 11vw, 7.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.95,
              letterSpacing: '-0.015em',
              color: 'rgba(255,255,255,0.95)',
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            You'll know.
          </h1>

          {/* Breathing space */}
          <div className="h-14 sm:h-16" />

          {/* CTA — fades in last */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
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
                    className="w-64 px-5 py-3 rounded-full text-white placeholder:text-white/25 text-sm tracking-wide focus:outline-none transition-all duration-500 text-center sm:text-left"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(224,64,160,0.3)'
                      e.target.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.10)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                    }}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-500"
                    style={{
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                    }}
                  >
                    {PHASE === 'exclusive' ? 'Request access' : 'Join waitlist'}
                  </button>
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {PHASE === 'exclusive'
                    ? 'By invitation only'
                    : <><AnimatedCounter target={WAITLIST_COUNT} /> already in line</>
                  }
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 animate-fade-in">
                <p className="text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  You're in.
                </p>
                <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ TYPEFORM ═══ */}
      {showForm && (
        <section ref={formRef} className="relative px-6 py-24 animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <p
              className="text-center text-[11px] tracking-[0.3em] uppercase mb-10"
              style={{ color: 'rgba(255,255,255,0.20)' }}
            >
              Complete your profile
            </p>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {TYPEFORM_FORM_ID === 'YOUR_TYPEFORM_ID' ? (
                <div className="p-20 text-center">
                  <p style={{ color: 'rgba(255,255,255,0.30)' }} className="text-sm mb-2">Typeform ready</p>
                  <p style={{ color: 'rgba(255,255,255,0.15)' }} className="text-xs">
                    Replace <code className="text-pulse/40 px-2 py-0.5 rounded text-[11px]" style={{ background: 'rgba(255,255,255,0.04)' }}>YOUR_TYPEFORM_ID</code> in WaitlistPage.tsx
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

      {/* ═══ FOOTER ═══ */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[11px] tracking-wider" style={{ color: 'rgba(255,255,255,0.12)' }}>
            Dubai 2026
          </span>
          <a
            href="mailto:jamal@hakadian.com"
            className="text-[11px] tracking-wider transition-colors duration-500"
            style={{ color: 'rgba(255,255,255,0.12)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.30)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
