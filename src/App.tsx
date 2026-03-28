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
import type { Candidate } from './data/people'

type Screen = 'waitlist' | 'marketing' | 'login' | 'home' | 'discover' | 'lobby' | 'session' | 'transition' | 'survey' | 'results' | 'speeddate' | 'close'

/* ─── Demo Nav ─────────────────────────────────────────────
   Full journey:
   waitlist → pitch → login → HOME (Netflix hub) → discover → 1-to-1 → group → dates → results → close

   The Home screen is the central hub where both paths are visible:
   - "Quick Match" → Discover (swipe → match → 1-to-1 speed date)
   - "Group 5×5"  → Lobby → 5×5 session → Results

   The flywheel:
   - After 1-to-1 → Home (choose next action)
   - After group results → Speed Date with matches OR Home
   - Each mode feeds the other
   ──────────────────────────────────────────────────────────── */
const DEMO_SCREENS: Screen[] = ['waitlist', 'marketing', 'login', 'home', 'discover', 'speeddate', 'lobby', 'session', 'survey', 'results', 'close']

function getInitialScreen(): Screen {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'demo' || hash === 'marketing') return 'marketing'
  if (['login', 'home', 'discover', 'lobby', 'session', 'survey', 'results'].includes(hash)) return hash as Screen
  return 'waitlist'
}

export default function App() {
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
    navigateTo('close')
  }, [navigateTo])

  /* ─── FLYWHEEL HANDLERS ──────────────────────────────────────
     Home is the hub. Both paths start and return here.

     Quick Match path: Home → Discover → Match → 1-to-1 Speed Date → Home
     Group path: Home → Lobby → 5×5 Session → Results → Home (or Speed Date)

     The flywheel: group results → speed date with match → home
     Every endpoint loops back. Users always have a next action.
     ──────────────────────────────────────────────────────────── */

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
      if (hash === 'demo' || hash === 'marketing') { setScreen('marketing'); return }
      if (hash === 'waitlist') { setScreen('waitlist'); return }
      if (['login', 'home', 'discover', 'lobby', 'session', 'survey', 'results'].includes(hash)) {
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
      {screen === 'close' && (
        <InvestorClose
          ratings={ratings}
          onRestart={handleRestart}
        />
      )}

      {/* Aura overlay */}
      {showAura && (
        <AiSupport onClose={() => setShowAura(false)} />
      )}

      {/* ═══ AURA FAB — floating bottom-right on ALL post-login screens ═══
           Aura — top-right, docked into the header zone.
           Compact glass pill. Never collides with bottom CTAs.
           On light screens (home): darker glass. On dark: subtle translucent.
           ──────────────────────────────────────────────────────── */}
      {!['waitlist', 'marketing', 'login'].includes(screen) && !showAura && (
        <button
          onClick={() => setShowAura(true)}
          className="fixed z-[90] group"
          style={{ top: '0.85rem', right: '0.85rem' }}
          title="Ask Aura">
          <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full transition-all duration-300
                          group-hover:scale-105 group-active:scale-95"
            style={{
              background: screen === 'home' ? 'rgba(42,37,40,0.75)' : 'rgba(30,27,24,0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(200,62,136,0.12)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}>
            {/* Aura orb — compact */}
            <div className="relative w-6 h-6 rounded-full flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #C83E88, #8040E0, #C83E88)',
                  opacity: 0.35,
                  animation: 'aura-ring-spin 6s linear infinite',
                  filter: 'blur(2px)',
                }} />
              <div className="relative rounded-full"
                style={{
                  width: '18px', height: '18px',
                  background: 'radial-gradient(circle at 35% 35%, #E040A0, #8040E0 70%, #5020C0)',
                  boxShadow: '0 0 8px rgba(200,62,136,0.35)',
                }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,200,230,0.4))',
                      animation: 'aura-breathe 3s ease-in-out infinite',
                    }} />
                </div>
              </div>
            </div>
            <span className="text-[0.6rem] font-semibold text-white/60 group-hover:text-white/80 transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.04em' }}>
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
