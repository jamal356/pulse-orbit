import { useState, useEffect, useCallback, useRef } from 'react'
import { candidates, conversationStarters, USER_COLOR } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'
import MatchCard from '../components/MatchCard'
import PulseLogo from '../components/PulseLogo'
import type { Candidate } from '../data/people'

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
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
  onContinue?: () => void
  onSpeedDate?: (candidate: Candidate) => void
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
  const colors = ['#C83E88', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700', '#C82E88', '#B0B0FF']
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6, rotation: Math.random() * 360,
  }))
}

type Phase = 'intro' | 'cascade' | 'summary'

export default function MatchResults({ ratings, onRestart, onContinue, onSpeedDate }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [revealedCards, setRevealedCards] = useState<boolean[]>(candidates.map(() => false))
  const [showConfetti, setShowConfetti] = useState(false)
  const [confetti] = useState(() => makeConfetti(80))
  const [replayOpen, setReplayOpen] = useState<string | null>(null)
  const [showSharecard, setShowSharecard] = useState(false)

  // Second Chance state
  const [secondChances, setSecondChances] = useState<Record<string, boolean>>({})
  const [secondChanceNotif, setSecondChanceNotif] = useState<string | null>(null)

  // Match Card state — shown when a mutual match is revealed
  const [matchCardTarget, setMatchCardTarget] = useState<Candidate | null>(null)

  // Sound engine
  const soundRef = useRef(createSoundEngine())
  useEffect(() => () => soundRef.current.cleanup(), [])

  // Speed Date handler — navigates to 1-to-1 speed date screen
  const handleSpeedDate = useCallback((c: Candidate) => {
    if (onSpeedDate) onSpeedDate(c)
  }, [onSpeedDate])

  // Derived
  const getEffectiveRating = useCallback((name: string) => secondChances[name] ? 'like' as const : (ratings[name] || 'pass' as const), [secondChances, ratings])
  const mutualMatches = candidates.filter(c => getEffectiveRating(c.name) === 'like' && theirRatings[c.name] === 'like')

  // Second Chance handler
  const handleSecondChance = useCallback((name: string) => {
    setSecondChances(prev => ({ ...prev, [name]: true }))
    setSecondChanceNotif(name)
    setTimeout(() => setSecondChanceNotif(null), 3000)
  }, [])

  /* ─── CASCADE REVEAL ───
     Intro (1.5s) → all 5 cards flip rapid-fire (300ms apart = 1.5s) → celebrate (2.5s) → summary
     Total: ~5.5 seconds. Fast, dramatic, no dead air.
     ─────────────────────── */
  useEffect(() => {
    if (phase === 'intro') {
      // Play drumroll during intro
      const drumTimer = setTimeout(() => soundRef.current.drumroll(), 200)
      const t = setTimeout(() => setPhase('cascade'), 1500)
      return () => { clearTimeout(t); clearTimeout(drumTimer) }
    }
    if (phase === 'cascade') {
      let hasMatch = false
      const timers = candidates.map((c, i) =>
        setTimeout(() => {
          setRevealedCards(prev => { const next = [...prev]; next[i] = true; return next })
          // Card flip sound
          soundRef.current.tick()
          const yours = secondChances[c.name] ? 'like' : (ratings[c.name] || 'pass')
          const theirs = theirRatings[c.name] || 'pass'
          if (yours === 'like' && theirs === 'like' && !hasMatch) {
            hasMatch = true
            // Match chime!
            setTimeout(() => soundRef.current.matchChime(), 100)
            setTimeout(() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000) }, 200)
            setTimeout(() => setMatchCardTarget(c), 800)
          }
        }, 300 * i)
      )
      const summaryTimer = setTimeout(() => setPhase('summary'), 300 * candidates.length + 2500)
      return () => { timers.forEach(clearTimeout); clearTimeout(summaryTimer) }
    }
  }, [phase, ratings, secondChances])

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
        <MatchCard
          match={matchCardTarget}
          onClose={() => setMatchCardTarget(null)}
        />
      )}

      {/* Speed Date overlay removed — navigates to dedicated SpeedDate screen */}

      {/* Second Chance notification toast */}
      {secondChanceNotif && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="glass-tile rounded-2xl px-5 py-3 flex items-center gap-3" style={{ boxShadow: '0 8px 32px rgba(200,62,136,0.25)' }}>
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
                          <img key={m.name} src={m.photo} alt={m.name} className="w-7 h-7 rounded-full object-cover border-2 border-[#C83E88]" />
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
            <div className="text-6xl mb-6">{'\u2728'}</div>
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
              {candidates.map((c, i) => {
                const revealed = revealedCards[i]
                const effRating = getEffectiveRating(c.name)
                const theirs = theirRatings[c.name] || 'pass'
                const isMatch = effRating === 'like' && theirs === 'like'
                return (
                  <div key={c.name} className="perspective-500">
                    <div
                      className="relative transition-all duration-700 ease-out"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: revealed ? 'rotateY(0deg)' : 'rotateY(180deg)',
                      }}
                    >
                      {/* Front — revealed result */}
                      <div
                        className={`glass-tile rounded-2xl overflow-hidden transition-all duration-500 ${isMatch && revealed ? 'ring-2 ring-[#C83E88]' : ''}`}
                        style={{
                          backfaceVisibility: 'hidden',
                          boxShadow: isMatch && revealed ? '0 0 30px rgba(200,62,136,0.25)' : '0 4px 16px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img src={c.photo} alt={c.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18] via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            <p className="text-sm font-bold text-white font-display">{c.name}, {c.age}</p>
                            <p className="text-[0.6rem] text-white/50">{c.location}</p>
                          </div>
                          {isMatch && revealed && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#C83E88] text-[0.55rem] font-bold text-white animate-scale-in">
                              MATCH
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[0.55rem] text-[#7A7A80] uppercase">You</span>
                            <span className="text-sm">{effRating === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span>
                          </div>
                          <div className="h-px" style={{ background: 'rgba(200,62,136,0.10)' }} />
                          <div className="flex items-center justify-between">
                            <span className="text-[0.55rem] text-[#7A7A80] uppercase">Them</span>
                            <span className="text-sm">{theirs === 'like' ? '\u{1F525}' : '\u2744\u{FE0F}'}</span>
                          </div>
                          {isMatch && (
                            <p className="text-center text-[0.6rem] font-bold text-[#C83E88] pt-1 animate-pulse">{'\u{1F4AB}'} Chemistry confirmed</p>
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

            {/* Countdown text */}
            {!revealedCards[0] && (
              <p className="text-center mt-6 text-sm text-[#C83E88] animate-pulse font-medium">Revealing results...</p>
            )}
            {revealedCards.every(Boolean) && mutualMatches.length > 0 && (
              <p className="text-center mt-6 text-lg font-display text-[#C83E88] animate-scale-in" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic' }}>
                {mutualMatches.length} mutual {mutualMatches.length === 1 ? 'match' : 'matches'} tonight
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
                  <p className="text-2xl font-bold font-display mt-1" style={{ color: s.label === 'You Liked' ? USER_COLOR.primary : '#C83E88' }}>{s.value}</p>
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
                  <div key={c.name} className={`glass-tile rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up ${match ? 'ring-1 ring-[rgba(200,62,136,0.30)]' : ''}`} style={{ animationDelay: `${0.3 + i * 0.08}s`, animationFillMode: 'backwards', boxShadow: match ? '0 4px 16px rgba(200,62,136,0.10)' : undefined }}>
                    <div className="p-4 flex items-center gap-3">
                      <img src={c.photo} alt={c.name} className="w-12 h-12 rounded-full object-cover shrink-0" style={{ border: match ? '2px solid #C83E88' : '2px solid rgba(255,255,255,0.1)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white">{c.name}, {c.age}</p>
                          {match && <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[rgba(200,62,136,0.12)] text-[#C83E88] font-bold">Match</span>}
                          {usedSecondChance && <span className="text-[0.6rem] px-2 py-0.5 rounded-full bg-[rgba(255,159,10,0.12)] text-[#FF9F0A] font-bold">2nd Chance</span>}
                        </div>
                        <p className="text-xs text-[#7A7A80]">{c.location}</p>
                      </div>

                      {/* ── PRIMARY ACTIONS — visible at card level, no expand needed ── */}
                      <div className="flex items-center gap-2 shrink-0">
                        {match && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSpeedDate(c) }}
                            className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white hover:scale-105 active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #C83E88, #C030A0)', boxShadow: '0 2px 12px rgba(200,62,136,0.35)' }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Speed Date
                          </button>
                        )}
                        {match && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setMatchCardTarget(c) }}
                            className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
                            style={{ background: 'rgba(200,62,136,0.12)', border: '1px solid rgba(200,62,136,0.20)' }}
                            title="View Match Card"
                          >
                            <span className="text-sm">💖</span>
                          </button>
                        )}
                        {canSecondChance && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSecondChance(c.name) }}
                            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold hover:scale-105 active:scale-95 transition-all"
                            style={{ background: 'rgba(255,159,10,0.10)', border: '1px solid rgba(255,159,10,0.25)', color: '#FF9F0A' }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            2nd Chance
                          </button>
                        )}
                        <button onClick={() => setReplayOpen(isReplayOpen ? null : c.name)} className="shrink-0 w-9 h-9 rounded-full glass-button flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
                          <svg className={`w-4 h-4 transition-transform ${isReplayOpen ? 'rotate-180' : ''} text-[#E0E0E5]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>

                    {isReplayOpen && replay && (
                      <div className="px-4 pb-4 animate-slide-up" style={{ animationDuration: '0.3s', borderTop: '1px solid rgba(200,62,136,0.08)' }}>
                        <div className="pt-3 space-y-4">
                          {/* Replay video */}
                          <div className="rounded-xl overflow-hidden glass-button">
                            <div className="aspect-video relative flex items-center justify-center">
                              <img src={c.photo} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-30" style={{ filter: 'blur(8px)' }} />
                              <div className="relative z-10 flex flex-col items-center gap-2">
                                <button className="w-14 h-14 rounded-full bg-[#C83E88]/20 border border-[#C83E88]/30 flex items-center justify-center hover:scale-110 transition-transform">
                                  <svg className="w-6 h-6 ml-0.5 text-[#C83E88]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
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
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#C83E88] mt-1.5 shrink-0" />
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

                          {/* Actions — secondary actions only (primary Say Hi + Match Card are at card level) */}
                          <div className="space-y-2">
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
                {onContinue ? (
                  <button onClick={onContinue} className="w-full py-4 rounded-full bg-[#C83E88] text-white text-base font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all lg:hidden" style={{ boxShadow: '0 4px 20px rgba(200,62,136,0.3)' }}>Continue →</button>
                ) : null}
                <button onClick={onRestart} className="w-full py-3 rounded-full glass-button text-sm font-semibold text-[#98989D] hover:text-white transition-colors">&larr; Replay demo</button>
              </div>
            </div>{/* end right column */}

          </div>

          {/* ════════════════════════════════════════════════════════
              INVESTOR CLOSER — Full-width. Below everything.
              Steve Jobs pitching the board. No apologies.
              ════════════════════════════════════════════════════════ */}
          <div className="relative mt-16 mb-8" style={{ borderTop: '1px solid rgba(200,62,136,0.15)' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(200,62,136,0.10) 0%, transparent 60%)',
            }} />

            <div className="max-w-5xl mx-auto px-6 pt-16 pb-8 relative z-10">

              {/* ── THE HOOK ── */}
              <div className="text-center mb-16">
                <p className="text-xs uppercase tracking-[0.4em] text-[#C83E88] font-semibold mb-8">Seed Round &middot; Open Now</p>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                  You just used a product that<br />
                  <span style={{ color: '#C83E88' }}>doesn&rsquo;t exist yet.</span>
                </h2>

                <p className="text-lg md:text-xl text-[#B0B0B8] max-w-2xl mx-auto leading-relaxed">
                  What you experienced in the last 3 minutes took Tinder 10 years and $3B in revenue to never figure out. We pilot in Dubai. Then we go everywhere &mdash; fast.
                </p>
              </div>

              {/* ── THE OPPORTUNITY ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto mb-16">
                {[
                  { value: '$12B', label: 'Global dating market', sub: '2025, growing 8% YoY' },
                  { value: '70%', label: 'MENA population under 30', sub: 'No dominant player' },
                  { value: 'AED 75', label: 'Revenue per user per session', sub: 'Day 1 monetization' },
                  { value: '$0', label: 'CAC via viral loop', sub: 'Every session = content' },
                ].map((s, i) => (
                  <div key={i} className="glass-tile rounded-2xl p-5 text-center animate-slide-up" style={{ animationDelay: `${0.8 + i * 0.12}s`, animationFillMode: 'backwards' }}>
                    <p className="text-2xl md:text-3xl font-bold font-display text-white">{s.value}</p>
                    <p className="text-xs text-[#C83E88] font-semibold mt-2 uppercase tracking-wider">{s.label}</p>
                    <p className="text-[0.65rem] text-[#7A7A80] mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── REVENUE STREAMS ── */}
              <div className="max-w-4xl mx-auto mb-16">
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#7A7A80] font-semibold mb-6 text-center">Seven Revenue Streams From Day One</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: '🎟️', title: 'Session tickets — AED 75/user', desc: 'Core revenue. 10 users per session = AED 750. Two sessions/night, 4 nights/week = AED 24K/month from a single city before scaling.', highlight: true },
                    { icon: '👑', title: 'Pulse Premium — AED 199/month', desc: 'Unlimited sessions, see who liked you, 10-min dates, priority matching. Targets power users who come back weekly.' },
                    { icon: '🔄', title: '2nd Chance & One More Thing', desc: 'In-session microtransactions. Retroactive pass-to-like conversions and time extensions. Impulse purchases at peak emotional moments.' },
                    { icon: '🏢', title: 'Sponsored sessions & venue partnerships', desc: 'Brands sponsor themed sessions ("Porsche Date Night," "The Palm Singles"). Venues bid to host. Media value per session is measurable.' },
                    { icon: '📱', title: 'AI photo enhancement', desc: 'Users upload photos, AI generates professional-quality profile pictures. Free basic tier drives platform quality. Premium packs at AED 25\u201349.' },
                    { icon: '📊', title: 'Sharecard & content virality', desc: 'Every session generates branded content. Organic reach on Instagram, WhatsApp, X. Users market the product. CAC approaches zero at scale.' },
                  ].map((item, i) => (
                    <div key={i} className={`glass-tile rounded-2xl p-5 animate-slide-up ${item.highlight ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${1.2 + i * 0.08}s`, animationFillMode: 'backwards', border: item.highlight ? '1px solid rgba(200,62,136,0.20)' : undefined }}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-white mb-1">{item.title}</p>
                          <p className="text-xs text-[#98989D] leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── THE DATA MOAT ── */}
              <div className="max-w-4xl mx-auto mb-16">
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#7A7A80] font-semibold mb-6 text-center">The Data Moat</h3>
                <div className="glass-tile rounded-2xl p-6 md:p-8" style={{ border: '1px solid rgba(200,62,136,0.15)', background: 'linear-gradient(160deg, rgba(200,62,136,0.04) 0%, rgba(0,0,0,0.1) 100%)' }}>
                  <p className="text-base md:text-lg text-white font-medium mb-4 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Every 5-minute date generates more signal than 10,000 swipes.
                  </p>
                  <p className="text-xs text-[#98989D] text-center max-w-2xl mx-auto mb-6 leading-relaxed">
                    Swipe apps know who you tap. We know who you actually connect with &mdash; on camera, in real time. That&rsquo;s a fundamentally different dataset.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Behavioral matching AI', desc: 'Conversation flow, reaction patterns, mutual engagement signals, spark timing. Train a matching algorithm no competitor can replicate because no competitor has live video interaction data at scale.' },
                      { title: 'Predictive chemistry scoring', desc: 'Over time, predict match quality before a session starts. Higher match rates = higher retention = higher LTV. The product gets smarter every session.' },
                      { title: 'Licensable insight layer', desc: 'Anonymized behavioral data on real-world chemistry becomes a B2B product. Dating platforms, matchmaking services, and relationship researchers have nothing like this. New revenue vertical.' },
                    ].map((item, i) => (
                      <div key={i} className="animate-slide-up" style={{ animationDelay: `${1.6 + i * 0.1}s`, animationFillMode: 'backwards' }}>
                        <p className="text-sm font-bold text-[#C83E88] mb-2">{item.title}</p>
                        <p className="text-xs text-[#98989D] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── THE GO-TO-MARKET ── */}
              <div className="max-w-4xl mx-auto mb-16">
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#7A7A80] font-semibold mb-6 text-center">Go-To-Market</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { phase: '01', title: 'Dubai Pilot', desc: 'Controlled launch. 500 curated users, influencer seeding, exclusive venue partnerships. Prove retention and unit economics.', color: '#C83E88' },
                    { phase: '02', title: 'Content Detonation', desc: 'Every session generates Instagram stories, TikToks, tweets. Dubai is the world\u2019s social media stage. We don\u2019t buy reach \u2014 users create it.', color: '#C83E88' },
                    { phase: '03', title: 'Global Wave', desc: 'Once viral content hits, we open waitlists city by city. London, Riyadh, Mumbai, NYC. The product travels because the content travels.', color: '#C83E88' },
                  ].map((item, i) => (
                    <div key={i} className="glass-tile rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${1.8 + i * 0.1}s`, animationFillMode: 'backwards' }}>
                      <p className="text-2xl font-bold font-display mb-2" style={{ color: item.color, opacity: 0.4 }}>{item.phase}</p>
                      <p className="text-sm font-bold text-white mb-2">{item.title}</p>
                      <p className="text-xs text-[#98989D] leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── USE OF FUNDS ── */}
              <div className="max-w-3xl mx-auto mb-16">
                <h3 className="text-xs uppercase tracking-[0.3em] text-[#7A7A80] font-semibold mb-6 text-center">Use of Funds</h3>
                <div className="glass-tile rounded-2xl p-6">
                  <div className="space-y-4">
                    {[
                      { pct: 35, label: 'Product & Engineering', detail: 'Real-time video infrastructure, matching algorithm, iOS + Android' },
                      { pct: 35, label: 'Dubai Pilot & Viral Launch', detail: 'Influencer seeding, launch events, content engine, PR blitz' },
                      { pct: 20, label: 'Operations & Safety', detail: 'Trust & safety team, legal, compliance, venue partnerships' },
                      { pct: 10, label: 'Reserve', detail: 'Runway buffer for rapid scaling' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-white font-medium">{item.label}</span>
                          <span className="text-sm font-bold text-[#C83E88]">{item.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(200,62,136,0.08)' }}>
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, background: 'linear-gradient(90deg, #C83E88, #C030A0)', animationDelay: `${1.5 + i * 0.15}s` }} />
                        </div>
                        <p className="text-[0.65rem] text-[#7A7A80] mt-1">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── THE ASK ── */}
              <div className="text-center max-w-2xl mx-auto mb-8">
                <p className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Raising $2.5M. Dubai pilot. Then the world.
                </p>
                <p className="text-sm text-[#98989D] mb-8">
                  The product works. Dubai is the fuse. The only question is whether you&rsquo;re in before it lights.
                </p>

                <a href="mailto:jamal@hakadian.com?subject=Pulse%20%E2%80%94%20Investment%20Inquiry" className="inline-block px-12 py-4 rounded-full text-base font-bold text-white text-center hover:scale-[1.03] active:scale-[0.98] transition-all mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #C83E88 0%, #C030A0 50%, #C83E88 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer-btn 3s ease-in-out infinite',
                    boxShadow: '0 6px 30px rgba(200,62,136,0.4), 0 0 80px rgba(200,62,136,0.12)',
                  }}>
                  jamal@hakadian.com
                </a>
                <p className="text-sm text-[#7A7A80]">Jamal Hakadian &middot; Founder &middot; Dubai, UAE</p>
              </div>

            </div>
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
