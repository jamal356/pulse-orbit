import { useState, useEffect, useCallback, useRef } from 'react'
import { candidates, conversationStarters, photos } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
}

/*
  THE REVEAL — emotional climax of Pulse

  Design: Left sidebar shows all 5 dates as cards.
  Center stage: one-by-one reveal sequence.

  For each person:
  1. Card enters — photo + name + your decision shown
  2. "Did they feel it too?" — heartbeat animation builds
  3. Pulse line accelerates, screen tension rises
  4. FLIP — their decision revealed
  5. Mutual match → explosion of confetti + glow
     No match → gentle fade, move to next

  After all 5: summary dashboard with stats + replay buttons
*/

// Simulate their ratings — some mutual, some not
const theirRatings: Record<string, 'like' | 'pass'> = {
  Sofia: 'like',
  Layla: 'pass',
  Amira: 'like',
  Nour: 'like',
  Yasmine: 'pass',
}

// Simulated conversation snippets for replay
const replayData: Record<string, { questions: string[]; highlights: string[] }> = {
  Sofia: {
    questions: [conversationStarters[0], conversationStarters[3]],
    highlights: ['Laughed about travel mishaps', 'Both love street food in Bangkok', 'She mentioned salsa dancing'],
  },
  Layla: {
    questions: [conversationStarters[1], conversationStarters[5]],
    highlights: ['Deep conversation about wellness', 'Different energy styles', 'She recommended a podcast'],
  },
  Amira: {
    questions: [conversationStarters[2], conversationStarters[7]],
    highlights: ['Instant chemistry — both art lovers', 'She collects vintage prints', 'Plans to visit Louvre Abu Dhabi'],
  },
  Nour: {
    questions: [conversationStarters[4], conversationStarters[9]],
    highlights: ['Both in tech — she gets the grind', 'Weekend hiking in Hatta', 'She laughed at your bad joke'],
  },
  Yasmine: {
    questions: [conversationStarters[6], conversationStarters[8]],
    highlights: ['Fashion world stories', 'Different sense of humor', 'Cool vintage camera collection'],
  },
}

// Confetti system
interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
  rotation: number
}

function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#E040A0', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700', '#C82E88', '#B0B0FF']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))
}

type Phase = 'intro' | 'revealing' | 'summary'
type CardState = 'locked' | 'yours' | 'heartbeat' | 'revealed'

export default function MatchResults({ ratings, onRestart }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardStates, setCardStates] = useState<CardState[]>(candidates.map(() => 'locked'))
  const [showConfetti, setShowConfetti] = useState(false)
  const [confetti] = useState(() => makeConfetti(80))
  const [heartbeatSpeed, setHeartbeatSpeed] = useState(1)
  const [replayOpen, setReplayOpen] = useState<string | null>(null)
  const [pulseCount, setPulseCount] = useState(0)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const person = candidates[currentIndex]
  const yourRating = ratings[person?.name] || 'pass'
  const theirRating = theirRatings[person?.name] || 'pass'
  const isMutual = yourRating === 'like' && theirRating === 'like'

  const mutualMatches = candidates.filter(c =>
    ratings[c.name] === 'like' && theirRatings[c.name] === 'like'
  )

  // Start the reveal sequence
  const startReveal = useCallback(() => {
    setPhase('revealing')
    // Show "yours" state for first card after a beat
    setTimeout(() => {
      setCardStates(prev => {
        const next = [...prev]
        next[0] = 'yours'
        return next
      })
    }, 600)
  }, [])

  // Advance to heartbeat phase, then reveal
  const revealCurrent = useCallback(() => {
    // Phase: heartbeat — tension builds
    setCardStates(prev => {
      const next = [...prev]
      next[currentIndex] = 'heartbeat'
      return next
    })
    setHeartbeatSpeed(1)
    setPulseCount(0)

    // Accelerate heartbeat over 3 seconds
    let speed = 1
    const accelInterval = setInterval(() => {
      speed += 0.4
      setHeartbeatSpeed(speed)
      setPulseCount(p => p + 1)
    }, 400)

    // After 3s of tension: REVEAL
    revealTimeoutRef.current = setTimeout(() => {
      clearInterval(accelInterval)
      setCardStates(prev => {
        const next = [...prev]
        next[currentIndex] = 'revealed'
        return next
      })

      // If mutual match: confetti burst
      const person = candidates[currentIndex]
      const yours = ratings[person?.name] || 'pass'
      const theirs = theirRatings[person?.name] || 'pass'
      if (yours === 'like' && theirs === 'like') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }, 3000)

    return () => {
      clearInterval(accelInterval)
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [currentIndex, ratings])

  // Move to next person
  const nextPerson = useCallback(() => {
    const next = currentIndex + 1
    if (next >= candidates.length) {
      setTimeout(() => setPhase('summary'), 800)
    } else {
      setCurrentIndex(next)
      setTimeout(() => {
        setCardStates(prev => {
          const updated = [...prev]
          updated[next] = 'yours'
          return updated
        })
      }, 400)
    }
  }, [currentIndex])

  // Intro auto-start
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(startReveal, 2500)
      return () => clearTimeout(t)
    }
  }, [phase, startReveal])

  // Auto-trigger heartbeat when card shows "yours"
  useEffect(() => {
    if (cardStates[currentIndex] === 'yours') {
      const t = setTimeout(revealCurrent, 2000)
      return () => clearTimeout(t)
    }
  }, [cardStates, currentIndex, revealCurrent])

  // Auto-advance after reveal
  useEffect(() => {
    if (cardStates[currentIndex] === 'revealed') {
      const t = setTimeout(nextPerson, 3500)
      return () => clearTimeout(t)
    }
  }, [cardStates, currentIndex, nextPerson])

  return (
    <div className="fixed inset-0 bg-[#2A2A2E] overflow-hidden">
      <BackgroundOrbs />

      {/* Confetti explosions */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confetti.map(p => (
            <div
              key={p.id}
              className="absolute top-0"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.8}px`,
                backgroundColor: p.color,
                borderRadius: '2px',
                transform: `rotate(${p.rotation}deg)`,
                animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="relative z-20 px-5 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-[#E040A0]">Pulse</h1>
        <div className="text-xs text-[#7A7A80]">
          {phase === 'intro' && 'Session Complete'}
          {phase === 'revealing' && `Reveal ${currentIndex + 1} of ${candidates.length}`}
          {phase === 'summary' && 'Your Results'}
        </div>
      </header>

      {/* ====== INTRO PHASE ====== */}
      {phase === 'intro' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">✨</div>
            <h2
              className="text-3xl md:text-5xl mb-4 font-display"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic' }}
            >
              Time for the truth.
            </h2>
            <p className="text-[#98989D] text-base md:text-lg max-w-md mx-auto mb-2">
              You met 5 people tonight. You made your choices.
            </p>
            <p className="text-[#E040A0] text-lg font-semibold animate-pulse">
              Did they feel it too?
            </p>
          </div>
        </div>
      )}

      {/* ====== REVEALING PHASE ====== */}
      {phase === 'revealing' && (
        <div className="absolute inset-0 top-12 z-10 flex flex-col md:flex-row overflow-hidden">

          {/* LEFT SIDEBAR — All 5 dates */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 p-3 md:p-4 md:border-r border-white/[0.05] overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#7A7A80] font-semibold mb-3 hidden md:block">Tonight's Dates</p>
            <div className="flex md:flex-col gap-2 md:gap-2.5 min-w-max md:min-w-0">
              {candidates.map((c, i) => {
                const state = cardStates[i]
                const isActive = i === currentIndex
                const isMatch = state === 'revealed' && ratings[c.name] === 'like' && theirRatings[c.name] === 'like'
                const isRevealed = state === 'revealed'

                return (
                  <div
                    key={c.name}
                    className={`flex items-center gap-2.5 rounded-xl p-2.5 md:p-3 transition-all duration-500 shrink-0 ${
                      isActive ? 'glass-tile ring-1 ring-[rgba(224,64,160,0.30)]' : 'glass-button'
                    } ${isMatch ? 'ring-1 ring-[rgba(224,64,160,0.40)]' : ''}`}
                    style={isActive ? { boxShadow: '0 4px 16px rgba(224,64,160,0.12)' } : {}}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={c.photo}
                        alt={c.name}
                        className={`w-10 h-10 rounded-full object-cover transition-all duration-500 ${state === 'locked' ? 'opacity-30 grayscale' : ''}`}
                        style={isMatch ? { border: '2px solid #E040A0', boxShadow: '0 0 10px rgba(224,64,160,0.3)' } : { border: '2px solid rgba(255,255,255,0.1)' }}
                      />
                      {isRevealed && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] ${
                          isMatch ? 'bg-[#E040A0]' : 'bg-[#424245]'
                        }`}
                          style={{ width: 18, height: 18 }}
                        >
                          {isMatch ? '💫' : '—'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 hidden md:block">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : state === 'locked' ? 'text-[#7A7A80]' : 'text-[#E0E0E5]'}`}>{c.name}</p>
                      <p className="text-[0.65rem] text-[#7A7A80] truncate">
                        {state === 'locked' && 'Waiting...'}
                        {state === 'yours' && `You: ${ratings[c.name] === 'like' ? '🔥 Liked' : '❄️ Passed'}`}
                        {state === 'heartbeat' && 'Revealing...'}
                        {state === 'revealed' && (isMatch ? '💫 Match!' : 'No match')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* CENTER STAGE — The Reveal */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-4 relative overflow-hidden">

            {/* Heartbeat pulse line behind card */}
            {cardStates[currentIndex] === 'heartbeat' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-full max-w-lg opacity-20">
                  <svg viewBox="0 0 400 100" className="w-full">
                    <path
                      d="M0 50 L100 50 L130 20 L145 80 L160 20 L175 50 L400 50"
                      fill="none"
                      stroke="#E040A0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{
                        animation: `pulse-line ${1 / heartbeatSpeed}s ease-in-out infinite`,
                        filter: 'drop-shadow(0 0 8px rgba(224,64,160,0.4))',
                      }}
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* The Card */}
            {person && (
              <div
                className={`relative z-10 w-full max-w-sm transition-all duration-700 ${
                  cardStates[currentIndex] === 'heartbeat' ? 'scale-[1.02]' : ''
                }`}
                style={{
                  animation: cardStates[currentIndex] === 'heartbeat'
                    ? `card-breathe ${1.2 / heartbeatSpeed}s ease-in-out infinite`
                    : undefined,
                }}
              >
                <div
                  className="glass-tile rounded-3xl overflow-hidden transition-all duration-500"
                  style={{
                    boxShadow: cardStates[currentIndex] === 'revealed' && isMutual
                      ? '0 8px 40px rgba(224,64,160,0.30), 0 0 80px rgba(224,64,160,0.10)'
                      : cardStates[currentIndex] === 'heartbeat'
                      ? `0 4px 24px rgba(224,64,160,${0.05 + pulseCount * 0.03})`
                      : '0 4px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Photo */}
                  <div className="relative h-56 md:h-64 overflow-hidden">
                    <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2E] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <p className="text-xl font-bold text-white font-display">{person.name}, {person.age}</p>
                      <p className="text-xs text-white/60">{person.location}</p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="glass-button rounded-full px-3 py-1 text-[0.7rem] font-medium text-white/70">
                        Date {currentIndex + 1}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="px-4 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {person.tags.map(tag => (
                        <span key={tag} className="text-[0.7rem] px-2.5 py-1 rounded-full bg-[rgba(224,64,160,0.08)] text-[#E040A0] border border-[rgba(224,64,160,0.15)]">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Your decision */}
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={photos.user} alt="You" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                      <div className="flex-1">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold">Your Decision</p>
                        <p className={`text-sm font-semibold ${yourRating === 'like' ? 'text-[#E040A0]' : 'text-[#98989D]'}`}>
                          {yourRating === 'like' ? '🔥 You felt the chemistry' : '❄️ You passed'}
                        </p>
                      </div>
                    </div>

                    {/* Divider with pulse */}
                    <div className="relative h-px mb-4" style={{ background: 'rgba(224,64,160,0.15)' }}>
                      {cardStates[currentIndex] === 'heartbeat' && (
                        <div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E040A0]"
                          style={{ animation: `dot-pulse ${0.8 / heartbeatSpeed}s ease-in-out infinite`, boxShadow: '0 0 12px rgba(224,64,160,0.5)' }}
                        />
                      )}
                    </div>

                    {/* Their decision — THE REVEAL ZONE */}
                    <div className="flex items-center gap-3">
                      <img
                        src={person.photo}
                        alt={person.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                      />
                      <div className="flex-1">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold">{person.name}'s Decision</p>

                        {/* LOCKED state */}
                        {(cardStates[currentIndex] === 'yours') && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-4 h-4 rounded glass-button flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-[#7A7A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <span className="text-sm text-[#7A7A80]">Hidden</span>
                          </div>
                        )}

                        {/* HEARTBEAT state — building tension */}
                        {cardStates[currentIndex] === 'heartbeat' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div
                              className="w-4 h-4 rounded-full bg-[#E040A0]"
                              style={{ animation: `dot-pulse ${0.6 / heartbeatSpeed}s ease-in-out infinite`, boxShadow: '0 0 8px rgba(224,64,160,0.4)' }}
                            />
                            <span className="text-sm text-[#E040A0] animate-pulse font-medium">Revealing...</span>
                          </div>
                        )}

                        {/* REVEALED state */}
                        {cardStates[currentIndex] === 'revealed' && (
                          <div className="animate-scale-in">
                            {theirRating === 'like' ? (
                              <p className="text-sm font-semibold text-[#E040A0]">🔥 They felt it too!</p>
                            ) : (
                              <p className="text-sm font-semibold text-[#98989D]">❄️ They passed</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MATCH RESULT BANNER */}
                  {cardStates[currentIndex] === 'revealed' && (
                    <div
                      className={`px-4 py-4 text-center animate-slide-up ${
                        isMutual
                          ? 'bg-gradient-to-r from-[rgba(224,64,160,0.15)] to-[rgba(224,64,160,0.08)]'
                          : 'bg-[rgba(255,255,255,0.02)]'
                      }`}
                      style={{ borderTop: `1px solid ${isMutual ? 'rgba(224,64,160,0.20)' : 'rgba(255,255,255,0.05)'}` }}
                    >
                      {isMutual ? (
                        <>
                          <p className="text-2xl font-bold text-[#E040A0] font-display mb-1">💫 It's a Match!</p>
                          <p className="text-xs text-[#E0E0E5]">You both felt the chemistry. Contact details shared.</p>
                        </>
                      ) : yourRating === 'like' ? (
                        <>
                          <p className="text-sm text-[#98989D]">Not this time — but chemistry is unpredictable.</p>
                        </>
                      ) : theirRating === 'like' ? (
                        <>
                          <p className="text-sm text-[#98989D]">They liked you — but you moved on. Onto the next.</p>
                        </>
                      ) : (
                        <p className="text-sm text-[#7A7A80]">Neither felt the spark. No time wasted.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tap to skip prompt */}
            {cardStates[currentIndex] === 'yours' && (
              <p className="mt-4 text-xs text-[#7A7A80] animate-pulse">Revealing in a moment...</p>
            )}
          </div>
        </div>
      )}

      {/* ====== SUMMARY PHASE ====== */}
      {phase === 'summary' && (
        <div className="absolute inset-0 top-12 z-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pb-24 pt-4 animate-fade-in">

            {/* Summary header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Tonight's Results</h2>
              <p className="text-sm text-[#98989D]">
                {mutualMatches.length > 0
                  ? `${mutualMatches.length} mutual ${mutualMatches.length === 1 ? 'match' : 'matches'} — real chemistry, confirmed.`
                  : 'No mutual matches tonight — every session is different.'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { value: '5', label: 'People Met', icon: '👥' },
                { value: String(mutualMatches.length), label: 'Matches', icon: '💫' },
                { value: '25m', label: 'Total Time', icon: '⏱' },
                { value: `${Object.values(ratings).filter(r => r === 'like').length}`, label: 'You Liked', icon: '🔥' },
              ].map((s, i) => (
                <div key={i} className="glass-tile rounded-2xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'backwards' }}>
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-2xl font-bold text-[#E040A0] font-display mt-1">{s.value}</p>
                  <p className="text-[0.65rem] text-[#7A7A80] uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* All dates — with replay */}
            <h3 className="text-xs tracking-[0.2em] uppercase text-[#7A7A80] font-semibold mb-3">Your Dates</h3>
            <div className="space-y-3 mb-8">
              {candidates.map((c, i) => {
                const yours = ratings[c.name] || 'pass'
                const theirs = theirRatings[c.name] || 'pass'
                const match = yours === 'like' && theirs === 'like'
                const replay = replayData[c.name]
                const isReplayOpen = replayOpen === c.name

                return (
                  <div
                    key={c.name}
                    className={`glass-tile rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up ${match ? 'ring-1 ring-[rgba(224,64,160,0.30)]' : ''}`}
                    style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: 'backwards', boxShadow: match ? '0 4px 16px rgba(224,64,160,0.10)' : undefined }}
                  >
                    {/* Main row */}
                    <div className="p-4 flex items-center gap-3">
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                        style={{ border: match ? '2px solid #E040A0' : '2px solid rgba(255,255,255,0.1)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{c.name}, {c.age}</p>
                          {match && (
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[rgba(224,64,160,0.12)] text-[#E040A0] font-bold">Match</span>
                          )}
                        </div>
                        <p className="text-xs text-[#7A7A80]">{c.location}</p>
                      </div>

                      {/* Decision indicators */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-center">
                          <p className="text-[0.55rem] text-[#7A7A80] uppercase">You</p>
                          <span className="text-sm">{yours === 'like' ? '🔥' : '❄️'}</span>
                        </div>
                        <div className="text-center">
                          <p className="text-[0.55rem] text-[#7A7A80] uppercase">Them</p>
                          <span className="text-sm">{theirs === 'like' ? '🔥' : '❄️'}</span>
                        </div>
                      </div>

                      {/* Replay button */}
                      <button
                        onClick={() => setReplayOpen(isReplayOpen ? null : c.name)}
                        className="shrink-0 w-9 h-9 rounded-full glass-button flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
                      >
                        <svg className={`w-4 h-4 transition-transform ${isReplayOpen ? 'rotate-180' : ''} text-[#E0E0E5]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>

                    {/* Replay panel */}
                    {isReplayOpen && replay && (
                      <div className="px-4 pb-4 animate-slide-up" style={{ animationDuration: '0.3s', borderTop: '1px solid rgba(224,64,160,0.08)' }}>
                        <div className="pt-3 space-y-4">

                          {/* Replay video placeholder */}
                          <div className="rounded-xl overflow-hidden glass-button">
                            <div className="aspect-video relative flex items-center justify-center">
                              <img src={c.photo} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-30" style={{ filter: 'blur(8px)' }} />
                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <button className="w-14 h-14 rounded-full bg-[#E040A0]/20 border border-[#E040A0]/30 flex items-center justify-center hover:scale-110 transition-transform">
                                  <svg className="w-6 h-6 ml-0.5 text-[#E040A0]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </button>
                                <p className="text-xs text-white/50">Watch 5-min replay</p>
                              </div>
                            </div>
                          </div>

                          {/* Conversation highlights */}
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold mb-2">Conversation Highlights</p>
                            <div className="space-y-1.5">
                              {replay.highlights.map((h, hi) => (
                                <div key={hi} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0] mt-1.5 shrink-0" />
                                  <p className="text-sm text-[#E0E0E5]">{h}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Questions discussed */}
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold mb-2">Questions Discussed</p>
                            <div className="space-y-1.5">
                              {replay.questions.map((q, qi) => (
                                <div key={qi} className="glass-button rounded-lg px-3 py-2 text-xs text-[#E0E0E5] italic">"{q}"</div>
                              ))}
                            </div>
                          </div>

                          {/* Action buttons */}
                          {match && (
                            <button className="w-full rounded-xl py-3 text-sm font-semibold bg-[#E040A0] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                              Message {c.name}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Investor insight card */}
            <div className="glass-tile rounded-2xl p-6 mb-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#E040A0] font-semibold mb-4 text-center">What Just Happened</h3>
              <div className="space-y-3">
                {[
                  { metric: '25 minutes total', insight: 'vs. 3+ hours of texting on traditional apps' },
                  { metric: 'Zero catfishing', insight: 'Camera on = what you see is what you get' },
                  { metric: 'Instant clarity', insight: 'Chemistry confirmed or denied in real-time' },
                  { metric: 'The replay changes decisions', insight: 'Users who rewatch upgrade 34% of passes to likes' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0] mt-2 shrink-0" />
                    <p className="text-sm"><span className="font-semibold text-white">{item.metric}</span> <span className="text-[#98989D]">— {item.insight}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <button className="w-full py-4 rounded-full bg-[#E040A0] text-white text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.3)' }}>
                Book Next Session — AED 75
              </button>
              <button
                onClick={onRestart}
                className="w-full py-3 rounded-full glass-button text-sm font-semibold text-[#98989D] hover:text-white transition-colors"
              >
                ← Back to Pitch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes card-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        @keyframes pulse-line {
          0% { opacity: 0.3; transform: scaleX(0.95); }
          50% { opacity: 1; transform: scaleX(1.05); }
          100% { opacity: 0.3; transform: scaleX(0.95); }
        }
      `}</style>
    </div>
  )
}
