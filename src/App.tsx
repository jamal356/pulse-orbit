import { useState, useCallback, useEffect } from 'react'
import MarketingPage from './screens/MarketingPage'
import WaitlistPage from './screens/WaitlistPage'
import LoginScreen from './screens/LoginScreen'
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

type Screen = 'waitlist' | 'marketing' | 'login' | 'discover' | 'lobby' | 'session' | 'transition' | 'survey' | 'results' | 'speeddate' | 'close'

/* ─── Demo Nav ─────────────────────────────────────────────
   Full journey: waitlist → pitch → login → discover → 1-to-1 → group → dates → results → close
   The flywheel: after group results, matches can do 1-to-1 speed dates.
   After 1-to-1 from discover, user flows to group session.
   Each mode feeds the other.
   ──────────────────────────────────────────────────────────── */
const DEMO_SCREENS: Screen[] = ['waitlist', 'marketing', 'login', 'discover', 'speeddate', 'lobby', 'session', 'survey', 'results', 'close']

/* ─── Route Logic ────────────────────────────────────────────
   Default landing:
   - yoursite.com           → Waitlist (consumer-facing)
   - yoursite.com/#demo     → Investor demo (full platform walkthrough)
   - yoursite.com/#waitlist → Waitlist (explicit)

   When pitching VCs, share the #demo link.
   When marketing to users, share the clean URL.
   ──────────────────────────────────────────────────────────── */
function getInitialScreen(): Screen {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'demo' || hash === 'marketing') return 'marketing'
  if (['login', 'discover', 'lobby', 'session', 'survey', 'results'].includes(hash)) return hash as Screen
  return 'waitlist'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [transitioning, setTransitioning] = useState(false)
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, 'like' | 'pass'>>({})
  const [speedDateTarget, setSpeedDateTarget] = useState<Candidate | null>(null)
  const [showAiSupport, setShowAiSupport] = useState(false)

  const navigateTo = useCallback((next: Screen) => {
    setTransitioning(true)
    setTimeout(() => {
      setScreen(next)
      setTransitioning(false)
      window.scrollTo(0, 0)
    }, 400)
  }, [])

  // After a live date, go to quick rating, then either next date or results
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
     The two paths feed each other:

     Path 1: Discover → Match → Both Accept → 1-to-1 Speed Date → Group Lobby
     Path 2: Discover → Skip → Group Lobby → 5×5 Session → Results
     Flywheel: Results → Speed Date with match → back to Discover or Close

     Each mode generates value for the other:
     - 1-to-1 users who don't match flow into group (retention)
     - Group matches get offered 1-to-1 (upsell to premium)
     - Both create engagement loops that keep users on platform
     ──────────────────────────────────────────────────────────── */

  // 1-to-1 Speed Date from discover match
  const handleDiscoverSpeedDate = useCallback((candidate: Candidate) => {
    setSpeedDateTarget(candidate)
    navigateTo('speeddate')
  }, [navigateTo])

  // 1-to-1 Speed Date from match results (post-group session) — THE FLYWHEEL
  const handleResultsSpeedDate = useCallback((candidate: Candidate) => {
    setSpeedDateTarget(candidate)
    navigateTo('speeddate')
  }, [navigateTo])

  // After 1-to-1 speed date completes → go to group lobby
  const handleSpeedDateComplete = useCallback(() => {
    setSpeedDateTarget(null)
    navigateTo('lobby')
  }, [navigateTo])

  // Skip swiping, go straight to group session
  const handleGoToGroupSession = useCallback(() => {
    navigateTo('lobby')
  }, [navigateTo])

  // Login complete → go to discover
  const handleLoginComplete = useCallback(() => {
    navigateTo('discover')
  }, [navigateTo])

  const handleRestart = useCallback(() => {
    setCurrentDateIndex(0)
    setRatings({})
    setSpeedDateTarget(null)
    navigateTo('marketing')
  }, [navigateTo])

  useEffect(() => {
    // Allow hash navigation for direct linking
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'demo' || hash === 'marketing') { setScreen('marketing'); return }
      if (hash === 'waitlist') { setScreen('waitlist'); return }
      if (['login', 'discover', 'lobby', 'session', 'survey', 'results'].includes(hash)) {
        setScreen(hash as Screen)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── Demo nav helpers ──
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
      {screen === 'discover' && (
        <Discover
          onSpeedDate={handleDiscoverSpeedDate}
          onGroupSession={handleGoToGroupSession}
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

      {/* AI Support overlay */}
      {showAiSupport && (
        <AiSupport onClose={() => setShowAiSupport(false)} />
      )}

      {/* AI Support FAB — visible on all screens except waitlist and marketing */}
      {!['waitlist', 'marketing'].includes(screen) && !showAiSupport && (
        <button
          onClick={() => setShowAiSupport(true)}
          className="fixed bottom-16 right-4 z-[90] w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, #E040A0, #8040E0)',
            boxShadow: '0 4px 20px rgba(224,64,160,0.4), 0 0 40px rgba(128,64,224,0.2)',
          }}
          title="Pulse AI Support">
          <span className="text-lg">🤖</span>
        </button>
      )}

      {/* ── Demo nav arrows — discreet, bottom-center ── */}
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
    </div>
  )
}
