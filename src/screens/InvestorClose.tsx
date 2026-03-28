import { useEffect, useState, useRef } from 'react'
import { candidates, photos } from '../data/people'

interface Props {
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
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

/* ─── Heartbeat SVG ──────────────────────────────────────────── */
function HeartbeatLine({ visible }: { visible: boolean }) {
  return (
    <svg width="100" height="20" viewBox="0 0 100 20" fill="none"
      className="transition-opacity duration-[2s]"
      style={{ opacity: visible ? 0.4 : 0 }}
    >
      <path
        d="M0 10h30l4-8 4 16 4-16 4 8h54"
        stroke="#C83E88" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="160" strokeDashoffset={visible ? '0' : '160'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
    </svg>
  )
}

/* ─── Simulated match data ───────────────────────────────────── */
const theirRatings: Record<string, 'like' | 'pass'> = {
  Sofia: 'like', Layla: 'pass', Amira: 'like', Nour: 'like', Yasmine: 'pass',
}

const pastSessions = [
  { date: 'Mar 20', matches: 2, dates: 5 },
  { date: 'Mar 13', matches: 1, dates: 5 },
  { date: 'Mar 6', matches: 3, dates: 5 },
]

/* ═══════════════════════════════════════════════════════════════
   INVESTOR CLOSE
   Flow: Dashboard showcase → Market numbers → The Ask
   ═══════════════════════════════════════════════════════════════ */
export default function InvestorClose({ ratings, onRestart }: Props) {
  const [phase, setPhase] = useState(0)
  const numbers = useReveal(0.3)
  const model = useReveal(0.2)
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
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'linear-gradient(170deg, #FAF7F2 0%, #F2EDE6 40%, #FAF7F2 100%)' }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '900px', height: '600px', background: 'radial-gradient(ellipse, rgba(200,62,136,0.04) 0%, transparent 70%)' }}
        />
      </div>

      {/* ═══ TRANSITION LINE ═══ */}
      <section className="relative pt-20 pb-8 px-6 text-center">
        <p
          className="transition-all duration-[2s] ease-out"
          style={{
            fontFamily: serif, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 300, fontStyle: 'italic',
            color: '#2A2528',
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          That was <span style={{ color: '#C83E88' }}>one session</span>.
        </p>
        <p
          className="mt-3 transition-all duration-[2s] ease-out"
          style={{
            fontFamily: sans, fontSize: '0.85rem',
            color: '#8A7E78', letterSpacing: '0.08em',
            opacity: phase >= 2 ? 1 : 0,
          }}
        >
          Here's what the user sees after.
        </p>
      </section>

      {/* ═══ USER DASHBOARD SHOWCASE ═══ */}
      <section className="relative px-4 sm:px-6 pb-24">
        <div
          className="max-w-md mx-auto rounded-2xl overflow-hidden transition-all duration-[2s] ease-out glass-tile"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          }}
        >
          {/* Profile header */}
          <div className="p-6 pb-4 flex items-center gap-4">
            <div className="relative">
              <img
                src={photos.user}
                alt="Your profile"
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '2px solid rgba(200,62,136,0.4)' }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: '#30D158' }}>
                ✓
              </div>
            </div>
            <div>
              <p style={{ fontFamily: serif, fontSize: '1.3rem', fontWeight: 600, color: '#2A2528' }}>
                Omar, 30
              </p>
              <p style={{ fontFamily: sans, fontSize: '0.75rem', color: '#8A7E78' }}>
                Dubai Marina · Joined Mar 2026
              </p>
            </div>
          </div>

          {/* Stats row */}
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
              {matches.length > 0 ? matches.map(m => (
                <div key={m.name} className="flex flex-col items-center gap-1.5">
                  <div className="relative">
                    <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover"
                      style={{ border: '2px solid rgba(200,62,136,0.5)' }} />
                    <div className="absolute -top-1 -right-1 text-[10px]">💗</div>
                  </div>
                  <p style={{ fontFamily: sans, fontSize: '0.7rem', color: 'rgba(255,255,255,0.60)' }}>{m.name}</p>
                </div>
              )) : (
                /* Default matches if investor skipped demo */
                [{name: 'Sofia', photo: photos.sofia}, {name: 'Amira', photo: photos.amira}].map(m => (
                  <div key={m.name} className="flex flex-col items-center gap-1.5">
                    <div className="relative">
                      <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover"
                        style={{ border: '2px solid rgba(200,62,136,0.5)' }} />
                      <div className="absolute -top-1 -right-1 text-[10px]">💗</div>
                    </div>
                    <p style={{ fontFamily: sans, fontSize: '0.7rem', color: '#2A2528' }}>{m.name}</p>
                  </div>
                ))
              )}
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
                    style={{ background: 'rgba(200,62,136,0.12)', color: '#C83E88', fontFamily: sans }}>
                    {s.matches}
                  </div>
                  <div>
                    <p style={{ fontFamily: sans, fontSize: '0.8rem', color: '#2A2528' }}>
                      {s.matches} match{s.matches !== 1 ? 'es' : ''} from {s.dates} dates
                    </p>
                    <p style={{ fontFamily: sans, fontSize: '0.65rem', color: '#8A7E78' }}>{s.date}</p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(42,37,40,0.15)" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>

          {/* Upcoming session */}
          <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(42,37,40,0.08)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E78' }}>
                  Next session
                </p>
                <p className="mt-1" style={{ fontFamily: serif, fontSize: '1.1rem', fontWeight: 500, color: '#2A2528' }}>
                  Thursday · 9 PM
                </p>
                <p style={{ fontFamily: sans, fontSize: '0.7rem', color: '#8A7E78' }}>
                  3 spots left
                </p>
              </div>
              <div className="px-4 py-2 rounded-full text-xs font-medium"
                style={{ background: 'rgba(200,62,136,0.15)', color: '#C83E88', fontFamily: sans }}>
                Booked ✓
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE NUMBERS — confirmation, not persuasion ═══ */}
      <section ref={numbers.ref} className="relative px-6 py-24 sm:py-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-10">
            <HeartbeatLine visible={numbers.visible} />
          </div>

          {/* Market stats */}
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 sm:grid-cols-4">
            {[
              { value: '$9.6B', label: 'Global dating market', delay: 0 },
              { value: '68M', label: 'Singles in GCC', delay: 200 },
              { value: '42%', label: 'Dissatisfied with apps', delay: 400 },
              { value: '82%', label: 'Prefer video-first', delay: 600 },
            ].map(s => (
              <div key={s.label} className="text-center transition-all duration-[1.5s] ease-out"
                style={{
                  opacity: numbers.visible ? 1 : 0,
                  transform: numbers.visible ? 'translateY(0)' : 'translateY(16px)',
                  transitionDelay: `${s.delay}ms`,
                }}>
                <p style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 600, color: '#C83E88', lineHeight: 1 }}>
                  {s.value}
                </p>
                <p className="mt-2" style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.06em', color: '#8A7E78' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ UNIT ECONOMICS — one clean block ═══ */}
      <section ref={model.ref} className="relative px-6 py-16 sm:py-24">
        <div className="max-w-lg mx-auto">
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: model.visible ? 1 : 0,
              transform: model.visible ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            {/* Revenue per session */}
            <div className="text-center mb-12">
              <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8A7E78' }}>
                Revenue per session
              </p>
              <p className="mt-2" style={{ fontFamily: serif, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 600, color: '#2A2528' }}>
                AED 750
              </p>
              <p style={{ fontFamily: sans, fontSize: '0.8rem', color: '#8A7E78' }}>
                10 seats × AED 75 · ~89% gross margin
              </p>
            </div>

            {/* Revenue mix */}
            <div className="space-y-4">
              {[
                { pct: '60%', label: 'Session fees', sub: 'AED 75 per seat' },
                { pct: '25%', label: 'Premium membership', sub: 'Priority booking, replays, second chances' },
                { pct: '15%', label: 'Sponsored moments', sub: 'Brand takeovers between dates' },
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

            {/* Expansion */}
            <p className="mt-12 text-center" style={{ fontFamily: sans, fontSize: '0.75rem', color: '#8A7E78', letterSpacing: '0.04em' }}>
              Dubai → Riyadh → Doha → Cairo → London
            </p>
          </div>
        </div>
      </section>

      {/* ═══ THE ASK — allocation, not pitch ═══ */}
      <section ref={ask.ref} className="relative px-6 pt-16 pb-32 sm:pt-24 sm:pb-40">
        <div className="max-w-xl mx-auto text-center">
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: ask.visible ? 1 : 0,
              transform: ask.visible ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <p
              style={{
                fontFamily: serif,
                fontSize: 'clamp(2rem, 5.5vw, 3.5rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                lineHeight: 1.1,
                color: '#2A2528',
              }}
            >
              We're opening a{' '}
              <span style={{ color: '#C83E88' }}>founding round</span>.
            </p>

            <p className="mt-4" style={{ fontFamily: sans, fontSize: '0.85rem', color: '#8A7E78', lineHeight: 1.6 }}>
              Limited to a small group of founding partners who believe<br />
              dating deserves better than the swipe.
            </p>

            <div className="mt-10">
              <a
                href="mailto:jamal@hakadian.com?subject=Pulse%20—%20Founding%20Round"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-base font-semibold transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: '#C83E88',
                  color: 'white',
                  boxShadow: '0 4px 30px rgba(200,62,136,0.30)',
                  fontFamily: sans,
                  textDecoration: 'none',
                }}
              >
                Request allocation
              </a>
            </div>

            <p className="mt-6" style={{ fontFamily: sans, fontSize: '0.7rem', color: '#DDD5CC', letterSpacing: '0.08em' }}>
              jamal@hakadian.com
            </p>
          </div>

          {/* Restart link */}
          <div className="mt-20">
            <button
              onClick={onRestart}
              className="text-sm transition-colors hover:text-[#2A2528]"
              style={{ fontFamily: sans, color: '#DDD5CC', background: 'none', border: 'none', cursor: 'pointer' }}
            >
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
