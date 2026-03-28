import { useState, useEffect, useRef, useCallback } from 'react'
import { candidates, photos, USER_COLOR } from '../data/people'
import type { Candidate } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  onQuickMatch: () => void      // → Discover (swipe → 1-to-1 speed date)
  onGroupSession: () => void    // → Group lobby (5×5 speed dating)
  onOpenAura: () => void        // → AI assistant
}

/* ─── HOME SCREEN — Netflix-inspired dual-path hub ────────
   Design principles borrowed from Netflix:
   1. Full-bleed hero with autoplay rotation
   2. Horizontal carousels with peek (next items visible)
   3. Content categories to keep browsing ("New near you", "Trending")
   4. Minimal chrome — the content IS the interface
   5. Always show the next thing — connection is one tap away
   6. Progressive disclosure — don't overwhelm, reveal on scroll

   Two paths are equally prominent:
   - Hero: rotating profiles with "Quick Match" CTA
   - Section: "Live Sessions" with group session card
   Both are above the fold. Neither is hidden.
   ──────────────────────────────────────────────────────────── */

// Extended profile pool for Netflix-style browsing
const allProfiles: Candidate[] = [
  {
    name: 'Maya', age: 27, location: 'Dubai Marina', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80',
    bio: 'Documentary filmmaker chasing stories across the Gulf',
    tags: ['Film', 'Travel', 'Sushi'],
  },
  {
    name: 'Zara', age: 30, location: 'DIFC, Dubai', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    bio: 'Venture capital analyst. Weekend potter. Terrible cook.',
    tags: ['Finance', 'Art', 'Yoga'],
  },
  {
    name: 'Lina', age: 25, location: 'Jumeirah, Dubai', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=400&q=80',
    bio: 'Architect who believes every building should make you feel something',
    tags: ['Design', 'Music', 'Running'],
  },
  ...candidates,
]

// "Live now" session data
const liveSessions = [
  { id: 1, title: 'Dubai Marina Mix', participants: 7, maxParticipants: 10, startsIn: 'Now', vibe: 'Chill & cultured' },
  { id: 2, title: 'DIFC After Hours', participants: 4, maxParticipants: 10, startsIn: '8 min', vibe: 'Professional & witty' },
  { id: 3, title: 'Weekend Brunch Crowd', participants: 9, maxParticipants: 10, startsIn: '23 min', vibe: 'Social butterflies' },
]

function createHomeSounds() {
  let ctx: AudioContext | null = null
  const getCtx = () => { if (!ctx) ctx = new AudioContext(); return ctx }
  return {
    hover() {
      try {
        const c = getCtx()
        const osc = c.createOscillator(); const gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = 1000
        gain.gain.setValueAtTime(0.03, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.06)
      } catch { /* */ }
    },
    cleanup() { if (ctx) ctx.close().catch(() => {}) }
  }
}

export default function HomeScreen({ onQuickMatch, onGroupSession, onOpenAura }: Props) {
  const [visible, setVisible] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const [heroTransitioning, setHeroTransitioning] = useState(false)
  const [hoveredProfile, setHoveredProfile] = useState<number | null>(null)
  const soundRef = useRef(createHomeSounds())
  const heroTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    return () => {
      soundRef.current.cleanup()
      if (heroTimerRef.current) clearInterval(heroTimerRef.current)
    }
  }, [])

  // Auto-rotate hero (Netflix autoplay)
  useEffect(() => {
    heroTimerRef.current = window.setInterval(() => {
      setHeroTransitioning(true)
      setTimeout(() => {
        setHeroIndex(prev => (prev + 1) % allProfiles.length)
        setHeroTransitioning(false)
      }, 600)
    }, 5000)
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current) }
  }, [])

  const heroProfile = allProfiles[heroIndex]

  const handleProfileHover = useCallback((index: number) => {
    setHoveredProfile(index)
    soundRef.current.hover()
  }, [])

  return (
    <div className="fixed inset-0 bg-[#0D0D11] overflow-y-auto overflow-x-hidden">
      <BackgroundOrbs />

      <div className={`relative z-10 min-h-full transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* ── Top bar ── */}
        <header className="fixed top-0 left-0 right-0 z-50 px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, rgba(13,13,17,0.95) 0%, rgba(13,13,17,0.6) 70%, transparent 100%)' }}>
          <h1 className="text-2xl font-bold font-display text-[#E040A0]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Pulse
          </h1>
          <div className="flex items-center gap-3">
            {/* Aura — AI assistant button (not a generic bot) */}
            <button onClick={onOpenAura}
              className="relative group"
              title="Ask Aura">
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(224,64,160,0.25), rgba(128,64,224,0.15), transparent 70%)',
                  border: '1.5px solid rgba(224,64,160,0.25)',
                  boxShadow: '0 0 12px rgba(224,64,160,0.15)',
                }}>
                {/* Aura's form: a breathing light, not a robot */}
                <div className="w-4 h-4 rounded-full animate-pulse"
                  style={{
                    background: 'radial-gradient(circle, #E040A0 0%, #8040E0 60%, transparent 100%)',
                    boxShadow: '0 0 8px rgba(224,64,160,0.6)',
                  }} />
              </div>
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[0.45rem] text-[#E040A0]/40 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Aura</span>
            </button>
            {/* User avatar */}
            <img src={photos.user} alt="You" className="w-8 h-8 rounded-full object-cover"
              style={{ border: `2px solid rgba(${USER_COLOR.rgb},0.4)` }} />
          </div>
        </header>

        {/* ── HERO — Full-bleed profile with auto-rotation ── */}
        <section className="relative w-full" style={{ height: '65vh', minHeight: '420px' }}>
          {/* Background image */}
          <div className={`absolute inset-0 transition-all duration-600 ${heroTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>
            <img src={heroProfile.photo} alt={heroProfile.name}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to top, #0D0D11 0%, rgba(13,13,17,0.7) 40%, rgba(13,13,17,0.2) 60%, rgba(13,13,17,0.4) 100%)',
            }} />
          </div>

          {/* Hero content */}
          <div className={`absolute bottom-0 left-0 right-0 px-5 pb-6 transition-all duration-600 ${heroTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {/* Profile info */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
                <span className="text-[0.65rem] text-[#30D158] font-semibold uppercase tracking-wider">Online now</span>
              </div>
              <h2 className="text-4xl font-bold text-white font-display mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {heroProfile.name}, {heroProfile.age}
              </h2>
              <p className="text-sm text-white/60 flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {heroProfile.location}
              </p>
              <p className="text-sm text-white/50 italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                "{heroProfile.bio}"
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {heroProfile.tags.map(tag => (
                <span key={tag} className="text-[0.65rem] px-3 py-1 rounded-full font-medium text-[#E040A0]/80"
                  style={{ background: 'rgba(224,64,160,0.08)', border: '1px solid rgba(224,64,160,0.15)' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* ═══ THE TWO PATHS — equally prominent ═══ */}
            <div className="flex gap-3">
              {/* Path 1: Quick Match (1-to-1) */}
              <button onClick={onQuickMatch}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #E040A0 0%, #C030A0 100%)',
                  boxShadow: '0 4px 25px rgba(224,64,160,0.4)',
                }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Quick Match
              </button>

              {/* Path 2: Group Session (5×5) */}
              <button onClick={onGroupSession}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{
                  background: `linear-gradient(135deg, rgba(${USER_COLOR.rgb},0.9) 0%, rgba(${USER_COLOR.rgb},0.7) 100%)`,
                  boxShadow: `0 4px 25px rgba(${USER_COLOR.rgb},0.35)`,
                }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Group 5×5
              </button>
            </div>
          </div>

          {/* Hero pagination dots */}
          <div className="absolute bottom-2 right-5 flex gap-1">
            {allProfiles.slice(0, 6).map((_, i) => (
              <div key={i} className={`h-0.5 rounded-full transition-all duration-500 ${
                i === heroIndex % 6 ? 'w-5 bg-[#E040A0]' : 'w-2 bg-white/20'
              }`} />
            ))}
          </div>
        </section>

        {/* ── PATH EXPLAINER — What each path offers ── */}
        <section className="px-5 pt-6 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Quick Match explanation */}
            <button onClick={onQuickMatch} className="glass-tile rounded-2xl p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group"
              style={{ border: '1px solid rgba(224,64,160,0.10)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(224,64,160,0.10)' }}>
                <span className="text-xl">💘</span>
              </div>
              <p className="text-xs font-bold text-white mb-1">Quick Match</p>
              <p className="text-[0.65rem] text-[#98989D] leading-relaxed">
                Swipe. Match. Instant 1-to-1 video call. Know in 5 minutes.
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-[#30D158]" />
                <span className="text-[0.55rem] text-[#30D158]">142 people online</span>
              </div>
            </button>

            {/* Group Session explanation */}
            <button onClick={onGroupSession} className="glass-tile rounded-2xl p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-all group"
              style={{ border: `1px solid rgba(${USER_COLOR.rgb},0.10)` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `rgba(${USER_COLOR.rgb},0.10)` }}>
                <span className="text-xl">👥</span>
              </div>
              <p className="text-xs font-bold text-white mb-1">Group 5×5</p>
              <p className="text-[0.65rem] text-[#98989D] leading-relaxed">
                5 dates, 5 minutes each. Meet people you'd never have swiped on.
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-[#FF9F0A]" />
                <span className="text-[0.55rem] text-[#FF9F0A]">Next session in 8 min</span>
              </div>
            </button>
          </div>
        </section>

        {/* ── CAROUSEL 1: "New near you" — Netflix horizontal scroll ── */}
        <section className="pt-4 pb-2">
          <div className="px-5 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">New near you</h3>
              <p className="text-[0.6rem] text-[#7A7A80]">Joined this week · Swipe to browse</p>
            </div>
            <button onClick={onQuickMatch} className="text-[0.7rem] font-semibold text-[#E040A0]">See all →</button>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5 pb-2" style={{ paddingRight: '60px' }}>
              {allProfiles.map((profile, i) => (
                <button key={i}
                  onClick={onQuickMatch}
                  onMouseEnter={() => handleProfileHover(i)}
                  onMouseLeave={() => setHoveredProfile(null)}
                  className={`shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300 ${
                    hoveredProfile === i ? 'scale-105 z-10' : 'scale-100'
                  }`}
                  style={{
                    width: '140px',
                    height: '200px',
                    boxShadow: hoveredProfile === i
                      ? '0 8px 30px rgba(224,64,160,0.3), 0 0 0 1.5px rgba(224,64,160,0.3)'
                      : '0 4px 15px rgba(0,0,0,0.3)',
                  }}>
                  <img src={profile.photo} alt={profile.name}
                    className={`w-full h-full object-cover transition-transform duration-700 ${hoveredProfile === i ? 'scale-110' : 'scale-100'}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Profile mini info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold text-white">{profile.name}, {profile.age}</p>
                    <p className="text-[0.6rem] text-white/50">{profile.location}</p>
                  </div>

                  {/* Online indicator */}
                  <div className="absolute top-2.5 right-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-pulse"
                      style={{ boxShadow: '0 0 6px rgba(48,209,88,0.5)' }} />
                  </div>

                  {/* Hover: show "Match" badge */}
                  {hoveredProfile === i && (
                    <div className="absolute top-2.5 left-2.5 animate-scale-in">
                      <div className="px-2 py-0.5 rounded-full text-[0.5rem] font-bold text-white"
                        style={{ background: 'rgba(224,64,160,0.8)' }}>
                        92% Match
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── LIVE SESSIONS — Show available group sessions ── */}
        <section className="px-5 pt-4 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Live Sessions</h3>
              <p className="text-[0.6rem] text-[#7A7A80]">5×5 group speed dating · Join anytime</p>
            </div>
            <button onClick={onGroupSession} className="text-[0.7rem] font-semibold" style={{ color: USER_COLOR.primary }}>Join →</button>
          </div>

          <div className="space-y-2.5">
            {liveSessions.map(session => (
              <button key={session.id} onClick={onGroupSession}
                className="w-full glass-tile rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.01] active:scale-[0.99] transition-all text-left"
                style={{ border: `1px solid rgba(${USER_COLOR.rgb},0.06)` }}>
                {/* Session visual */}
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, rgba(${USER_COLOR.rgb},0.15), rgba(224,64,160,0.08))` }}>
                  {/* Mini avatar stack */}
                  <div className="flex -space-x-2">
                    {allProfiles.slice(session.id, session.id + 3).map((p, i) => (
                      <img key={i} src={p.photo} alt="" className="w-6 h-6 rounded-full object-cover border border-[#0D0D11]" />
                    ))}
                  </div>
                </div>

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{session.title}</p>
                    {session.startsIn === 'Now' && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[0.5rem] font-bold text-[#30D158] bg-[#30D158]/10 animate-pulse">LIVE</span>
                    )}
                  </div>
                  <p className="text-[0.65rem] text-[#98989D]">{session.vibe}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[0.6rem] text-[#7A7A80]">{session.participants}/{session.maxParticipants} joined</span>
                    {session.startsIn !== 'Now' && (
                      <span className="text-[0.6rem] text-[#FF9F0A]">Starts in {session.startsIn}</span>
                    )}
                  </div>
                </div>

                {/* Fill bar */}
                <div className="shrink-0 w-10 flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(session.participants / session.maxParticipants) * 100}%`,
                        background: session.participants >= 8 ? '#30D158' : `rgba(${USER_COLOR.rgb},0.7)`,
                      }} />
                  </div>
                  <span className="text-[0.5rem] text-[#7A7A80]">{session.maxParticipants - session.participants} left</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── CAROUSEL 2: "Trending profiles" ── */}
        <section className="pt-6 pb-2">
          <div className="px-5 mb-3">
            <h3 className="text-base font-bold text-white">Trending in Dubai</h3>
            <p className="text-[0.6rem] text-[#7A7A80]">Most liked this week</p>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5 pb-2" style={{ paddingRight: '60px' }}>
              {[...allProfiles].reverse().map((profile, i) => (
                <button key={`trending-${i}`} onClick={onQuickMatch}
                  className="shrink-0 glass-tile rounded-2xl p-3 flex items-center gap-3 hover:scale-[1.03] active:scale-[0.98] transition-all"
                  style={{ width: '240px', border: '1px solid rgba(224,64,160,0.06)' }}>
                  <img src={profile.photo} alt={profile.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{profile.name}, {profile.age}</p>
                    <p className="text-[0.6rem] text-[#98989D] truncate">{profile.bio}</p>
                    <div className="flex gap-1 mt-1">
                      {profile.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[0.5rem] px-1.5 py-0.5 rounded-full text-[#E040A0]/70"
                          style={{ background: 'rgba(224,64,160,0.06)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA — Reinforcement ── */}
        <section className="px-5 pt-6 pb-24">
          <div className="glass-tile rounded-3xl p-6 text-center" style={{ border: '1px solid rgba(224,64,160,0.08)' }}>
            <p className="text-xs uppercase tracking-[0.25em] text-[#E040A0] font-semibold mb-2">Why wait?</p>
            <h3 className="text-lg font-bold text-white mb-1 font-display" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Chemistry can't be measured in messages.
            </h3>
            <p className="text-sm text-[#98989D] mb-5">
              5 minutes face to face tells you more than 5 days of texting.
            </p>
            <div className="flex gap-3">
              <button onClick={onQuickMatch}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #E040A0, #C030A0)', boxShadow: '0 4px 20px rgba(224,64,160,0.3)' }}>
                Start Matching
              </button>
              <button onClick={onGroupSession}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, rgba(${USER_COLOR.rgb},0.9), rgba(${USER_COLOR.rgb},0.7))`, boxShadow: `0 4px 20px rgba(${USER_COLOR.rgb},0.3)` }}>
                Join Live Session
              </button>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
