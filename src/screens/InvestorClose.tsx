import { useEffect, useState, useRef } from 'react'
import { candidates, photos } from '../data/people'

interface Props {
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
}

/* ═══════════════════════════════════════════════════════════════
   INVESTOR CLOSE — The Steve Jobs Keynote

   Structure (5 acts, like a Jobs keynote):
   1. THE DEMO PROOF   — "That was one session." Dashboard.
   2. THE COLLAPSE      — The industry is dying. Feel it.
   3. THE VALIDATION    — Tinder just copied our thesis.
   4. THE ECONOMICS     — One clean block. Undeniable.
   5. THE ASK           — Not a pitch. An invitation.

   Rules:
   - ONE number per moment. Let it land.
   - Short sentences. Silence between them.
   - Never explain what they can feel.
   - The audience should be reaching for their checkbook
     before the ask appears.
   ═══════════════════════════════════════════════════════════════ */

/* ── Scroll reveal hook ────────────────────────────────── */
function useReveal(threshold = 0.25) {
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

/* ── Heartbeat SVG ─────────────────────────────────────── */
function HeartbeatLine({ visible }: { visible: boolean }) {
  return (
    <svg width="80" height="16" viewBox="0 0 100 20" fill="none"
      className="transition-opacity duration-[2s]"
      style={{ opacity: visible ? 0.3 : 0 }}>
      <path d="M0 10h30l4-8 4 16 4-16 4 8h54"
        stroke="#C83E88" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="160" strokeDashoffset={visible ? '0' : '160'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }} />
    </svg>
  )
}

/* ── Simulated match data ──────────────────────────────── */
const theirRatings: Record<string, 'like' | 'pass'> = {
  Sofia: 'like', Layla: 'pass', Amira: 'like', Nour: 'like', Yasmine: 'pass',
}
const pastSessions = [
  { date: 'Mar 20', matches: 2, dates: 5 },
  { date: 'Mar 13', matches: 1, dates: 5 },
  { date: 'Mar 6', matches: 3, dates: 5 },
]

export default function InvestorClose({ ratings, onRestart }: Props) {
  const [phase, setPhase] = useState(0)
  const collapse = useReveal(0.3)
  const validation = useReveal(0.3)
  const failures = useReveal(0.2)
  const economics = useReveal(0.3)
  const ask = useReveal(0.3)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const matches = candidates.filter(c =>
    ratings[c.name] === 'like' && theirRatings[c.name] === 'like'
  )

  const serif = "'Cormorant Garamond', Georgia, serif"
  const sans = "'DM Sans', sans-serif"

  return (
    <div className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(170deg, #FAF7F2 0%, #F2EDE6 40%, #FAF7F2 100%)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(200,62,136,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          ACT 1: THE DEMO PROOF
          "That was one session."
          ═══════════════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-8 px-6 text-center">
        <p className="transition-all duration-[2s] ease-out"
          style={{
            fontFamily: serif, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 300, fontStyle: 'italic', color: '#2A2528',
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          }}>
          That was <span style={{ color: '#C83E88' }}>one session</span>.
        </p>
        <p className="mt-3 transition-all duration-[2s] ease-out"
          style={{
            fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78',
            letterSpacing: '0.08em',
            opacity: phase >= 2 ? 1 : 0,
          }}>
          Here's what the user sees after.
        </p>
      </section>

      {/* ── User Dashboard ── */}
      <section className="relative px-4 sm:px-6 pb-16">
        <div className="max-w-md mx-auto rounded-2xl overflow-hidden transition-all duration-[2s] ease-out"
          style={{
            background: 'rgba(42,37,40,0.02)', border: '1px solid rgba(42,37,40,0.06)',
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          }}>
          {/* Profile header */}
          <div className="p-6 pb-4 flex items-center gap-4">
            <div className="relative">
              <img src={photos.user} alt="Profile" className="w-16 h-16 rounded-full object-cover"
                style={{ border: '2px solid rgba(200,62,136,0.4)' }} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: '#30D158' }}>✓</div>
            </div>
            <div>
              <p style={{ fontFamily: serif, fontSize: '1.3rem', fontWeight: 600, color: '#2A2528' }}>Omar, 30</p>
              <p style={{ fontFamily: sans, fontSize: '0.75rem', color: '#8A7E78' }}>Dubai Marina · Joined Mar 2026</p>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 flex justify-between" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
            {[
              { value: '4', label: 'Sessions' },
              { value: '6', label: 'Matches' },
              { value: '20', label: 'Dates' },
              { value: '30%', label: 'Match rate' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: serif, fontSize: '1.3rem', fontWeight: 600, color: '#C83E88' }}>{s.value}</p>
                <p style={{ fontFamily: sans, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A7E78' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tonight's matches */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
            <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E78', marginBottom: '12px' }}>
              Tonight's matches
            </p>
            <div className="flex gap-3">
              {(matches.length > 0 ? matches : [{name: 'Sofia', photo: photos.sofia}, {name: 'Amira', photo: photos.amira}]).map(m => (
                <div key={m.name} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover"
                      style={{ border: '2px solid rgba(200,62,136,0.5)' }} />
                    <div className="absolute -top-1 -right-1 text-[10px]">💗</div>
                  </div>
                  <p style={{ fontFamily: sans, fontSize: '0.7rem', color: '#2A2528' }}>{m.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
            <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E78', marginBottom: '12px' }}>
              Session history
            </p>
            {pastSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < pastSessions.length - 1 ? '1px solid rgba(42,37,40,0.06)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: 'rgba(200,62,136,0.12)', color: '#C83E88', fontFamily: sans }}>{s.matches}</div>
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '0.8rem', color: '#2A2528' }}>
                      {s.matches} match{s.matches !== 1 ? 'es' : ''} from {s.dates} dates
                    </p>
                    <p style={{ fontFamily: sans, fontSize: '0.65rem', color: '#8A7E78' }}>{s.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next session */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E78' }}>Next session</p>
                <p className="mt-1" style={{ fontFamily: serif, fontSize: '1.1rem', fontWeight: 500, color: '#2A2528' }}>Thursday · 9 PM</p>
                <p style={{ fontFamily: sans, fontSize: '0.7rem', color: '#8A7E78' }}>3 spots left</p>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-medium"
                style={{ background: 'rgba(200,62,136,0.15)', color: '#C83E88', fontFamily: sans }}>Booked ✓</div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 2: THE COLLAPSE
          One number at a time. Let each one land.
          ═══════════════════════════════════════════════════════ */}
      <section ref={collapse.ref} className="relative px-6 py-20 sm:py-28">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center mb-12">
            <HeartbeatLine visible={collapse.visible} />
          </div>

          {/* The opening line — like Jobs: "There's a problem." */}
          <p className="text-center transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#C83E88',
              opacity: collapse.visible ? 1 : 0,
              transform: collapse.visible ? 'translateY(0)' : 'translateY(10px)',
            }}>
            The industry they built
          </p>

          {/* THE STAT — $6.2 billion */}
          <p className="text-center mt-6 transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              fontWeight: 600, color: '#2A2528', lineHeight: 1,
              opacity: collapse.visible ? 1 : 0,
              transform: collapse.visible ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: '300ms',
            }}>
            $6.2 billion.
          </p>
          <p className="text-center mt-3 transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78',
              opacity: collapse.visible ? 1 : 0,
              transitionDelay: '600ms',
            }}>
            That's what the dating industry earned last year.
          </p>

          {/* The twist */}
          <p className="text-center mt-2 transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: serif, fontSize: '1.15rem', fontStyle: 'italic',
              fontWeight: 400, color: '#2A2528',
              opacity: collapse.visible ? 1 : 0,
              transitionDelay: '1000ms',
            }}>
            By keeping people lonely.
          </p>

          {/* The evidence — three collapse signals */}
          <div className="mt-16 space-y-8">
            {[
              {
                stat: '79%',
                line: 'of users report dating app burnout.',
                sub: 'Not dissatisfied. Burned out.',
                delay: 1400,
              },
              {
                stat: '$75 → $5',
                line: 'Bumble\u2019s stock price. In 18 months.',
                sub: 'CEO resigned. Paying users down 16%. Revenue declining 10% year over year.',
                delay: 1800,
              },
              {
                stat: '88%',
                line: 'consistently disappointed with their matches.',
                sub: 'The swipe model isn\u2019t broken. It was never designed to work.',
                delay: 2200,
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 items-start transition-all duration-[1.5s] ease-out"
                style={{
                  opacity: collapse.visible ? 1 : 0,
                  transform: collapse.visible ? 'translateY(0)' : 'translateY(12px)',
                  transitionDelay: `${item.delay}ms`,
                }}>
                <span className="shrink-0 text-right" style={{
                  fontFamily: serif, fontSize: '1.8rem', fontWeight: 600,
                  color: '#C83E88', minWidth: '80px', lineHeight: 1.1,
                }}>
                  {item.stat}
                </span>
                <div>
                  <p style={{ fontFamily: sans, fontSize: '0.9rem', color: '#2A2528', lineHeight: 1.5 }}>
                    {item.line}
                  </p>
                  <p className="mt-1" style={{ fontFamily: sans, fontSize: '0.75rem', color: '#8A7E78', lineHeight: 1.5 }}>
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 3: THE VALIDATION
          "And then the market leader proved us right."
          This is the killer moment. One fact.
          ═══════════════════════════════════════════════════════ */}
      <section ref={validation.ref} className="relative px-6 py-20 sm:py-28">
        <div className="max-w-xl mx-auto text-center">
          <p className="transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.4rem, 3.5vw, 2rem)',
              fontWeight: 300, fontStyle: 'italic',
              lineHeight: 1.3, color: '#2A2528',
              opacity: validation.visible ? 1 : 0,
              transform: validation.visible ? 'translateY(0)' : 'translateY(16px)',
            }}>
            In March 2026, Tinder launched{' '}
            <span style={{ color: '#C83E88', fontWeight: 500 }}>video speed dating</span>.
          </p>

          <p className="mt-5 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78', lineHeight: 1.6,
              opacity: validation.visible ? 1 : 0,
              transitionDelay: '600ms',
            }}>
            When the market leader pivots toward your model,
            you're not early — you're right.
          </p>

          <p className="mt-4 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.85rem', color: '#2A2528', lineHeight: 1.6,
              opacity: validation.visible ? 1 : 0,
              transitionDelay: '1000ms',
            }}>
            But they're bolting video onto a swipe-first architecture.
          </p>

          <p className="mt-2 transition-all duration-[1.8s] ease-out"
            style={{
              fontFamily: serif, fontSize: '1.2rem', fontWeight: 500, color: '#C83E88',
              opacity: validation.visible ? 1 : 0,
              transitionDelay: '1400ms',
            }}>
            Pulse is video-native from the ground up.
          </p>

          <p className="mt-1 transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.75rem', color: '#A89E98',
              opacity: validation.visible ? 1 : 0,
              transitionDelay: '1800ms',
            }}>
            That's the difference between a feature and a platform.
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 3.5: THE FIVE FAILURES
          Why the swipe model can't be fixed.
          Pulse solves all five simultaneously.
          ═══════════════════════════════════════════════════════ */}
      <section ref={failures.ref} className="relative px-6 py-16 sm:py-24">
        <div className="max-w-lg mx-auto">
          <p className="text-center mb-12 transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#C83E88',
              opacity: failures.visible ? 1 : 0,
            }}>
            Five failures. One fix.
          </p>

          <div className="space-y-6">
            {[
              { failure: 'Swipe fatigue', fix: 'Finite sessions — 5 people, not 5,000', delay: 200 },
              { failure: 'Ghosting epidemic', fix: 'Live video — presence, not promises', delay: 400 },
              { failure: 'The photo gap', fix: 'Camera on — what you see is what you get', delay: 600 },
              { failure: 'Low-effort matches', fix: 'Paid entry — everyone at the table chose to be there', delay: 800 },
              { failure: 'Paradox of choice', fix: 'Constrained discovery — depth over volume', delay: 1000 },
            ].map((item, i) => (
              <div key={i}
                className="flex items-start gap-4 transition-all duration-[1.5s] ease-out"
                style={{
                  opacity: failures.visible ? 1 : 0,
                  transform: failures.visible ? 'translateX(0)' : 'translateX(-12px)',
                  transitionDelay: `${item.delay}ms`,
                }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(200,62,136,0.1)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C83E88]" />
                </div>
                <div>
                  <p style={{ fontFamily: sans, fontSize: '0.85rem', color: '#2A2528' }}>
                    <span style={{ textDecoration: 'line-through', color: '#C2B8AE' }}>{item.failure}</span>
                  </p>
                  <p className="mt-0.5" style={{ fontFamily: sans, fontSize: '0.8rem', color: '#8A7E78' }}>
                    {item.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center mt-12 transition-all duration-[1.5s] ease-out"
            style={{
              fontFamily: serif, fontSize: '1.05rem', fontStyle: 'italic',
              color: '#2A2528',
              opacity: failures.visible ? 1 : 0,
              transitionDelay: '1400ms',
            }}>
            Pulse doesn't fix swiping. It replaces it.
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 3.75: THE GCC — Why here. Why now.
          ═══════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-16 sm:py-20">
        <div className="max-w-lg mx-auto text-center">
          <p style={{
            fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#C83E88', marginBottom: '24px',
          }}>
            The launch market
          </p>

          <p style={{
            fontFamily: serif, fontSize: 'clamp(1.3rem, 3.5vw, 1.8rem)',
            fontWeight: 400, color: '#2A2528', lineHeight: 1.3,
          }}>
            Western apps don't fit the culture.
            <br />
            Arranged introductions don't fit the generation.
          </p>
          <p className="mt-2" style={{
            fontFamily: serif, fontSize: '1.1rem', fontWeight: 500, color: '#C83E88',
          }}>
            Pulse sits in the gap.
          </p>

          {/* GCC stats — horizontal, clean */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '130%', label: 'Download growth since 2021' },
              { value: '2x', label: 'Engagement vs. global average' },
              { value: '64M+', label: 'Smartphone users across GCC' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p style={{ fontFamily: serif, fontSize: '1.6rem', fontWeight: 600, color: '#C83E88', lineHeight: 1 }}>{s.value}</p>
                <p className="mt-2" style={{ fontFamily: sans, fontSize: '0.6rem', color: '#8A7E78', lineHeight: 1.4 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-8" style={{ fontFamily: sans, fontSize: '0.75rem', color: '#A89E98', letterSpacing: '0.06em' }}>
            Dubai → Riyadh → Doha → Cairo → London
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 4: THE ECONOMICS
          Simple. Clean. Undeniable.
          ═══════════════════════════════════════════════════════ */}
      <section ref={economics.ref} className="relative px-6 py-20 sm:py-28">
        <div className="max-w-lg mx-auto">
          <div className="transition-all duration-[2s] ease-out"
            style={{
              opacity: economics.visible ? 1 : 0,
              transform: economics.visible ? 'translateY(0)' : 'translateY(16px)',
            }}>
            <p className="text-center" style={{
              fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: '#C83E88',
            }}>
              Unit economics
            </p>

            <p className="text-center mt-6" style={{
              fontFamily: serif, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)',
              fontWeight: 600, color: '#2A2528',
            }}>
              AED 750
            </p>
            <p className="text-center" style={{ fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78' }}>
              Revenue per session · 10 seats × AED 75
            </p>
            <p className="text-center mt-1" style={{ fontFamily: serif, fontSize: '1rem', color: '#C83E88' }}>
              ~89% gross margin.
            </p>

            {/* Revenue mix */}
            <div className="mt-12 space-y-5">
              {[
                { pct: '60%', label: 'Session fees', sub: 'AED 75 per seat — people pay to show up' },
                { pct: '25%', label: 'Premium membership', sub: 'Priority booking, replays, second chances' },
                { pct: '15%', label: 'Sponsored moments', sub: 'Premium brands between dates — you just experienced them' },
              ].map(r => (
                <div key={r.label} className="flex items-baseline gap-4"
                  style={{ borderBottom: '1px solid rgba(42,37,40,0.06)', paddingBottom: '16px' }}>
                  <span style={{ fontFamily: serif, fontSize: '1.4rem', fontWeight: 600, color: '#C83E88', minWidth: '48px' }}>
                    {r.pct}
                  </span>
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '0.85rem', color: '#2A2528' }}>{r.label}</p>
                    <p style={{ fontFamily: sans, fontSize: '0.7rem', color: '#8A7E78' }}>{r.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* The flywheel — one sentence */}
            <p className="mt-10 text-center" style={{
              fontFamily: serif, fontSize: '1rem', fontStyle: 'italic',
              color: '#2A2528', lineHeight: 1.5,
            }}>
              Every session generates organic, emotionally charged,
              inherently shareable video content.
              <br />
              <span style={{ color: '#8A7E78', fontSize: '0.85rem' }}>
                The marketing budget is the product itself.
              </span>
            </p>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          ACT 5: THE ASK
          Not a pitch. An allocation.
          Scarcity. Conviction. Checkbook.
          ═══════════════════════════════════════════════════════ */}
      <section ref={ask.ref} className="relative px-6 pt-16 pb-32 sm:pt-24 sm:pb-40">
        <div className="max-w-xl mx-auto text-center">
          <div className="transition-all duration-[2s] ease-out"
            style={{
              opacity: ask.visible ? 1 : 0,
              transform: ask.visible ? 'translateY(0)' : 'translateY(16px)',
            }}>
            <div className="flex justify-center mb-8">
              <HeartbeatLine visible={ask.visible} />
            </div>

            <p style={{
              fontFamily: serif,
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              fontWeight: 300, fontStyle: 'italic', lineHeight: 1.15,
              color: '#2A2528',
            }}>
              We're opening a{' '}
              <span style={{ color: '#C83E88', fontWeight: 500 }}>founding round</span>.
            </p>

            <p className="mt-5" style={{
              fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78', lineHeight: 1.7,
            }}>
              Limited to a small group of founding partners
              <br />
              who understand that dating deserves better than the swipe.
            </p>

            <p className="mt-3" style={{
              fontFamily: sans, fontSize: '0.8rem', color: '#A89E98', lineHeight: 1.6,
            }}>
              The product works. The market is collapsing toward us.
              <br />
              The only question is how fast we move.
            </p>

            <div className="mt-10">
              <a
                href="mailto:jamal@hakadian.com?subject=Pulse%20—%20Founding%20Round"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-base font-semibold transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: '#C83E88', color: 'white',
                  boxShadow: '0 4px 30px rgba(200,62,136,0.30)',
                  fontFamily: sans, textDecoration: 'none',
                }}>
                Request allocation
              </a>
            </div>

            <p className="mt-5" style={{ fontFamily: sans, fontSize: '0.7rem', color: '#C2B8AE' }}>
              jamal@hakadian.com
            </p>
          </div>

          {/* Restart */}
          <div className="mt-20">
            <button onClick={onRestart}
              className="text-sm transition-colors hover:text-[#2A2528]"
              style={{ fontFamily: sans, color: '#DDD5CC', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Replay demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
        <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.1em', color: '#DDD5CC' }}>
          Pulse · Dubai 2026
        </p>
      </footer>
    </div>
  )
}
