import { useEffect, useState, useCallback, useRef } from 'react'
import { photos, conversationStarters, USER_COLOR } from '../data/people'
import type { Candidate } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  candidate: Candidate
  onComplete: () => void
}

type SpeedDatePhase = 'intro' | 'live' | 'rating' | 'result' | 'next'

interface ConfettiPiece { id: number; left: number; delay: number; duration: number; color: string; size: number; rotation: number }
function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#E040A0', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700']
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6, rotation: Math.random() * 360,
  }))
}

const reactionEmojis = ['😂', '🔥', '❤️', '😍', '👏', '😮']

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
}

/* ─── 1-TO-1 SPEED DATE ─────────────────────────────────────
   Intimate format. One person, full attention, no group queue.
   Same 5-minute structure but everything feels more personal.
   This is what happens after a mutual match — no texting,
   no chat, just chemistry verification via live video.
   ──────────────────────────────────────────────────────────── */
const CONVERSATION_TIME = 300   // 5 minutes
const ONE_MORE_TIME = 60        // +1 minute boost

export default function SpeedDate({ candidate, onComplete }: Props) {
  const [phase, setPhase] = useState<SpeedDatePhase>('intro')
  const [timer, setTimer] = useState(CONVERSATION_TIME)
  const [visible, setVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const emojiIdRef = useRef(0)

  // Compatibility
  const [compatScore, setCompatScore] = useState(0)
  const [compatTarget] = useState(() => Math.floor(Math.random() * 15) + 82)
  const [showCompat, setShowCompat] = useState(false)

  // Spark
  const [userSparked, setUserSparked] = useState(false)
  const [partnerSparked, setPartnerSparked] = useState(false)
  const [sparkRevealed, setSparkRevealed] = useState(false)
  const [sparkGlow, setSparkGlow] = useState(false)

  // One More Thing
  const [usedOneMore, setUsedOneMore] = useState(false)
  const [oneMoreFlash, setOneMoreFlash] = useState(false)

  // End date confirmation
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Post-date state
  const [userRating, setUserRating] = useState<'like' | 'pass' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [confetti] = useState(() => makeConfetti(60))
  const [showConfetti, setShowConfetti] = useState(false)

  // Intro sequence — 3 seconds then live
  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const introTimer = setTimeout(() => {
      setPhase('live')
      setShowCompat(true)
    }, 3000)
    return () => clearTimeout(introTimer)
  }, [])

  // Main countdown — only runs during live phase
  useEffect(() => {
    if (phase !== 'live') return
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    // Partner reactions
    const partnerTimer = setInterval(() => {
      const emoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)]
      spawnEmoji(emoji)
    }, 5000)

    // Partner sparks with higher probability (they already matched)
    const sparkDelay = 60000 + Math.random() * 90000
    const partnerSparkTimer = setTimeout(() => {
      if (Math.random() < 0.65) setPartnerSparked(true)
    }, sparkDelay)

    return () => {
      clearInterval(interval)
      clearInterval(partnerTimer)
      clearTimeout(partnerSparkTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Mutual Spark detection
  useEffect(() => {
    if (userSparked && partnerSparked && !sparkRevealed) {
      setSparkRevealed(true)
      setSparkGlow(true)
      setTimeout(() => setSparkGlow(false), 4000)
    }
  }, [userSparked, partnerSparked, sparkRevealed])

  // Animate compat score
  useEffect(() => {
    if (!showCompat) return
    const step = () => {
      setCompatScore(prev => {
        if (prev >= compatTarget) return compatTarget
        return prev + 1
      })
    }
    const id = setInterval(step, 25)
    return () => clearInterval(id)
  }, [showCompat, compatTarget])

  const spawnEmoji = useCallback((emoji: string) => {
    const id = emojiIdRef.current++
    const x = 10 + Math.random() * 80
    setFloatingEmojis(prev => [...prev, { id, emoji, x }])
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id))
    }, 3000)
  }, [])

  const handleReaction = useCallback((emoji: string) => {
    spawnEmoji(emoji)
    setTimeout(() => {
      const response = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)]
      spawnEmoji(response)
    }, 800 + Math.random() * 1200)
  }, [spawnEmoji])

  const spinForQuestion = useCallback(() => {
    if (isSpinning) return
    setIsSpinning(true)
    setCurrentQuestion(null)
    let count = 0
    const shuffleInterval = setInterval(() => {
      setCurrentQuestion(conversationStarters[Math.floor(Math.random() * conversationStarters.length)])
      count++
      if (count > 10) {
        clearInterval(shuffleInterval)
        setCurrentQuestion(conversationStarters[Math.floor(Math.random() * conversationStarters.length)])
        setIsSpinning(false)
      }
    }, 120)
  }, [isSpinning])

  const handleSpark = useCallback(() => {
    if (userSparked) return
    setUserSparked(true)
  }, [userSparked])

  const handleOneMore = useCallback(() => {
    if (usedOneMore) return
    setUsedOneMore(true)
    setTimer(prev => prev + ONE_MORE_TIME)
    setOneMoreFlash(true)
    setTimeout(() => setOneMoreFlash(false), 2500)
  }, [usedOneMore])

  // End date → go to rating phase
  const handleEndDate = useCallback(() => {
    setShowEndConfirm(false)
    setPhase('rating')
  }, [])

  // Rate the date → reveal result
  const handleRate = useCallback((rating: 'like' | 'pass') => {
    setUserRating(rating)
    // Brief pause, then reveal their rating
    setTimeout(() => {
      setShowResult(true)
      if (rating === 'like') {
        // Simulate mutual match for the demo
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
      // After result reveal, show next step
      setTimeout(() => setPhase('next'), rating === 'like' ? 3500 : 2000)
    }, 800)
  }, [])

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60
  const compatArc = (compatScore / 100) * 283

  // ── INTRO SCREEN — cinematic "connecting you" moment ──
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 bg-[#1a1a1e] flex flex-col items-center justify-center overflow-hidden">
        <BackgroundOrbs />
        <div className={`relative z-10 text-center transition-all duration-700 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Both photos */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="relative">
              <img src={photos.user} alt="You" className="w-20 h-20 rounded-full object-cover"
                style={{ border: `3px solid ${USER_COLOR.primary}`, boxShadow: `0 0 30px rgba(${USER_COLOR.rgb},0.3)` }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold glass-button" style={{ color: USER_COLOR.primary }}>You</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <div className="relative">
              <img src={candidate.photo} alt={candidate.name} className="w-20 h-20 rounded-full object-cover"
                style={{ border: '3px solid #E040A0', boxShadow: '0 0 30px rgba(224,64,160,0.3)' }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[0.6rem] font-semibold glass-button text-[#E040A0]">{candidate.name}</div>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.3em] text-[#E040A0] font-semibold mb-3 animate-pulse">1-to-1 Speed Date</p>
          <h2 className="text-2xl md:text-3xl font-display text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic' }}>
            You matched. Now verify the chemistry.
          </h2>
          <p className="text-sm text-[#98989D]">5 minutes. One conversation. No texting required.</p>

          {/* Connecting animation */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
            <span className="text-xs text-[#30D158]/70">Connecting...</span>
          </div>
        </div>
      </div>
    )
  }

  // ── RATING PHASE — "Did you feel the chemistry?" ──
  if (phase === 'rating') {
    return (
      <div className="fixed inset-0 bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
        <BackgroundOrbs />
        <div className="relative z-10 w-full max-w-md mx-auto px-6 text-center animate-fade-in">
          <img src={candidate.photo} alt={candidate.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
            style={{ border: '3px solid rgba(224,64,160,0.4)', boxShadow: '0 0 30px rgba(224,64,160,0.2)' }} />
          <h2 className="text-2xl font-bold text-white mb-1 font-display">{candidate.name}, {candidate.age}</h2>
          <p className="text-sm text-[#98989D] mb-8">Your 1-to-1 speed date just ended</p>

          <h3 className="text-lg text-white mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
            Did you feel the chemistry?
          </h3>

          {!userRating ? (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleRate('pass')}
                className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'rgba(255,59,48,0.08)', border: '1.5px solid rgba(255,59,48,0.20)' }}>
                <span className="text-3xl">❄️</span>
                <span className="text-sm font-semibold text-[#FF3B30]">Not this time</span>
              </button>
              <button onClick={() => handleRate('like')}
                className="flex flex-col items-center gap-2 px-8 py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'rgba(224,64,160,0.08)', border: '1.5px solid rgba(224,64,160,0.25)', boxShadow: '0 0 20px rgba(224,64,160,0.1)' }}>
                <span className="text-3xl">🔥</span>
                <span className="text-sm font-semibold text-[#E040A0]">I felt it</span>
              </button>
            </div>
          ) : (
            <div className="animate-scale-in">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{ background: userRating === 'like' ? 'rgba(224,64,160,0.15)' : 'rgba(255,59,48,0.10)' }}>
                <span className="text-3xl">{userRating === 'like' ? '🔥' : '❄️'}</span>
              </div>
              {showResult && (
                <div className="animate-fade-in">
                  {userRating === 'like' ? (
                    <>
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <img src={photos.user} alt="You" className="w-10 h-10 rounded-full object-cover" style={{ border: `2px solid ${USER_COLOR.primary}` }} />
                        <span className="text-2xl" style={{ animation: 'spark-pulse 0.8s ease-in-out infinite' }}>💖</span>
                        <img src={candidate.photo} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" style={{ border: '2px solid #E040A0' }} />
                      </div>
                      <p className="text-lg font-bold text-[#E040A0] mb-1">Mutual Match!</p>
                      <p className="text-sm text-[#98989D]">{candidate.name} felt it too. Connection saved.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-semibold text-white mb-1">Noted.</p>
                      <p className="text-sm text-[#98989D]">No worries — more connections ahead.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {confetti.map(p => (
              <div key={p.id} className="absolute top-0" style={{
                left: `${p.left}%`, width: `${p.size}px`, height: `${p.size * 1.8}px`,
                backgroundColor: p.color, borderRadius: '2px', transform: `rotate(${p.rotation}deg)`,
                animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`, opacity: 0,
              }} />
            ))}
          </div>
        )}
        <style>{`@keyframes spark-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }`}</style>
      </div>
    )
  }

  // ── NEXT PHASE — CTA to group session ──
  if (phase === 'next') {
    return (
      <div className="fixed inset-0 bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
        <BackgroundOrbs />
        <div className="relative z-10 w-full max-w-lg mx-auto px-6 animate-fade-in">
          {/* Summary card */}
          <div className="glass-tile rounded-3xl p-8 text-center mb-6" style={{ border: '1px solid rgba(224,64,160,0.15)' }}>
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ background: 'rgba(224,64,160,0.12)' }}>
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-display">1-to-1 Speed Date Complete</h2>
            <p className="text-sm text-[#98989D] mb-6 leading-relaxed">
              That's the power of Pulse — matched, verified, and connected in under 10 minutes. No swiping for weeks. No awkward texts. Just chemistry, face to face.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass-button rounded-xl p-3">
                <p className="text-xl font-bold text-[#E040A0] font-display">5m</p>
                <p className="text-[0.6rem] text-[#7A7A80] uppercase tracking-wider">Date Length</p>
              </div>
              <div className="glass-button rounded-xl p-3">
                <p className="text-xl font-bold text-[#E040A0] font-display">{compatTarget}%</p>
                <p className="text-[0.6rem] text-[#7A7A80] uppercase tracking-wider">Chemistry</p>
              </div>
              <div className="glass-button rounded-xl p-3">
                <p className="text-xl font-bold text-[#30D158] font-display">{userRating === 'like' ? '💖' : '—'}</p>
                <p className="text-[0.6rem] text-[#7A7A80] uppercase tracking-wider">{userRating === 'like' ? 'Matched' : 'No Match'}</p>
              </div>
            </div>

            <div className="h-px mb-6" style={{ background: 'rgba(224,64,160,0.10)' }} />

            {/* What's next */}
            <div className="text-left mb-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#E040A0] font-semibold mb-2">What's next?</p>
              <p className="text-sm text-[#B0B0B8] leading-relaxed">
                Keep going. Find another Spark, or join <span className="text-white font-semibold">The Round</span> — 5 new people, 5 minutes each. Someone might surprise you.
              </p>
            </div>

            <button onClick={onComplete}
              className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{ background: 'linear-gradient(135deg, #E040A0 0%, #C030A0 100%)', boxShadow: '0 4px 20px rgba(224,64,160,0.35)' }}>
              Continue
            </button>
          </div>

          {/* Subtle Pulse branding */}
          <p className="text-center text-[0.65rem] text-[#7A7A80]">
            Two paths to connection. Zero time wasted.
          </p>
        </div>
      </div>
    )
  }

  // ── LIVE PHASE — the actual 1-to-1 speed date ──
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#2A2A2E' }}>
      <BackgroundOrbs />

      {/* Spark glow */}
      {sparkRevealed && (
        <div className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000"
          style={{ opacity: sparkGlow ? 1 : 0.3, boxShadow: 'inset 0 0 80px rgba(224,64,160,0.35), inset 0 0 200px rgba(224,64,160,0.15)' }} />
      )}

      {/* Floating emojis */}
      {floatingEmojis.map(e => (
        <div key={e.id} className="fixed z-30 text-3xl pointer-events-none"
          style={{ left: `${e.x}%`, bottom: '15%', animation: 'emoji-float 3s ease-out forwards' }}>
          {e.emoji}
        </div>
      ))}

      {/* Mutual Spark celebration */}
      {sparkRevealed && sparkGlow && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="animate-scale-in text-center">
            <div className="text-6xl mb-2" style={{ animation: 'spark-pulse 0.8s ease-in-out infinite' }}>✨</div>
            <p className="text-sm font-semibold text-[#E040A0] tracking-wide animate-fade-in"
              style={{ animationDelay: '0.3s', animationFillMode: 'backwards', textShadow: '0 0 20px rgba(224,64,160,0.5)' }}>
              Mutual Spark!
            </p>
          </div>
        </div>
      )}

      {/* One More Thing celebration */}
      {oneMoreFlash && (
        <>
          <div className="fixed inset-0 pointer-events-none z-40 animate-fade-in"
            style={{ background: `radial-gradient(circle at center, rgba(${USER_COLOR.rgb},0.12) 0%, transparent 70%)`, animation: 'extend-glow 2.5s ease-out forwards' }} />
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="animate-scale-in text-center">
              <div className="text-5xl mb-2">⚡</div>
              <p className="text-lg font-bold text-white mb-1">+1 Minute!</p>
              <p className="text-sm" style={{ color: USER_COLOR.primary }}>The vibe continues...</p>
            </div>
          </div>
        </>
      )}

      {/* End date confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-tile rounded-3xl p-6 max-w-sm mx-4 w-full animate-scale-in" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#E040A0]/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👋</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">End this speed date?</h3>
              <p className="text-sm text-[#98989D] leading-relaxed">
                You'll return to your match results. This date can't be restarted.
              </p>
            </div>
            <div className="space-y-2.5">
              <button onClick={handleEndDate}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-[0.98] transition-transform"
                style={{ background: 'linear-gradient(135deg, #E040A0, #C030A0)' }}>
                End Date
              </button>
              <button onClick={() => setShowEndConfirm(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold glass-button text-[#98989D] active:scale-[0.98] transition-transform">
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 flex-1 flex flex-col transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Video panel */}
        <div className="flex-1 relative overflow-hidden transition-all duration-1000"
          style={{
            border: sparkRevealed ? '3px solid #E040A0' : '3px solid #E040A0',
            boxShadow: sparkRevealed
              ? `0 0 0 1.5px #E040A0, 0 0 ${sparkGlow ? '60' : '25'}px rgba(224, 64, 160, ${sparkGlow ? '0.50' : '0.20'})`
              : '0 0 0 1px #E040A0, 0 0 20px rgba(224, 64, 160, 0.30)',
          }}>
          <img src={candidate.photo} alt={`${candidate.name}, ${candidate.age}`}
            className="object-cover w-full h-full absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="glass-button rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
                <span className="text-[#E040A0]">♥</span>
                <span className="text-[#E0E0E5]">1-to-1 Speed Date</span>
              </div>
              <div className="glass-button rounded-full px-3 py-1.5 text-xs font-semibold text-[#30D158] flex items-center gap-1.5 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                Mutual Match
              </div>
            </div>
          </div>

          {/* Compatibility score */}
          {showCompat && (
            <div className="absolute top-14 right-4 z-20 animate-scale-in">
              <div className="glass-tile rounded-xl p-2.5 flex items-center gap-2">
                <div className="w-11 h-11 relative">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(224,64,160,0.15)" strokeWidth="5" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#E040A0" strokeWidth="5" strokeLinecap="round" strokeDasharray="283" strokeDashoffset={283 - compatArc} className="transition-all duration-300" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-[#E040A0]">{compatScore}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[0.65rem] uppercase tracking-wider font-semibold text-[#B0B0B8]">Chemistry</p>
                  <p className="text-[0.7rem] font-medium text-[#E0E0E5]">
                    {compatScore >= 90 ? 'On fire!' : compatScore >= 85 ? 'Amazing!' : 'Great vibe!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Spark sent indicator */}
          {userSparked && !sparkRevealed && (
            <div className="absolute top-14 left-4 z-20 animate-fade-in">
              <div className="glass-tile rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <span className="text-sm" style={{ animation: 'spark-pulse 1.5s ease-in-out infinite' }}>✨</span>
                <span className="text-[0.6rem]" style={{ color: `rgba(${USER_COLOR.rgb},0.6)` }}>Spark sent</span>
              </div>
            </div>
          )}

          {/* Partner info */}
          <div className="absolute bottom-4 left-4 z-20 animate-slide-up">
            <div className="glass-tile backdrop-blur-xl rounded-2xl px-4 py-3 max-w-[280px] md:max-w-[340px]">
              <div className="flex items-center gap-2.5 mb-2">
                <img src={candidate.photo} alt={candidate.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-[rgba(224,64,160,0.3)]" />
                <div>
                  <p className="font-semibold text-sm text-white">{candidate.name}, {candidate.age}</p>
                  <p className="text-[0.7rem] text-[#E0E0E5]">{candidate.location}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-[#30D158]" />
                  <span className="text-[0.65rem] text-[#30D158]/80">Live</span>
                </div>
              </div>
              <p className="text-[0.75rem] text-[#98989D] mb-2 italic">{candidate.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.tags.map(tag => (
                  <span key={tag} className="text-[0.7rem] px-2.5 py-1 rounded-full font-medium text-[#E040A0] glass-button">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* User PiP */}
          <div className="absolute bottom-4 right-4 z-20 w-[110px] h-[150px] md:w-[140px] md:h-[190px] overflow-hidden shadow-2xl"
            style={{ borderRadius: '20px', border: `3px solid rgba(${USER_COLOR.rgb}, 0.5)`, boxShadow: `0 0 15px rgba(${USER_COLOR.rgb}, 0.2), 0 8px 32px rgba(0,0,0,0.4)` }}>
            <img src={photos.user} alt="You" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-medium glass-button" style={{ color: USER_COLOR.primary }}>You</div>
          </div>

          {/* Question display */}
          {currentQuestion && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[90%] max-w-xl animate-scale-in">
              <div className="glass-tile backdrop-blur-xl rounded-2xl px-6 py-4 text-center">
                <p className="text-[0.7rem] uppercase tracking-[0.2em] mb-1.5 font-medium text-[#E0E0E5]">Conversation Starter</p>
                <p className="text-base md:text-lg font-medium leading-relaxed text-white">{currentQuestion}</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom control bar */}
        <div className="relative z-20 glass-strong backdrop-blur-xl px-3 py-2 md:py-3 flex items-center gap-2 md:gap-3"
          style={{ borderTop: '1px solid rgba(224, 64, 160, 0.1)' }}>

          {/* Timer */}
          <div className={`shrink-0 flex items-center gap-1.5 glass-button rounded-full px-3 py-1.5 transition-colors duration-300 ${timer <= 30 ? 'animate-pulse' : ''}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${timer <= 30 ? 'bg-[#FF9F0A]' : 'bg-[#E040A0]'}`} />
            <span className={`text-xs font-mono font-semibold ${timer <= 30 ? 'text-[#FF9F0A]' : 'text-[#E040A0]'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* One More Thing */}
          {!usedOneMore && (
            <button onClick={handleOneMore}
              className="shrink-0 group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 active:scale-95 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, rgba(${USER_COLOR.rgb},0.20), rgba(224,64,160,0.15))`,
                border: `1.5px solid rgba(${USER_COLOR.rgb},0.35)`,
                boxShadow: `0 0 10px rgba(${USER_COLOR.rgb},0.15)`,
              }}
              title="Add 1 minute — keep the vibe going">
              <span className="text-base">⚡</span>
              <span className="text-[0.65rem] font-bold text-white/90 whitespace-nowrap">One More Thing</span>
            </button>
          )}

          {/* Spark Signal */}
          <button onClick={handleSpark} disabled={userSparked}
            className={`shrink-0 relative transition-all duration-300 ${userSparked ? 'opacity-60 scale-95' : 'hover:scale-110 active:scale-90'}`}
            title={userSparked ? 'Spark sent!' : "Send a Spark — if they spark too, you'll both know"}>
            <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
              sparkRevealed ? 'bg-[#E040A0]/30 ring-2 ring-[#E040A0]' : userSparked ? 'border' : 'glass-button'
            }`}
              style={sparkRevealed ? { boxShadow: '0 0 20px rgba(224,64,160,0.4)' } : userSparked ? { background: `rgba(${USER_COLOR.rgb},0.15)`, borderColor: `rgba(${USER_COLOR.rgb},0.30)` } : undefined}>
              <span className="text-lg" style={sparkRevealed ? { animation: 'spark-pulse 0.8s ease-in-out infinite' } : undefined}>
                {sparkRevealed ? '💖' : '✨'}
              </span>
            </div>
            {!userSparked && (
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[0.5rem] text-white/30 whitespace-nowrap">Spark</span>
            )}
          </button>

          {/* Emoji reactions */}
          <div className="flex-1 overflow-x-auto scrollbar-hide glass-button rounded-full px-1.5 py-0.5">
            <div className="flex items-center gap-1 min-w-max">
              {reactionEmojis.map(emoji => (
                <button key={emoji} onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm md:text-base hover:scale-125 active:scale-90 transition-transform shrink-0 glass-button">
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Spin for question */}
          <button onClick={spinForQuestion} disabled={isSpinning}
            className="shrink-0 group relative" title="Spin for a question">
            <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 bg-[#E040A0] ${isSpinning ? 'animate-spin' : ''}`}
              style={{ boxShadow: '0 4px 20px rgba(224, 64, 160, 0.4)', animationDuration: isSpinning ? '0.5s' : undefined }}>
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </button>

          {/* End Date */}
          <button onClick={() => setShowEndConfirm(true)}
            className="shrink-0 group relative" title="End Date">
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 glass-button">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#E040A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spark-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes extend-glow {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
