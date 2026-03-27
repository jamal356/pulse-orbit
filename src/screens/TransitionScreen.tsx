import { useState, useEffect } from 'react'
import { candidates, conversationStarters } from '../data/people'
import { sponsors } from '../data/sponsors'

/*
  CINEMATIC TRANSITION — between dates

  Alternates between Pulse brand moments (cinematic quotes)
  and premium sponsor takeovers (full-bleed, elegant).
  Odd dates = Pulse quote, Even dates = Sponsor.
*/

interface Props {
  dateIndex: number
  onNavigate: () => void
}

const TOTAL = 12

/* Cinematic backdrops — atmospheric, no faces, pure mood */
const backdrops = [
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=85', // starry mountains
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=85', // golden hour ocean
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&q=85', // sunset field
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=85', // night sky
]

/* Cinematic lines — not tips, not ads. Atmosphere. */
const cinematicLines = [
  { quote: 'Chemistry can\u2019t be manufactured.', sub: 'It can only be discovered.' },
  { quote: 'The best conversations start with honesty.', sub: 'And end with \u201Ccan we keep going?\u201D' },
  { quote: 'Five minutes is all it takes.', sub: 'To know if something is real.' },
  { quote: 'You showed up. That\u2019s the hardest part.', sub: 'Everything else is momentum.' },
  { quote: 'No algorithm can predict a spark.', sub: 'But a camera never lies.' },
  { quote: 'This isn\u2019t dating. This is meeting.', sub: 'The way it was always meant to be.' },
]

export default function TransitionScreen({ dateIndex, onNavigate }: Props) {
  const nextPerson = candidates[dateIndex] || candidates[0]
  const isSponsorSlot = dateIndex % 2 === 0 // alternate: quote, sponsor, quote, sponsor
  const sponsor = sponsors[(dateIndex - 1) % sponsors.length]
  const backdrop = isSponsorSlot ? sponsor.image : backdrops[(dateIndex - 1) % backdrops.length]
  const cinematic = cinematicLines[(dateIndex - 1) % cinematicLines.length]
  const starterHint = conversationStarters[(dateIndex * 2 + 1) % conversationStarters.length]

  const [count, setCount] = useState(TOTAL)
  const [showSkip, setShowSkip] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const [showSub, setShowSub] = useState(false)
  const [showPulseBar, setShowPulseBar] = useState(false)
  const [showIceBreaker, setShowIceBreaker] = useState(false)

  // Lock body scroll
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
      document.body.style.overflow = prevBody
    }
  }, [])

  // Staggered reveal
  useEffect(() => {
    setTimeout(() => setShowQuote(true), 600)
    setTimeout(() => setShowSub(true), 1400)
    setTimeout(() => setShowPulseBar(true), 2200)
    setTimeout(() => setShowIceBreaker(true), 3500)
  }, [])

  // Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(onNavigate, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onNavigate])

  // Skip after 3s
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 3000)
    return () => clearTimeout(skipTimer)
  }, [])

  const barWidth = (count / TOTAL) * 100

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>

      {/* ====== FULL-BLEED CINEMATIC BACKDROP ====== */}
      <img
        src={backdrop}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 1.5s ease-out',
          filter: 'brightness(0.40) saturate(0.75)',
          animation: imageLoaded ? 'ken-burns 15s ease-in-out infinite alternate' : 'none',
        }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.10) 40%, rgba(0,0,0,0.25) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)' }} />

      {/* ====== TOP BAR — Pulse + countdown ====== */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 md:px-8 py-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-base font-display font-semibold text-white/40">Pulse</span>
          <svg width="40" height="10" viewBox="0 0 120 24" fill="none" className="opacity-20">
            <path d="M0 12h30l5-10 5 20 5-20 5 10h70" stroke="#E040A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="glass-button flex items-center gap-2 rounded-full px-4 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0] animate-pulse" />
          <span className="text-xs font-mono text-white/70 tabular-nums">{count}s</span>
        </div>
      </div>

      {/* ====== CENTER — Quote or Sponsor ====== */}
      <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
        {isSponsorSlot ? (
          /* ── Sponsor takeover — cinematic, left-aligned ── */
          <div className="max-w-2xl w-full text-left">
            <div
              className="flex items-center gap-2 mb-4"
              style={{
                opacity: showQuote ? 1 : 0,
                transform: showQuote ? 'translateY(0)' : 'translateY(15px)',
                transition: 'all 800ms ease-out',
              }}
            >
              <span className="text-[0.6rem] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-full"
                style={{ color: 'rgba(255,255,255,0.45)', border: '0.5px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                Presented by
              </span>
              <span className="text-[0.6rem] tracking-[0.15em] uppercase text-white/25">{sponsor.category}</span>
            </div>
            <p
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] mb-3"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                opacity: showQuote ? 1 : 0,
                transform: showQuote ? 'translateY(0)' : 'translateY(25px)',
                transition: 'all 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {sponsor.brand}
            </p>
            <p
              className="text-base md:text-xl text-white/50 max-w-md"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 300,
                opacity: showSub ? 1 : 0,
                transform: showSub ? 'translateY(0)' : 'translateY(15px)',
                transition: 'all 800ms ease-out',
              }}
            >
              {sponsor.tagline}
            </p>
          </div>
        ) : (
          /* ── Pulse cinematic quote ── */
          <div className="text-center max-w-2xl">
          <p
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500,
              opacity: showQuote ? 1 : 0,
              transform: showQuote ? 'translateY(0)' : 'translateY(25px)',
              transition: 'all 1000ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {cinematic.quote}
          </p>
          <p
            className="text-sm md:text-lg text-white/50 mt-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: 300,
              opacity: showSub ? 1 : 0,
              transform: showSub ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 800ms ease-out',
            }}
          >
            {cinematic.sub}
          </p>
          </div>
        )}
      </div>

      {/* ====== BOTTOM — Next date preview + Skip ====== */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 md:px-10 pb-6 md:pb-10">

        {/* Skip */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onNavigate}
            className="transition-all duration-500 text-sm"
            style={{
              opacity: showSkip ? 0.5 : 0,
              pointerEvents: showSkip ? 'auto' : 'none',
              color: 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            Skip &rarr;
          </button>
        </div>

        {/* Next date bar */}
        <div
          style={{
            opacity: showPulseBar ? 1 : 0,
            transform: showPulseBar ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 500ms ease-out',
          }}
        >
          <div className="glass-tile backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3">
            <img
              src={nextPerson.photo}
              alt={nextPerson.name}
              className="w-10 h-10 rounded-full object-cover shrink-0"
              style={{ border: '1.5px solid #E040A0', boxShadow: '0 0 8px rgba(224,64,160,0.3)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/80 font-medium">
                Up next: <span className="text-[#E040A0]">{nextPerson.name}</span>, {nextPerson.age}
              </p>
              <p className="text-[0.65rem] text-white/35 mb-1">{nextPerson.location} &middot; {nextPerson.bio}</p>
              <div className="flex gap-1 flex-wrap">
                {nextPerson.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(224,64,160,0.10)', color: '#E040A0', border: '0.5px solid rgba(224,64,160,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className="mt-1.5 flex items-center gap-1"
                style={{
                  opacity: showIceBreaker ? 1 : 0,
                  transform: showIceBreaker ? 'translateY(0)' : 'translateY(4px)',
                  transition: 'all 600ms ease-out',
                }}
              >
                <svg className="w-2.5 h-2.5 text-[#FF9F0A]/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-[0.55rem] text-white/25 italic truncate">Try asking: &ldquo;{starterHint.slice(0, 50)}...&rdquo;</p>
              </div>
            </div>

            {/* Session progress dots */}
            <div className="flex items-center gap-1.5 shrink-0">
              {[1, 2, 3, 4, 5].map(i => {
                const completed = i < dateIndex
                const current = i === dateIndex
                return (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: completed ? '#E040A0' : current ? '#E040A0' : 'rgba(255,255,255,0.15)',
                      boxShadow: (completed || current) ? '0 0 6px rgba(224,64,160,0.5)' : 'none',
                      animation: current ? 'dot-pulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  />
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="w-16 md:w-24 h-1 rounded-full overflow-hidden shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full bg-[#E040A0]"
                style={{ width: `${barWidth}%`, transition: 'width 1s linear' }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
        @keyframes ken-burns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </div>
  )
}
