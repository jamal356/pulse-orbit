import { useEffect, useState } from 'react'
import { candidates } from '../data/people'
import { sponsors } from '../data/sponsors'

interface Props {
  onNavigate: () => void
}

/* ─── Carousel content: profile teasers + sponsor ads ─────────
   Netflix model: full-bleed image, info overlay, auto-advance.
   Profiles and sponsors alternate — the wait time IS the ad time.
   ───────────────────────────────────────────────────────────── */
interface Slide {
  type: 'profile' | 'sponsor'
  image: string
  title: string
  subtitle: string
  tags?: string[]
  cta?: string
  accent?: string
}

/* Profile photos — mix of men and women */
const profilePhotos = {
  woman1: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  man1: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
  woman2: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  man2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  woman3: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
}

const slides: Slide[] = [
  // Profile — woman
  {
    type: 'profile',
    image: profilePhotos.woman1,
    title: '"I believe in love at first conversation."',
    subtitle: 'Dubai Marina · 26-30',
    tags: ['Creative', 'Foodie', 'Travel'],
  },
  // Sponsor
  {
    type: 'sponsor',
    image: sponsors[0].image,
    title: sponsors[0].brand,
    subtitle: sponsors[0].tagline,
    cta: sponsors[0].cta,
    accent: sponsors[0].accent,
  },
  // Profile — man
  {
    type: 'profile',
    image: profilePhotos.man1,
    title: '"Energy doesn\'t lie."',
    subtitle: 'Downtown Dubai · 28-32',
    tags: ['Fitness', 'Entrepreneur', 'Music'],
  },
  // Sponsor
  {
    type: 'sponsor',
    image: sponsors[1].image,
    title: sponsors[1].brand,
    subtitle: sponsors[1].tagline,
    cta: sponsors[1].cta,
    accent: sponsors[1].accent,
  },
  // Profile — woman
  {
    type: 'profile',
    image: profilePhotos.woman2,
    title: '"Show me your playlist, I\'ll show you my soul."',
    subtitle: 'Abu Dhabi · 24-28',
    tags: ['Art', 'Dance', 'Coffee'],
  },
  // Sponsor
  {
    type: 'sponsor',
    image: sponsors[2].image,
    title: sponsors[2].brand,
    subtitle: sponsors[2].tagline,
    cta: sponsors[2].cta,
    accent: sponsors[2].accent,
  },
  // Profile — man
  {
    type: 'profile',
    image: profilePhotos.man2,
    title: '"I can talk about anything for five minutes."',
    subtitle: 'Riyadh · 27-31',
    tags: ['Tech', 'Hiking', 'Podcasts'],
  },
  // Sponsor
  {
    type: 'sponsor',
    image: sponsors[3].image,
    title: sponsors[3].brand,
    subtitle: sponsors[3].tagline,
    cta: sponsors[3].cta,
    accent: sponsors[3].accent,
  },
  // Profile — woman
  {
    type: 'profile',
    image: profilePhotos.woman3,
    title: '"The eyes say everything."',
    subtitle: 'JBR, Dubai · 31-35',
    tags: ['Fashion', 'Photography', 'Travel'],
  },
]

/* Profiles are quick teasers; sponsors get full luxury dwell time */
const PROFILE_DURATION = 3500
const SPONSOR_DURATION = 7000
function getSlideDuration(idx: number) {
  return slides[idx].type === 'sponsor' ? SPONSOR_DURATION : PROFILE_DURATION
}

export default function SessionLobby({ onNavigate }: Props) {
  const [countdown, setCountdown] = useState(120)
  const [visible, setVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideProgress, setSlideProgress] = useState(0)
  const [joined, setJoined] = useState(3)
  const [transitioning, setTransitioning] = useState(false)

  // Countdown + join simulation
  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const timer = setInterval(() => setCountdown(p => (p > 0 ? p - 1 : 0)), 1000)
    const joinTimer = setInterval(() => setJoined(p => Math.min(p + 1, 10)), 3000)
    return () => { clearInterval(timer); clearInterval(joinTimer) }
  }, [])

  // Auto-advancing carousel — duration depends on slide type
  useEffect(() => {
    const duration = getSlideDuration(currentSlide)

    const progressInterval = setInterval(() => {
      setSlideProgress(p => {
        if (p >= 100) return 100
        return p + (100 / (duration / 50))
      })
    }, 50)

    const slideTimeout = setTimeout(() => {
      setTransitioning(true)
      setTimeout(() => {
        setCurrentSlide(p => (p + 1) % slides.length)
        setSlideProgress(0)
        setTransitioning(false)
      }, 400)
    }, duration)

    return () => { clearInterval(progressInterval); clearTimeout(slideTimeout) }
  }, [currentSlide])

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const slide = slides[currentSlide]

  return (
    <div className="fixed inset-0 bg-[#1a1a1e] flex flex-col overflow-hidden">

      {/* ═══ NETFLIX HERO — full bleed image ═══ */}
      <div className="relative flex-1 min-h-0">

        {/* ─── SPONSOR SLIDES: full-bleed cinematic image ─── */}
        {slide.type === 'sponsor' && (
          <div className={`absolute inset-0 transition-opacity duration-[800ms] ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
            <img src={slide.image} alt="" className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.45)', animation: 'ken-burns 25s ease-in-out infinite alternate' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #1a1a1e 0%, rgba(26,26,30,0.7) 30%, transparent 60%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,26,30,0.5) 0%, transparent 50%)' }} />
          </div>
        )}

        {/* ─── PROFILE SLIDES: ambient bg + contained card ─── */}
        {slide.type === 'profile' && (
          <div className={`absolute inset-0 transition-opacity duration-[800ms] flex items-center justify-center ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'linear-gradient(170deg, #1C1A22 0%, #16141C 40%, #12111A 100%)' }}>
            {/* Ambient glow behind card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(224,64,160,0.08) 0%, transparent 60%)' }} />

            {/* Profile card */}
            <div className="relative z-10 w-72 sm:w-80 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
              <div className="relative h-72 sm:h-80 overflow-hidden">
                <img src={slide.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(20,18,26,0.95)] via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-[0.55rem] tracking-[0.15em] uppercase px-2 py-1 rounded"
                    style={{ background: 'rgba(224,64,160,0.15)', color: '#E040A0' }}>Tonight's lineup</span>
                </div>
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.45)' }}>
                    {slide.subtitle}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-lg mb-3 leading-snug"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>
                  {slide.title}
                </p>
                {slide.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {slide.tags.map(tag => (
                      <span key={tag} className="text-[0.65rem] px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(224,64,160,0.08)', color: '#E040A0', border: '1px solid rgba(224,64,160,0.12)' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Top bar: Logo + Countdown ─── */}
        <header className="relative z-20 px-6 py-4 flex items-center justify-between">
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

        {/* ─── Bottom overlay — sponsor info + progress bars ─── */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 px-6 pb-6 transition-all duration-[800ms] ${transitioning ? 'opacity-0' : 'opacity-100'}`}>

          {/* Sponsor overlay text — only for sponsor slides */}
          {slide.type === 'sponsor' && (
            <div className="mb-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[0.6rem] tracking-[0.15em] uppercase px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)' }}>Presented by</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 max-w-xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, color: 'rgba(255,255,255,0.92)' }}>
                {slide.title}
              </h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif" }}>
                {slide.subtitle}
              </p>
              {slide.cta && (
                <button className="mb-4 px-6 py-2.5 rounded text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {slide.cta} <span className="ml-1">›</span>
                </button>
              )}
            </div>
          )}

          {/* Netflix-style progress bars */}
          <div className="flex gap-1">
            {slides.map((_, idx) => (
              <div key={idx} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
                <div
                  className="h-full rounded-full transition-all ease-linear"
                  style={{
                    width: idx < currentSlide ? '100%' : idx === currentSlide ? `${slideProgress}%` : '0%',
                    background: slides[idx].type === 'sponsor' ? (slides[idx].accent || 'rgba(255,255,255,0.5)') : '#E040A0',
                    transitionDuration: idx === currentSlide ? '50ms' : '400ms',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM BAR ═══ */}
      <div className={`relative z-20 px-6 py-4 flex items-center justify-between transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(26,26,30,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Mini participant avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {candidates.slice(0, Math.min(joined, 5)).map((c, i) => (
              <img
                key={c.name}
                src={c.photo}
                alt={c.name}
                className="w-8 h-8 rounded-full object-cover transition-all duration-500"
                style={{
                  border: '2px solid #1a1a1e',
                  opacity: i < joined ? 1 : 0.3,
                  zIndex: 5 - i,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-white/30 ml-1">{joined}/10</span>
        </div>

        {/* Ready button */}
        <button
          onClick={onNavigate}
          className="group px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-[#E040A0] shadow-lg shadow-[rgba(224,64,160,0.25)]"
        >
          <span className="text-white flex items-center gap-2">
            I'm Ready
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </span>
        </button>
      </div>

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1) translateX(0); }
          100% { transform: scale(1.08) translateX(-1%); }
        }
      `}</style>
    </div>
  )
}
