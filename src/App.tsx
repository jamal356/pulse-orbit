import { useState, useCallback, useEffect } from 'react'
import MarketingPage from './screens/MarketingPage'
import WaitlistPage from './screens/WaitlistPage'
import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import Discover from './screens/Discover'
import SessionLobby from './screens/SessionLobby'
import LiveSession from './screens/LiveSession'
import TransitionScreen from './screens/TransitionScreen'
import MatchSurvey from './screens/MatchSurvey'
import MatchResults from './screens/MatchResults'
import SpeedDate from './screens/SpeedDate'
import AiSupport from './screens/AiSupport'
import InvestorClose from './screens/InvestorClose'
import VideoDate from './screens/VideoDate'
import type { Candidate } from './data/people'

type Screen = 'waitlist' | 'marketing' | 'login' | 'home' | 'discover' | 'lobby' | 'session' | 'transition' | 'survey' | 'results' | 'speeddate' | 'videodate'

/* ─── Route Architecture ──────────────────────────────────────
   Two independent routes:

   DEFAULT (product demo):
   waitlist → marketing → login → HOME → discover/lobby → dates → results → HOME
   Home is the hub. Every path loops back. No investor content.

   #pitch (investor pitch):
   Standalone InvestorClose. Accessed directly via URL.
   No demo flow, no product screens.
   ──────────────────────────────────────────────────────────── */
const DEMO_SCREENS: Screen[] = ['waitlist', 'marketing', 'login', 'home', 'discover', 'speeddate', 'lobby', 'session', 'survey', 'results']

function getRoute(): 'pitch' | 'product' {
  return window.location.hash.replace('#', '') === 'pitch' ? 'pitch' : 'product'
}

function getInitialScreen(): Screen {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'pitch') return 'waitlist' // won't be used — pitch route renders separately
  if (hash === 'demo' || hash === 'marketing') return 'marketing'
  if (['login', 'home', 'discover', 'lobby', 'session', 'survey', 'results', 'videodate'].includes(hash)) return hash as Screen
  return 'waitlist'
}

export default function App() {
  const [route, setRoute] = useState<'pitch' | 'product'>(getRoute)
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [transitioning, setTransitioning] = useState(false)
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, 'like' | 'pass'>>({})
  const [speedDateTarget, setSpeedDateTarget] = useState<Candidate | null>(null)
  const [showAura, setShowAura] = useState(false)

  const navigateTo = useCallback((next: Screen) => {
    setTransitioning(true)
    setTimeout(() => {
      setScreen(next)
      setTransitioning(false)
      window.scrollTo(0, 0)
    }, 400)
  }, [])

  // ── Core flow handlers ──
  const handleDateComplete = useCallback(() => {
    navigateTo('survey')
  }, [navigateTo])

  const handleRatingComplete = useCallback((name: string, rating: 'like' | 'pass') => {
    setRatings(prev => ({ ...prev, [name]: rating }))
    const nextIndex = currentDateIndex + 1
    if (nextIndex < 5) {
      setCurrentDateIndex(nextIndex)
      navigateTo('transition')
    } else {
      navigateTo('results')
    }
  }, [currentDateIndex, navigateTo])

  const handleTransitionComplete = useCallback(() => {
    navigateTo('session')
  }, [navigateTo])

  const handleResultsContinue = useCallback(() => {
    setCurrentDateIndex(0)
    setRatings({})
    navigateTo('home')
  }, [navigateTo])

  /* ─── FLYWHEEL HANDLERS ──────────────────────────────────────
     Home is the hub. Both paths start and return here.

     Quick Match path: Home → Discover → Match → 1-to-1 Speed Date → Home
     Group path: Home → Lobby → 5×5 Session → Results → Home (or Speed Date)

     The flywheel: group results → speed date with match → home
     Every endpoint loops back. Users always have a next action.
     ──────────────────────────────────────────────────────────── */

  // Home → Live video date (real WebRTC)
  const handleVideoDate = useCallback(() => {
    navigateTo('videodate')
  }, [navigateTo])

  // Home → Discover (swipe to find matches)
  const handleQuickMatch = useCallback(() => {
    navigateTo('discover')
  }, [navigateTo])

  // Home → Group lobby (5×5 session)
  const handleGroupSession = useCallback(() => {
    navigateTo('lobby')
  }, [navigateTo])

  // Discover → 1-to-1 speed date (after mutual match)
  const handleDiscoverSpeedDate = useCallback((candidate: Candidate) => {
    setSpeedDateTarget(candidate)
    navigateTo('speeddate')
  }, [navigateTo])

  // Results → 1-to-1 speed date (post-group flywheel)
  const handleResultsSpeedDate = useCallback((candidate: Candidate) => {
    setSpeedDateTarget(candidate)
    navigateTo('speeddate')
  }, [navigateTo])

  // After 1-to-1 completes → back to Home (not lobby — let them choose)
  const handleSpeedDateComplete = useCallback(() => {
    setSpeedDateTarget(null)
    navigateTo('home')
  }, [navigateTo])

  // Discover → skip to group (also on Home)
  const handleDiscoverToGroup = useCallback(() => {
    navigateTo('lobby')
  }, [navigateTo])

  // Login → Home
  const handleLoginComplete = useCallback(() => {
    navigateTo('home')
  }, [navigateTo])

  // Restart demo
  const handleRestart = useCallback(() => {
    setCurrentDateIndex(0)
    setRatings({})
    setSpeedDateTarget(null)
    navigateTo('marketing')
  }, [navigateTo])

  // Hash navigation
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'pitch') { setRoute('pitch'); return }
      setRoute('product')
      if (hash === 'demo' || hash === 'marketing') { setScreen('marketing'); return }
      if (hash === 'waitlist') { setScreen('waitlist'); return }
      if (['login', 'home', 'discover', 'lobby', 'session', 'survey', 'results', 'videodate'].includes(hash)) {
        setScreen(hash as Screen)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Demo nav
  const demoIdx = DEMO_SCREENS.indexOf(screen)
  const canGoBack = demoIdx > 0
  const canGoForward = demoIdx < DEMO_SCREENS.length - 1 && demoIdx >= 0

  const demoPrev = useCallback(() => {
    const idx = DEMO_SCREENS.indexOf(screen)
    if (idx > 0) navigateTo(DEMO_SCREENS[idx - 1])
  }, [screen, navigateTo])

  const demoNext = useCallback(() => {
    const idx = DEMO_SCREENS.indexOf(screen)
    if (idx >= 0 && idx < DEMO_SCREENS.length - 1) navigateTo(DEMO_SCREENS[idx + 1])
  }, [screen, navigateTo])

  // ── PITCH ROUTE: standalone investor deck ──
  if (route === 'pitch') {
    return (
      <InvestorClose
        ratings={ratings}
        onRestart={() => { window.location.hash = ''; setRoute('product'); setScreen('waitlist') }}
      />
    )
  }

  // ── PRODUCT ROUTE: the actual app ──
  return (
    <div className={`transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
      {screen === 'waitlist' && (
        <WaitlistPage />
      )}
      {screen === 'marketing' && (
        <MarketingPage onStartDemo={() => navigateTo('login')} />
      )}
      {screen === 'login' && (
        <LoginScreen onComplete={handleLoginComplete} />
      )}
      {screen === 'home' && (
        <HomeScreen
          onQuickMatch={handleQuickMatch}
          onGroupSession={handleGroupSession}
          onVideoDate={handleVideoDate}
        />
      )}
      {screen === 'discover' && (
        <Discover
          onSpeedDate={handleDiscoverSpeedDate}
          onGroupSession={handleDiscoverToGroup}
        />
      )}
      {screen === 'lobby' && (
        <SessionLobby onNavigate={() => navigateTo('session')} />
      )}
      {screen === 'session' && (
        <LiveSession
          dateIndex={currentDateIndex}
          onNavigate={handleDateComplete}
        />
      )}
      {screen === 'transition' && (
        <TransitionScreen
          dateIndex={currentDateIndex}
          onNavigate={handleTransitionComplete}
        />
      )}
      {screen === 'survey' && (
        <MatchSurvey
          dateIndex={currentDateIndex}
          onRate={handleRatingComplete}
        />
      )}
      {screen === 'results' && (
        <MatchResults
          ratings={ratings}
          onRestart={handleRestart}
          onContinue={handleResultsContinue}
          onSpeedDate={handleResultsSpeedDate}
        />
      )}
      {screen === 'speeddate' && speedDateTarget && (
        <SpeedDate
          candidate={speedDateTarget}
          onComplete={handleSpeedDateComplete}
        />
      )}
      {screen === 'videodate' && (
        <VideoDate onBack={() => navigateTo('home')} />
      )}
      {/* Aura overlay */}
      {showAura && (
        <AiSupport onClose={() => setShowAura(false)} />
      )}

      {/* ═══ AURA — top-center liquid glass island ═══
           Inspired by Apple's Dynamic Island. Centered, floating, liquid.
           Multi-layer glass: frosted base + inner glow + living orb.
           Adapts tint to light (home) vs dark screens.
           ──────────────────────────────────────────────────────── */}
      {!['waitlist', 'marketing', 'login'].includes(screen) && !showAura && (
        <button
          onClick={() => setShowAura(true)}
          className="fixed z-[90] left-1/2 -translate-x-1/2 group"
          style={{ top: '0.65rem' }}
          title="Ask Aura">
          {/* Outer liquid glass shell */}
          <div className="relative flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full transition-all duration-500
                          group-hover:scale-[1.06] group-active:scale-[0.96]"
            style={{
              background: screen === 'home'
                ? 'linear-gradient(135deg, rgba(42,37,40,0.65) 0%, rgba(42,37,40,0.45) 100%)'
                : 'linear-gradient(135deg, rgba(30,27,24,0.50) 0%, rgba(50,40,55,0.35) 100%)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `
                0 1px 0 0 rgba(255,255,255,0.05) inset,
                0 -1px 0 0 rgba(0,0,0,0.1) inset,
                0 4px 20px rgba(0,0,0,0.15),
                0 0 0 0.5px rgba(200,62,136,0.08)
              `,
            }}>
            {/* Inner ambient glow — shifts with hover */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(200,62,136,0.08) 0%, transparent 70%)',
              }} />

            {/* Aura orb — the living core */}
            <div className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              {/* Spinning gradient ring */}
              <div className="absolute inset-[-2px] rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(200,62,136,0.5), rgba(128,64,224,0.5), rgba(200,62,136,0.5))',
                  animation: 'aura-ring-spin 6s linear infinite',
                  filter: 'blur(3px)',
                }} />
              {/* Glass orb body */}
              <div className="relative rounded-full overflow-hidden"
                style={{
                  width: '22px', height: '22px',
                  background: 'radial-gradient(circle at 35% 30%, #E040A0, #9040D0 55%, #5020C0 100%)',
                  boxShadow: '0 0 12px rgba(200,62,136,0.4), 0 2px 6px rgba(0,0,0,0.2) inset',
                }}>
                {/* Specular highlight — glass refraction */}
                <div className="absolute top-[3px] left-[4px] w-[8px] h-[5px] rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(1px)',
                  }} />
                {/* Breathing soul light */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,200,230,0.3))',
                      animation: 'aura-breathe 3s ease-in-out infinite',
                    }} />
                </div>
              </div>
            </div>

            {/* Label — Cormorant, elegant */}
            <span className="text-[0.65rem] font-semibold text-white/55 group-hover:text-white/80 transition-colors duration-300"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>
              Aura
            </span>
          </div>
        </button>
      )}

      {/* Demo nav arrows */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-1 opacity-20 hover:opacity-80 transition-opacity duration-300">
        <button
          onClick={demoPrev}
          disabled={!canGoBack}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white/70 transition-all ${canGoBack ? 'hover:bg-white/10 hover:text-white active:scale-90' : 'opacity-20 cursor-default'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-[0.55rem] text-white/40 font-mono min-w-[60px] text-center">{screen}</span>
        <button
          onClick={demoNext}
          disabled={!canGoForward}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white/70 transition-all ${canGoForward ? 'hover:bg-white/10 hover:text-white active:scale-90' : 'opacity-20 cursor-default'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Aura's global keyframes */}
      <style>{`
        @keyframes aura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes aura-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
