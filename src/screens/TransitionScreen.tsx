import { useState, useEffect } from 'react'
import { candidates, conversationStarters } from '../data/people'
import { sponsors } from '../data/sponsors'

/*
  WETRANSFER-STYLE SPONSOR TAKEOVER

  The ad IS the screen. Full-bleed premium imagery.
  Pulse session info overlaid minimally â the user is
  waiting anyway, so the brand gets undivided attention.

  Rules:
  - Image must be full bleed, high quality, atmospheric
  - Brand info: logo-sized name + tagline + single CTA
  - Pulse countdown: small, elegant, non-competing
  - Skip appears after 5s â non-negotiable
  - Different sponsor per transition (rotates)
  - "Presented by" label â transparent, not deceptive
*/

interface Props {
  dateIndex: number
  onNavigate: () => void
}

const TOTAL = 15

export default function TransitionScreen({ dateIndex, onNavigate }: Props) {
  const nextPerson = candidates[dateIndex] || candidates[0]
  const sponsor = sponsors[(dateIndex - 1) % sponsors.length] || sponsors[0]
  // Pick a conversation starter hint based on the person's tags
  const starterHint = conversationStarters[(dateIndex * 2 + 1) % conversationStarters.length]

  const [count, setCount] = useState(TOTAL)
  const [showSkip, setShowSkip] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [showBrand, setShowBrand] = useState(false)
  const [showCta, setShowCta] = useState(false)
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

  // Staggered reveal â cinematic entry
  useEffect(() => {
    setTimeout(() => setShowContent(true), 400)
    setTimeout(() => setShowBrand(true), 900)
    setTimeout(() => setShowCta(true), 1400)
    setTimeout(() => setShowPulseBar(true), 1800)
    setTimeout(() => setShowIceBreaker(true), 3000)
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

  // Skip after 5s
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 5000)
    return () => clearTimeout(skipTimer)
  }, [])

  const barWidth = (count / TOTAL) * 100

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#0A0A0A' }}>

      {/* ====== LAYER 1: FULL-BLEED SPONSOR IMAGE ====== */}
      <img
        src={sponsor.image}
        alt={sponsor.brand}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: imageLoaded ? 1 : 0,
          transition: 'opacity 1.2s ease-out',
          filter: 'brightness(0.55) saturate(0.85)',
        }}
        onLoad={() => setImageLoaded(true)}
      />

      {/* Gradient overlays for text legibility */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.30) 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.50) 0%, transparent 50%)' }} />

      {/* ====== LAYER 2: TOP BAR â Pulse branding + countdown ====== */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 md:px-8 py-4"
        style={{
          opacity: showContent ? 1 : 0,
          transform: showContent ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 600ms ease-out',
        }}
      >
        {/* Pulse logo â subtle, not competing */}
        <div className="flex items-center gap-3">
          <span className="text-base font-display font-semibold text-white/50">Pulse</span>
          <svg width="40" height="10" viewBox="0 0 120 24" fill="none" className="opacity-25">
            <path d="M0 12h30l5-10 5 20 5-20 5 10h70" stroke="#E040A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Countdown pill */}
        <div
          className="flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0] animate-pulse" />
          <span className="text-xs font-mono text-white/70 tabular-nums">{count}s</span>
        </div>
      </div>

      {/* ====== LAYER 3: BOTTOM CONTENT ZONE ====== */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-5 md:px-10 pb-6 md:pb-10">

        {/* Sponsor brand info */}
        <div
          style={{
            opacity: showBrand ? 1 : 0,
            transform: showBrand ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[0.6rem] tracking-[0.2em] uppercase font-medium px-2.5 py-1 rounded-full"
              style={{ color: 'rgba(255,255,255,0.45)', border: '0.5px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              Presented by
            </span>
            <span className="text-[0.6rem] tracking-[0.15em] uppercase text-white/25">{sponsor.category}</span>
          </div>

          <h2
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            {sponsor.brand}
          </h2>

          <p
            className="text-base md:text-xl text-white/60 mb-6 md:mb-8 max-w-md"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic' }}
          >
            {sponsor.tagline}
          </p>
        </div>

        {/* CTA + Skip row */}
        <div
          className="flex items-end justify-between gap-4"
          style={{
            opacity: showCta ? 1 : 0,
            transform: showCta ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 600ms ease-out',
          }}
        >
          {/* Sponsor CTA */}
          <button
            className="group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              backgroundColor: 'rgba(255,255,255,0.10)',
              backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              color: 'white',
            }}
          >
            {sponsor.cta}
            <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Skip button */}
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
            Skip â
          </button>
        </div>

        {/* ====== PULSE SESSION BAR (overlaid at very bottom) ====== */}
        <div
          className="mt-5 md:mt-6"
          style={{
            opacity: showPulseBar ? 1 : 0,
            transform: showPulseBar ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 500ms ease-out',
          }}
        >
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(30px)', border: '0.5px solid rgba(255,255,255,0.08)' }}
          >
            {/* Next person preview â rich teaser */}
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
              <p className="text-[0.65rem] text-white/35 mb-1">{nextPerson.location} Â· {nextPerson.bio}</p>
              <div className="flex gap-1 flex-wrap">
                {nextPerson.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(224,64,160,0.10)', color: '#E040A0', border: '0.5px solid rgba(224,64,160,0.15)' }}>
                    {tag}
                  </span>
                ))}
              </div>
              {/* Ice breaker hint â fades in after 3s */}
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
                <p className="text-[0.55rem] text-white/25 italic truncate">Try asking: "{starterHint.slice(0, 50)}..."</p>
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
      `}</style>
    </div>
  )
}
