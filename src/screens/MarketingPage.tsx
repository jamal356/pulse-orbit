import { useEffect, useState, useRef } from 'react'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onStartDemo: () => void
}

/* ─── Scroll reveal ──────────────────────────────────────────── */
function useReveal(threshold = 0.2) {
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

/* ─── Animated heartbeat ─────────────────────────────────────── */
function HeartbeatLine({ visible }: { visible: boolean }) {
  return (
    <svg width="140" height="24" viewBox="0 0 140 24" fill="none"
      className="transition-opacity duration-[2s]"
      style={{ opacity: visible ? 0.45 : 0 }}
    >
      <path
        d="M0 12h42l5-10 5 20 5-20 5 10h78"
        stroke="#C83E88" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="200" strokeDashoffset={visible ? '0' : '200'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
    </svg>
  )
}

/* ─── Single stat — big number, small label ──────────────────── */
function Stat({ value, label, delay, visible }: {
  value: string; label: string; delay: number; visible: boolean
}) {
  return (
    <div
      className="text-center transition-all duration-[1.5s] ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <p
        className="font-display"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 600,
          color: '#C83E88',
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs sm:text-sm tracking-wide" style={{ color: '#A89E98' }}>
        {label}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   INVESTOR DEMO PAGE

   Structure (Jobs method):
   1. The human truth → make them feel the problem
   2. The shift → one line that changes everything
   3. The demo CTA → let the product speak
   4. The business → only after they've felt it
   5. The close → clean ask
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingPage({ onStartDemo }: Props) {
  const [heroPhase, setHeroPhase] = useState(0)
  const tension = useReveal(0.3)
  const shift = useReveal(0.3)
  const proof = useReveal(0.2)
  const model = useReveal(0.2)
  const close = useReveal(0.2)

  /* Hero timing — mechanical loop words, then the turn, then life breaks through */
  useEffect(() => {
    const timers = [
      setTimeout(() => setHeroPhase(1), 400),   // "Swipe."
      setTimeout(() => setHeroPhase(2), 900),    // "Match."
      setTimeout(() => setHeroPhase(3), 1400),   // "Text."
      setTimeout(() => setHeroPhase(4), 1900),   // "Ghost."
      setTimeout(() => setHeroPhase(5), 2400),   // "Repeat."
      setTimeout(() => setHeroPhase(6), 3600),   // "$9.6 billion. By design."
      setTimeout(() => setHeroPhase(7), 5200),   // Heartbeat + PULSE + CTA
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(170deg, #FAF7F2 0%, #F2EDE6 40%, #FAF7F2 100%)' }}
    >
      {/* ─── Ambient ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '1000px', height: '700px',
            background: 'radial-gradient(ellipse, rgba(200,62,136,0.06) 0%, transparent 40%, transparent 70%)',
          }}
        />
      </div>

      {/* ═══ HERO — The Loop, The Turn, The Pulse ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-3xl">

          {/* THE LOOP — mechanical, staccato, one word at a time */}
          <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6">
            {['Swipe.', 'Match.', 'Text.', 'Ghost.', 'Repeat.'].map((word, i) => (
              <span
                key={word}
                className="transition-all duration-700 ease-out"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: heroPhase >= (i + 1)
                    ? (word === 'Repeat.' ? 'transparent' : '#8A7E78')
                    : 'transparent',
                  transform: heroPhase >= (i + 1) ? 'translateY(0)' : 'translateY(6px)',
                }}
              >
                {word}
              </span>
            ))}
          </div>

          <div className="h-12 sm:h-16" />

          {/* THE TURN — the insight that reframes everything */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: heroPhase >= 6 ? 1 : 0,
              transform: heroPhase >= 6 ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(2.4rem, 7vw, 4.8rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                lineHeight: 1.05,
                color: '#2A2528',
              }}
            >
              $9.6 billion.
              <br />
              <span style={{ color: '#C83E88' }}>By design.</span>
            </h1>
          </div>

          <div className="h-10 sm:h-14" />

          {/* THE PULSE — life breaks the loop */}
          <div
            className="transition-all duration-[2s] ease-out flex flex-col items-center"
            style={{
              opacity: heroPhase >= 7 ? 1 : 0,
              transform: heroPhase >= 7 ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            <HeartbeatLine visible={heroPhase >= 7} />

            <div className="mt-6">
              <PulseLogo variant="full" color="accent" size="sm" />
            </div>

            <div className="mt-10">
              <button
                onClick={onStartDemo}
                className="group px-10 py-4 rounded-full text-base font-semibold transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: '#C83E88',
                  color: 'white',
                  boxShadow: '0 4px 30px rgba(200,62,136,0.30)',
                }}
              >
                <span className="flex items-center gap-2.5">
                  Experience the demo
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
              <p className="mt-4 text-[11px] tracking-[0.15em] uppercase" style={{ color: '#DDD5CC' }}>
                Interactive walkthrough · 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE TENSION — make the VC feel the problem ═══ */}
      <section ref={tension.ref} className="relative px-6 py-32 sm:py-40">
        <div className="max-w-2xl mx-auto">
          {/* Three truths, one at a time */}
          {[
            { line: '3 hours of texting before a first date.', delay: 0 },
            { line: '53% say the person looked nothing like their photos.', delay: 200 },
            { line: '72% feel zero chemistry when they finally meet.', delay: 400 },
          ].map((item, i) => (
            <p
              key={i}
              className="mb-8 sm:mb-10 transition-all duration-[1.5s] ease-out"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                lineHeight: 1.35,
                color: '#8A7E78',
                opacity: tension.visible ? 1 : 0,
                transform: tension.visible ? 'translateY(0)' : 'translateY(12px)',
                transitionDelay: `${item.delay}ms`,
              }}
            >
              {item.line}
            </p>
          ))}

          {/* The punchline */}
          <p
            className="transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              fontWeight: 400,
              lineHeight: 1.35,
              color: '#2A2528',
              opacity: tension.visible ? 1 : 0,
              transform: tension.visible ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: '700ms',
            }}
          >
            The current model profits from keeping people lonely.
          </p>
        </div>
      </section>

      {/* ═══ THE SHIFT — one line that reframes everything ═══ */}
      <section ref={shift.ref} className="relative px-6 py-32 sm:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2rem, 7vw, 4rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.05,
              color: '#2A2528',
              opacity: shift.visible ? 1 : 0,
              transform: shift.visible ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            What if you knew
            <br />
            <span style={{ color: '#C83E88' }}>in five minutes?</span>
          </h2>

          <div className="h-10" />

          <p
            className="text-sm sm:text-base leading-relaxed max-w-lg mx-auto transition-all duration-[1.8s] ease-out"
            style={{
              color: '#A89E98',
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            Pulse runs live video speed dating sessions. Five people. Five minutes each. Camera on.
            Body language doesn't lie. You know in seconds what takes weeks to discover over text.
          </p>

          <div className="h-10" />

          {/* How it works — three lines, not three cards */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 transition-all duration-[1.8s] ease-out"
            style={{
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '600ms',
            }}
          >
            {[
              { num: '01', text: 'Book a session' },
              { num: '02', text: '5 live video dates' },
              { num: '03', text: 'Mutual matches revealed' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[11px] tracking-wider font-medium" style={{ color: 'rgba(200,62,136,0.6)' }}>{s.num}</span>
                <span className="text-sm tracking-wide" style={{ color: '#8A7E78' }}>{s.text}</span>
              </div>
            ))}
          </div>

          <div className="h-14" />

          {/* Second CTA */}
          <button
            onClick={onStartDemo}
            className="px-8 py-3 rounded-full text-sm tracking-wide transition-all duration-500"
            style={{
              color: '#4A4548',
              border: '1px solid rgba(200,62,136,0.20)',
              background: 'rgba(200,62,136,0.08)',
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '800ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#2A2528'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#4A4548'
            }}
          >
            Try it yourself →
          </button>
        </div>
      </section>

      {/* ═══ THE PROOF — market, after they've felt it ═══ */}
      <section ref={proof.ref} className="relative px-6 py-32 sm:py-40">
        <div className="max-w-4xl mx-auto">

          {/* One line of context */}
          <p
            className="text-center mb-16 sm:mb-20 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#8A7E78',
              opacity: proof.visible ? 1 : 0,
            }}
          >
            Western apps don't fit the culture. Arranged introductions don't fit the generation.
            <br />
            <span style={{ color: '#4A4548' }}>Pulse sits in the gap.</span>
          </p>

          {/* Four numbers — clean, no cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 sm:gap-6">
            <Stat value="$9.6B" label="Global dating market" delay={0} visible={proof.visible} />
            <Stat value="68M" label="Singles in GCC" delay={150} visible={proof.visible} />
            <Stat value="42%" label="Dissatisfied with current apps" delay={300} visible={proof.visible} />
            <Stat value="82%" label="Prefer video-first" delay={450} visible={proof.visible} />
          </div>
        </div>
      </section>

      {/* ═══ THE MODEL — clean, confident, no glass tiles ═══ */}
      <section ref={model.ref} className="relative px-6 py-32 sm:py-40">
        <div className="max-w-2xl mx-auto">

          <h3
            className="text-center mb-16 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#2A2528',
              opacity: model.visible ? 1 : 0,
            }}
          >
            Three revenue streams.
            <br />
            <span style={{ color: '#A89E98' }}>Day one.</span>
          </h3>

          {/* Revenue lines */}
          {[
            { pct: '60%', title: 'Session fees', desc: 'AED 75 per seat. Paid entry means serious people.' },
            { pct: '25%', title: 'Premium membership', desc: 'Priority booking, extended profiles, session replays.' },
            { pct: '15%', title: 'Sponsored moments', desc: 'Brand placements between dates. Captive, engaged audience.' },
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-baseline gap-6 py-6 transition-all duration-[1.5s] ease-out"
              style={{
                borderBottom: '1px solid rgba(42,37,40,0.08)',
                opacity: model.visible ? 1 : 0,
                transform: model.visible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${200 + i * 150}ms`,
              }}
            >
              <span
                className="text-2xl sm:text-3xl font-display shrink-0"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  color: '#C83E88',
                  width: '70px',
                }}
              >
                {r.pct}
              </span>
              <div>
                <p className="text-sm sm:text-base font-medium" style={{ color: '#3A3538' }}>{r.title}</p>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: '#C2B8AE' }}>{r.desc}</p>
              </div>
            </div>
          ))}

          {/* Unit economics — one line */}
          <div
            className="mt-12 text-center transition-all duration-[1.5s] ease-out"
            style={{
              opacity: model.visible ? 1 : 0,
              transitionDelay: '800ms',
            }}
          >
            <div className="inline-flex items-center gap-8 sm:gap-12">
              <div className="text-center">
                <p className="text-2xl font-display" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: '#3A3538' }}>
                  AED 750
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#C2B8AE' }}>Revenue / session</p>
              </div>
              <div style={{ color: '#DDD5CC' }}>→</div>
              <div className="text-center">
                <p className="text-2xl font-display" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, color: '#C83E88' }}>
                  ~89%
                </p>
                <p className="text-[11px] mt-1" style={{ color: '#C2B8AE' }}>Gross margin</p>
              </div>
            </div>
          </div>

          {/* Expansion — one clean line */}
          <div
            className="mt-20 text-center transition-all duration-[1.5s] ease-out"
            style={{
              opacity: model.visible ? 1 : 0,
              transitionDelay: '1000ms',
            }}
          >
            <p className="text-[11px] tracking-[0.25em] uppercase mb-6" style={{ color: '#DDD5CC' }}>
              Expansion
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { city: 'Dubai', when: 'Launch', active: true },
                { city: 'Riyadh', when: 'Q3 2026', active: false },
                { city: 'Doha', when: 'Q4 2026', active: false },
                { city: 'Cairo', when: '2027', active: false },
                { city: 'London', when: '2027', active: false },
              ].map((c, i) => (
                <span
                  key={i}
                  className="text-sm tracking-wide"
                  style={{
                    color: c.active ? 'rgba(200,62,136,0.8)' : '#DDD5CC',
                  }}
                >
                  {c.city} <span className="text-[10px] ml-1" style={{ opacity: 0.6 }}>{c.when}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE CLOSE ═══ */}
      <section ref={close.ref} className="relative px-6 py-32 sm:py-40">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="mb-6 transition-all duration-[2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.05,
              color: '#2A2528',
              opacity: close.visible ? 1 : 0,
              transform: close.visible ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            See it in action.
          </h2>

          <p
            className="text-sm sm:text-base mb-10 transition-all duration-[1.8s] ease-out"
            style={{
              color: '#A89E98',
              opacity: close.visible ? 1 : 0,
              transitionDelay: '300ms',
            }}
          >
            Walk through a complete Pulse session.
            <br />
            From lobby to match reveal. Two minutes.
          </p>

          <button
            onClick={onStartDemo}
            className="group px-10 py-4 rounded-full text-base font-semibold transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: '#C83E88',
              color: 'white',
              boxShadow: '0 4px 30px rgba(200,62,136,0.30)',
              opacity: close.visible ? 1 : 0,
              transitionDelay: '500ms',
            }}
          >
            <span className="flex items-center gap-2.5">
              Launch demo
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid rgba(42,37,40,0.06)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[11px] tracking-wider" style={{ color: '#DDD5CC' }}>
            Pulse · Dubai 2026
          </span>
          <a
            href="mailto:jamal@hakadian.com"
            className="text-[11px] tracking-wider transition-colors duration-500"
            style={{ color: '#DDD5CC' }}
            onMouseEnter={e => e.currentTarget.style.color = '#A89E98'}
            onMouseLeave={e => e.currentTarget.style.color = '#DDD5CC'}
          >
            jamal@hakadian.com
          </a>
        </div>
      </footer>
    </div>
  )
}
