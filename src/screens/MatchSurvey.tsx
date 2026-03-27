import { useState, useEffect, useCallback, useRef } from 'react'
import { candidates } from '../data/people'
import { sponsors } from '../data/sponsors'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  dateIndex: number
  onRate: (name: string, rating: 'like' | 'pass') => void
}

/* ─── Compatibility whispers ─── */
const compatibilityWhispers: Record<string, string> = {
  Sofia: "You both value experiences over things \u2014 that's rare chemistry.",
  Layla: "Different energy, different wavelength \u2014 trust your gut.",
  Amira: "Shared creative passions can be a powerful foundation.",
  Nour: "Two ambitious minds \u2014 could be fireworks or fuel.",
  Yasmine: "Style meets substance \u2014 but did the conversation match?",
}

/* ─── Vibe options ─── */
const vibeOptions = [
  { emoji: '\u26A1', label: 'Electric', color: '#FF6EC7' },
  { emoji: '\u{1F60A}', label: 'Warm', color: '#FF9F0A' },
  { emoji: '\u{1F914}', label: 'Interesting', color: '#6060FF' },
  { emoji: '\u{1F602}', label: 'Fun', color: '#30D158' },
  { emoji: '\u{1F32A}\u{FE0F}', label: 'Intense', color: '#E040A0' },
  { emoji: '\u{1F636}', label: 'Awkward', color: '#7A7A80' },
]

/* ─── Real-date intent options ─── */
const dateIntentOptions = [
  { emoji: '\u{1F4AF}', label: 'Absolutely', value: 'definitely' as const },
  { emoji: '\u{1F914}', label: 'Maybe', value: 'maybe' as const },
  { emoji: '\u{1F91D}', label: 'As friends', value: 'friends' as const },
  { emoji: '\u274C', label: 'Nah', value: 'no' as const },
]

type Phase = 'rating' | 'vibe' | 'intent' | 'done'
const phaseOrder: Phase[] = ['rating', 'vibe', 'intent', 'done']

export default function MatchSurvey({ dateIndex, onRate }: Props) {
  const person = candidates[dateIndex] || candidates[0]
  const sponsor = sponsors[dateIndex % sponsors.length]
  const [visible, setVisible] = useState(false)
  const [phase, setPhase] = useState<Phase>('rating')
  const [rating, setRating] = useState<'like' | 'pass' | null>(null)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number; color: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const whisper = compatibilityWhispers[person.name] || 'Trust what you felt in the moment.'

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  /* ── Phase transition with crossfade ── */
  const advancePhase = useCallback((next: Phase) => {
    setTransitioning(true)
    setTimeout(() => {
      setPhase(next)
      setTransitioning(false)
    }, 300)
  }, [])

  /* ── Ripple effect on tap ── */
  const triggerRipple = useCallback((e: React.MouseEvent, color: string) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, color })
    setTimeout(() => setRipple(null), 600)
  }, [])

  const handleRate = useCallback((r: 'like' | 'pass', e: React.MouseEvent) => {
    setRating(r)
    triggerRipple(e, r === 'like' ? '#E040A0' : '#6060FF')
    setTimeout(() => advancePhase('vibe'), 500)
  }, [advancePhase, triggerRipple])

  const handleVibe = useCallback((vibe: string, e: React.MouseEvent, color: string) => {
    setSelectedVibe(vibe)
    triggerRipple(e, color)
    setTimeout(() => advancePhase('intent'), 450)
  }, [advancePhase, triggerRipple])

  const handleIntent = useCallback((intent: string, e: React.MouseEvent) => {
    setSelectedIntent(intent)
    triggerRipple(e, '#E040A0')
    advancePhase('done')
    setTimeout(() => {
      if (rating) onRate(person.name, rating)
    }, 700)
  }, [rating, person.name, onRate, advancePhase, triggerRipple])

  /* ── Progress calculation ── */
  const progress = phase === 'done' ? 1 : phaseOrder.indexOf(phase) / 3

  return (
    <div ref={containerRef} className="fixed inset-0 flex flex-col overflow-hidden">
      {/* ═══ Sponsor background image ═══ */}
      <div className="absolute inset-0 z-0">
        <img
          src={sponsor.image}
          alt=""
          className="w-full h-full object-cover"
          style={{
            filter: 'brightness(0.25) saturate(0.6) blur(2px)',
            transform: 'scale(1.05)',
          }}
        />
        {/* Netflix-style gradient darken from left */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)',
        }} />
        {/* Bottom gradient for sponsor card legibility */}
        <div className="absolute bottom-0 left-0 right-0 h-48" style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
        }} />
      </div>

      <BackgroundOrbs />

      {/* ═══ Ripple effect ═══ */}
      {ripple && (
        <div
          className="absolute z-50 rounded-full pointer-events-none"
          style={{
            left: ripple.x - 200,
            top: ripple.y - 200,
            width: 400,
            height: 400,
            background: `radial-gradient(circle, ${ripple.color}30 0%, transparent 70%)`,
            animation: 'ripple-expand 0.6s ease-out forwards',
          }}
        />
      )}

      {/* ═══ Progress bar ═══ */}
      <div className="absolute top-0 left-0 right-0 z-30 h-[2px] bg-black/20">
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #E040A0, #FF6EC7, #E040A0)',
            boxShadow: '0 0 12px rgba(224,64,160,0.5)',
          }}
        />
      </div>

      {/* ═══ Top bar: Profile pill + date counter ═══ */}
      <div
        className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'all 0.6s ease-out 0.1s',
        }}
      >
        {/* Profile pill \u2014 glass */}
        <div className="glass-tile backdrop-blur-xl flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-full">
          <div className="relative">
            <img
              src={person.photo}
              alt={person.name}
              className="w-9 h-9 rounded-full object-cover"
              style={{
                border: '2px solid rgba(224,64,160,0.4)',
                boxShadow: '0 2px 12px rgba(224,64,160,0.15)',
              }}
            />
            {rating && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{
                  background: rating === 'like' ? '#E040A0' : '#3A3A3E',
                  border: '1.5px solid rgba(0,0,0,0.4)',
                  animation: 'scale-pop 0.3s ease-out',
                }}
              >
                <span className="text-[0.45rem]">{rating === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {person.name}, {person.age}
            </p>
            <p className="text-[0.6rem] text-white/40">{person.location}</p>
          </div>
        </div>

        {/* Date counter */}
        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= dateIndex ? '#E040A0' : 'rgba(224,64,160,0.15)',
                boxShadow: i === dateIndex ? '0 0 6px rgba(224,64,160,0.4)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ Center: The Question ═══ */}
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8">
        <div
          className="w-full max-w-lg flex flex-col items-center"
          style={{
            opacity: transitioning ? 0 : (visible ? 1 : 0),
            transform: transitioning ? 'translateY(20px) scale(0.97)' : (visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)'),
            transition: 'all 0.35s ease-out',
          }}
        >
          {/* ─── PHASE 1: Chemistry ─── */}
          {phase === 'rating' && (
            <>
              {/* AI whisper \u2014 glass pill */}
              <div
                className="mb-8 max-w-sm text-center"
                style={{
                  opacity: visible ? 0.8 : 0,
                  transition: 'opacity 1.2s ease-out 0.4s',
                }}
              >
                <div className="glass-tile backdrop-blur-xl inline-flex items-center gap-2 px-4 py-2 rounded-full">
                  <svg className="w-3 h-3 text-[#E040A0]/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-[0.65rem] text-white/50 italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{whisper}</p>
                </div>
              </div>

              {/* The big question \u2014 inside glass card */}
              <div className="glass-tile backdrop-blur-xl rounded-3xl px-8 py-10 mb-8 w-full max-w-sm text-center">
                <h2
                  className="text-3xl md:text-4xl leading-tight mb-3"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#F5F5F7',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Did you feel<br />the chemistry?
                </h2>
                <p className="text-xs text-white/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {person.bio}
                </p>
              </div>

              {/* Two buttons \u2014 glass */}
              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={(e) => handleRate('pass', e)}
                  className="flex-1 group glass-button backdrop-blur-xl rounded-2xl py-6 flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.96]"
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{'\u2744\u{FE0F}'}</span>
                  <span className="text-sm font-medium text-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>Not this time</span>
                </button>
                <button
                  onClick={(e) => handleRate('like', e)}
                  className="flex-1 group glass-button backdrop-blur-xl rounded-2xl py-6 flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.96]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,64,160,0.18), rgba(224,64,160,0.08))',
                    borderColor: 'rgba(224,64,160,0.30)',
                    boxShadow: '0 4px 24px rgba(224,64,160,0.12), inset 0 1px 0 rgba(255,255,255,0.10)',
                  }}
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{'\u{1F525}'}</span>
                  <span className="text-sm font-medium text-[#E040A0]/90" style={{ fontFamily: "'DM Sans', sans-serif" }}>I felt it</span>
                </button>
              </div>
            </>
          )}

          {/* ─── PHASE 2: Vibe check ─── */}
          {phase === 'vibe' && (
            <>
              <div className="glass-tile backdrop-blur-xl rounded-3xl px-8 py-8 mb-8 w-full max-w-sm text-center">
                <h2
                  className="text-3xl md:text-4xl leading-tight mb-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#F5F5F7',
                    letterSpacing: '-0.01em',
                  }}
                >
                  What was<br />the vibe?
                </h2>
                <p className="text-xs text-white/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  One word that captures it
                </p>
              </div>

              {/* 3x2 grid \u2014 glass buttons */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {vibeOptions.map((v) => (
                  <button
                    key={v.label}
                    onClick={(e) => handleVibe(v.label, e, v.color)}
                    className={`group glass-button backdrop-blur-xl rounded-2xl py-5 flex flex-col items-center gap-2.5 transition-all duration-200 active:scale-[0.94] ${selectedVibe === v.label ? 'ring-1' : ''}`}
                    style={{
                      background: selectedVibe === v.label
                        ? `linear-gradient(135deg, ${v.color}25, ${v.color}10)`
                        : undefined,
                      borderColor: selectedVibe === v.label ? `${v.color}50` : undefined,
                      boxShadow: selectedVibe === v.label ? `0 4px 20px ${v.color}20, inset 0 1px 0 rgba(255,255,255,0.10)` : undefined,
                      ringColor: selectedVibe === v.label ? v.color : undefined,
                    }}
                  >
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{v.emoji}</span>
                    <span
                      className="text-xs font-medium transition-colors duration-200"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: selectedVibe === v.label ? v.color : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {v.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─── PHASE 3: Real date intent ─── */}
          {phase === 'intent' && (
            <>
              <div className="glass-tile backdrop-blur-xl rounded-3xl px-8 py-8 mb-8 w-full max-w-sm text-center">
                <h2
                  className="text-3xl md:text-4xl leading-tight mb-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: '#F5F5F7',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Would you go<br />on a real date?
                </h2>
                <p className="text-xs text-white/30" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  Honest answer only
                </p>
              </div>

              {/* Stacked options \u2014 glass rows */}
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {dateIntentOptions.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={(e) => handleIntent(opt.value, e)}
                    className="group glass-button backdrop-blur-xl rounded-2xl py-4 px-5 flex items-center gap-4 transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: selectedIntent === opt.value
                        ? 'linear-gradient(135deg, rgba(224,64,160,0.20), rgba(224,64,160,0.08))'
                        : undefined,
                      borderColor: selectedIntent === opt.value ? 'rgba(224,64,160,0.35)' : undefined,
                    }}
                  >
                    {/* Keyboard shortcut hint */}
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[0.6rem] font-mono font-bold flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.30)',
                        border: '0.5px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>

                    <span className="text-xl">{opt.emoji}</span>

                    <span
                      className="text-sm font-medium"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: selectedIntent === opt.value ? '#E040A0' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─── PHASE 4: Done ─── */}
          {phase === 'done' && (
            <div className="glass-tile backdrop-blur-xl rounded-3xl px-10 py-10 flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'radial-gradient(circle, rgba(224,64,160,0.20) 0%, transparent 70%)',
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                }}
              >
                <svg className="w-7 h-7 text-[#E040A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ animation: 'draw-check 0.5s ease-out forwards' }} />
                </svg>
              </div>
              <p
                className="text-lg text-white/40"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}
              >
                Noted. Moving on...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom: Sponsor card \u2014 Netflix-style glass integration ═══ */}
      <div
        className="relative z-10 pb-5 px-5"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 1s ease-out 0.8s',
        }}
      >
        <div className="glass-tile backdrop-blur-xl rounded-2xl px-5 py-3.5 flex items-center gap-4 max-w-lg mx-auto">
          {/* Sponsor accent bar */}
          <div
            className="w-1 h-10 rounded-full flex-shrink-0"
            style={{ background: `linear-gradient(to bottom, ${sponsor.accent}, ${sponsor.accent}40)` }}
          />

          {/* Sponsor info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[0.55rem] tracking-[0.12em] uppercase text-white/25">Presented by</span>
              <span
                className="text-[0.5rem] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium"
                style={{ background: `${sponsor.accent}15`, color: `${sponsor.accent}90`, border: `0.5px solid ${sponsor.accent}25` }}
              >
                {sponsor.category}
              </span>
            </div>
            <p
              className="text-base font-semibold text-white/80 truncate"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {sponsor.brand}
            </p>
            <p className="text-[0.6rem] text-white/25 italic truncate" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {sponsor.tagline}
            </p>
          </div>

          {/* CTA button */}
          <button
            className="glass-button backdrop-blur-xl rounded-xl px-4 py-2 flex-shrink-0 transition-all duration-200 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${sponsor.accent}18, ${sponsor.accent}08)`,
              borderColor: `${sponsor.accent}30`,
            }}
          >
            <span className="text-[0.65rem] font-semibold whitespace-nowrap" style={{ color: sponsor.accent }}>
              {sponsor.cta}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ Animations ═══ */}
      <style>{`
        @keyframes ripple-expand {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes scale-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes draw-check {
          0% { stroke-dasharray: 30; stroke-dashoffset: 30; }
          100% { stroke-dasharray: 30; stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
