import { useState, useCallback, useEffect, useRef } from 'react'
import { candidates, photos, USER_COLOR, genderColors } from '../data/people'
import type { Candidate } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  onSpeedDate: (candidate: Candidate) => void
  onGroupSession: () => void
}

/* ─── DISCOVER ──────────────────────────────────────────────
   Profile browsing / swiping. Two things can happen:

   1. User swipes right on someone who also swiped right → MATCH
      → Both accept a 1-to-1 speed date (no chat, no texting)
      → Navigates to SpeedDate screen

   2. User decides to join a group session instead
      → Navigates to SessionLobby for the 5×5 format

   For the demo, we simulate a mutual match on the 2nd "like"
   to show both paths convincingly.
   ──────────────────────────────────────────────────────────── */

// Additional profiles for the discover feed (beyond the 5×5 group candidates)
const discoverProfiles: Candidate[] = [
  {
    name: 'Maya',
    age: 27,
    location: 'Dubai Marina',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
    bio: 'Documentary filmmaker chasing stories across the Gulf',
    tags: ['Film', 'Travel', 'Sushi'],
    gender: 'female',
  },
  {
    name: 'Zara',
    age: 30,
    location: 'DIFC, Dubai',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    bio: 'Venture capital analyst. Weekend potter. Terrible cook.',
    tags: ['Finance', 'Art', 'Yoga'],
    gender: 'female',
  },
  {
    name: 'Lina',
    age: 25,
    location: 'Jumeirah, Dubai',
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&q=80',
    bio: 'Architect who believes every building should make you feel something',
    tags: ['Design', 'Music', 'Running'],
    gender: 'female',
  },
  // Also include some from the main cast for continuity
  candidates[0], // Sofia
  candidates[2], // Amira
]

// Who will be the match? 2nd profile (Zara)
const MATCH_INDEX = 1
const MATCH_CANDIDATE = discoverProfiles[MATCH_INDEX]

// Sound effects
function createDiscoverSounds() {
  let ctx: AudioContext | null = null
  const getCtx = () => { if (!ctx) ctx = new AudioContext(); return ctx }
  return {
    swipeRight() {
      try {
        const c = getCtx()
        const osc = c.createOscillator(); const gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = 800
        osc.frequency.linearRampToValueAtTime(1200, c.currentTime + 0.15)
        gain.gain.setValueAtTime(0.1, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.2)
      } catch { /* */ }
    },
    swipeLeft() {
      try {
        const c = getCtx()
        const osc = c.createOscillator(); const gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = 600
        osc.frequency.linearRampToValueAtTime(400, c.currentTime + 0.1)
        gain.gain.setValueAtTime(0.06, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.12)
      } catch { /* */ }
    },
    matchChime() {
      try {
        const c = getCtx()
        ;[523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = c.createOscillator(); const gain = c.createGain()
          osc.type = 'sine'; osc.frequency.value = freq
          gain.gain.setValueAtTime(0, c.currentTime + i * 0.1)
          gain.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.1 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 1.0)
          osc.connect(gain).connect(c.destination)
          osc.start(c.currentTime + i * 0.1); osc.stop(c.currentTime + i * 0.1 + 1.0)
        })
      } catch { /* */ }
    },
    cleanup() { if (ctx) ctx.close().catch(() => {}) }
  }
}

type DiscoverPhase = 'browsing' | 'match-reveal' | 'accept-prompt' | 'connecting'

interface ConfettiPiece { id: number; left: number; delay: number; duration: number; color: string; size: number; rotation: number }
function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#E040A0', '#F050B0', '#FF6EC7', '#6060FF', '#30D158', '#FF9F0A', '#FFD700']
  return Array.from({ length: count }, (_, i) => ({
    id: i, left: Math.random() * 100, delay: Math.random() * 1.5, duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)], size: 4 + Math.random() * 6, rotation: Math.random() * 360,
  }))
}

export default function Discover({ onSpeedDate, onGroupSession }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<DiscoverPhase>('browsing')
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [visible, setVisible] = useState(false)
  const [likes, setLikes] = useState<string[]>([])
  const [confetti] = useState(() => makeConfetti(60))
  const [showConfetti, setShowConfetti] = useState(false)
  const [partnerAccepted, setPartnerAccepted] = useState(false)
  const [userAccepted, setUserAccepted] = useState(false)
  const soundRef = useRef(createDiscoverSounds())
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(0)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    return () => soundRef.current.cleanup()
  }, [])

  const currentProfile = discoverProfiles[currentIndex]
  const isLastCard = currentIndex >= discoverProfiles.length

  // Simulate partner accepting after user accepts
  useEffect(() => {
    if (userAccepted && !partnerAccepted) {
      const timer = setTimeout(() => setPartnerAccepted(true), 1800)
      return () => clearTimeout(timer)
    }
  }, [userAccepted, partnerAccepted])

  // Both accepted → start connecting → navigate to speed date
  useEffect(() => {
    if (userAccepted && partnerAccepted && phase === 'accept-prompt') {
      setPhase('connecting')
      const timer = setTimeout(() => onSpeedDate(MATCH_CANDIDATE), 2500)
      return () => clearTimeout(timer)
    }
  }, [userAccepted, partnerAccepted, phase, onSpeedDate])

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (phase !== 'browsing' || isLastCard) return
    setSwipeDirection(direction)

    if (direction === 'right') {
      soundRef.current.swipeRight()
      setLikes(prev => [...prev, currentProfile.name])
    } else {
      soundRef.current.swipeLeft()
    }

    // Check for match — trigger on the MATCH_INDEX profile when swiped right
    const isMatchProfile = currentIndex === MATCH_INDEX && direction === 'right'

    setTimeout(() => {
      setSwipeDirection(null)
      setDragX(0)
      if (isMatchProfile) {
        // MATCH!
        soundRef.current.matchChime()
        setShowConfetti(true)
        setPhase('match-reveal')
        setTimeout(() => {
          setShowConfetti(false)
          setPhase('accept-prompt')
        }, 3500)
      } else {
        setCurrentIndex(prev => prev + 1)
      }
    }, 350)
  }, [phase, isLastCard, currentIndex, currentProfile])

  // Touch/drag handling
  const handleDragStart = useCallback((clientX: number) => {
    if (phase !== 'browsing') return
    setIsDragging(true)
    dragStartRef.current = clientX
  }, [phase])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return
    setDragX(clientX - dragStartRef.current)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > 80) handleSwipe('right')
    else if (dragX < -80) handleSwipe('left')
    else setDragX(0)
  }, [isDragging, dragX, handleSwipe])

  // ── MATCH REVEAL ──
  if (phase === 'match-reveal') {
    return (
      <div className="fixed inset-0 bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
        <BackgroundOrbs />
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
        <div className="relative z-10 text-center animate-scale-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img src={photos.user} alt="You" className="w-24 h-24 rounded-full object-cover"
              style={{ border: `3px solid ${USER_COLOR.primary}`, boxShadow: `0 0 30px rgba(${USER_COLOR.rgb},0.4)` }} />
            <div className="text-4xl" style={{ animation: 'spark-pulse 0.8s ease-in-out infinite' }}>💖</div>
            <img src={MATCH_CANDIDATE.photo} alt={MATCH_CANDIDATE.name} className="w-24 h-24 rounded-full object-cover"
              style={{ border: `3px solid ${genderColors.female.primary}`, boxShadow: `0 0 30px rgba(${genderColors.female.rgb},0.4)` }} />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            It's a Match!
          </h2>
          <p className="text-base text-[#E040A0]">You and {MATCH_CANDIDATE.name} liked each other</p>
        </div>
        <style>{`@keyframes spark-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }`}</style>
      </div>
    )
  }

  // ── ACCEPT PROMPT — both must click to start the speed date ──
  if (phase === 'accept-prompt' || phase === 'connecting') {
    return (
      <div className="fixed inset-0 bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
        <BackgroundOrbs />
        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-6">
              <img src={photos.user} alt="You" className="w-20 h-20 rounded-full object-cover"
                style={{ border: `3px solid ${USER_COLOR.primary}`, boxShadow: `0 0 25px rgba(${USER_COLOR.rgb},0.3)` }} />
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-[2px] rounded-full bg-[#E040A0]/30" />
                <span className="text-xs text-[#E040A0]/50">♥</span>
                <div className="w-8 h-[2px] rounded-full bg-[#E040A0]/30" />
              </div>
              <img src={MATCH_CANDIDATE.photo} alt={MATCH_CANDIDATE.name} className="w-20 h-20 rounded-full object-cover"
                style={{ border: `3px solid ${genderColors.female.primary}`, boxShadow: `0 0 25px rgba(${genderColors.female.rgb},0.3)` }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Skip the chat?</h2>
            <p className="text-sm text-[#98989D] leading-relaxed max-w-xs mx-auto">
              Both of you need to accept to start a 1-to-1 speed date. 5 minutes, face to face, right now.
            </p>
          </div>

          {/* Accept status cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Your status */}
            <div className={`glass-tile rounded-2xl p-4 text-center transition-all duration-500 ${userAccepted ? 'ring-2' : ''}`}
              style={userAccepted ? { borderColor: USER_COLOR.primary, boxShadow: `0 0 20px rgba(${USER_COLOR.rgb},0.2)` } : {}}>
              <img src={photos.user} alt="You" className="w-12 h-12 rounded-full object-cover mx-auto mb-2" style={{ border: `2px solid ${USER_COLOR.primary}` }} />
              <p className="text-sm font-semibold text-white mb-1">You</p>
              {userAccepted ? (
                <div className="flex items-center justify-center gap-1 animate-scale-in">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: USER_COLOR.primary }}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: USER_COLOR.primary }}>Ready</span>
                </div>
              ) : (
                <p className="text-xs text-[#7A7A80]">Waiting...</p>
              )}
            </div>

            {/* Partner status */}
            <div className={`glass-tile rounded-2xl p-4 text-center transition-all duration-500 ${partnerAccepted ? 'ring-2' : ''}`}
              style={partnerAccepted ? { borderColor: genderColors.female.primary, boxShadow: `0 0 20px rgba(${genderColors.female.rgb},0.2)` } : {}}>
              <img src={MATCH_CANDIDATE.photo} alt={MATCH_CANDIDATE.name} className="w-12 h-12 rounded-full object-cover mx-auto mb-2" style={{ border: `2px solid ${genderColors.female.primary}` }} />
              <p className="text-sm font-semibold text-white mb-1">{MATCH_CANDIDATE.name}</p>
              {partnerAccepted ? (
                <div className="flex items-center justify-center gap-1 animate-scale-in">
                  <div className="w-5 h-5 rounded-full bg-[#E040A0] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-xs font-semibold text-[#E040A0]">Ready</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A] animate-pulse" />
                  <span className="text-xs text-[#FF9F0A]">Deciding...</span>
                </div>
              )}
            </div>
          </div>

          {/* Connecting animation */}
          {phase === 'connecting' && (
            <div className="text-center mb-6 animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-sm font-semibold text-[#30D158]">Both accepted — connecting your speed date...</p>
            </div>
          )}

          {/* Action buttons */}
          {phase === 'accept-prompt' && (
            <div className="space-y-3 animate-slide-up">
              {!userAccepted ? (
                <button onClick={() => setUserAccepted(true)}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, #E040A0 0%, #C030A0 100%)', boxShadow: '0 4px 20px rgba(224,64,160,0.35)' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Start Speed Date
                </button>
              ) : (
                <div className="w-full py-4 rounded-2xl text-base font-semibold text-center glass-tile" style={{ color: USER_COLOR.primary }}>
                  Waiting for {MATCH_CANDIDATE.name}...
                </div>
              )}
              <button onClick={onGroupSession}
                className="w-full py-3 rounded-2xl text-sm font-semibold glass-button text-[#98989D] hover:text-white transition-colors">
                Skip — Join Group Session Instead
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── BROWSING PHASE — card stack with swipe ──
  return (
    <div className="fixed inset-0 bg-[#1a1a1e] overflow-hidden">
      <BackgroundOrbs />

      <div className={`relative z-10 h-full flex flex-col transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Header */}
        <header className="px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold font-display text-[#E040A0]">Pulse</h1>
            <p className="text-[0.6rem] text-[#7A7A80] uppercase tracking-[0.15em]">Discover</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass-button rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-xs">❤️</span>
              <span className="text-xs font-semibold text-[#E040A0]">{likes.length}</span>
            </div>
            <button onClick={onGroupSession}
              className="glass-button rounded-full px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1.5">
              <span>👥</span> Group Session
            </button>
          </div>
        </header>

        {/* Card stack area */}
        <div className="flex-1 flex items-center justify-center px-6 pb-4">
          {isLastCard ? (
            <div className="text-center animate-fade-in">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-white mb-2 font-display">More people in Group Sessions</h2>
              <p className="text-sm text-[#98989D] mb-6 max-w-sm">Join a 5×5 speed dating session to meet 5 new people in 25 minutes.</p>
              <button onClick={onGroupSession}
                className="px-8 py-4 rounded-2xl text-base font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{ background: 'linear-gradient(135deg, #E040A0 0%, #C030A0 100%)', boxShadow: '0 4px 20px rgba(224,64,160,0.35)' }}>
                Join Group Session — AED 75
              </button>
            </div>
          ) : (
            <div className="relative w-full max-w-sm">
              {/* Next card preview (behind) */}
              {currentIndex + 1 < discoverProfiles.length && (
                <div className="absolute inset-0 rounded-3xl overflow-hidden scale-[0.95] -translate-y-2 opacity-50 pointer-events-none">
                  <img src={discoverProfiles[currentIndex + 1].photo} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                </div>
              )}

              {/* Current card */}
              <div
                className={`relative rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform ${
                  swipeDirection === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' :
                  swipeDirection === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' : ''
                }`}
                style={{
                  transform: !swipeDirection && dragX ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)` : undefined,
                  transitionDuration: swipeDirection ? '350ms' : isDragging ? '0ms' : '200ms',
                  aspectRatio: '3/4.5',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(224,64,160,0.15)',
                }}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={handleDragEnd}
              >
                <img src={currentProfile.photo} alt={currentProfile.name}
                  className="w-full h-full object-cover absolute inset-0 pointer-events-none select-none" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                {/* Swipe indicators */}
                {dragX > 40 && (
                  <div className="absolute top-8 left-6 z-20 px-4 py-2 rounded-xl border-2 border-[#30D158] text-[#30D158] text-lg font-bold -rotate-12 animate-scale-in">
                    LIKE
                  </div>
                )}
                {dragX < -40 && (
                  <div className="absolute top-8 right-6 z-20 px-4 py-2 rounded-xl border-2 border-[#FF3B30] text-[#FF3B30] text-lg font-bold rotate-12 animate-scale-in">
                    PASS
                  </div>
                )}

                {/* Profile info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pointer-events-none">
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-white font-display">{currentProfile.name}, {currentProfile.age}</h3>
                      <p className="text-sm text-white/60 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {currentProfile.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 italic mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>"{currentProfile.bio}"</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProfile.tags.map(tag => (
                      <span key={tag} className="text-[0.7rem] px-3 py-1 rounded-full font-medium text-[#E040A0] backdrop-blur-md"
                        style={{ background: 'rgba(224,64,160,0.12)', border: '1px solid rgba(224,64,160,0.20)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isLastCard && (
          <div className="shrink-0 px-6 pb-6 flex items-center justify-center gap-5">
            <button onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
              style={{ background: 'rgba(255,59,48,0.10)', border: '2px solid rgba(255,59,48,0.25)' }}>
              <svg className="w-7 h-7 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <button onClick={() => handleSwipe('right')}
              className="w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(224,64,160,0.20), rgba(224,64,160,0.10))', border: '2px solid rgba(224,64,160,0.35)', boxShadow: '0 0 25px rgba(224,64,160,0.15)' }}>
              <svg className="w-9 h-9 text-[#E040A0]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
            </button>

            <button onClick={onGroupSession}
              className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
              style={{ background: 'rgba(45,212,191,0.10)', border: `2px solid rgba(${USER_COLOR.rgb},0.25)` }}>
              <span className="text-2xl">👥</span>
            </button>
          </div>
        )}

        {/* Bottom hint */}
        {!isLastCard && (
          <div className="text-center pb-4">
            <p className="text-[0.6rem] text-[#7A7A80]">
              Swipe right to like · Swipe left to pass · Or join a group session
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spark-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
      `}</style>
    </div>
  )
}
