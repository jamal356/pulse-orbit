import { useEffect, useState, useCallback } from 'react'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onEnter: () => void
  onDemo: () => void
}

const TAGLINES = [
  { strike: 'He can\u2019t message first.', punch: 'With Pulse, he can\u2019t message at all.' },
  { strike: 'Swipe right to match.', punch: 'Or just\u2026 meet them.' },
  { strike: 'Designed to be deleted.', punch: 'We\u2019re designed to never be needed twice.' },
  { strike: 'Three hours texting before a first date.', punch: 'Five minutes of knowing.' },
  { strike: 'Send a like and hope.', punch: 'Show up and know.' },
]

export default function LandingPage({ onEnter, onDemo }: Props) {
  const [mounted, setMounted] = useState(false)
  const [idx, setIdx] = useState(0)
  const [showStrike, setShowStrike] = useState(false)
  const [showPunch, setShowPunch] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t0 = setTimeout(() => setMounted(true), 100)
    const t1 = setTimeout(() => setShowStrike(true), 1400)
    const t2 = setTimeout(() => setShowPunch(true), 3000)
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const advance = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      setShowStrike(false)
      setShowPunch(false)
      setIdx(i => (i + 1) % TAGLINES.length)
      setFading(false)
      setTimeout(() => setShowStrike(true), 200)
      setTimeout(() => setShowPunch(true), 1600)
    }, 600)
  }, [])

  useEffect(() => {
    const iv = setInterval(advance, 6500)
    return () => clearInterval(iv)
  }, [advance])

  const t = TAGLINES[idx]
  const sans = "'DM Sans', sans-serif"
  const serif = "'Cormorant Garamond', Georgia, serif"

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#080608' }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(200,62,136,0.07) 0%, rgba(200,62,136,0.02) 35%, transparent 60%)' }} />
        <div className="absolute bottom-[20%] right-[20%]"
          style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(128,64,224,0.04) 0%, transparent 55%)', animation: 'lp-drift 12s ease-in-out infinite' }} />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

        {/* Logo */}
        <div className="transition-all duration-[2.5s] ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-15px)' }}>
          <PulseLogo variant="full" color="accent" size="sm" />
        </div>

        {/* Tagline block */}
        <div className="mt-12 sm:mt-16 min-h-[90px] sm:min-h-[110px] text-center flex flex-col items-center justify-center"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease' }}>

          <p className="transition-all duration-[1s] ease-out px-4"
            style={{
              fontFamily: sans, fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.22)',
              textDecoration: 'line-through', textDecorationColor: 'rgba(200,62,136,0.35)',
              opacity: showStrike ? 1 : 0, transform: showStrike ? 'translateY(0)' : 'translateY(6px)',
            }}>
            {t.strike}
          </p>

          <p className="mt-3 sm:mt-4 transition-all duration-[1.2s] ease-out px-4"
            style={{
              fontFamily: serif, fontSize: 'clamp(1.25rem, 4vw, 2rem)',
              fontWeight: 300, fontStyle: 'italic', color: '#C83E88', lineHeight: 1.25,
              opacity: showPunch ? 1 : 0, transform: showPunch ? 'translateY(0)' : 'translateY(8px)',
            }}>
            {t.punch}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-14 sm:mt-18 flex flex-col items-center gap-5 transition-all duration-[2s] ease-out"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)', transitionDelay: '0.8s' }}>
          <button onClick={onEnter}
            className="group relative px-11 py-4 rounded-full overflow-hidden transition-all duration-500 active:scale-[0.97]"
            style={{
              fontFamily: sans, fontSize: '1rem', fontWeight: 600, letterSpacing: '0.04em', color: 'white',
              background: 'linear-gradient(135deg, #C83E88 0%, #A02D6E 100%)',
              boxShadow: '0 4px 30px rgba(200,62,136,0.25)',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'linear-gradient(135deg, #D44E98 0%, #B03D7E 100%)' }} />
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="relative z-10 flex flex-col items-center gap-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 2rem)' }}>
        <svg width="100" height="16" viewBox="0 0 100 16" fill="none"
          className="transition-opacity duration-[3s]"
          style={{ opacity: mounted ? 0.25 : 0, transitionDelay: '2s' }}>
          <path d="M0 8h30l4-7 4 14 4-14 4 7h54" stroke="#C83E88" strokeWidth="0.8" strokeLinecap="round"
            strokeDasharray="140" strokeDashoffset={mounted ? '0' : '140'}
            style={{ transition: 'stroke-dashoffset 3s ease-out 2s' }} />
        </svg>
        <button onClick={onDemo}
          className="text-[0.65rem] tracking-[0.12em] uppercase transition-colors duration-300 pb-2"
          style={{ color: 'rgba(255,255,255,0.15)', fontFamily: sans, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}>
          Investor walkthrough
        </button>
      </div>

      <style>{`
        @keyframes lp-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 15px); }
        }
      `}</style>
    </div>
  )
}
