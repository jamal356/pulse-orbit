import { useState, useEffect, useCallback } from 'react'
import { candidates } from '../data/people'
import { sponsors } from '../data/sponsors'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  dateIndex: number
  onRate: (name: string, rating: 'like' | 'pass') => void
}

/* âââ Compatibility whispers â AI-style micro-insights âââ */
const compatibilityWhispers: Record<string, string> = {
  Sofia: "You both value experiences over things \u2014 that\u2019s rare chemistry.",
  Layla: "Different energy, different wavelength \u2014 trust your gut.",
  Amira: "Shared creative passions can be a powerful foundation.",
  Nour: "Two ambitious minds \u2014 could be fireworks or fuel.",
  Yasmine: "Style meets substance \u2014 but did the conversation match?",
}

/* âââ Vibe options â quick emotional fingerprint âââ */
const vibeOptions = [
  { emoji: '\u26A1', label: 'Electric', color: '#FF6EC7' },
  { emoji: '\u{1F60A}', label: 'Warm', color: '#FF9F0A' },
  { emoji: '\u{1F914}', label: 'Interesting', color: '#6060FF' },
  { emoji: '\u{1F602}', label: 'Fun', color: '#30D158' },
  { emoji: '\u{1F32A}\u{FE0F}', label: 'Intense', color: '#E040A0' },
  { emoji: '\u{1F636}', label: 'Awkward', color: '#7A7A80' },
]

/* âââ Real-date intent options âââ */
const dateIntentOptions = [
  { emoji: '\u{1F4AF}', label: 'Absolutely', value: 'definitely' as const },
  { emoji: '\u{1F914}', label: 'Maybe', value: 'maybe' as const },
  { emoji: '\u{1F91D}', label: 'As friends', value: 'friends' as const },
  { emoji: '\u274C', label: 'Nah', value: 'no' as const },
]

type Phase = 'rating' | 'vibe' | 'intent' | 'done'

export default function MatchSurvey({ dateIndex, onRate }: Props) {
  const person = candidates[dateIndex] || candidates[0]
  const sponsor = sponsors[dateIndex % sponsors.length]
  const [visible, setVisible] = useState(false)
  const [showWhisper, setShowWhisper] = useState(false)
  const [phase, setPhase] = useState<Phase>('rating')
  const [rating, setRating] = useState<'like' | 'pass' | null>(null)
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => setShowWhisper(true), 600)
  }, [])

  const handleRate = useCallback((r: 'like' | 'pass') => {
    setRating(r)
    // Brief pause to show selection, then advance to vibe phase
    setTimeout(() => setPhase('vibe'), 500)
  }, [])

  const handleVibe = useCallback((vibe: string) => {
    setSelectedVibe(vibe)
    // Advance to intent phase
    setTimeout(() => setPhase('intent'), 400)
  }, [])

  const handleIntent = useCallback((intent: string) => {
    setSelectedIntent(intent)
    setPhase('done')
    // Brief celebration, then advance to next screen
    setTimeout(() => {
      if (rating) onRate(person.name, rating)
    }, 600)
  }, [rating, person.name, onRate])

  const whisper = compatibilityWhispers[person.name] || 'Trust what you felt in the moment.'

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#2A2A2E]">
      <BackgroundOrbs />

      <div className={`relative z-10 flex flex-col items-center px-6 max-w-md w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header */}
        <p className="text-[0.7rem] tracking-[0.25em] uppercase text-[#B0B0B8] mb-4 font-medium">
          Date {dateIndex + 1} of 5 complete
        </p>

        {/* Progress dots â shows which phase we're on */}
        <div className="flex items-center gap-2 mb-5">
          {['rating', 'vibe', 'intent'].map((p, i) => {
            const phases: Phase[] = ['rating', 'vibe', 'intent']
            const currentIdx = phases.indexOf(phase === 'done' ? 'intent' : phase)
            const isActive = i <= currentIdx
            return (
              <div key={p} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: isActive ? '#E040A0' : 'rgba(224,64,160,0.15)',
                    boxShadow: isActive ? '0 0 8px rgba(224,64,160,0.4)' : 'none',
                    transform: isActive ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                {i < 2 && (
                  <div className="w-6 h-px" style={{ backgroundColor: i < currentIdx ? 'rgba(224,64,160,0.3)' : 'rgba(224,64,160,0.08)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Person photo â shrinks after rating phase */}
        <div className={`relative mb-4 transition-all duration-500 ${phase !== 'rating' ? 'scale-75 -mb-1' : ''}`}>
          <img
            src={person.photo}
            alt={person.name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover"
            style={{ border: '3px solid #E040A0', boxShadow: '0 8px 30px rgba(224,64,160,0.15)' }}
          />
          {/* Rating badge â shows after rating */}
          {rating && phase !== 'rating' && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center animate-scale-in"
              style={{ background: rating === 'like' ? '#E040A0' : '#3A3A3E', border: '2px solid #2A2A2E' }}>
              <span className="text-xs">{rating === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span>
            </div>
          )}
        </div>

        {/* Person name â always visible */}
        <h2 className={`text-xl md:text-2xl font-bold font-display mb-0.5 text-white transition-all duration-500 ${phase !== 'rating' ? 'text-lg' : ''}`}>
          {person.name}, {person.age}
        </h2>
        <p className={`text-xs text-[#98989D] transition-all duration-500 ${phase === 'rating' ? 'mb-1' : 'mb-3'}`}>{person.location}</p>

        {/* âââââââ PHASE 1: RATING âââââââ */}
        {phase === 'rating' && (
          <div className="animate-fade-in w-full flex flex-col items-center">
            <p className="text-sm text-[#E0E0E5] italic mb-3 text-center">{person.bio}</p>

            {/* AI whisper */}
            <div
              className="mb-5 max-w-xs text-center"
              style={{
                opacity: showWhisper ? 1 : 0,
                transform: showWhisper ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 800ms ease-out',
              }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(224,64,160,0.06)', border: '0.5px solid rgba(224,64,160,0.12)' }}>
                <svg className="w-3 h-3 text-[#E040A0]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-[0.65rem] text-white/40 italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{whisper}</p>
              </div>
            </div>

            <h3
              className="text-xl md:text-2xl font-display italic mb-8 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#F5F5F7' }}
            >
              Did you feel the chemistry?
            </h3>

            <div className="flex gap-5 w-full max-w-xs">
              <button
                onClick={() => handleRate('pass')}
                className="flex-1 glass-button rounded-2xl py-5 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="text-3xl">{'\u2744\u{FE0F}'}</span>
                <span className="text-sm font-semibold text-[#E0E0E5]">Not this time</span>
              </button>
              <button
                onClick={() => handleRate('like')}
                className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                style={{
                  backgroundColor: 'rgba(224,64,160,0.10)',
                  border: '1px solid rgba(224,64,160,0.25)',
                  boxShadow: '0 2px 8px rgba(224,64,160,0.08)',
                }}
              >
                <span className="text-3xl">{'\u{1F525}'}</span>
                <span className="text-sm font-semibold text-[#E040A0]">I felt it</span>
              </button>
            </div>
          </div>
        )}

        {/* âââââââ PHASE 2: VIBE CHECK âââââââ */}
        {phase === 'vibe' && (
          <div className="animate-slide-up w-full flex flex-col items-center" style={{ animationDuration: '0.4s' }}>
            <h3
              className="text-lg md:text-xl font-display italic mb-2 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#F5F5F7' }}
            >
              What was the vibe?
            </h3>
            <p className="text-[0.65rem] text-white/30 mb-5">One word that captures it</p>

            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
              {vibeOptions.map((v) => (
                <button
                  key={v.label}
                  onClick={() => handleVibe(v.label)}
                  className={`rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${selectedVibe === v.label ? 'ring-2' : ''}`}
                  style={{
                    backgroundColor: selectedVibe === v.label ? `${v.color}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedVibe === v.label ? `${v.color}50` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: selectedVibe === v.label ? `0 0 0 2px ${v.color}40` : 'none',
                  }}
                >
                  <span className="text-xl">{v.emoji}</span>
                  <span className="text-[0.65rem] font-medium" style={{ color: selectedVibe === v.label ? v.color : '#B0B0B8' }}>{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* âââââââ PHASE 3: REAL DATE INTENT âââââââ */}
        {phase === 'intent' && (
          <div className="animate-slide-up w-full flex flex-col items-center" style={{ animationDuration: '0.4s' }}>
            <h3
              className="text-lg md:text-xl font-display italic mb-2 text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#F5F5F7' }}
            >
              Would you go on a real date?
            </h3>
            <p className="text-[0.65rem] text-white/30 mb-5">Honest answer only</p>

            <div className="flex gap-2.5 w-full max-w-xs">
              {dateIntentOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleIntent(opt.value)}
                  className={`flex-1 rounded-xl py-3.5 flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 transition-all ${selectedIntent === opt.value ? 'ring-2 ring-[#E040A0]' : ''}`}
                  style={{
                    backgroundColor: selectedIntent === opt.value ? 'rgba(224,64,160,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${selectedIntent === opt.value ? 'rgba(224,64,160,0.30)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="text-[0.6rem] font-medium" style={{ color: selectedIntent === opt.value ? '#E040A0' : '#B0B0B8' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* âââââââ PHASE 4: DONE â brief confirmation âââââââ */}
        {phase === 'done' && (
          <div className="animate-scale-in flex flex-col items-center mt-4">
            <div className="w-10 h-10 rounded-full bg-[#E040A0]/15 flex items-center justify-center mb-3"
              style={{ boxShadow: '0 0 30px rgba(224,64,160,0.2)' }}>
              <svg className="w-5 h-5 text-[#E040A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-white/40" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>Noted. Moving on...</p>
          </div>
        )}
      </div>

      {/* ââ Discreet sponsor tag â bottom of screen ââ */}
      <div
        className="absolute bottom-5 left-0 right-0 z-10 flex items-center justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 1.5s ease-out 1s',
        }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(10px)' }}>
          <span className="text-[0.5rem] tracking-[0.15em] uppercase text-white/20">This moment by</span>
          <span className="text-[0.55rem] font-medium" style={{ color: sponsor.accent, opacity: 0.5 }}>{sponsor.brand}</span>
        </div>
      </div>

      <style>{`
        @keyframes slide-up-survey {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
