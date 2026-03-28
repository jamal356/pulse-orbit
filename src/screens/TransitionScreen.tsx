import { useState, useEffect } from 'react'
import { candidates, conversationStarters } from '../data/people'
import { sponsors } from '../data/sponsors'

/* ═══════════════════════════════════════════════════════════════
   TRANSITION SCREEN — "The Anticipation Moment"

   Design philosophy (Jobs / Ive):
   The user is captive. Nervous. Heart rate up. Every pixel
   is premium cognitive real estate.

   OLD: Giant countdown number in the center, empty space.
   NEW: Full-bleed photo of who they're about to meet.
        Name and one shared interest large and cinematic.
        A conversation starter they can actually use.
        The countdown is a thin ambient bar — not the hero.
        Sponsor integration as an elegant "Presented by" strip.

   The user should arrive at the date already curious about
   the person, with something to say. This screen BUILDS
   anticipation instead of burning it.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  dateIndex: number
  onNavigate: () => void
}

const TOTAL = 12

/* Cinematic lines — mood, not information */
const vibeLines = [
  'Plot twist: they\'re nervous too',
  'Chemistry can\'t be rehearsed',
  'The best hellos are unscripted',
  'Five minutes. No pressure. Just presence.',
  'You showed up. That\'s already rare.',
]

export default function TransitionScreen({ dateIndex, onNavigate }: Props) {
  const nextPerson = candidates[dateIndex] || candidates[0]
  const isSponsorSlot = dateIndex % 2 === 0
  const sponsor = sponsors[(dateIndex - 1) % sponsors.length]
  const starter = conversationStarters[(dateIndex * 2 + 1) % conversationStarters.length]
  const vibeLine = vibeLines[(dateIndex - 1) % vibeLines.length]

  const [count, setCount] = useState(TOTAL)
  const [showSkip, setShowSkip] = useState(false)
  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [phase, setPhase] = useState(0) // 0→nothing, 1→name, 2→starter, 3→sponsor

  // Lock scroll
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
    setTimeout(() => setPhase(1), 400)
    setTimeout(() => setPhase(2), 1800)
    setTimeout(() => setPhase(3), 3200)
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
    const t = setTimeout(() => setShowSkip(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const progress = ((TOTAL - count) / TOTAL) * 100

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: '#1E1B18' }}>

      {/* ══════ FULL-BLEED: Next person's photo ══════ */}
      <img
        src={nextPerson.photo}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: photoLoaded ? 1 : 0,
          transition: 'opacity 1.2s ease-out',
          objectPosition: 'center 25%',
          animation: photoLoaded ? 'slow-zoom 15s ease-in-out infinite alternate' : 'none',
        }}
        onLoad={() => setPhotoLoaded(true)}
      />

      {/* Cinematic gradient — dark bottom for text, subtle vignette */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.15) 100%)',
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center 30%, transparent 40%, rgba(0,0,0,0.25) 100%)',
      }} />

      {/* ══════ TOP — Minimal: Pulse logo + session progress ══════ */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 py-4 flex items-center justify-between">
        <span className="text-sm font-medium text-white/30" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Pulse
        </span>

        {/* Session dots — which date are we on */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => {
            const done = i < dateIndex
            const current = i === dateIndex
            return (
              <div key={i} className="relative">
                <div style={{
                  width: current ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: done ? '#C83E88' : current ? '#C83E88' : 'rgba(255,255,255,0.15)',
                  boxShadow: (done || current) ? '0 0 8px rgba(200,62,136,0.4)' : 'none',
                  transition: 'all 500ms ease-out',
                }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════ CENTER-BOTTOM: The person — cinematic lower third ══════ */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8">

        {/* "Up next" label */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 600ms ease-out',
        }}>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-[#C83E88]/70">
            Up next
          </span>
        </div>

        {/* Name — the hero text */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 900ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          <h2 className="text-5xl font-bold text-white mt-1 mb-1" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            {nextPerson.name}, {nextPerson.age}
          </h2>
          <p className="text-sm text-white/40 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {nextPerson.location}
          </p>
        </div>

        {/* Tags — shared interests glow */}
        <div className="flex gap-2 mt-3" style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 700ms ease-out 200ms',
        }}>
          {nextPerson.tags.slice(0, 3).map((tag, i) => (
            <span key={tag} className="text-[0.65rem] px-3 py-1 rounded-full font-medium"
              style={{
                background: i === 0 ? 'rgba(200,62,136,0.15)' : 'rgba(255,255,255,0.06)',
                color: i === 0 ? '#C83E88' : 'rgba(255,255,255,0.5)',
                border: i === 0 ? '1px solid rgba(200,62,136,0.25)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {i === 0 ? `You both like ${tag}` : tag}
            </span>
          ))}
        </div>

        {/* ── Conversation starter — large, readable, useful ── */}
        <div className="mt-5 rounded-xl px-4 py-3" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 700ms ease-out',
        }}>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(255,159,10,0.12)' }}>
              <svg className="w-3 h-3 text-[#FF9F0A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-[0.6rem] text-white/25 uppercase tracking-wider font-medium mb-1">Try opening with</p>
              <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                &ldquo;{starter}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── Sponsor strip — elegant "Presented by" ── */}
        {isSponsorSlot && (
          <div className="mt-4 flex items-center gap-2" style={{
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 800ms ease-out',
          }}>
            <span className="text-[0.5rem] tracking-[0.15em] uppercase text-white/15">Presented by</span>
            <span className="text-[0.6rem] font-medium text-white/25" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {sponsor.brand}
            </span>
            <span className="text-[0.5rem] text-white/10">·</span>
            <span className="text-[0.5rem] italic text-white/15" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {sponsor.tagline}
            </span>
          </div>
        )}

        {/* ── Vibe line (non-sponsor slots) ── */}
        {!isSponsorSlot && (
          <p className="mt-4 text-[0.65rem] text-white/20 italic" style={{
            fontFamily: "'Cormorant Garamond', serif",
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 800ms ease-out',
          }}>
            {vibeLine}
          </p>
        )}

        {/* ══════ PROGRESS BAR — the countdown lives here, ambient ══════ */}
        <div className="mt-5 mb-1">
          <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #C83E88 0%, rgba(200,62,136,0.6) 100%)',
                transition: 'width 1s linear',
                boxShadow: '0 0 8px rgba(200,62,136,0.3)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[0.55rem] text-white/20 font-mono tabular-nums">
              {count}s
            </span>
            {showSkip && (
              <button
                onClick={onNavigate}
                className="text-[0.6rem] text-white/25 hover:text-white/50 transition-colors"
              >
                Skip →
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.06) translate(-0.5%, -1%); }
        }
      `}</style>
    </div>
  )
}
