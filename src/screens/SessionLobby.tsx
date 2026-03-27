import { useEffect, useState, useCallback, useRef } from 'react'
import { candidates } from '../data/people'
import { sponsors } from '../data/sponsors'

interface Props {
  onNavigate: () => void
}

/* ─── THIS OR THAT — interactive personality game ───────────
   Quick, fun, swipeable choices. Feels like a game but builds
   a compatibility profile. Sponsor-branded questions rotate in.
   ──────────────────────────────────────────────────────────── */
interface ThisOrThat {
  a: string
  b: string
  sponsor?: string
}

const thisOrThatQuestions: ThisOrThat[] = [
  { a: 'Mountains', b: 'Beach' },
  { a: 'Cook at home', b: 'Dine out' },
  { a: 'Early bird', b: 'Night owl' },
  { a: 'Road trip', b: 'First class', sponsor: 'Emirates' },
  { a: 'Cats', b: 'Dogs' },
  { a: 'Netflix', b: 'Live concert' },
  { a: 'Coffee', b: 'Tea' },
  { a: 'City life', b: 'Countryside' },
  { a: 'Text first', b: 'Call first' },
  { a: 'Sunset dinner', b: 'Sunrise hike', sponsor: 'The Palm Jumeirah' },
  { a: 'Introvert', b: 'Extrovert' },
  { a: 'Spontaneous', b: 'Planner' },
  { a: 'Sweet', b: 'Savory' },
  { a: 'Podcast', b: 'Music' },
  { a: 'Test drive', b: 'Window shop', sponsor: 'Porsche Dubai' },
]

/* ─── Two-layer Netflix model ─────────────────────────────────
   BACKGROUND: Sponsor images cycle continuously (full-bleed,
   Ken Burns, cinematic). The screen is NEVER empty.
   FOREGROUND: Profile cards slide in/out on the left, overlaid
   on the sponsor backdrop. When no profile is showing, sponsor
   branding takes the left overlay position instead.
   ───────────────────────────────────────────────────────────── */

interface Profile {
  image: string
  quote: string
  location: string
  tags: string[]
}

const profiles: Profile[] = [
  {
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
    quote: '"I believe in love at first conversation."',
    location: 'Dubai Marina · 26-30',
    tags: ['Creative', 'Foodie', 'Travel'],
  },
  {
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
    quote: '"Energy doesn\'t lie."',
    location: 'Downtown Dubai · 28-32',
    tags: ['Fitness', 'Entrepreneur', 'Music'],
  },
  {
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
    quote: '"Show me your playlist, I\'ll show you my soul."',
    location: 'Abu Dhabi · 24-28',
    tags: ['Art', 'Dance', 'Coffee'],
  },
  {
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
    quote: '"I can talk about anything for five minutes."',
    location: 'Riyadh · 27-31',
    tags: ['Tech', 'Hiking', 'Podcasts'],
  },
  {
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
    quote: '"The eyes say everything."',
    location: 'JBR, Dubai · 31-35',
    tags: ['Fashion', 'Photography', 'Travel'],
  },
]

/* Timing */
const BG_CYCLE = 8000       // background sponsor rotates every 8s
const PROFILE_SHOW = 3500   // profile card visible for 3.5s
const SPONSOR_SHOW = 5000   // sponsor branding visible for 5s
const TRANSITION = 600      // crossfade duration

/* The foreground alternates: profile → sponsor → profile → sponsor...
   We build a sequence that pairs each profile with a sponsor overlay */
interface FgSlide {
  type: 'profile' | 'sponsor'
  profileIdx?: number   // index into profiles[]
  sponsorIdx?: number   // index into sponsors[]
}

const fgSequence: FgSlide[] = []
for (let i = 0; i < profiles.length; i++) {
  fgSequence.push({ type: 'profile', profileIdx: i })
  fgSequence.push({ type: 'sponsor', sponsorIdx: i % sponsors.length })
}

const hypeQuotes = [
  "Bring your A game 🔥",
  "First impressions matter — be you",
  "Eye contact wins hearts 💫",
  "Confidence is your superpower",
  "Ask the unexpected question",
  "Laugh first, judge never 😄",
  "Energy is everything ⚡",
  "Be curious, not impressive",
  "Smile — it's contagious ✨",
  "This is your moment",
  "Don't mention your ex 😬",
  "Breathe. You've got this.",
  "Plot twist: they're nervous too",
  "Main character energy only 💅",
  "No pickup lines. Be real.",
  "Your vibe attracts your tribe",
  "Relax — it's only 5 minutes",
  "Be the date you'd want to have",
  "Hot take > small talk 🎤",
  "Chemistry can't be faked ✨",
]

export default function SessionLobby({ onNavigate }: Props) {
  const [countdown, setCountdown] = useState(120)
  const [visible, setVisible] = useState(false)
  const [joined, setJoined] = useState(3)

  // Pre-session 10s countdown
  const [preCountdown, setPreCountdown] = useState<number | null>(null)
  const [hypeIdx, setHypeIdx] = useState(0)

  // Background: which sponsor image fills the screen
  const [bgIdx, setBgIdx] = useState(0)
  const [bgFading, setBgFading] = useState(false)

  // Foreground: which overlay (profile card or sponsor info) is showing
  const [fgIdx, setFgIdx] = useState(0)
  const [fgVisible, setFgVisible] = useState(false)
  const [fgProgress, setFgProgress] = useState(0)

  // This or That game
  const [totIdx, setTotIdx] = useState(0)
  const [totPick, setTotPick] = useState<'a' | 'b' | null>(null)
  const [totAnswered, setTotAnswered] = useState(0)
  const [totAnimating, setTotAnimating] = useState(false)

  const handleTotPick = useCallback((pick: 'a' | 'b') => {
    if (totAnimating) return
    setTotPick(pick)
    setTotAnimating(true)
    setTotAnswered(p => p + 1)
    setTimeout(() => {
      setTotPick(null)
      setTotIdx(p => (p + 1) % thisOrThatQuestions.length)
      setTotAnimating(false)
    }, 800)
  }, [totAnimating])

  // Ambient audio — warm lo-fi pad
  const audioRef = useRef<AudioContext | null>(null)
  const audioStarted = useRef(false)

  const startAmbient = useCallback(() => {
    if (audioStarted.current) return
    audioStarted.current = true
    try {
      const ctx = new AudioContext()
      audioRef.current = ctx

      // Master gain for overall volume control
      const master = ctx.createGain()
      master.gain.value = 0.8
      master.connect(ctx.destination)

      // Create a warm ambient pad using oscillators
      const createPad = (freq: number, vol: number, type: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        osc.type = type
        osc.frequency.value = freq
        filter.type = 'lowpass'
        filter.frequency.value = 1200
        filter.Q.value = 0.5
        gain.gain.value = 0
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2)
        osc.connect(filter).connect(gain).connect(master)
        osc.start()
        return { osc, gain }
      }

      // Rich ambient chord: Cmaj7 — warm, anticipatory
      createPad(130.81, 0.12, 'sine')     // C3 — foundation
      createPad(164.81, 0.08, 'sine')     // E3
      createPad(196.00, 0.07, 'sine')     // G3
      createPad(246.94, 0.05, 'sine')     // B3
      createPad(261.63, 0.04, 'triangle') // C4 — shimmer
      createPad(329.63, 0.03, 'triangle') // E4 — high shimmer

      // Subtle LFO for movement (pulsing feel)
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.type = 'sine'
      lfo.frequency.value = 0.15 // Very slow pulse
      lfoGain.gain.value = 0.02
      lfo.connect(lfoGain).connect(master.gain)
      lfo.start()
    } catch {
      /* Audio not available */
    }
  }, [])

  const fg = fgSequence[fgIdx]
  const fgDuration = fg.type === 'profile' ? PROFILE_SHOW : SPONSOR_SHOW
  const totQ = thisOrThatQuestions[totIdx]

  // ── Countdown + join simulation ──
  useEffect(() => {
    setTimeout(() => setVisible(true), 200)
    const timer = setInterval(() => setCountdown(p => (p > 0 ? p - 1 : 0)), 1000)
    const joinTimer = setInterval(() => setJoined(p => Math.min(p + 1, 10)), 3000)
    return () => {
      clearInterval(timer)
      clearInterval(joinTimer)
      // Clean up audio
      if (audioRef.current) audioRef.current.close().catch(() => {})
    }
  }, [])

  // ── Background: slow sponsor image rotation ──
  useEffect(() => {
    const cycle = setInterval(() => {
      setBgFading(true)
      setTimeout(() => {
        setBgIdx(p => (p + 1) % sponsors.length)
        setBgFading(false)
      }, TRANSITION)
    }, BG_CYCLE)
    return () => clearInterval(cycle)
  }, [])

  // ── Foreground: slide in, hold, slide out, advance ──
  useEffect(() => {
    // Slide in
    const enterTimer = setTimeout(() => setFgVisible(true), 100)

    // Progress bar
    const progressInterval = setInterval(() => {
      setFgProgress(p => {
        if (p >= 100) return 100
        return p + (100 / (fgDuration / 50))
      })
    }, 50)

    // Slide out → next
    const exitTimer = setTimeout(() => {
      setFgVisible(false)
      setTimeout(() => {
        setFgIdx(p => (p + 1) % fgSequence.length)
        setFgProgress(0)
      }, TRANSITION)
    }, fgDuration)

    return () => {
      clearTimeout(enterTimer)
      clearInterval(progressInterval)
      clearTimeout(exitTimer)
    }
  }, [fgIdx, fgDuration])

  // ── Pre-session countdown logic ──
  useEffect(() => {
    if (preCountdown === null) return
    if (preCountdown <= 0) { onNavigate(); return }
    const t = setTimeout(() => setPreCountdown(p => (p ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [preCountdown, onNavigate])

  // New random quote every 2 seconds (5 quotes across 10s)
  useEffect(() => {
    if (preCountdown === null) return
    if (preCountdown % 2 === 0) {
      setHypeIdx(Math.floor(Math.random() * hypeQuotes.length))
    }
  }, [preCountdown])

  const startPreCountdown = useCallback(() => {
    setHypeIdx(Math.floor(Math.random() * hypeQuotes.length))
    setPreCountdown(10)
  }, [])

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const bgSponsor = sponsors[bgIdx]

  // ── PRE-SESSION COUNTDOWN OVERLAY ──
  if (preCountdown !== null && preCountdown > 0) {
    const progress = ((10 - preCountdown) / 10) * 100
    return (
      <div className="fixed inset-0 bg-[#0a090d] flex flex-col items-center justify-center overflow-hidden px-6">
        {/* Animated background pulse */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at center, rgba(224,64,160,${0.05 + (preCountdown <= 3 ? 0.08 : 0)}) 0%, transparent 60%)`,
          animation: 'countdown-pulse 1s ease-in-out infinite',
        }} />

        {/* Progress ring — scales down on mobile */}
        <div className="relative mb-6 sm:mb-8">
          <svg className="w-36 h-36 sm:w-48 sm:h-48 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(224,64,160,0.1)" strokeWidth="4" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="#E040A0" strokeWidth="4" strokeLinecap="round"
              strokeDasharray="565.5" strokeDashoffset={565.5 - (progress / 100) * 565.5}
              className="transition-all duration-1000 ease-linear" />
          </svg>

          {/* Big countdown number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl sm:text-7xl font-bold font-display text-white" style={{
              animation: 'number-pop 1s ease-out',
              textShadow: '0 0 40px rgba(224,64,160,0.4)',
            }} key={preCountdown}>
              {preCountdown}
            </span>
          </div>
        </div>

        {/* Label */}
        <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-[#E040A0] font-semibold mb-4 sm:mb-6">
          {preCountdown <= 3 ? 'GET READY' : 'STARTING IN'}
        </p>

        {/* Hype quote */}
        <div className="h-8 flex items-center justify-center px-4" key={hypeIdx}>
          <p className="text-base sm:text-lg text-white/60 font-medium text-center animate-fade-in" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {hypeQuotes[hypeIdx]}
          </p>
        </div>

        {/* Bottom participant count */}
        <div className="absolute bottom-8 sm:bottom-10 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#30D158] rounded-full animate-pulse" />
          <span className="text-xs text-white/40">{joined} people are ready</span>
        </div>

        <style>{`
          @keyframes countdown-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes number-pop {
            0% { transform: scale(1.4); opacity: 0.3; }
            50% { transform: scale(0.95); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#0a090d] flex flex-col overflow-hidden" onClick={startAmbient}>

      {/* ═══ LAYER 1: Full-bleed sponsor background (always visible) ═══ */}
      <div className="absolute inset-0">
        {/* Current sponsor image */}
        <div className={`absolute inset-0 transition-opacity ease-in-out ${bgFading ? 'opacity-0' : 'opacity-100'}`}
          style={{ transitionDuration: `${TRANSITION}ms` }}>
          <img
            src={bgSponsor.image}
            alt=""
            className="w-full h-full object-cover"
            style={{
              filter: fg.type === 'profile' ? 'brightness(0.25) saturate(0.7)' : 'brightness(0.4) saturate(0.85)',
              transition: 'filter 800ms ease',
              animation: 'ken-burns 30s ease-in-out infinite alternate',
            }}
          />
        </div>

        {/* Gradient overlays — always present */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a090d 0%, rgba(10,9,13,0.8) 25%, rgba(10,9,13,0.3) 50%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,9,13,0.85) 0%, rgba(10,9,13,0.4) 40%, transparent 65%)' }} />
      </div>

      {/* ═══ LAYER 2: Foreground content (left-aligned Netflix overlay) ═══ */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">

        {/* ─── Top bar ─── */}
        <header className="relative z-20 px-6 sm:px-10 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-display text-[#E040A0]">Pulse</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#E040A0] rounded-full animate-pulse" />
              <span className="text-xs text-white/50">{joined}/10 joined</span>
            </div>
            <div className="glass-button rounded-full px-4 py-1.5 text-sm font-mono text-[#E040A0] font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </header>

        {/* ─── Main content area ─── */}
        <div className="flex-1 min-h-0 flex items-center px-6 sm:px-10 md:px-16 lg:px-24">

          {/* PROFILE CARD — slides in from left */}
          {fg.type === 'profile' && fg.profileIdx !== undefined && (
            <div
              className="transition-all ease-out"
              style={{
                transitionDuration: `${TRANSITION}ms`,
                opacity: fgVisible ? 1 : 0,
                transform: fgVisible ? 'translateX(0)' : 'translateX(-40px)',
              }}
            >
              <div className="flex items-center gap-6 sm:gap-8 md:gap-12">
                {/* Photo */}
                <div className="relative flex-shrink-0 w-[180px] sm:w-[220px] md:w-[280px] lg:w-[320px] aspect-[3/4] rounded-xl overflow-hidden"
                  style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 100px rgba(224,64,160,0.05)' }}>
                  <img src={profiles[fg.profileIdx].image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,9,13,0.6) 0%, transparent 50%)' }} />
                  <div className="absolute top-3 left-3">
                    <span className="text-[0.5rem] tracking-[0.18em] uppercase px-2 py-0.5 rounded"
                      style={{ background: 'rgba(224,64,160,0.2)', color: '#E040A0', backdropFilter: 'blur(8px)' }}>
                      Tonight's lineup
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="max-w-sm glass-tile p-6 rounded-xl">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] leading-snug mb-3"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.9)' }}>
                    {profiles[fg.profileIdx].quote}
                  </p>
                  <p className="text-xs sm:text-sm mb-4"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em' }}>
                    {profiles[fg.profileIdx].location}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profiles[fg.profileIdx].tags.map(tag => (
                      <span key={tag} className="text-[0.6rem] sm:text-[0.65rem] px-3 py-1 rounded-full"
                        style={{ background: 'rgba(224,64,160,0.1)', color: '#E040A0', border: '1px solid rgba(224,64,160,0.15)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPONSOR BRANDING — slides in on left, same position */}
          {fg.type === 'sponsor' && fg.sponsorIdx !== undefined && (
            <div
              className="transition-all ease-out max-w-xl"
              style={{
                transitionDuration: `${TRANSITION}ms`,
                opacity: fgVisible ? 1 : 0,
                transform: fgVisible ? 'translateY(0)' : 'translateY(20px)',
              }}
            >
              <div className="mb-3">
                <span className="text-[0.55rem] tracking-[0.18em] uppercase px-2.5 py-1 rounded"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                  Presented by · {sponsors[fg.sponsorIdx].category}
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-3 leading-[1.05]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, color: 'rgba(255,255,255,0.92)' }}>
                {sponsors[fg.sponsorIdx].brand}
              </h2>
              <p className="text-sm sm:text-base mb-6 max-w-md"
                style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                {sponsors[fg.sponsorIdx].tagline}
              </p>
              <button className="glass-button backdrop-blur-xl px-7 py-3 rounded text-sm font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${sponsors[fg.sponsorIdx].accent}33 0%, rgba(255,255,255,0.08) 100%)`,
                  border: `1px solid ${sponsors[fg.sponsorIdx].accent}30`,
                }}>
                {sponsors[fg.sponsorIdx].cta} <span className="ml-1.5 opacity-60">→</span>
              </button>
            </div>
          )}
        </div>

        {/* ─── THIS OR THAT game — bottom right corner ─── */}
        <div className="absolute bottom-28 right-6 sm:right-10 z-30 w-[220px] sm:w-[260px]">
          <div
            className={`transition-all duration-500 ${totAnswered === 0 ? 'animate-slide-up' : ''}`}
            style={{ animationDelay: '2s', animationFillMode: 'backwards' }}
            onClick={startAmbient}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.55rem] tracking-[0.15em] uppercase text-white/30">While you wait...</span>
              {totAnswered > 0 && (
                <span className="text-[0.55rem] text-[#E040A0]/60">{totAnswered} answered</span>
              )}
            </div>

            {/* Card */}
            <div
              className="glass-tile rounded-xl overflow-hidden transition-all duration-300"
              style={{
                transform: totAnimating ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              {/* Sponsor badge */}
              {totQ.sponsor && (
                <div className="px-3 pt-2.5">
                  <span className="text-[0.5rem] tracking-[0.12em] uppercase text-white/20">
                    Presented by {totQ.sponsor}
                  </span>
                </div>
              )}

              {/* Question label */}
              <div className="px-3 pt-2.5 pb-1">
                <p className="text-[0.6rem] uppercase tracking-wider text-[#E040A0]/60 font-semibold">This or That?</p>
              </div>

              {/* Options */}
              <div className="p-2.5 flex gap-2">
                <button
                  onClick={() => handleTotPick('a')}
                  disabled={totAnimating}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 active:scale-95 ${
                    !totPick ? 'glass-button' : ''
                  } ${
                    totPick === 'a' ? 'bg-[#E040A0] text-white scale-105' : totPick === 'b' ? 'opacity-30 scale-95' : 'hover:scale-102'
                  }`}
                >
                  {totQ.a}
                </button>
                <button
                  onClick={() => handleTotPick('b')}
                  disabled={totAnimating}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 active:scale-95 ${
                    !totPick ? 'glass-button' : ''
                  } ${
                    totPick === 'b' ? 'bg-[#E040A0] text-white scale-105' : totPick === 'a' ? 'opacity-30 scale-95' : 'hover:scale-102'
                  }`}
                >
                  {totQ.b}
                </button>
              </div>

              {/* Progress dots */}
              <div className="px-3 pb-2.5 flex justify-center gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-1 h-1 rounded-full transition-colors duration-300"
                    style={{ background: i < totAnswered ? '#E040A0' : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Progress bars + bottom bar ─── */}
        <div className="relative z-20 px-6 sm:px-10">
          {/* Segment progress bars */}
          <div className="flex gap-1 mb-0">
            {fgSequence.map((seg, idx) => (
              <div key={idx} className="flex-1 h-[2.5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full transition-all ease-linear"
                  style={{
                    width: idx < fgIdx ? '100%' : idx === fgIdx ? `${fgProgress}%` : '0%',
                    background: seg.type === 'sponsor'
                      ? (sponsors[seg.sponsorIdx ?? 0].accent || 'rgba(255,255,255,0.4)')
                      : '#E040A0',
                    transitionDuration: idx === fgIdx ? '50ms' : '300ms',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ═══ BOTTOM BAR ═══ */}
        <div className={`glass-tile relative z-20 px-6 sm:px-10 py-4 flex items-center justify-between transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

          {/* Participant avatars */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {candidates.slice(0, Math.min(joined, 5)).map((c, i) => (
                <img
                  key={c.name}
                  src={c.photo}
                  alt={c.name}
                  className="w-8 h-8 rounded-full object-cover transition-all duration-500"
                  style={{
                    border: '2px solid #0a090d',
                    opacity: i < joined ? 1 : 0.3,
                    zIndex: 5 - i,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-white/25 ml-1">{joined}/10</span>
          </div>

          {/* Ready button */}
          <button
            onClick={startPreCountdown}
            className="group px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-[#E040A0] shadow-lg shadow-[rgba(224,64,160,0.25)]"
          >
            <span className="text-white flex items-center gap-2">
              I'm Ready
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.06) translate(-0.5%, -0.3%); }
          100% { transform: scale(1.1) translate(-1%, 0.2%); }
        }
      `}</style>
    </div>
  )
}
