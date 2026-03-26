import { useState, useEffect, useCallback, useRef } from 'react'
import { candidates, conversationStarters, photos } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
}

// Simulate their ratings
const theirRatings: Record<string, 'like' | 'pass'> = {
  Sofia: 'like',
  Layla: 'pass',
  Amira: 'like',
  Nour: 'like',
  Yasmine: 'pass',
}

// Replay data
const replayData: Record<string, { questions: string[]; highlights: string[]; duration: string; emojis: string[] }> = {
  Sofia: {
    questions: [conversationStarters[0], conversationStarters[3]],
    highlights: ['Laughed about travel mishaps', 'Both love street food in Bangkok', 'She mentioned salsa dancing'],
    duration: '5:00',
    emojis: ['\u{1F60D}', '\u{1F525}', '\u{2764}\u{FE0F}', '\u{1F602}'],
  },
  Layla: {
    questions: [conversationStarters[1], conversationStarters[5]],
    highlights: ['Deep conversation about wellness', 'Different energy styles', 'She recommended a podcast'],
    duration: '5:00',
    emojis: ['\u{1F60A}', '\u{1F44F}'],
  },
  Amira: {
    questions: [conversationStarters[2], conversationStarters[7]],
    highlights: ['Instant chemistry \u2014 both art lovers', 'She collects vintage prints', 'Plans to visit Louvre Abu Dhabi'],
    duration: '5:00',
    emojis: ['\u{1F60D}', '\u{1F525}', '\u{1F44F}', '\u{1F4AF}'],
  },
  Nour: {
    questions: [conversationStarters[4], conversationStarters[9]],
    highlights: ['Both in tech \u2014 she gets the grind', 'Weekend hiking in Hatta', 'She laughed at your bad joke'],
    duration: '5:00',
    emojis: ['\u{1F525}', '\u{2764}\u{FE0F}', '\u{1F602}'],
  },
  Yasmine: {
    questions: [conversationStarters[6], conversationStarters[8]],
    highlights: ['Fashion world stories', 'Different sense of humor', 'Cool vintage camera collection'],
    duration: '5:00',
    emojis: ['\u{1F60E}'],
  },
}

// Confetti
interface ConfettiPiece { id: number; left: number; delay: number; duration: number; color: string; size: number; rotation: number }
function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#E040A0', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700', '#C82E88', '#B0B0FF']
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6, rotation: Math.random() * 360,
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
  const [showSharecard, setShowSharecard] = useState(false)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Second Chance state
  const [secondChances, setSecondChances] = useState<Record<string, boolean>>({})
  const [secondChanceNotif, setSecondChanceNotif] = useState<string | null>(null)

  // Derived
  const person = candidates[currentIndex]
  const getEffectiveRating = useCallback((name: string) => secondChances[name] ? 'like' as const : (ratings[name] || 'pass' as const), [secondChances, ratings])
  const yourRating = getEffectiveRating(person?.name)
  const theirRating = theirRatings[person?.name] || 'pass'
  const isMutual = yourRating === 'like' && theirRating === 'like'
  const mutualMatches = candidates.filter(c => getEffectiveRating(c.name) === 'like' && theirRatings[c.name] === 'like')

  // Second Chance handler
  const handleSecondChance = useCallback((name: string) => {
    setSecondChances(prev => ({ ...prev, [name]: true }))
    setSecondChanceNotif(name)
    setTimeout(() => setSecondChanceNotif(null), 3000)
  }, [])

  // Reveal sequence
  const startReveal = useCallback(() => {
    setPhase('revealing')
    setTimeout(() => {
      setCardStates(prev => { const next = [...prev]; next[0] = 'yours'; return next })
    }, 600)
  }, [])

  const revealCurrent = useCallback(() => {
    setCardStates(prev => { const next = [...prev]; next[currentIndex] = 'heartbeat'; return next })
    setHeartbeatSpeed(1)
    setPulseCount(0)
    let speed = 1
    const accelInterval = setInterval(() => { speed += 0.4; setHeartbeatSpeed(speed); setPulseCount(p => p + 1) }, 400)
    revealTimeoutRef.current = setTimeout(() => {
      clearInterval(accelInterval)
      setCardStates(prev => { const next = [...prev]; next[currentIndex] = 'revealed'; return next })
      const p = candidates[currentIndex]
      const yours = ratings[p?.name] || 'pass'
      const theirs = theirRatings[p?.name] || 'pass'
      if (yours === 'like' && theirs === 'like') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }, 3000)
    return () => { clearInterval(accelInterval); if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current) }
  }, [currentIndex, ratings])

  const nextPerson = useCallback(() => {
    const next = currentIndex + 1
    if (next >= candidates.length) {
      setTimeout(() => setPhase('summary'), 800)
    } else {
      setCurrentIndex(next)
      setTimeout(() => { setCardStates(prev => { const u = [...prev]; u[next] = 'yours'; return u }) }, 400)
    }
  }, [currentIndex])

  useEffect(() => { if (phase === 'intro') { const t = setTimeout(startReveal, 2500); return () => clearTimeout(t) } }, [phase, startReveal])
  useEffect(() => { if (cardStates[currentIndex] === 'yours') { const t = setTimeout(revealCurrent, 2000); return () => clearTimeout(t) } }, [cardStates, currentIndex, revealCurrent])
  useEffect(() => { if (cardStates[currentIndex] === 'revealed') { const t = setTimeout(nextPerson, 3500); return () => clearTimeout(t) } }, [cardStates, currentIndex, nextPerson])

  return (
    <div className="fixed inset-0 bg-[#2A2A2E] overflow-hidden">
      <BackgroundOrbs />

      {/* Confetti */}
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

      {/* Second Chance notification toast */}
      {secondChanceNotif && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="glass-tile rounded-2xl px-5 py-3 flex items-center gap-3" style={{ boxShadow: '0 8px 32px rgba(224,64,160,0.25)' }}>
            <span className="text-lg">{'\u{1F525}'}</span>
            <div>
              <p className="text-sm font-semibold text-white">Second Chance sent!</p>
              <p className="text-xs text-[#98989D]">{secondChanceNotif} will be notified you changed your mind</p>
            </div>
          </div>
        </div>
      )}

      {/* Sharecard Modal */}
      {showSharecard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="glass-tile rounded-3xl p-5 max-w-sm mx-4 w-full animate-scale-in" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm">Share to Instagram Story</h3>
              <button onClick={() => setShowSharecard(false)} className="w-8 h-8 glass-button rounded-full flex items-center justify-center text-[#7A7A80]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Instagram Story Card */}
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '420px' }}>
              <div className="w-full h-full relative flex flex-col items-center justify-between py-8 px-6" style={{
                background: 'linear-gradient(165deg, #2A2A2E 0%, #1a1a1e 30%, #E040A0 100%)',
              }}>
                <div className="text-center">
                  <h4 className="text-3xl font-bold font-display text-white mb-1">Pulse</h4>
                  <p className="text-[0.65rem] text-white/40 uppercase tracking-[0.2em]">Tonight's Session</p>
                </div>
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { v: '5', l: 'People Met' },
                      { v: String(mutualMatches.length), l: 'Matches' },
                      { v: '25m', l: 'Total Time' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl py-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <p className="text-2xl font-bold text-white font-display">{s.v}</p>
                        <p className="text-[0.55rem] uppercase text-white/50 tracking-wider mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {mutualMatches.length > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-xs text-white/50">Matched with</span>
                      <div className="flex -space-x-2">
                        {mutualMatches.map(m => (
                          <img key={m.name} src={m.photo} alt={m.name} className="w-7 h-7 rounded-full object-cover border-2 border-[#E040A0]" />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-center text-sm italic text-white/70" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {mutualMatches.length >= 2 ? '"Chemistry confirmed \u2014 twice."' : mutualMatches.length === 1 ? '"Found a spark in 25 minutes."' : '"5 real conversations. Zero time wasted."'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[0.7rem] text-white/30 mb-1">Skip the texting. See the chemistry.</p>
                  <p className="text-xs font-semibold text-white/60">pulse.app</p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                Share to Instagram Story
              </button>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold glass-button text-[#E0E0E5] active:scale-[0.98] transition-transform">WhatsApp</button>
                <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold glass-button text-[#E0E0E5] active:scale-[0.98] transition-transform">X / Twitter</button>
                <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold glass-button text-[#E0E0E5] active:scale-[0.98] transition-transform">Save Image</button>
              </div>
            </div>
          </div>
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

      {/* ====== INTRO ====== */}
      {phase === 'intro' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">{'\u2728'}</div>
            <h2 className="text-3xl md:text-5xl mb-4 font-display" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic' }}>
              Time for the truth.
            </h2>
            <p className="text-[#98989D] text-base md:text-lg max-w-md mx-auto mb-2">You met 5 people tonight. You made your choices.</p>
            <p className="text-[#E040A0] text-lg font-semibold animate-pulse">Did they feel it too?</p>
          </div>
        </div>
      )}

      {/* ====== REVEALING ====== */}
      {phase === 'revealing' && (
        <div className="absolute inset-0 top-12 z-10 flex flex-col md:flex-row overflow-hidden">
          {/* Left sidebar */}
          <div className="w-full md:w-64 lg:w-72 shrink-0 p-3 md:p-4 md:border-r border-white/[0.05] overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
            <p className="text-[0.65rem] tracking-[0.2em] uppercase text-[#7A7A80] font-semibold mb-3 hidden md:block">Tonight's Dates</p>
            <div className="flex md:flex-col gap-2 md:gap-2.5 min-w-max md:min-w-0">
              {candidates.map((c, i) => {
                const state = cardStates[i]
                const isActive = i === currentIndex
                const effRating = getEffectiveRating(c.name)
                const isMatch = state === 'revealed' && effRating === 'like' && theirRatings[c.name] === 'like'
                return (
                  <div key={c.name} className={`flex items-center gap-2.5 rounded-xl p-2.5 md:p-3 transition-all duration-500 shrink-0 ${isActive ? 'glass-tile ring-1 ring-[rgba(224,64,160,0.30)]' : 'glass-button'} ${isMatch ? 'ring-1 ring-[rgba(224,64,160,0.40)]' : ''}`} style={isActive ? { boxShadow: '0 4px 16px rgba(224,64,160,0.12)' } : {}}>
                    <div className="relative shrink-0">
                      <img src={c.photo} alt={c.name} className={`w-10 h-10 rounded-full object-cover transition-all duration-500 ${state === 'locked' ? 'opacity-30 grayscale' : ''}`} style={isMatch ? { border: '2px solid #E040A0', boxShadow: '0 0 10px rgba(224,64,160,0.3)' } : { border: '2px solid rgba(255,255,255,0.1)' }} />
                      {state === 'revealed' && (
                        <div className={`absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center text-[10px] ${isMatch ? 'bg-[#E040A0]' : 'bg-[#424245]'}`} style={{ width: 18, height: 18 }}>{isMatch ? '\u{1F4AB}' : '\u2014'}</div>
                      )}
                    </div>
                    <div className="min-w-0 hidden md:block">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : state === 'locked' ? 'text-[#7A7A80]' : 'text-[#E0E0E5]'}`}>{c.name}</p>
                      <p className="text-[0.65rem] text-[#7A7A80] truncate">
                        {state === 'locked' && 'Waiting...'}
                        {state === 'yours' && `You: ${effRating === 'like' ? '\u{1F525} Liked' : '\u2744\u{FE0F} Passed'}`}
                        {state === 'heartbeat' && 'Revealing...'}
                        {state === 'revealed' && (isMatch ? '\u{1F4AB} Match!' : 'No match')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Center stage */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-4 relative overflow-hidden">
            {cardStates[currentIndex] === 'heartbeat' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-full max-w-lg opacity-20">
                  <svg viewBox="0 0 400 100" className="w-full">
                    <path d="M0 50 L100 50 L130 20 L145 80 L160 20 L175 50 L400 50" fill="none" stroke="#E040A0" strokeWidth="2" strokeLinecap="round" style={{ animation: `pulse-line ${1 / heartbeatSpeed}s ease-in-out infinite`, filter: 'drop-shadow(0 0 8px rgba(224,64,160,0.4))' }} />
                  </svg>
                </div>
              </div>
            )}

            {person && (
              <div className={`relative z-10 w-full max-w-sm transition-all duration-700 ${cardStates[currentIndex] === 'heartbeat' ? 'scale-[1.02]' : ''}`} style={{ animation: cardStates[currentIndex] === 'heartbeat' ? `card-breathe ${1.2 / heartbeatSpeed}s ease-in-out infinite` : undefined }}>
                <div className="glass-tile rounded-3xl overflow-hidden transition-all duration-500" style={{
                  boxShadow: cardStates[currentIndex] === 'revealed' && isMutual ? '0 8px 40px rgba(224,64,160,0.30), 0 0 80px rgba(224,64,160,0.10)' : cardStates[currentIndex] === 'heartbeat' ? `0 4px 24px rgba(224,64,160,${0.05 + pulseCount * 0.03})` : '0 4px 16px rgba(0,0,0,0.2)',
                }}>
                  <div className="relative h-56 md:h-64 overflow-hidden">
                    <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2E] via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <p className="text-xl font-bold text-white font-display">{person.name}, {person.age}</p>
                      <p className="text-xs text-white/60">{person.location}</p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="glass-button rounded-full px-3 py-1 text-[0.7rem] font-medium text-white/70">Date {currentIndex + 1}</div>
                    </div>
                  </div>
                  <div className="px-4 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      {person.tags.map(tag => (<span key={tag} className="text-[0.7rem] px-2.5 py-1 rounded-full bg-[rgba(224,64,160,0.08)] text-[#E040A0] border border-[rgba(224,64,160,0.15)]">{tag}</span>))}
                    </div>
                  </div>
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={photos.user} alt="You" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                      <div className="flex-1">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold">Your Decision</p>
                        <p className={`text-sm font-semibold ${yourRating === 'like' ? 'text-[#E040A0]' : 'text-[#98989D]'}`}>
                          {yourRating === 'like' ? '\u{1F525} You felt the chemistry' : '\u2744\u{FE0F} You passed'}
                        </p>
                      </div>
                    </div>
                    <div className="relative h-px mb-4" style={{ background: 'rgba(224,64,160,0.15)' }}>
                      {cardStates[currentIndex] === 'heartbeat' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E040A0]" style={{ animation: `dot-pulse ${0.8 / heartbeatSpeed}s ease-in-out infinite`, boxShadow: '0 0 12px rgba(224,64,160,0.5)' }} />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={person.photo} alt={person.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10" />
                      <div className="flex-1">
                        <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold">{person.name}'s Decision</p>
                        {cardStates[currentIndex] === 'yours' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-4 h-4 rounded glass-button flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 text-[#7A7A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <span className="text-sm text-[#7A7A80]">Hidden</span>
                          </div>
                        )}
                        {cardStates[currentIndex] === 'heartbeat' && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-[#E040A0]" style={{ animation: `dot-pulse ${0.6 / heartbeatSpeed}s ease-in-out infinite`, boxShadow: '0 0 8px rgba(224,64,160,0.4)' }} />
                            <span className="text-sm text-[#E040A0] animate-pulse font-medium">Revealing...</span>
                          </div>
                        )}
                        {cardStates[currentIndex] === 'revealed' && (
                          <div className="animate-scale-in">
                            {theirRating === 'like' ? <p className="text-sm font-semibold text-[#E040A0]">{'\u{1F525}'} They felt it too!</p> : <p className="text-sm font-semibold text-[#98989D]">{'\u2744\u{FE0F}'} They passed</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {cardStates[currentIndex] === 'revealed' && (
                    <div className={`px-4 py-4 text-center animate-slide-up ${isMutual ? 'bg-gradient-to-r from-[rgba(224,64,160,0.15)] to-[rgba(224,64,160,0.08)]' : 'bg-[rgba(255,255,255,0.02)]'}`} style={{ borderTop: `1px solid ${isMutual ? 'rgba(224,64,160,0.20)' : 'rgba(255,255,255,0.05)'}` }}>
                      {isMutual ? (
                        <><p className="text-2xl font-bold text-[#E040A0] font-display mb-1">{'\u{1F4AB}'} It's a Match!</p><p className="text-xs text-[#E0E0E5]">You both felt the chemistry. Contact details shared.</p></>
                      ) : yourRating === 'like' ? (
                        <p className="text-sm text-[#98989D]">Not this time &mdash; but chemistry is unpredictable.</p>
                      ) : theirRating === 'like' ? (
                        <p className="text-sm text-[#98989D]">They liked you &mdash; but you moved on.</p>
                      ) : (
                        <p className="text-sm text-[#7A7A80]">Neither felt the spark. No time wasted.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {cardStates[currentIndex] === 'yours' && (<p className="mt-4 text-xs text-[#7A7A80] animate-pulse">Revealing in a moment...</p>)}
          </div>
        </div>
      )}

      {/* ====== SUMMARY ====== */}
      {phase === 'summary' && (
        <div className="absolute inset-0 top-12 z-10 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pb-24 pt-4 animate-fade-in">

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Tonight's Results</h2>
              <p className="text-sm text-[#98989D]">
                {mutualMatches.length > 0 ? `${mutualMatches.length} mutual ${mutualMatches.length === 1 ? 'match' : 'matches'} \u2014 real chemistry, confirmed.` : 'No mutual matches tonight \u2014 every session is different.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { value: '5', label: 'People Met', icon: '\u{1F465}' },
                { value: String(mutualMatches.length), label: 'Matches', icon: '\u{1F4AB}' },
                { value: '25m', label: 'Total Time', icon: '\u23F1' },
                { value: `${Object.values(ratings).filter(r => r === 'like').length + Object.keys(secondChances).length}`, label: 'You Liked', icon: '\u{1F525}' },
              ].map((s, i) => (
                <div key={i} className="glass-tile rounded-2xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'backwards' }}>
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-2xl font-bold text-[#E040A0] font-display mt-1">{s.value}</p>
                  <p className="text-[0.65rem] text-[#7A7A80] uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Share button */}
            <button onClick={() => setShowSharecard(true)} className="w-full glass-tile rounded-2xl p-4 flex items-center justify-between mb-6 group hover:scale-[1.01] active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Share Your Session Card</p>
                  <p className="text-xs text-[#7A7A80]">Post to Instagram, WhatsApp, or X</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-[#7A7A80] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>

            {/* All dates with replay + second chance */}
            <h3 className="text-xs tracking-[0.2em] uppercase text-[#7A7A80] font-semibold mb-3">Your Dates</h3>
            <div className="space-y-3 mb-8">
              {candidates.map((c, i) => {
                const effRating = getEffectiveRating(c.name)
                const theirs = theirRatings[c.name] || 'pass'
                const match = effRating === 'like' && theirs === 'like'
                const originallyPassed = ratings[c.name] === 'pass'
                const usedSecondChance = secondChances[c.name]
                const canSecondChance = originallyPassed && !usedSecondChance
                const replay = replayData[c.name]
                const isReplayOpen = replayOpen === c.name

                return (
                  <div key={c.name} className={`glass-tile rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up ${match ? 'ring-1 ring-[rgba(224,64,160,0.30)]' : ''}`} style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: 'backwards', boxShadow: match ? '0 4px 16px rgba(224,64,160,0.10)' : undefined }}>
                    <div className="p-4 flex items-center gap-3">
                      <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: match ? '2px solid #E040A0' : '2px solid rgba(255,255,255,0.1)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{c.name}, {c.age}</p>
                          {match && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[rgba(224,64,160,0.12)] text-[#E040A0] font-bold">Match</span>}
                          {usedSecondChance && <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-[rgba(255,159,10,0.12)] text-[#FF9F0A] font-bold">2nd Chance</span>}
                        </div>
                        <p className="text-xs text-[#7A7A80]">{c.location}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-center"><p className="text-[0.55rem] text-[#7A7A80] uppercase">You</p><span className="text-sm">{effRating === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span></div>
                        <div className="text-center"><p className="text-[0.55rem] text-[#7A7A80] uppercase">Them</p><span className="text-sm">{theirs === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span></div>
                      </div>
                      <button onClick={() => setReplayOpen(isReplayOpen ? null : c.name)} className="shrink-0 w-9 h-9 rounded-full glass-button flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
                        <svg className={`w-4 h-4 transition-transform ${isReplayOpen ? 'rotate-180' : ''} text-[#E0E0E5]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>

                    {isReplayOpen && replay && (
                      <div className="px-4 pb-4 animate-slide-up" style={{ animationDuration: '0.3s', borderTop: '1px solid rgba(224,64,160,0.08)' }}>
                        <div className="pt-3 space-y-4">
                          {/* Replay video */}
                          <div className="rounded-xl overflow-hidden glass-button">
                            <div className="aspect-video relative flex items-center justify-center">
                              <img src={c.photo} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-30" style={{ filter: 'blur(8px)' }} />
                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <button className="w-14 h-14 rounded-full bg-[#E040A0]/20 border border-[#E040A0]/30 flex items-center justify-center hover:scale-110 transition-transform">
                                  <svg className="w-6 h-6 ml-0.5 text-[#E040A0]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </button>
                                <p className="text-xs text-white/50">Rewatch {replay.duration} conversation</p>
                              </div>
                              <div className="absolute bottom-2 right-2 glass-button rounded-full px-2 py-0.5 text-[0.6rem] text-white/50">Available 24hrs</div>
                            </div>
                          </div>

                          {/* Emoji timeline */}
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold mb-2">Reactions During Date</p>
                            <div className="flex gap-1.5">
                              {replay.emojis.map((e, ei) => (
                                <span key={ei} className="w-8 h-8 glass-button rounded-full flex items-center justify-center text-sm">{e}</span>
                              ))}
                            </div>
                          </div>

                          {/* Highlights */}
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

                          {/* Questions */}
                          <div>
                            <p className="text-[0.65rem] uppercase tracking-wider text-[#7A7A80] font-semibold mb-2">Questions Discussed</p>
                            <div className="space-y-1.5">
                              {replay.questions.map((q, qi) => (
                                <div key={qi} className="glass-button rounded-lg px-3 py-2 text-xs text-[#E0E0E5] italic">&ldquo;{q}&rdquo;</div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="space-y-2">
                            {match && (
                              <button className="w-full rounded-xl py-3 text-sm font-semibold bg-[#E040A0] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                Message {c.name}
                              </button>
                            )}
                            {canSecondChance && (
                              <button onClick={() => handleSecondChance(c.name)} className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:scale-[1.01]" style={{ backgroundColor: 'rgba(255,159,10,0.10)', border: '1px solid rgba(255,159,10,0.25)', color: '#FF9F0A' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Second Chance &mdash; Change to Like
                              </button>
                            )}
                            {usedSecondChance && !match && (
                              <div className="rounded-xl py-3 px-4 text-center" style={{ backgroundColor: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.12)' }}>
                                <p className="text-xs text-[#FF9F0A]">{'\u{1F525}'} You used your Second Chance &mdash; {c.name} has been notified</p>
                                <p className="text-[0.65rem] text-[#7A7A80] mt-0.5">They have 24 hours to rewatch and decide</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Investor insight */}
            <div className="glass-tile rounded-2xl p-6 mb-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#E040A0] font-semibold mb-4 text-center">What Just Happened</h3>
              <div className="space-y-3">
                {[
                  { metric: '25 minutes total', insight: 'vs. 3+ hours of texting on traditional apps' },
                  { metric: 'Zero catfishing', insight: 'Camera on = what you see is what you get' },
                  { metric: 'Emergency exit', insight: 'Instant safety disconnect \u2014 trust enables openness' },
                  { metric: 'Second Chance converts', insight: 'Users who rewatch upgrade 34% of passes to likes' },
                  { metric: 'Social sharing loop', insight: 'Every sharecard is a free ad to your exact demographic' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0] mt-2 shrink-0" />
                    <p className="text-sm"><span className="font-semibold text-white">{item.metric}</span> <span className="text-[#98989D]">&mdash; {item.insight}</span></p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full py-4 rounded-full bg-[#E040A0] text-white text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all" style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.3)' }}>Book Next Session &mdash; AED 75</button>
              <button onClick={onRestart} className="w-full py-3 rounded-full glass-button text-sm font-semibold text-[#98989D] hover:text-white transition-colors">&larr; Back to Pitch</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dot-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes card-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        @keyframes pulse-line { 0% { opacity: 0.3; transform: scaleX(0.95); } 50% { opacity: 1; transform: scaleX(1.05); } 100% { opacity: 0.3; transform: scaleX(0.95); } }
      `}</style>
    </div>
  )
}
