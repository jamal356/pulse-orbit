import { useEffect, useState, useCallback, useRef } from 'react'
import { photos, candidates, conversationStarters, USER_COLOR } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  dateIndex: number
  onNavigate: () => void
}

const reactionEmojis = ['😂', '🔥', '❤️', '😍', '👏', '😮']

interface FloatingEmoji {
  id: number
  emoji: string
  x: number
}

/* ─── SLOT ARCHITECTURE ───────────────────────────────────────
   The user sees "5-minute dates." The slot is actually 7 minutes.
   5:00 conversation → 0:30 rating buffer → 1:30 transition/sponsor
   When BOTH people hit Extend, the extra 2 min come from the buffer.
   Conversation goes to 7:00, transition is instant. Schedule never shifts.
   ──────────────────────────────────────────────────────────── */
const CONVERSATION_TIME = 300  // 5 minutes default
const EXTENDED_TIME = 420      // 7 minutes when mutually extended
const EXTEND_WINDOW = 30       // Extend button appears in last 30 seconds

export default function LiveSession({ dateIndex, onNavigate }: Props) {
  const person = candidates[dateIndex] || candidates[0]
  const [timer, setTimer] = useState(CONVERSATION_TIME)
  const [visible, setVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const emojiIdRef = useRef(0)

  // Emergency exit state
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
  const [emergencyTriggered, setEmergencyTriggered] = useState(false)

  // Compatibility animation
  const [compatScore, setCompatScore] = useState(0)
  const [compatTarget] = useState(() => Math.floor(Math.random() * 30) + 65)
  const [showCompat, setShowCompat] = useState(false)

  // ── SPARK SIGNAL ──
  // Either person can tap. If BOTH tap during the same date, magic happens.
  const [userSparked, setUserSparked] = useState(false)
  const [partnerSparked, setPartnerSparked] = useState(false)
  const [sparkRevealed, setSparkRevealed] = useState(false)
  const [sparkGlow, setSparkGlow] = useState(false)

  // ── EXTEND ──
  const [userExtended, setUserExtended] = useState(false)
  const [partnerExtended, setPartnerExtended] = useState(false)
  const [isExtended, setIsExtended] = useState(false)
  const [extendFlash, setExtendFlash] = useState(false)

  const showExtendButton = timer <= EXTEND_WINDOW && timer > 0 && !isExtended

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    setTimeout(() => setShowCompat(true), 1200)

    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    // Simulate partner reactions
    const partnerTimer = setInterval(() => {
      const emoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)]
      spawnEmoji(emoji)
    }, 6000)

    // Simulate partner spark (35% chance, after 2-4 minutes)
    const sparkDelay = 120000 + Math.random() * 120000
    const partnerSparkTimer = setTimeout(() => {
      if (Math.random() < 0.35) {
        setPartnerSparked(true)
      }
    }, sparkDelay)

    // Simulate partner extend (60% chance, when timer is low)
    const partnerExtendTimer = setTimeout(() => {
      if (Math.random() < 0.6) {
        setPartnerExtended(true)
      }
    }, (CONVERSATION_TIME - EXTEND_WINDOW + 5) * 1000)

    return () => {
      clearInterval(interval)
      clearInterval(partnerTimer)
      clearTimeout(partnerSparkTimer)
      clearTimeout(partnerExtendTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Mutual Spark detection ──
  useEffect(() => {
    if (userSparked && partnerSparked && !sparkRevealed) {
      setSparkRevealed(true)
      setSparkGlow(true)
      // Glow lasts 4 seconds, then dims to subtle
      setTimeout(() => setSparkGlow(false), 4000)
    }
  }, [userSparked, partnerSparked, sparkRevealed])

  // ── Mutual Extend detection ──
  useEffect(() => {
    if (userExtended && partnerExtended && !isExtended) {
      setIsExtended(true)
      setTimer(EXTENDED_TIME - CONVERSATION_TIME + timer) // Add remaining buffer
      setExtendFlash(true)
      setTimeout(() => setExtendFlash(false), 2000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userExtended, partnerExtended])

  // Animate compat score
  useEffect(() => {
    if (!showCompat) return
    const step = () => {
      setCompatScore(prev => {
        if (prev >= compatTarget) return compatTarget
        return prev + 1
      })
    }
    const id = setInterval(step, 30)
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

  const handleExtend = useCallback(() => {
    if (userExtended) return
    setUserExtended(true)
  }, [userExtended])

  // Emergency exit handler
  const handleEmergencyExit = useCallback(() => {
    setEmergencyTriggered(true)
    setShowEmergencyConfirm(false)
    setTimeout(onNavigate, 1500)
  }, [onNavigate])

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60
  const compatArc = (compatScore / 100) * 283

  // Emergency triggered — immediate black screen
  if (emergencyTriggered) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-[#FF3B30]/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <p className="text-white font-semibold mb-2">Session Ended</p>
          <p className="text-sm text-white/50 max-w-xs">This date has been terminated. The interaction has been flagged for review by our safety team.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: '#2A2A2E' }}>
      <BackgroundOrbs />

      {/* ── Mutual Spark glow — full border glow when both sparked ── */}
      {sparkRevealed && (
        <div
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000"
          style={{
            opacity: sparkGlow ? 1 : 0.3,
            boxShadow: 'inset 0 0 80px rgba(224,64,160,0.35), inset 0 0 200px rgba(224,64,160,0.15)',
          }}
        />
      )}

      {/* ── Extend flash — full screen warm flash ── */}
      {extendFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-40 animate-fade-in"
          style={{
            background: 'radial-gradient(circle at center, rgba(224,64,160,0.15) 0%, transparent 70%)',
            animation: 'extend-glow 2s ease-out forwards',
          }}
        />
      )}

      {/* Floating emojis */}
      {floatingEmojis.map(e => (
        <div
          key={e.id}
          className="fixed z-30 text-3xl pointer-events-none"
          style={{
            left: `${e.x}%`,
            bottom: '15%',
            animation: 'emoji-float 3s ease-out forwards',
          }}
        >
          {e.emoji}
        </div>
      ))}

      {/* ====== MUTUAL SPARK CELEBRATION ====== */}
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

      {/* ====== MUTUAL EXTEND CELEBRATION ====== */}
      {extendFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="animate-scale-in text-center">
            <div className="text-5xl mb-2">⏳</div>
            <p className="text-lg font-bold text-white mb-1">+2 Minutes!</p>
            <p className="text-sm text-[#E040A0]">You both want more time</p>
          </div>
        </div>
      )}

      {/* ====== EMERGENCY CONFIRMATION MODAL ====== */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-tile rounded-3xl p-6 max-w-sm mx-4 w-full animate-scale-in" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-[#FF3B30]/15 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">End this date immediately?</h3>
              <p className="text-sm text-[#98989D] leading-relaxed">
                This will disconnect the call instantly. The interaction will be flagged and reviewed by our safety team. This person will not be matched with you.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleEmergencyExit}
                className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#FF3B30] text-white active:scale-[0.98] transition-transform"
              >
                End Date Now
              </button>
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold glass-button text-[#98989D] active:scale-[0.98] transition-transform"
              >
                Cancel — Continue Date
              </button>
            </div>

            <p className="text-[0.65rem] text-[#7A7A80] text-center mt-4">
              Your safety is our priority. All reports are confidential.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 flex-1 flex flex-col transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Video panel */}
        <div
          className="flex-1 relative overflow-hidden transition-all duration-1000"
          style={{
            border: sparkRevealed
              ? '2px solid #E040A0'
              : '2px solid #E040A0',
            boxShadow: sparkRevealed
              ? `0 0 0 1.5px #E040A0, 0 0 ${sparkGlow ? '60' : '25'}px rgba(224, 64, 160, ${sparkGlow ? '0.50' : '0.20'})`
              : '0 0 0 1.5px #E040A0, 0 0 20px rgba(224, 64, 160, 0.30)',
          }}
        >
          <img
            src={person.photo}
            alt={`${person.name}, ${person.age}`}
            className="object-cover w-full h-full absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Top bar: date counter + safety + extend */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="glass-button rounded-full px-4 py-1.5 text-xs font-semibold text-[#E0E0E5]">
                Date {dateIndex + 1} of 5
              </div>
              {isExtended && (
                <div className="glass-button rounded-full px-3 py-1.5 text-xs font-semibold text-[#E040A0] animate-scale-in">
                  +2 min
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* EXTEND BUTTON — appears in last 30 seconds */}
              {showExtendButton && (
                <button
                  onClick={handleExtend}
                  disabled={userExtended}
                  className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-300 active:scale-95 animate-scale-in glass-button ${
                    userExtended
                      ? 'opacity-50'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: userExtended ? `rgba(${USER_COLOR.rgb},0.15)` : `rgba(${USER_COLOR.rgb},0.12)`,
                  }}
                >
                  <span className="text-base">⏳</span>
                  <span className="text-[0.7rem] font-semibold" style={{ color: USER_COLOR.primary }}>
                    {userExtended ? 'Waiting...' : '+2 min'}
                  </span>
                </button>
              )}

              {/* EMERGENCY EXIT */}
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 hover:bg-[#FF3B30]/20 active:scale-95"
                style={{ backgroundColor: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.20)' }}
                title="Emergency exit — end this date immediately"
              >
                <svg className="w-3.5 h-3.5 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-[0.7rem] font-semibold text-[#FF3B30] hidden md:inline">Safety</span>
              </button>
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
                    {compatScore >= 85 ? 'Amazing!' : compatScore >= 75 ? 'Great vibe!' : 'Building...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Spark indicator — subtle, top-left below date counter */}
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
                <img src={person.photo} alt={person.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-[rgba(224,64,160,0.3)]" />
                <div>
                  <p className="font-semibold text-sm text-white">{person.name}, {person.age}</p>
                  <p className="text-[0.7rem] text-[#E0E0E5]">{person.location}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-[#30D158]" />
                  <span className="text-[0.65rem] text-[#30D158]/80">Live</span>
                </div>
              </div>
              <p className="text-[0.75rem] text-[#98989D] mb-2 italic">{person.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {person.tags.map(tag => (
                  <span key={tag} className="text-[0.7rem] px-2.5 py-1 rounded-full font-medium text-[#E040A0] glass-button">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* User PiP */}
          <div className="absolute bottom-4 right-4 z-20 w-[110px] h-[150px] md:w-[140px] md:h-[190px] overflow-hidden shadow-2xl" style={{ borderRadius: '20px', border: `2px solid rgba(${USER_COLOR.rgb}, 0.4)` }}>
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
        <div className="relative z-20 glass-strong backdrop-blur-xl px-3 py-2 md:py-3 flex items-center gap-2 md:gap-3" style={{ borderTop: '1px solid rgba(224, 64, 160, 0.1)' }}>

          {/* Timer */}
          <div className={`shrink-0 flex items-center gap-1.5 glass-button rounded-full px-3 py-1.5 transition-colors duration-300 ${timer <= 30 && !isExtended ? 'animate-pulse' : ''}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${timer <= 30 && !isExtended ? 'bg-[#FF9F0A]' : 'bg-[#E040A0]'}`} />
            <span className={`text-xs font-mono font-semibold ${timer <= 30 && !isExtended ? 'text-[#FF9F0A]' : 'text-[#E040A0]'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* ── SPARK SIGNAL BUTTON ── */}
          <button
            onClick={handleSpark}
            disabled={userSparked}
            className={`shrink-0 relative transition-all duration-300 ${
              userSparked
                ? 'opacity-60 scale-95'
                : 'hover:scale-110 active:scale-90'
            }`}
            title={userSparked ? 'Spark sent!' : 'Send a Spark — if they spark too, you\'ll both know'}
          >
            <div
              className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                sparkRevealed
                  ? 'bg-[#E040A0]/30 ring-2 ring-[#E040A0]'
                  : userSparked
                    ? 'border'
                    : 'glass-button'
              }`}
              style={sparkRevealed ? { boxShadow: '0 0 20px rgba(224,64,160,0.4)' } : userSparked ? { background: `rgba(${USER_COLOR.rgb},0.15)`, borderColor: `rgba(${USER_COLOR.rgb},0.30)` } : undefined}
            >
              <span className={`text-lg ${sparkRevealed ? '' : ''}`} style={sparkRevealed ? { animation: 'spark-pulse 0.8s ease-in-out infinite' } : undefined}>
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
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm md:text-base hover:scale-125 active:scale-90 transition-transform shrink-0 glass-button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Spin for question */}
          <button
            onClick={spinForQuestion}
            disabled={isSpinning}
            className="shrink-0 group relative"
            title="Spin for a question"
          >
            <div
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 bg-[#E040A0] ${isSpinning ? 'animate-spin' : ''}`}
              style={{
                boxShadow: '0 4px 20px rgba(224, 64, 160, 0.4)',
                animationDuration: isSpinning ? '0.5s' : undefined,
              }}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </div>
          </button>

          {/* End / Next */}
          <button
            onClick={onNavigate}
            className="shrink-0 group relative"
            title="End Date"
          >
            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 glass-button">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#E040A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
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
