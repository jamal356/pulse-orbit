import { useState, useEffect, useRef, useCallback } from 'react'
import BackgroundOrbs from '../components/BackgroundOrbs'

/* ─── Configuration ─────────────────────────────────────────────
   Toggle between launch phases:
   - 'exclusive'  → "Apply for Early Access" (Raya-style selectivity)
   - 'fomo'       → "Join 2,400+ on the waitlist" (counter-driven urgency)

   Change this when you hit critical mass (e.g., 500+ signups)
   ──────────────────────────────────────────────────────────────── */
const PHASE: 'exclusive' | 'fomo' = 'exclusive'

/* Replace with your actual Typeform form ID */
const TYPEFORM_FORM_ID = 'YOUR_TYPEFORM_ID'

/* FOMO counter — update periodically with real numbers */
const WAITLIST_COUNT = 2_437

/* ─── Scroll-reveal hook ─────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
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
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
          setCount(Math.floor(eased * target))
          if (progress < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

/* ─── Floating particles ─────────────────────────────────────── */
function FloatingHearts() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute text-pulse/20 animate-float-slow"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 1.2}s`,
            fontSize: `${14 + (i % 3) * 8}px`,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  )
}

/* ─── How it Works step card ─────────────────────────────────── */
function StepCard({ number, icon, title, desc, delay }: {
  number: number; icon: string; title: string; desc: string; delay: number
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={`glass-tile p-8 text-center transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-full bg-pulse/15 border border-pulse/25 flex items-center justify-center mx-auto mb-4">
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-xs text-pulse font-semibold tracking-widest uppercase mb-2">
        Step {number}
      </div>
      <h3 className="font-display text-xl text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

/* ─── Trust badge ────────────────────────────────────────────── */
function TrustBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 glass-button rounded-full px-4 py-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-text-secondary">{text}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [showTypeform, setShowTypeform] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const typeformRef = useRef<HTMLDivElement>(null)

  const heroReveal = useReveal(0.1)
  const problemReveal = useReveal()
  const howReveal = useReveal()
  const socialReveal = useReveal()
  const formReveal = useReveal()
  const faqReveal = useReveal()

  const scrollToForm = useCallback(() => {
    setShowTypeform(true)
    setTimeout(() => {
      typeformRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [])

  /* Quick email capture (pre-Typeform hook) */
  const handleQuickEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setEmailSubmitted(true)
      setShowTypeform(true)
      setTimeout(() => {
        typeformRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }

  /* ─── FAQ data ─────────────────────────────────────────────── */
  const faqs = [
    {
      q: 'How does it work?',
      a: 'You join a scheduled session with other singles. Over 5 live video dates (5 minutes each), you meet real people face-to-face. After all dates, mutual matches are revealed.'
    },
    {
      q: 'Is my privacy protected?',
      a: 'Absolutely. No last names are shown during dates. Video streams are live only — never recorded. You control what you share, always.'
    },
    {
      q: 'What if someone behaves inappropriately?',
      a: 'Every session has an emergency exit button that instantly disconnects you and flags the other person for safety review. Zero tolerance.'
    },
    {
      q: 'How much does it cost?',
      a: 'Founding members get exclusive early pricing. Sessions are priced per event — no subscriptions, no hidden fees, no pay-to-win.'
    },
  ]

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-deep-water relative overflow-hidden">
      <BackgroundOrbs />
      <FloatingHearts />

      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pulse to-pulse-deep flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-display text-xl text-text-primary">Pulse</span>
            <span className="text-text-tertiary text-xs mt-1">/ Orbit</span>
          </div>
          <button
            onClick={scrollToForm}
            className="glass-button rounded-full px-5 py-2 text-sm text-text-primary hover:text-white transition-colors"
          >
            {PHASE === 'exclusive' ? 'Apply Now' : 'Join Waitlist'}
          </button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section
        ref={heroReveal.ref}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20"
      >
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pulse/8 rounded-full blur-[120px] pointer-events-none" />

        <div className={`relative z-10 max-w-2xl transition-all duration-1000 ${
          heroReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          {/* Phase badge */}
          {PHASE === 'exclusive' ? (
            <div className="inline-flex items-center gap-2 glass-button rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-pulse animate-pulse-slow" />
              <span className="text-xs text-text-secondary tracking-wide">
                Applications Open · Limited Founding Members
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 glass-button rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-slow" />
              <span className="text-xs text-text-secondary tracking-wide">
                <AnimatedCounter target={WAITLIST_COUNT} /> people already waiting
              </span>
            </div>
          )}

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-text-primary leading-[1.05] mb-6 text-shadow-glow">
            Stop Swiping.
            <br />
            <span className="text-pulse">Start Meeting.</span>
          </h1>

          <p className="text-text-secondary text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto">
            Live video speed dating that shows you{' '}
            <span className="text-text-primary">real chemistry in 5 minutes</span>
            {' '}— not a curated highlight reel.
          </p>

          {/* Quick email capture */}
          {!emailSubmitted ? (
            <form onSubmit={handleQuickEmail} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-3.5 rounded-xl bg-white/8 border border-white/15 text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-pulse/50 focus:ring-1 focus:ring-pulse/25 transition-all"
              />
              <button
                type="submit"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-pulse to-pulse-deep text-white font-semibold text-sm hover:shadow-lg hover:shadow-pulse/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                {PHASE === 'exclusive' ? 'Apply for Early Access' : 'Join the Waitlist'}
              </button>
            </form>
          ) : (
            <div className="glass-tile px-6 py-4 max-w-md mx-auto mb-6 text-center animate-scale-in">
              <span className="text-success text-lg mr-2">✓</span>
              <span className="text-text-primary text-sm">
                Great — complete your profile below to secure your spot
              </span>
            </div>
          )}

          <p className="text-text-tertiary text-xs">
            {PHASE === 'exclusive'
              ? 'By invitation & application only · Launching Summer 2026'
              : `${WAITLIST_COUNT.toLocaleString()} people ahead of you · Launching Summer 2026`}
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
          <span className="text-text-tertiary text-xs">Scroll to learn more</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-tertiary">
            <path d="M10 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section ref={problemReveal.ref} className="relative px-6 py-24">
        <div className={`max-w-4xl mx-auto transition-all duration-700 ${
          problemReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center mb-16">
            <p className="text-pulse text-sm font-semibold tracking-widest uppercase mb-3">The Problem</p>
            <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-4">
              Dating apps are broken.
              <br />
              <span className="text-text-secondary">You already know it.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: '👻',
                stat: '72%',
                title: 'Ghosted after matching',
                desc: 'Endless texting that leads nowhere. Hours invested in someone who vanishes.',
              },
              {
                emoji: '🎭',
                stat: '53%',
                title: 'Catfished on first date',
                desc: 'Curated photos hide reality. You only find out when it\'s too late.',
              },
              {
                emoji: '😴',
                stat: '3 hrs',
                title: 'Wasted per week swiping',
                desc: 'Swiping feels productive but it\'s not. You\'re browsing, not connecting.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`glass-tile p-6 text-center transition-all duration-700 ${
                  problemReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <div className="text-2xl font-bold text-pulse mb-1">{item.stat}</div>
                <h3 className="text-text-primary font-semibold text-sm mb-2">{item.title}</h3>
                <p className="text-text-tertiary text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE SOLUTION — HOW IT WORKS ═══ */}
      <section ref={howReveal.ref} className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            howReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <p className="text-pulse text-sm font-semibold tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-4">
              Real faces. Real chemistry.
              <br />
              <span className="text-text-secondary">In under an hour.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            <StepCard
              number={1}
              icon="📅"
              title="Book a Session"
              desc="Choose an evening that works. Sessions are scheduled events — not endless browsing."
              delay={0}
            />
            <StepCard
              number={2}
              icon="📹"
              title="5 Live Video Dates"
              desc="Camera on, 5 minutes each. See body language, hear tone of voice, feel the energy."
              delay={150}
            />
            <StepCard
              number={3}
              icon="💫"
              title="Mutual Matches Revealed"
              desc="After all dates, find out who felt the spark too. No ghosting — just answers."
              delay={300}
            />
          </div>

          {/* Visual demo strip */}
          <div className={`mt-12 glass-tile p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 transition-all duration-700 ${
            howReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '500ms' }}>
            <div className="flex -space-x-3">
              {['🧕', '👩', '👨', '🧔', '👩‍🦱'].map((e, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-base-elevated border-2 border-base flex items-center justify-center text-lg">
                  {e}
                </div>
              ))}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-text-primary text-sm font-medium">
                5 dates · 5 minutes each · 1 evening
              </p>
              <p className="text-text-tertiary text-xs mt-1">
                What takes weeks on Tinder happens in under 30 minutes on Pulse.
              </p>
            </div>
            <button
              onClick={scrollToForm}
              className="glass-button rounded-full px-5 py-2 text-sm text-pulse hover:text-pulse-bright transition-colors whitespace-nowrap"
            >
              I want in →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF / WHY DIFFERENT ═══ */}
      <section ref={socialReveal.ref} className="relative px-6 py-24">
        <div className={`max-w-4xl mx-auto transition-all duration-700 ${
          socialReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center mb-16">
            <p className="text-pulse text-sm font-semibold tracking-widest uppercase mb-3">Why Pulse</p>
            <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-4">
              Built for people who are
              <br />
              <span className="text-text-secondary">done wasting time.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: '🎥',
                title: 'Camera doesn\'t lie',
                desc: 'Body language, eye contact, nervous laughter — the things that actually tell you if there\'s chemistry.',
              },
              {
                icon: '🛡️',
                title: 'Safe by design',
                desc: 'Emergency exit button, no last names, live-only video (never recorded), and a safety review team.',
              },
              {
                icon: '⏱️',
                title: 'Respects your time',
                desc: 'One session, one evening. Not weeks of texting to meet someone who looks nothing like their photos.',
              },
              {
                icon: '🚫',
                title: 'No pay-to-win',
                desc: 'No super-likes, no boosts, no algorithm manipulation. Everyone gets the same 5 dates, same 5 minutes.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`glass-tile p-6 flex gap-4 transition-all duration-700 ${
                  socialReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${200 + i * 120}ms` }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-text-primary font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-text-tertiary text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison strip */}
          <div className={`glass-tile p-6 sm:p-8 transition-all duration-700 ${
            socialReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`} style={{ transitionDelay: '600ms' }}>
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div />
              <div className="text-text-tertiary font-medium uppercase tracking-wider">Tinder / Bumble</div>
              <div className="text-pulse font-medium uppercase tracking-wider">Pulse / Orbit</div>

              {[
                ['First impression', 'Photos', 'Live video'],
                ['Time to meet', '2-3 weeks', '5 minutes'],
                ['Catfish risk', 'High', 'Zero'],
                ['Ghosting', 'Constant', 'Not possible'],
                ['Cost model', 'Pay-to-win', 'Pay-per-session'],
              ].map(([label, old, ours], i) => (
                <div key={i} className="contents">
                  <div className="text-text-secondary text-left py-2 border-t border-white/5">{label}</div>
                  <div className="text-text-tertiary py-2 border-t border-white/5">{old}</div>
                  <div className="text-text-primary py-2 border-t border-white/5 font-medium">{ours}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FOMO counter (shown in both phases, more prominent in fomo) */}
          {PHASE === 'fomo' && (
            <div className="mt-12 text-center">
              <div className="glass-strong rounded-2xl px-8 py-6 inline-block">
                <div className="text-4xl font-bold text-pulse mb-1">
                  <AnimatedCounter target={WAITLIST_COUNT} />
                </div>
                <p className="text-text-secondary text-sm">people on the waitlist</p>
                <p className="text-text-tertiary text-xs mt-1">Dubai · Abu Dhabi · Riyadh · Doha</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ TYPEFORM SECTION ═══ */}
      <section ref={formReveal.ref} className="relative px-6 py-24">
        <div ref={typeformRef} className={`max-w-2xl mx-auto transition-all duration-700 ${
          formReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center mb-10">
            <p className="text-pulse text-sm font-semibold tracking-widest uppercase mb-3">
              {PHASE === 'exclusive' ? 'Apply Now' : 'Join the Waitlist'}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-4">
              {PHASE === 'exclusive' ? (
                <>Your seat at the table<br /><span className="text-text-secondary">is waiting.</span></>
              ) : (
                <>Don't miss the launch.<br /><span className="text-text-secondary">Get in line.</span></>
              )}
            </h2>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              {PHASE === 'exclusive'
                ? 'Takes 60 seconds. No commitments. Founding members get priority access and exclusive pricing.'
                : `Join ${WAITLIST_COUNT.toLocaleString()} others. The earlier you sign up, the sooner you get access.`}
            </p>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <TrustBadge icon="🔒" text="No spam, ever" />
            <TrustBadge icon="⚡" text="60 seconds" />
            <TrustBadge icon="🎁" text="Founding member perks" />
          </div>

          {/* Typeform embed or CTA to open it */}
          {showTypeform || emailSubmitted ? (
            <div className="glass-tile overflow-hidden" style={{ borderRadius: '20px' }}>
              {TYPEFORM_FORM_ID === 'YOUR_TYPEFORM_ID' ? (
                /* Placeholder when no Typeform ID is set */
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-pulse/15 border border-pulse/25 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-text-primary font-medium mb-2">Typeform Integration Ready</p>
                  <p className="text-text-tertiary text-sm mb-4">
                    Replace <code className="text-pulse text-xs bg-white/5 px-2 py-0.5 rounded">YOUR_TYPEFORM_ID</code> in WaitlistPage.tsx with your actual form ID
                  </p>
                  <p className="text-text-tertiary text-xs">
                    The form will embed right here — full height, seamless experience
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
          ) : (
            <div className="text-center">
              <button
                onClick={scrollToForm}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-pulse to-pulse-deep text-white font-semibold text-base hover:shadow-lg hover:shadow-pulse/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {PHASE === 'exclusive' ? 'Apply for Early Access' : 'Join the Waitlist →'}
              </button>
              <p className="text-text-tertiary text-xs mt-4">
                {PHASE === 'exclusive'
                  ? 'Limited spots · We review every application'
                  : 'Free to join · No obligations'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section ref={faqReveal.ref} className="relative px-6 py-24">
        <div className={`max-w-2xl mx-auto transition-all duration-700 ${
          faqReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="text-center mb-12">
            <p className="text-pulse text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="font-display text-3xl text-text-primary">
              Questions? Answered.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`glass-tile overflow-hidden transition-all duration-500 ${
                  faqReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-text-primary text-sm font-medium pr-4">{faq.q}</span>
                  <span className={`text-text-tertiary transition-transform duration-300 flex-shrink-0 ${
                    openFaq === i ? 'rotate-45' : ''
                  }`}>
                    +
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${
                  openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <p className="px-5 pb-5 text-text-secondary text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative px-6 py-24 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-text-primary mb-4 text-shadow-glow">
            {PHASE === 'exclusive'
              ? 'Chemistry can\'t be swiped.'
              : 'The future of dating is live.'}
          </h2>
          <p className="text-text-secondary mb-8">
            {PHASE === 'exclusive'
              ? 'Be among the first to experience what dating should have always been.'
              : `${WAITLIST_COUNT.toLocaleString()} people already agree. Join them.`}
          </p>
          <button
            onClick={scrollToForm}
            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-pulse to-pulse-deep text-white font-semibold text-base hover:shadow-lg hover:shadow-pulse/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {PHASE === 'exclusive' ? 'Apply for Early Access' : 'Join the Waitlist'}
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative px-6 py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pulse to-pulse-deep flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">P</span>
            </div>
            <span className="text-text-tertiary text-sm">Pulse / Orbit © 2026</span>
          </div>
          <div className="flex items-center gap-6 text-text-tertiary text-xs">
            <span>Dubai · Abu Dhabi · Riyadh</span>
            <a href="mailto:jamal@hakadian.com" className="hover:text-pulse transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
