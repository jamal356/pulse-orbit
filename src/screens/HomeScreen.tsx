import { useState, useEffect, useRef, useCallback } from 'react'
import { candidates, photos, USER_COLOR } from '../data/people'
import type { Candidate } from '../data/people'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onQuickMatch: () => void
  onGroupSession: () => void
}

/* ─── HOME SCREEN — True Netflix / Jobs-Ive philosophy ───────
   RULES:
   1. ONE hero dominates the viewport — 80vh cinematic.
   2. The hero ALTERNATES between Spark and The Round.
      No twin buttons competing. One CTA per slide.
   3. Below the fold: ONE carousel, ONE session teaser. Done.
   4. Every pixel earns its place. If it doesn't move the user
      toward a date, it doesn't belong.
   5. Whitespace is not emptiness — it's confidence.
   ──────────────────────────────────────────────────────────── */

// Hero slides: alternating between a profile (→ Spark) and the group experience (→ The Round)
interface HeroSlide {
  type: 'spark' | 'round'
  profile?: Candidate
  image: string
  headline: string
  sub: string
  cta: string
}

const heroProfiles: Candidate[] = [
  {
    name: 'Zara', age: 30, location: 'DIFC, Dubai', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=3840&q=95',
    bio: 'Venture capital analyst. Weekend potter. Terrible cook.',
    tags: ['Finance', 'Art', 'Yoga'],
  },
  {
    name: 'Maya', age: 27, location: 'Dubai Marina', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=3840&q=95',
    bio: 'Documentary filmmaker chasing stories across the Gulf',
    tags: ['Film', 'Travel', 'Sushi'],
  },
  {
    name: 'Lina', age: 25, location: 'Jumeirah, Dubai', gender: 'female',
    photo: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=3840&q=95',
    bio: 'Architect who believes every building should make you feel something',
    tags: ['Design', 'Music', 'Running'],
  },
]

const heroSlides: HeroSlide[] = [
  // Spark slide — profile-forward
  {
    type: 'spark',
    profile: heroProfiles[0],
    image: heroProfiles[0].photo,
    headline: `${heroProfiles[0].name}, ${heroProfiles[0].age}`,
    sub: heroProfiles[0].bio,
    cta: 'Spark',
  },
  // The Round slide — experience-forward
  {
    type: 'round',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=3840&q=95',
    headline: 'The Round',
    sub: '5 new people. 5 minutes each. One table.',
    cta: 'Join the next round',
  },
  // Spark
  {
    type: 'spark',
    profile: heroProfiles[1],
    image: heroProfiles[1].photo,
    headline: `${heroProfiles[1].name}, ${heroProfiles[1].age}`,
    sub: heroProfiles[1].bio,
    cta: 'Spark',
  },
  // Round variant
  {
    type: 'round',
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=3840&q=95',
    headline: 'The Saturday Table',
    sub: 'Weekend energy, new faces — starts in 8 min',
    cta: 'Reserve your seat',
  },
  // Spark
  {
    type: 'spark',
    profile: heroProfiles[2],
    image: heroProfiles[2].photo,
    headline: `${heroProfiles[2].name}, ${heroProfiles[2].age}`,
    sub: heroProfiles[2].bio,
    cta: 'Spark',
  },
]

// Extended carousel profiles — Netflix fills the row edge-to-edge
const extraProfiles: Candidate[] = [
  { name: 'Hana', age: 24, location: 'Business Bay', gender: 'female', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=3840&q=95', bio: 'Biotech researcher who paints on weekends', tags: ['Science', 'Art', 'Wine'] },
  { name: 'Dalia', age: 27, location: 'Al Barsha', gender: 'female', photo: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=3840&q=95', bio: 'Yoga instructor with a startup on the side', tags: ['Wellness', 'Startup', 'Tea'] },
  { name: 'Rania', age: 30, location: 'Palm Jumeirah', gender: 'female', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=3840&q=95', bio: 'Chef who believes food is the first language', tags: ['Cooking', 'Travel', 'Jazz'] },
  { name: 'Farah', age: 26, location: 'DIFC, Dubai', gender: 'female', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=3840&q=95', bio: 'Corporate lawyer who secretly writes poetry', tags: ['Writing', 'Law', 'Coffee'] },
  { name: 'Salma', age: 28, location: 'Dubai Hills', gender: 'female', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=3840&q=95', bio: 'Fashion photographer based between Dubai and Paris', tags: ['Fashion', 'Photography', 'Film'] },
  { name: 'Leena', age: 25, location: 'JLT, Dubai', gender: 'female', photo: 'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=3840&q=95', bio: 'UX designer obsessed with behavioral psychology', tags: ['Design', 'Psychology', 'Running'] },
  { name: 'Mira', age: 32, location: 'Sharjah', gender: 'female', photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=3840&q=95', bio: 'Gallery owner with a thing for brutalist architecture', tags: ['Art', 'Architecture', 'Wine'] },
  { name: 'Tala', age: 23, location: 'Ajman', gender: 'female', photo: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=3840&q=95', bio: 'Marine biologist who free-dives on weekends', tags: ['Ocean', 'Science', 'Hiking'] },
]

const nearbyProfiles: Candidate[] = [
  ...heroProfiles,
  ...candidates,
  ...extraProfiles,
]

function createHomeSounds() {
  let ctx: AudioContext | null = null
  const getCtx = () => { if (!ctx) ctx = new AudioContext(); return ctx }
  return {
    tap() {
      try {
        const c = getCtx()
        const osc = c.createOscillator(); const gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = 880
        gain.gain.setValueAtTime(0.04, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.08)
      } catch { /* */ }
    },
    cleanup() { if (ctx) ctx.close().catch(() => {}) }
  }
}

export default function HomeScreen({ onQuickMatch, onGroupSession }: Props) {
  const [visible, setVisible] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const soundRef = useRef(createHomeSounds())
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 80)
    return () => {
      soundRef.current.cleanup()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Auto-rotate hero every 5s
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTransitioning(true)
      setTimeout(() => {
        setSlideIndex(prev => (prev + 1) % heroSlides.length)
        setTransitioning(false)
      }, 500)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const slide = heroSlides[slideIndex]
  const isSpark = slide.type === 'spark'

  const handleHeroCta = useCallback(() => {
    soundRef.current.tap()
    if (isSpark) onQuickMatch()
    else onGroupSession()
  }, [isSpark, onQuickMatch, onGroupSession])

  return (
    <div className="fixed inset-0 bg-[#FAF7F2] overflow-y-auto overflow-x-hidden">
      <div className={`relative min-h-full transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* ── Top bar — almost invisible, floats over the hero ── */}
        <header className="fixed top-0 left-0 right-0 z-50 px-5 py-3 flex items-center justify-between"
          style={{ background: 'linear-gradient(to bottom, rgba(250,247,242,0.7) 0%, rgba(250,247,242,0.2) 50%, transparent 100%)' }}>
          <PulseLogo variant="full" color="accent" size="sm" />
          <div className="flex items-center gap-3">
            <img src={photos.user} alt="You" className="w-8 h-8 rounded-full object-cover"
              style={{ border: `2px solid rgba(${USER_COLOR.rgb},0.35)` }} />
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            HERO — 80vh cinematic. One slide, one CTA.
            Alternates: profile (Spark) → experience (The Round)
           ══════════════════════════════════════════════════════════ */}
        <section className="relative w-full" style={{ height: '82vh', minHeight: '520px' }}>
          {/* Background image — full bleed */}
          <div className={`absolute inset-0 transition-all duration-600 ${transitioning ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'}`}>
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center center' }}
            />
            {/* Gradient: only the bottom 40% fades to ivory for text legibility.
                The rest of the image is untouched so faces are fully visible. */}
            <div className="absolute inset-0" style={{
              background: isSpark
                ? 'linear-gradient(to top, #FAF7F2 0%, rgba(250,247,242,0.85) 25%, rgba(250,247,242,0.15) 45%, transparent 60%)'
                : 'linear-gradient(to top, rgba(30,27,24,0.9) 0%, rgba(30,27,24,0.5) 30%, rgba(30,27,24,0.1) 50%, transparent 65%)',
            }} />
          </div>

          {/* Hero content — bottom-aligned */}
          <div className={`absolute bottom-0 left-0 right-0 px-6 pb-8 transition-all duration-500 ${
            transitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          }`}>
            {/* Category pill */}
            <div className="mb-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                style={{
                  color: isSpark ? '#C83E88' : `rgba(${USER_COLOR.rgb},1)`,
                  background: isSpark ? 'rgba(200,62,136,0.12)' : `rgba(${USER_COLOR.rgb},0.15)`,
                  border: `1px solid ${isSpark ? 'rgba(200,62,136,0.2)' : `rgba(${USER_COLOR.rgb},0.25)`}`,
                  backdropFilter: 'blur(8px)',
                }}>
                {isSpark ? '1-to-1' : 'Group experience'}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl font-bold mb-2" style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: '#2A2528',
              textShadow: '0 1px 8px rgba(250,247,242,0.8)',
            }}>
              {slide.headline}
            </h2>

            {/* Sub */}
            <p className="text-sm mb-1 italic max-w-[280px]" style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: isSpark ? '#6B6360' : 'rgba(255,255,255,0.7)',
              textShadow: isSpark ? '0 1px 6px rgba(250,247,242,0.7)' : 'none',
            }}>
              {isSpark ? `"${slide.sub}"` : slide.sub}
            </p>

            {/* Location (spark only) */}
            {isSpark && slide.profile && (
              <p className="text-xs flex items-center gap-1.5 mb-5" style={{
                color: '#8A7E78',
                textShadow: '0 1px 4px rgba(250,247,242,0.6)',
              }}>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {slide.profile.location}
              </p>
            )}
            {!isSpark && <div className="mb-5" />}

            {/* SINGLE CTA — large, confident, no competition */}
            <button
              onClick={handleHeroCta}
              className="w-full py-4 rounded-2xl font-bold text-white text-base tracking-wide
                         hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              style={{
                background: isSpark
                  ? 'linear-gradient(135deg, #C83E88 0%, #A83070 100%)'
                  : `linear-gradient(135deg, rgba(${USER_COLOR.rgb},0.95) 0%, rgba(${USER_COLOR.rgb},0.75) 100%)`,
                boxShadow: isSpark
                  ? '0 6px 30px rgba(200,62,136,0.35)'
                  : `0 6px 30px rgba(${USER_COLOR.rgb},0.3)`,
              }}>
              {slide.cta}
            </button>

            {/* Subtle alternate path — not competing, just available */}
            <p className="text-center mt-3 text-[0.7rem]"
              style={{ color: isSpark ? '#A89E98' : 'rgba(255,255,255,0.35)' }}>
              {isSpark ? 'or ' : 'or '}
              <button
                onClick={isSpark ? onGroupSession : onQuickMatch}
                className="underline underline-offset-2 transition-colors duration-200"
                style={{ color: isSpark ? '#C83E88' : 'rgba(255,255,255,0.55)' }}>
                {isSpark ? 'join a Round' : 'find a Spark'}
              </button>
            </p>
          </div>

          {/* Slide indicators — minimal, bottom-right */}
          <div className="absolute bottom-3 right-6 flex gap-1.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setTransitioning(true)
                  setTimeout(() => { setSlideIndex(i); setTransitioning(false) }, 400)
                }}
                className={`rounded-full transition-all duration-500 ${
                  i === slideIndex
                    ? 'w-6 h-1 bg-[#C83E88]'
                    : `w-1.5 h-1 ${isSpark ? 'bg-[#2A2528]/15' : 'bg-white/25'}`
                }`}
              />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            BELOW THE FOLD — Only two sections. Restrained.
           ══════════════════════════════════════════════════════════ */}

        {/* ── "New near you" — single horizontal carousel ── */}
        <section className="pt-8 pb-4">
          <div className="px-6 mb-4 flex items-baseline justify-between">
            <h3 className="text-lg font-bold text-[#2A2528]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              New near you
            </h3>
            <button onClick={onQuickMatch} className="text-[0.7rem] font-medium text-[#C83E88]">
              See all
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-6" style={{ paddingRight: '48px' }}>
              {nearbyProfiles.map((profile, i) => (
                <button
                  key={i}
                  onClick={onQuickMatch}
                  className="shrink-0 relative overflow-hidden rounded-2xl transition-all duration-300
                             hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    width: '130px',
                    height: '185px',
                    boxShadow: '0 4px 20px rgba(42,37,40,0.12)',
                  }}>
                  <img src={profile.photo} alt={profile.name}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(30,27,24,0.75) 0%, transparent 50%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[0.8rem] font-bold text-white leading-tight">{profile.name}, {profile.age}</p>
                    <p className="text-[0.55rem] text-white/60 mt-0.5">{profile.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live session teaser — one card, not three ── */}
        <section className="px-6 pt-2 pb-24">
          <button
            onClick={onGroupSession}
            className="w-full rounded-2xl overflow-hidden text-left
                       hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            style={{
              background: 'rgba(42,37,40,0.03)',
              border: `1px solid rgba(${USER_COLOR.rgb},0.1)`,
            }}>
            <div className="p-5 flex items-center gap-4">
              {/* Pulse indicator */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative"
                style={{ background: `rgba(${USER_COLOR.rgb},0.06)` }}>
                <div className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    background: USER_COLOR.primary,
                    boxShadow: `0 0 12px rgba(${USER_COLOR.rgb},0.4)`,
                  }} />
                {/* Ripple */}
                <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ border: `1.5px solid rgba(${USER_COLOR.rgb},0.3)` }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-[#2A2528]">The Marina Round</p>
                  <span className="px-1.5 py-0.5 rounded text-[0.5rem] font-bold text-[#30D158] bg-[#30D158]/10 animate-pulse">
                    LIVE
                  </span>
                </div>
                <p className="text-[0.7rem] text-[#8A7E78]">7 of 10 joined · Chill, cultured, sea breeze energy</p>
              </div>

              {/* Arrow */}
              <svg className="w-5 h-5 text-[#C2B8AE] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        </section>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
