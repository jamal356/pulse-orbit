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
  Sofia: "You both value experiences over things — that's rare chemistry.",
  Layla: "Different energy, different wavelength — trust your gut.",
  Amira: "Shared creative passions can be a powerful foundation.",
  Nour: "Two ambitious minds — could be fireworks or fuel.",
  Yasmine: "Style meets substance — but did the conversation match?",
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
    <div ref={containerRef} className="fixed inset-0 flex flex-col overflow-hidden bg-[#1A1A1E]">
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

      {/* ═══ Progress bar — thin gradient line at top ═══ */}
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

      {/* ═══ Top: Profile pill + date counter ═══ */}
      <div
        className="relative z-20 flex items-center justify-between px-5 pt-12 pb-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-12px)',
          transition: 'all 0.6s ease-out 0.1s',
        }}
      >
        {/* Profile pill */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={person.photo}
              alt={person.name}
              className="w-10 h-10 rounded-full object-cover"
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
                  border: '1.5px solid #1A1A1E',
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
            <p className="text-[0.6rem] text-white/30">{person.location}</p>
          </div>
        </div>

        {/* Date counter */}
        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= dateIndex ? '#E040A0' : 'rgba(224,64,160,0.12)',
                boxShadow: i === dateIndex ? '0 0 6px rgba(224,64,160,0.4)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* ═══ Center: The Question — owns the viewport ═══ */}
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
              {/* AI whisper */}
              <div
                className="mb-8 max-w-sm text-center"
                style={{
                  opacity: visible ? 0.6 : 0,
                  transition: 'opacity 1.2s ease-out 0.4s',
                }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(224,64,160,0.05)', border: '0.5px solid rgba(224,64,160,0.10)' }}>
                  <svg className="w-3 h-3 text-[#E040A0]/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <p className="text-[0.65rem] text-white/35 italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{whisper}</p>
                </div>
              </div>

              {/* The big question */}
              <h2
                className="text-3xl md:text-5xl text-center mb-4 leading-tight"
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

              <p className="text-xs text-white/20 mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {person.bio}
              </p>

              {/* Two big buttons — full width in thumb zone */}
              <div className="flex gap-4 w-full max-w-sm">
                <button
                  onClick={(e) => handleRate('pass', e)}
                  className="flex-1 group relative overflow-hidden rounded-2xl py-6 flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.96]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{'\u2744\u{FE0F}'}</span>
                  <span className="text-sm font-medium text-white/50" style={{ fontFamily: "'DM Sans', sans-serif" }}>Not this time</span>
                </button>
                <button
                  onClick={(e) => handleRate('like', e)}
                  className="flex-1 group relative overflow-hidden rounded-2xl py-6 flex flex-col items-center gap-3 transition-all duration-200 active:scale-[0.96]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,64,160,0.12), rgba(224,64,160,0.06))',
                    border: '1px solid rgba(224,64,160,0.20)',
                    boxShadow: '0 4px 24px rgba(224,64,160,0.08)',
                  }}
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">{'\u{1F525}'}</span>
                  <span className="text-sm font-medium text-[#E040A0]/80" style={{ fontFamily: "'DM Sans', sans-serif" }}>I felt it</span>
                </button>
              </div>
            </>
          )}

          {/* ─── PHASE 2: Vibe check ─── */}
          {phase === 'vibe' && (
            <>
              <h2
                className="text-3xl md:text-5xl text-center mb-3 leading-tight"
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

              <p className="text-xs text-white/20 mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                One word that captures it
              </p>

              {/* 3x2 grid of vibe pills */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                {vibeOptions.map((v) => (
                  <button
                    key={v.label}
                    onClick={(e) => handleVibe(v.label, e, v.color)}
                    className="group relative overflow-hidden rounded-2xl py-5 flex flex-col items-center gap-2.5 transition-all duration-200 active:scale-[0.94]"
                    style={{
                      background: selectedVibe === v.label
                        ? `linear-gradient(135deg, ${v.color}25, ${v.color}10)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedVibe === v.label ? `${v.color}40` : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: selectedVibe === v.label ? `0 4px 20px ${v.color}15` : 'none',
                    }}
                  >
                    <span className="text-2xl transition-transform duration-200 group-hover:scale-110">{v.emoji}</span>
                    <span
                      className="text-xs font-medium transition-colors duration-200"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: selectedVibe === v.label ? v.color : 'rgba(255,255,255,0.4)',
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
              <h2
                className="text-3xl md:text-5xl text-center mb-3 leading-tight"
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

              <p className="text-xs text-white/20 mb-10" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Honest answer only
              </p>

              {/* Stacked full-width options — typeform style */}
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {dateIntentOptions.map((opt, i) => (
                  <button
                    key={opt.value}
                    onClick={(e) => handleIntent(opt.value, e)}
                    className="group relative overflow-hidden rounded-2xl py-4 px-5 flex items-center gap-4 transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: selectedIntent === opt.value
                        ? 'linear-gradient(135deg, rgba(224,64,160,0.15), rgba(224,64,160,0.05))'
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedIntent === opt.value ? 'rgba(224,64,160,0.30)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    {/* Keyboard shortcut hint */}
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[0.6rem] font-mono font-bold flex-shrink-0"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.25)',
                        border: '1px solid rgba(255,255,255,0.06)',
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

          {/* ─── PHASE 4: Done — minimal confirmation ─── */}
          {phase === 'done' && (
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'radial-gradient(circle, rgba(224,64,160,0.15) 0%, transparent 70%)',
                  animation: 'pulse-glow 1.5s ease-in-out infinite',
                }}
              >
                <svg className="w-7 h-7 text-[#E040A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" style={{ animation: 'draw-check 0.5s ease-out forwards' }} />
                </svg>
              </div>
              <p
                className="text-lg text-white/30"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}
              >
                Noted. Moving on...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom: Sponsor tag ═══ */}
      <div
        className="relative z-10 pb-6 flex items-center justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1.5s ease-out 1s',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(10px)' }}>
          <span className="text-[0.5rem] tracking-[0.15em] uppercase text-white/20">This moment by</span>
          <span className="text-[0.55rem] font-medium" style={{ color: sponsor.accent, opacity: 0.5 }}>{sponsor.brand}</span>
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
