import { useEffect, useState, useRef } from 'react'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onStartDemo: () => void
}

/* ─── Scroll reveal ──────────────────────────────────────── */
function useReveal(threshold = 0.18) {
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

/* ─── Animated heartbeat ─────────────────────────────────── */
function HeartbeatLine({ visible, width = 160 }: { visible: boolean; width?: number }) {
  return (
    <svg width={width} height="28" viewBox="0 0 160 28" fill="none"
      className="transition-opacity duration-[2.5s]"
      style={{ opacity: visible ? 0.5 : 0 }}
    >
      <path
        d="M0 14h50l6-12 6 24 6-24 6 12h86"
        stroke="#C83E88" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="220" strokeDashoffset={visible ? '0' : '220'}
        style={{ transition: 'stroke-dashoffset 2.5s ease-out' }}
      />
    </svg>
  )
}

/* ─── Typewriter cursor ──────────────────────────────────── */
function Cursor({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <span
      className="inline-block ml-1"
      style={{
        width: '3px', height: '1.1em', background: '#C83E88',
        animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom',
      }}
    />
  )
}

const serif = "'Cormorant Garamond', Georgia, serif"
const sans = "'DM Sans', sans-serif"

/* ═══════════════════════════════════════════════════════════════
   MARKETING / INVESTOR DEMO PAGE

   Structure (Jobs keynote method):
   1. THE LOOP     → mechanical, suffocating, broken
   2. THE TURN     → one number reframes everything
   3. THE TENSION  → make them feel why it's broken
   4. THE SHIFT    → what if there's another way
   5. THE PROOF    → the market is ready
   6. THE MODEL    → how it makes money
   7. THE CLOSE    → experience it yourself
   ═══════════════════════════════════════════════════════════════ */
export default function MarketingPage({ onStartDemo }: Props) {
  const [heroPhase, setHeroPhase] = useState(0)
  const tension1 = useReveal(0.4)
  const tension2 = useReveal(0.4)
  const tension3 = useReveal(0.4)
  const tensionPunch = useReveal(0.3)
  const shift = useReveal(0.25)
  const proof = useReveal(0.2)
  const model = useReveal(0.2)
  const expansion = useReveal(0.2)
  const close = useReveal(0.25)

  /* Hero timing — each word SLAMS in, then dissolves, then the turn */
  useEffect(() => {
    const timers = [
      setTimeout(() => setHeroPhase(1), 500),    // "Swipe."
      setTimeout(() => setHeroPhase(2), 1100),   // "Match."
      setTimeout(() => setHeroPhase(3), 1700),   // "Text."
      setTimeout(() => setHeroPhase(4), 2300),   // "Ghost."
      setTimeout(() => setHeroPhase(5), 3200),   // words fade
      setTimeout(() => setHeroPhase(6), 4200),   // "$9.6 billion."
      setTimeout(() => setHeroPhase(7), 5800),   // "By design."
      setTimeout(() => setHeroPhase(8), 7200),   // Heartbeat + PULSE + CTA
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const loopWords = ['Swipe.', 'Match.', 'Text.', 'Ghost.']
  const currentWord = heroPhase >= 1 && heroPhase <= 4 ? heroPhase - 1 : -1

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(170deg, #FAF7F2 0%, #F2EDE6 40%, #FAF7F2 100%)' }}
    >
      {/* ─── Blink keyframe ─── */}
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>

      {/* ─── Ambient glow ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '1200px', height: '800px',
            background: 'radial-gradient(ellipse, rgba(200,62,136,0.05) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* ═══ HERO — The Loop, The Turn ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-4xl w-full">

          {/* THE LOOP — one word at a time, typewriter, mechanical */}
          <div
            className="transition-all duration-[1.5s] ease-out"
            style={{
              opacity: heroPhase >= 5 ? 0 : 1,
              transform: heroPhase >= 5 ? 'translateY(-30px) scale(0.95)' : 'translateY(0)',
              position: heroPhase >= 6 ? 'absolute' : 'relative',
              pointerEvents: heroPhase >= 5 ? 'none' : 'auto',
            }}
          >
            <div className="flex flex-wrap justify-center gap-x-5 sm:gap-x-8 md:gap-x-10">
              {loopWords.map((word, i) => (
                <span
                  key={word}
                  className="transition-all duration-500 ease-out"
                  style={{
                    fontFamily: sans,
                    fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                    fontWeight: 400,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: heroPhase >= (i + 1) ? '#6B635E' : 'transparent',
                    transform: heroPhase >= (i + 1) ? 'translateY(0)' : 'translateY(8px)',
                  }}
                >
                  {word}
                  <Cursor visible={currentWord === i} />
                </span>
              ))}
            </div>
          </div>

          {/* THE TURN — the number that reframes everything */}
          <div
            className="transition-all duration-[2.5s] ease-out"
            style={{
              opacity: heroPhase >= 6 ? 1 : 0,
              transform: heroPhase >= 6 ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            <h1
              style={{
                fontFamily: serif,
                fontSize: 'clamp(3.2rem, 9vw, 6.5rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                lineHeight: 1,
                color: '#2A2528',
              }}
            >
              $9.6 billion.
            </h1>

            <div
              className="transition-all duration-[2s] ease-out"
              style={{
                opacity: heroPhase >= 7 ? 1 : 0,
                transform: heroPhase >= 7 ? 'translateY(0)' : 'translateY(12px)',
                transitionDelay: '0ms',
              }}
            >
              <h1
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(3.2rem, 9vw, 6.5rem)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  lineHeight: 1,
                  color: '#C83E88',
                  marginTop: '0.1em',
                }}
              >
                By design.
              </h1>
            </div>
          </div>

          <div className="h-10 sm:h-14" />

          {/* THE PULSE — life breaks the loop */}
          <div
            className="transition-all duration-[2s] ease-out flex flex-col items-center"
            style={{
              opacity: heroPhase >= 8 ? 1 : 0,
              transform: heroPhase >= 8 ? 'translateY(0)' : 'translateY(14px)',
            }}
          >
            <HeartbeatLine visible={heroPhase >= 8} />

            <div className="mt-8">
              <PulseLogo variant="full" color="accent" size="sm" />
            </div>

            <div className="mt-12">
              <button
                onClick={onStartDemo}
                className="group px-12 py-5 rounded-full transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: '#C83E88',
                  color: 'white',
                  fontFamily: sans,
                  fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  boxShadow: '0 6px 40px rgba(200,62,136,0.30)',
                }}
              >
                <span className="flex items-center gap-3">
                  Experience the demo
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </button>
              <p className="mt-5" style={{
                fontFamily: sans, fontSize: '0.85rem',
                letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C2B8AE',
              }}>
                Interactive walkthrough · 2 minutes
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ═══ THE TENSION — one truth per screen. Let each one land. ═══ */}

      {/* Truth 1 */}
      <section ref={tension1.ref} className="relative px-6 py-28 sm:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 600,
              color: '#C83E88',
              lineHeight: 1,
              opacity: tension1.visible ? 1 : 0,
              transform: tension1.visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
            }}
          >
            3 hours.
          </p>
          <p
            className="mt-5 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#8A7E78',
              lineHeight: 1.4,
              opacity: tension1.visible ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            Average time spent texting before a first date.
          </p>
        </div>
      </section>

      {/* Truth 2 */}
      <section ref={tension2.ref} className="relative px-6 py-28 sm:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 600,
              color: '#C83E88',
              lineHeight: 1,
              opacity: tension2.visible ? 1 : 0,
              transform: tension2.visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
            }}
          >
            53%
          </p>
          <p
            className="mt-5 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#8A7E78',
              lineHeight: 1.4,
              opacity: tension2.visible ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            say the person looked nothing like their photos.
          </p>
        </div>
      </section>

      {/* Truth 3 */}
      <section ref={tension3.ref} className="relative px-6 py-28 sm:py-36">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.8rem, 7vw, 5rem)',
              fontWeight: 600,
              color: '#C83E88',
              lineHeight: 1,
              opacity: tension3.visible ? 1 : 0,
              transform: tension3.visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
            }}
          >
            72%
          </p>
          <p
            className="mt-5 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.3rem, 3.5vw, 2rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#8A7E78',
              lineHeight: 1.4,
              opacity: tension3.visible ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            feel zero chemistry when they finally meet.
          </p>
        </div>
      </section>

      {/* The punchline */}
      <section ref={tensionPunch.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="transition-all duration-[2.5s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
              fontWeight: 400,
              lineHeight: 1.15,
              color: '#2A2528',
              opacity: tensionPunch.visible ? 1 : 0,
              transform: tensionPunch.visible ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            The current model profits
            <br />
            from keeping people lonely.
          </p>
        </div>
      </section>


      {/* ═══ THE SHIFT — what if there's another way ═══ */}
      <section ref={shift.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.6rem, 8vw, 5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.05,
              color: '#2A2528',
              opacity: shift.visible ? 1 : 0,
              transform: shift.visible ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            What if you knew
            <br />
            <span style={{ color: '#C83E88' }}>in five minutes?</span>
          </h2>

          <div className="h-10 sm:h-14" />

          <p
            className="leading-relaxed max-w-xl mx-auto transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: sans,
              fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)',
              color: '#8A7E78',
              lineHeight: 1.7,
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '500ms',
            }}
          >
            Pulse runs live video speed dating sessions. Five people.
            Five minutes each. Camera on. Body language doesn't lie.
            You know in seconds what takes weeks to discover over text.
          </p>

          <div className="h-12 sm:h-16" />

          {/* How it works — three steps, clean and large */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-14 transition-all duration-[1.8s] ease-out"
            style={{
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '800ms',
            }}
          >
            {[
              { num: '01', text: 'Book a session' },
              { num: '02', text: '5 live video dates' },
              { num: '03', text: 'Mutual matches revealed' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  style={{
                    fontFamily: sans, fontSize: '0.9rem',
                    letterSpacing: '0.1em', fontWeight: 500, color: '#C83E88',
                  }}
                >
                  {s.num}
                </span>
                <span
                  style={{
                    fontFamily: sans, fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                    letterSpacing: '0.03em', color: '#6B635E',
                  }}
                >
                  {s.text}
                </span>
              </div>
            ))}
          </div>

          <div className="h-14 sm:h-20" />

          <button
            onClick={onStartDemo}
            className="px-10 py-4 rounded-full transition-all duration-500 hover:scale-[1.02]"
            style={{
              color: '#3A3538',
              fontFamily: sans,
              fontSize: 'clamp(1rem, 2vw, 1.1rem)',
              fontWeight: 500,
              letterSpacing: '0.03em',
              border: '1.5px solid rgba(200,62,136,0.25)',
              background: 'rgba(200,62,136,0.06)',
              opacity: shift.visible ? 1 : 0,
              transitionDelay: '1000ms',
            }}
          >
            Try it yourself →
          </button>
        </div>
      </section>


      {/* ═══ THE PROOF — global market, massive opportunity ═══ */}
      <section ref={proof.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-4xl mx-auto">

          <p
            className="text-center mb-16 sm:mb-24 transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#6B635E',
              lineHeight: 1.3,
              opacity: proof.visible ? 1 : 0,
            }}
          >
            A $9.6 billion industry where 79% of users are burned out.
            <br />
            <span style={{ color: '#2A2528', fontWeight: 400 }}>
              That's not a market. That's a correction waiting to happen.
            </span>
          </p>

          {/* Four global numbers — big, clean */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 sm:gap-8">
            {[
              { value: '$9.6B', label: 'Global dating market' },
              { value: '380M+', label: 'People on dating apps worldwide' },
              { value: '79%', label: 'Report dating app burnout' },
              { value: '82%', label: 'Want video-first dating' },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center transition-all duration-[1.8s] ease-out"
                style={{
                  opacity: proof.visible ? 1 : 0,
                  transform: proof.visible ? 'translateY(0)' : 'translateY(18px)',
                  transitionDelay: `${i * 180}ms`,
                }}
              >
                <p
                  style={{
                    fontFamily: serif,
                    fontSize: 'clamp(2.6rem, 6vw, 4.2rem)',
                    fontWeight: 600,
                    color: '#C83E88',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </p>
                <p className="mt-3" style={{
                  fontFamily: sans,
                  fontSize: 'clamp(0.85rem, 1.8vw, 1rem)',
                  color: '#8A7E78',
                  letterSpacing: '0.02em',
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ THE MODEL — how it makes money ═══ */}
      <section ref={model.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-2xl mx-auto">

          <div className="text-center mb-16 sm:mb-20">
            <h3
              className="transition-all duration-[2s] ease-out"
              style={{
                fontFamily: serif,
                fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: '#2A2528',
                lineHeight: 1.1,
                opacity: model.visible ? 1 : 0,
              }}
            >
              Women join free.
              <br />
              <span style={{ color: '#C83E88', fontWeight: 400 }}>Men pay to show up.</span>
            </h3>
            <p
              className="mt-6 max-w-lg mx-auto transition-all duration-[1.8s] ease-out"
              style={{
                fontFamily: sans,
                fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
                color: '#8A7E78',
                lineHeight: 1.7,
                opacity: model.visible ? 1 : 0,
                transitionDelay: '300ms',
              }}
            >
              Every two-sided marketplace has a scarce side.
              In dating, it's women. Subsidize supply. Monetize demand.
            </p>
          </div>

          {/* Three revenue engines */}
          {[
            {
              label: 'SESSION REVENUE',
              title: 'Spark — AED 75 per session',
              desc: 'The gateway. Paid entry means every person at the table wants to be there. No tourists.',
              accent: true,
            },
            {
              label: 'SUBSCRIPTIONS',
              title: 'Ignite — AED 249 per month',
              desc: 'Unlimited sessions. 24h date replays. Second Chances. The features that matter most — available only after the emotion hits.',
              accent: false,
            },
            {
              label: 'MICROTRANSACTIONS',
              title: 'Impulse purchases at peak emotion',
              desc: 'Time extensions when chemistry sparks. Second Chances at the moment of maximum regret. Profile boosts before high-demand sessions.',
              accent: false,
            },
          ].map((r, i) => (
            <div
              key={i}
              className="py-8 transition-all duration-[1.5s] ease-out"
              style={{
                borderBottom: '1px solid rgba(42,37,40,0.08)',
                opacity: model.visible ? 1 : 0,
                transform: model.visible ? 'translateY(0)' : 'translateY(12px)',
                transitionDelay: `${500 + i * 200}ms`,
              }}
            >
              <p style={{
                fontFamily: sans, fontSize: '0.85rem',
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#C83E88', fontWeight: 500, marginBottom: '10px',
              }}>
                {r.label}
              </p>
              <p style={{
                fontFamily: serif,
                fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                fontWeight: 500, color: '#2A2528', lineHeight: 1.3,
              }}>
                {r.title}
              </p>
              <p className="mt-2" style={{
                fontFamily: sans,
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                color: '#8A7E78', lineHeight: 1.6,
              }}>
                {r.desc}
              </p>
            </div>
          ))}

          {/* Unit economics — the headline */}
          <div
            className="mt-16 text-center transition-all duration-[2s] ease-out"
            style={{
              opacity: model.visible ? 1 : 0,
              transitionDelay: '1200ms',
            }}
          >
            <div className="inline-flex items-center gap-10 sm:gap-16">
              <div className="text-center">
                <p style={{
                  fontFamily: serif,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 600, color: '#2A2528',
                }}>
                  AED 375+
                </p>
                <p className="mt-2" style={{
                  fontFamily: sans, fontSize: '0.95rem', color: '#8A7E78',
                }}>
                  Revenue per session
                </p>
              </div>
              <div style={{ color: '#C2B8AE', fontSize: '1.5rem' }}>→</div>
              <div className="text-center">
                <p style={{
                  fontFamily: serif,
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  fontWeight: 600, color: '#C83E88',
                }}>
                  ~92%
                </p>
                <p className="mt-2" style={{
                  fontFamily: sans, fontSize: '0.95rem', color: '#8A7E78',
                }}>
                  Gross margin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══ THE EXPANSION — UAE is the launchpad, not the ceiling ═══ */}
      <section ref={expansion.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-3xl mx-auto text-center">

          <h3
            className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              color: '#2A2528',
              lineHeight: 1.1,
              opacity: expansion.visible ? 1 : 0,
            }}
          >
            We start in Dubai.
            <br />
            <span style={{ color: '#C83E88', fontWeight: 400 }}>We don't stay there.</span>
          </h3>

          <p
            className="mt-8 max-w-xl mx-auto transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: sans,
              fontSize: 'clamp(1rem, 2.2vw, 1.15rem)',
              color: '#8A7E78', lineHeight: 1.7,
              opacity: expansion.visible ? 1 : 0,
              transitionDelay: '400ms',
            }}
          >
            Every city with a nightlife scene is a Pulse market.
            Dubai is our proving ground — 200+ nationalities,
            the world's dating culture compressed into one city.
          </p>

          {/* Expansion visual — concentric rings from Dubai outward */}
          <div
            className="mt-16 transition-all duration-[2s] ease-out"
            style={{
              opacity: expansion.visible ? 1 : 0,
              transitionDelay: '700ms',
            }}
          >
            {/* Timeline-style expansion */}
            <div className="flex flex-col items-center gap-0">
              {[
                { phase: '2026', label: 'Launch', cities: 'Dubai', active: true },
                { phase: '2027', label: 'GCC', cities: 'Riyadh · Doha · Kuwait City', active: false },
                { phase: '2028', label: 'MENA + Europe', cities: 'Cairo · London · Istanbul', active: false },
                { phase: '2029', label: 'Global', cities: 'New York · Singapore · São Paulo · more', active: false },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-6 sm:gap-10 w-full max-w-md py-5"
                  style={{
                    borderBottom: i < 3 ? '1px solid rgba(42,37,40,0.06)' : 'none',
                    opacity: expansion.visible ? 1 : 0,
                    transform: expansion.visible ? 'translateX(0)' : 'translateX(-16px)',
                    transition: 'all 1.5s ease-out',
                    transitionDelay: `${800 + i * 200}ms`,
                  }}
                >
                  <div className="shrink-0 w-16 text-right">
                    <p style={{
                      fontFamily: serif,
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: row.active ? '#C83E88' : '#C2B8AE',
                    }}>
                      {row.phase}
                    </p>
                  </div>
                  <div className="relative flex items-center">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        background: row.active ? '#C83E88' : 'rgba(200,62,136,0.2)',
                        boxShadow: row.active ? '0 0 12px rgba(200,62,136,0.4)' : 'none',
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <p style={{
                      fontFamily: sans,
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: row.active ? '#C83E88' : '#8A7E78',
                    }}>
                      {row.label}
                    </p>
                    <p style={{
                      fontFamily: sans,
                      fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                      color: row.active ? '#2A2528' : '#A89E98',
                      marginTop: '2px',
                    }}>
                      {row.cities}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p
            className="mt-12 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              fontStyle: 'italic',
              color: '#2A2528',
              opacity: expansion.visible ? 1 : 0,
              transitionDelay: '1600ms',
            }}
          >
            Loneliness is not a regional problem. It's a global one.
            <br />
            <span style={{ color: '#C83E88' }}>Pulse is the fix.</span>
          </p>
        </div>
      </section>


      {/* ═══ THE CLOSE ═══ */}
      <section ref={close.ref} className="relative px-6 py-32 sm:py-44">
        <div className="max-w-2xl mx-auto text-center">

          <div className="flex justify-center mb-10">
            <HeartbeatLine visible={close.visible} />
          </div>

          <h2
            className="mb-8 transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(2.4rem, 7vw, 4.2rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 1.05,
              color: '#2A2528',
              opacity: close.visible ? 1 : 0,
              transform: close.visible ? 'translateY(0)' : 'translateY(14px)',
            }}
          >
            See it in action.
          </h2>

          <p
            className="mb-12 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: sans,
              fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)',
              color: '#8A7E78',
              lineHeight: 1.7,
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
            className="group px-12 py-5 rounded-full transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: '#C83E88',
              color: 'white',
              fontFamily: sans,
              fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
              fontWeight: 600,
              boxShadow: '0 6px 40px rgba(200,62,136,0.30)',
              opacity: close.visible ? 1 : 0,
              transitionDelay: '500ms',
            }}
          >
            <span className="flex items-center gap-3">
              Launch demo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        </div>
      </section>


      {/* ═══ FOOTER ═══ */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(42,37,40,0.06)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: sans, fontSize: '0.85rem', letterSpacing: '0.08em', color: '#C2B8AE' }}>
            Pulse · 2026
          </span>
          <a
            href="mailto:jamal@hakadian.com"
            className="transition-colors duration-500"
            style={{ fontFamily: sans, fontSize: '0.85rem', letterSpacing: '0.06em', color: '#C2B8AE' }}
            onMouseEnter={e => e.currentTarget.style.color = '#8A7E78'}
            onMouseLeave={e => e.currentTarget.style.color = '#C2B8AE'}
          >
            jamal@hakadian.com
          </a>
        </div>
      </footer>
    </div>
  )
}
