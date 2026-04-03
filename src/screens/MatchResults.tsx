import { useState, useEffect, useCallback, useRef } from 'react'
import BackgroundOrbs from '../components/BackgroundOrbs'
import PulseLogo from '../components/PulseLogo'

/* ─── SOUND ENGINE — Web Audio API procedural sounds ─────────
   No external audio files. Pure synthesis.
   tick: quick percussive click for each card flip
   match: warm rising chord when a mutual match is revealed
   drumroll: building anticipation before cascade
   ──────────────────────────────────────────────────────────── */
function createSoundEngine() {
  let ctx: AudioContext | null = null
  const getCtx = () => {
    if (!ctx) ctx = new AudioContext()
    return ctx
  }

  return {
    tick() {
      try {
        const c = getCtx()
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = 'sine'
        osc.frequency.value = 1200
        gain.gain.setValueAtTime(0.15, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime)
        osc.stop(c.currentTime + 0.08)
      } catch { /* */ }
    },

    matchChime() {
      try {
        const c = getCtx()
        // Rising major chord: C5 → E5 → G5 staggered
        ;[523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = c.createOscillator()
          const gain = c.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0, c.currentTime + i * 0.08)
          gain.gain.linearRampToValueAtTime(0.12, c.currentTime + i * 0.08 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.08 + 0.8)
          osc.connect(gain).connect(c.destination)
          osc.start(c.currentTime + i * 0.08)
          osc.stop(c.currentTime + i * 0.08 + 0.8)
        })
      } catch { /* */ }
    },

    drumroll() {
      try {
        const c = getCtx()
        // Soft snare-like noise bursts accelerating
        for (let i = 0; i < 16; i++) {
          const bufferSize = 800
          const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
          const data = buffer.getChannelData(0)
          for (let j = 0; j < bufferSize; j++) data[j] = (Math.random() * 2 - 1) * 0.3
          const noise = c.createBufferSource()
          noise.buffer = buffer
          const gain = c.createGain()
          const filter = c.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.value = 300
          filter.Q.value = 2
          const time = c.currentTime + i * (0.12 - i * 0.005)
          gain.gain.setValueAtTime(0.03 + i * 0.005, time)
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
          noise.connect(filter).connect(gain).connect(c.destination)
          noise.start(time)
          noise.stop(time + 0.06)
        }
      } catch { /* */ }
    },

    // Ringing tone for Say Hi call
    ringTone() {
      try {
        const c = getCtx()
        const playRing = (startTime: number) => {
          // Two-tone ring like a phone
          ;[440, 480].forEach(freq => {
            const osc = c.createOscillator()
            const gain = c.createGain()
            osc.type = 'sine'
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.08, startTime)
            gain.gain.setValueAtTime(0, startTime + 0.8)
            gain.gain.setValueAtTime(0.08, startTime + 1.2)
            gain.gain.setValueAtTime(0, startTime + 2.0)
            osc.connect(gain).connect(c.destination)
            osc.start(startTime)
            osc.stop(startTime + 2.5)
          })
        }
        // Ring twice
        playRing(c.currentTime)
        playRing(c.currentTime + 3)
      } catch { /* */ }
    },

    // Connected call tone — warm confirmation
    callConnected() {
      try {
        const c = getCtx()
        ;[523.25, 659.25].forEach((freq, i) => {
          const osc = c.createOscillator()
          const gain = c.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0, c.currentTime + i * 0.15)
          gain.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.15 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.4)
          osc.connect(gain).connect(c.destination)
          osc.start(c.currentTime + i * 0.15)
          osc.stop(c.currentTime + i * 0.15 + 0.4)
        })
      } catch { /* */ }
    },

    // Hangup tone
    hangup() {
      try {
        const c = getCtx()
        const osc = c.createOscillator()
        const gain = c.createGain()
        osc.type = 'sine'
        osc.frequency.value = 480
        gain.gain.setValueAtTime(0.1, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
        osc.frequency.linearRampToValueAtTime(320, c.currentTime + 0.3)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime)
        osc.stop(c.currentTime + 0.5)
      } catch { /* */ }
    },

    cleanup() {
      if (ctx) ctx.close().catch(() => {})
    }
  }
}

interface Props {
  user: { id: string; display_name: string; photo_url: string }
  sessionId: string
  matches: Array<{ match_id: string; partner_name: string; partner_photo: string; partner_id: string }>
  onNavigate: (screen: 'videodate' | 'home', data?: any) => void
}


// Confetti
interface ConfettiPiece { id: number; left: number; delay: number; duration: number; color: string; size: number; rotation: number }
function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#C83E88', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700', '#C82E88', '#B0B0FF']
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6, rotation: Math.random() * 360,
  }))
}

type Phase = 'intro' | 'cascade' | 'summary'

export default function MatchResults({ matches, onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [showConfetti, setShowConfetti] = useState(false)
  const [confetti] = useState(() => makeConfetti(80))
  const [showSharecard, setShowSharecard] = useState(false)

  // Sound engine
  const soundRef = useRef(createSoundEngine())
  useEffect(() => () => soundRef.current.cleanup(), [])

  const hasMatches = matches && matches.length > 0
  const [revealedCards, setRevealedCards] = useState<boolean[]>(new Array(Math.max(5, matches?.length || 0)).fill(false))

  // Track which match we're currently showcasing
  const [matchQueue, setMatchQueue] = useState<Array<{ match_id: string; partner_name: string; partner_photo: string; partner_id: string }>>([])
  const [matchIndex, setMatchIndex] = useState(0)
  const [matchCardTarget, setMatchCardTarget] = useState<{ match_id: string; partner_name: string; partner_photo: string; partner_id: string } | null>(null)

  useEffect(() => {
    if (phase === 'intro') {
      const drumTimer = setTimeout(() => soundRef.current.drumroll(), 200)
      const t = setTimeout(() => setPhase('cascade'), 1500)
      return () => { clearTimeout(t); clearTimeout(drumTimer) }
    }
    if (phase === 'cascade') {
      const cardCount = Math.max(5, matches?.length || 0)
      const flipTimers = Array.from({ length: cardCount }).map((_c, i) =>
        setTimeout(() => {
          setRevealedCards(prev => { const next = [...prev]; next[i] = true; return next })
          soundRef.current.tick()
        }, 300 * i)
      )

      const allFlippedTime = 300 * cardCount + 800
      const matchRevealTimer = setTimeout(() => {
        if (hasMatches && matches) {
          setMatchQueue(matches)
          setMatchIndex(0)
          soundRef.current.matchChime()
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 4000)
          setMatchCardTarget(matches[0])
        } else {
          setTimeout(() => setPhase('summary'), 1500)
        }
      }, allFlippedTime)

      return () => { flipTimers.forEach(clearTimeout); clearTimeout(matchRevealTimer) }
    }
  }, [phase, hasMatches, matches])

  const handleMatchCardClose = useCallback(() => {
    setMatchCardTarget(null)
    const nextIdx = matchIndex + 1
    if (nextIdx < matchQueue.length) {
      setTimeout(() => {
        setMatchIndex(nextIdx)
        soundRef.current.matchChime()
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
        setMatchCardTarget(matchQueue[nextIdx])
      }, 600)
    } else {
      setTimeout(() => setPhase('summary'), 800)
    }
  }, [matchIndex, matchQueue])

  const handleVideoDate = useCallback((match: { match_id: string; partner_name: string; partner_photo: string; partner_id: string }) => {
    onNavigate('videodate', { match })
  }, [onNavigate])

  return (
    <div className="fixed inset-0 bg-[#1E1B18] overflow-hidden">
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

      {/* Match Card overlay */}
      {matchCardTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full mx-4 animate-scale-in">
            <button
              onClick={handleMatchCardClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full glass-button flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="glass-tile rounded-3xl overflow-hidden">
              <img src={matchCardTarget.partner_photo} alt={matchCardTarget.partner_name} className="w-full aspect-square object-cover" />
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-2xl font-bold text-white">{matchCardTarget.partner_name}</p>
                  <p className="text-sm text-[#98989D]">You matched!</p>
                </div>
                <button
                  onClick={() => handleVideoDate(matchCardTarget)}
                  className="w-full py-4 rounded-full bg-[#C83E88] text-white font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ boxShadow: '0 4px 20px rgba(200,62,136,0.3)' }}
                >
                  Start Video Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speed Date overlay removed — navigates to dedicated SpeedDate screen */}


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
                background: 'linear-gradient(165deg, #1E1B18 0%, #161412 30%, #C83E88 100%)',
              }}>
                <div className="text-center">
                  <PulseLogo variant="full" color="white" size="md" />
                  <p className="text-[0.65rem] text-white/40 uppercase tracking-[0.2em]">Tonight's Session</p>
                </div>
                <div className="w-full">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { v: '5', l: 'People Met' },
                      { v: String(matches?.length || 0), l: 'Matches' },
                      { v: '25m', l: 'Total Time' },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl py-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
                        <p className="text-2xl font-bold text-white font-display">{s.v}</p>
                        <p className="text-[0.55rem] uppercase text-white/50 tracking-wider mt-0.5">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  {hasMatches && matches && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-xs text-white/50">Matched with</span>
                      <div className="flex -space-x-2">
                        {matches.map(m => (
                          <img key={m.match_id} src={m.partner_photo} alt={m.partner_name} className="w-7 h-7 rounded-full object-cover border-2 border-[#C83E88]" />
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-center text-sm italic text-white/70" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {hasMatches && matches && matches.length >= 2 ? '"Chemistry confirmed — twice."' : hasMatches && matches && matches.length === 1 ? '"Found a spark in 25 minutes."' : '"5 real conversations. Zero time wasted."'}
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
        <PulseLogo variant="full" color="accent" size="sm" />
        <div className="text-xs text-[#7A7A80]">
          {phase === 'intro' && 'Session Complete'}
          {phase === 'cascade' && 'Revealing...'}
          {phase === 'summary' && 'Your Results'}
        </div>
      </header>

      {/* ====== INTRO ====== */}
      {phase === 'intro' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-6">{'✨'}</div>
            <h2 className="text-3xl md:text-5xl mb-4 font-display" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic' }}>
              Time for the truth.
            </h2>
            <p className="text-[#98989D] text-base md:text-lg max-w-md mx-auto mb-2">You met 5 people tonight. You made your choices.</p>
            <p className="text-[#C83E88] text-lg font-semibold animate-pulse">Did they feel it too?</p>
          </div>
        </div>
      )}

      {/* ====== CASCADE REVEAL — all cards flip rapid-fire ====== */}
      {phase === 'cascade' && (
        <div className="absolute inset-0 top-12 z-10 flex items-center justify-center px-4 overflow-hidden">
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {Array.from({ length: Math.max(5, matches?.length || 0) }).map((_, i) => {
                const revealed = revealedCards[i]
                const match = matches?.[i]
                const isMatch = !!match && revealed
                return (
                  <div key={i} className="perspective-500">
                    <div
                      className="relative transition-all duration-700 ease-out"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: revealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                      }}
                    >
                      {/* Front — revealed result */}
                      <div
                        className={`glass-tile rounded-2xl overflow-hidden transition-all duration-500 ${isMatch ? 'ring-2 ring-[#C83E88]' : ''}`}
                        style={{
                          backfaceVisibility: 'hidden',
                          boxShadow: isMatch ? '0 0 30px rgba(200,62,136,0.25)' : '0 4px 16px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden">
                          {match ? (
                            <>
                              <img src={match.partner_photo} alt={match.partner_name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18] via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3">
                                <p className="text-sm font-bold text-white font-display">{match.partner_name}</p>
                              </div>
                              {isMatch && (
                                <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#C83E88] text-[0.55rem] font-bold text-white animate-scale-in">
                                  MATCH
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2A2528]/20 to-[#1E1B18]" />
                          )}
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          {match ? (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-[0.55rem] text-[#7A7A80] uppercase">Match</span>
                                <span className="text-sm">{'\u{1F525}'}</span>
                              </div>
                              <p className="text-center text-[0.6rem] font-bold text-[#C83E88] pt-1 animate-pulse">{'\u{1F4AB}'} Chemistry confirmed</p>
                            </>
                          ) : (
                            <div className="flex items-center justify-center py-1">
                              <span className="text-sm text-white/30">—</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Back — face down card */}
                      <div
                        className="absolute inset-0 glass-tile rounded-2xl flex flex-col items-center justify-center"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background: 'linear-gradient(135deg, rgba(200,62,136,0.08) 0%, rgba(200,62,136,0.02) 100%)',
                          border: '1px solid rgba(200,62,136,0.15)',
                        }}
                      >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                          style={{ background: 'rgba(200,62,136,0.10)' }}>
                          <svg className="w-6 h-6 text-[#C83E88]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <p className="text-[0.65rem] text-[#C83E88]/50 font-medium">?</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {!revealedCards[0] && (
              <p className="text-center mt-6 text-sm text-[#C83E88] animate-pulse font-medium">Revealing results...</p>
            )}
            {revealedCards.every(Boolean) && hasMatches && (
              <p className="text-center mt-6 text-lg font-display text-[#C83E88] animate-scale-in" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic' }}>
                {matches?.length || 0} mutual {matches?.length === 1 ? 'match' : 'matches'} tonight
              </p>
            )}
            {revealedCards.every(Boolean) && !hasMatches && (
              <p className="text-center mt-6 text-lg font-display text-[#7A7A80] animate-scale-in" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic' }}>
                No matches tonight
              </p>
            )}
          </div>
        </div>
      )}

      {/* ====== SUMMARY ====== */}
      {phase === 'summary' && (
        <div className="absolute inset-0 top-12 z-10 overflow-y-auto">
          {/* Split layout: results left, monetization right on desktop */}
          <div className="max-w-7xl mx-auto px-4 pb-24 pt-4 animate-fade-in lg:flex lg:gap-8 lg:items-start">

            {/* ── LEFT COLUMN: Your dates ── */}
            <div className="lg:flex-1 lg:max-w-2xl">

            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Tonight's Results</h2>
              <p className="text-sm text-[#98989D]">
                {hasMatches && matches ? `${matches.length} mutual ${matches.length === 1 ? 'match' : 'matches'} — real chemistry, confirmed.` : 'No mutual matches tonight — every session is different.'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { value: '5', label: 'People Met', icon: '\u{1F465}' },
                { value: String(matches?.length || 0), label: 'Matches', icon: '\u{1F4AB}' },
                { value: '25m', label: 'Total Time', icon: '⏱' },
                { value: '5', label: 'You Liked', icon: '\u{1F525}' },
              ].map((s, i) => (
                <div key={i} className="glass-tile rounded-2xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'backwards' }}>
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-2xl font-bold font-display mt-1" style={{ color: s.label === 'You Liked' ? '#C83E88' : '#C83E88' }}>{s.value}</p>
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

            {/* Matches list */}
            {hasMatches && matches && (
              <>
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#7A7A80] font-semibold mb-3">Your Matches</h3>
                <div className="space-y-3 mb-8">
                  {matches.map((m, i) => (
                    <div key={m.match_id} className="glass-tile rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up ring-1 ring-[rgba(200,62,136,0.30)]" style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: 'backwards', boxShadow: '0 4px 16px rgba(200,62,136,0.10)' }}>
                      <div className="p-4 flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img src={m.partner_photo} alt={m.partner_name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: '2px solid #C83E88' }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white">{m.partner_name}</p>
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[rgba(200,62,136,0.12)] text-[#C83E88] font-bold inline-block mt-1">Match</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleVideoDate(m)}
                          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white hover:scale-105 active:scale-95 transition-all shrink-0"
                          style={{ background: 'linear-gradient(135deg, #C83E88, #C030A0)', boxShadow: '0 2px 12px rgba(200,62,136,0.35)' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            </div>{/* end left column */}

            {/* ── RIGHT COLUMN: Monetization + Next Session ── */}
            <div className="lg:w-[380px] lg:shrink-0 lg:sticky lg:top-16 mt-8 lg:mt-0 space-y-5">

              {/* 🔥 NEXT SESSION CTA — high urgency */}
              <div className="glass-tile rounded-2xl p-6 text-center" style={{ border: '1px solid rgba(200,62,136,0.20)', boxShadow: '0 0 30px rgba(200,62,136,0.08)' }}>
                <div className="w-14 h-14 rounded-full bg-[#C83E88]/15 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔥</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1 font-display">Ride the Momentum</h3>
                <p className="text-sm text-[#98989D] mb-4">Next session starts in 15 minutes. 6 spots left.</p>
                <div className="glass-tile rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#C83E88] font-mono">14:52</p>
                      <p className="text-[0.6rem] text-[#7A7A80] uppercase tracking-wider">Until next session</p>
                    </div>
                  </div>
                </div>
                <button className="w-full py-3.5 rounded-full bg-[#C83E88] text-white text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all mb-2" style={{ boxShadow: '0 4px 20px rgba(200,62,136,0.3)' }}>
                  Jump In &mdash; AED 75
                </button>
                <p className="text-[0.65rem] text-[#7A7A80]">5 new people, fresh connections</p>
              </div>

              {/* Premium upsell */}
              <div className="glass-tile rounded-2xl p-5" style={{ border: '1px solid rgba(201,149,107,0.25)', background: 'linear-gradient(135deg, rgba(201,149,107,0.06) 0%, rgba(255,255,255,0.04) 100%)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">👑</span>
                  <p className="text-xs text-[#C9956B] font-bold uppercase tracking-wider">Pulse Premium</p>
                </div>
                <p className="text-sm text-white font-medium mb-2">Unlimited sessions. Priority matching.</p>
                <div className="space-y-1.5 mb-4">
                  {['Unlimited sessions per week', 'See who liked you first', 'Extended 10-min dates', 'Priority in matching queue'].map((perk, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-[#C9956B]" />
                      <p className="text-xs text-[#98989D]">{perk}</p>
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, rgba(201,149,107,0.2) 0%, rgba(201,149,107,0.08) 100%)', color: '#C9956B', border: '1px solid rgba(201,149,107,0.25)' }}>
                  AED 199/month &mdash; Start Free Trial
                </button>
              </div>

              {/* Cinematic sponsor moment */}
              <div className="glass-tile rounded-2xl overflow-hidden relative" style={{ border: '1px solid rgba(201,149,107,0.20)' }}>
                <div className="absolute inset-0 opacity-25">
                  <img src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=3840&q=95" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[0.5rem] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full" style={{ color: 'rgba(201,149,107,0.7)', border: '0.5px solid rgba(201,149,107,0.2)' }}>
                      Presented by
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>The Palm Jumeirah</p>
                  <p className="text-xs text-white/40 italic mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Where every sunset tells a story</p>
                  <button className="w-full py-2.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: 'rgba(201,149,107,0.12)', color: '#C9956B', border: '1px solid rgba(201,149,107,0.20)' }}>
                    Book a date night &rarr;
                  </button>
                </div>
              </div>

              {/* Pulse brand quote */}
              <div className="glass-tile rounded-2xl p-4 text-center" style={{ border: '1px solid rgba(200,62,136,0.08)' }}>
                <p className="text-sm text-white/70 leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
                  &ldquo;The best connections happen when you stop scrolling and start showing up.&rdquo;
                </p>
                <p className="text-[0.6rem] text-[#C83E88] uppercase tracking-[0.25em] mt-2 font-semibold">Pulse</p>
              </div>

              {/* Investor insight — collapsed into right column */}
              <div className="glass-tile rounded-2xl p-5">
                <h3 className="text-xs tracking-[0.2em] uppercase text-[#C83E88] font-semibold mb-3">What Just Happened</h3>
                <div className="space-y-2">
                  {[
                    { metric: '25 minutes total', insight: 'vs. 3+ hours of texting' },
                    { metric: 'Zero catfishing', insight: 'Camera on = what you get' },
                    { metric: '2nd Chance converts', insight: '34% upgrade passes to likes' },
                    { metric: 'Social loop', insight: 'Every sharecard = free ad' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C83E88] mt-1.5 shrink-0" />
                      <p className="text-xs"><span className="font-semibold text-white">{item.metric}</span> <span className="text-[#7A7A80]">&mdash; {item.insight}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom actions */}
              <div className="space-y-3">
                <button onClick={() => onNavigate('home')} className="w-full py-4 rounded-full bg-[#C83E88] text-white text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all lg:hidden" style={{ boxShadow: '0 4px 20px rgba(200,62,136,0.3)' }}>Back to Lobby →</button>
              </div>
            </div>{/* end right column */}

          </div>

        </div>
      )}

      <style>{`
        .perspective-500 { perspective: 500px; }
        @keyframes dot-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes card-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
        @keyframes pulse-line { 0% { opacity: 0.3; transform: scaleX(0.95); } 50% { opacity: 1; transform: scaleX(1.05); } 100% { opacity: 0.3; transform: scaleX(0.95); } }
        @keyframes wave-bar { 0% { height: 8px; } 100% { height: 28px; } }
        @keyframes shimmer-btn { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </div>
  )
}
