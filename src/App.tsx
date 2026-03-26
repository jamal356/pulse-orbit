import { useState, useCallback, useEffect } from 'react'
import MarketingPage from './screens/MarketingPage'
import WaitlistPage from './screens/WaitlistPage'
import SessionLobby from './screens/SessionLobby'
import LiveSession from './screens/LiveSession'
import TransitionScreen from './screens/TransitionScreen'
import MatchSurvey from './screens/MatchSurvey'
import MatchResults from './screens/MatchResults'

type Screen = 'waitlist' | 'marketing' | 'lobby' | 'session' | 'transition' | 'survey' | 'results'

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
  if (['lobby', 'session', 'survey', 'results'].includes(hash)) return hash as Screen
  return 'waitlist'
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [transitioning, setTransitioning] = useState(false)
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, 'like' | 'pass'>>({})

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

  const handleRestart = useCallback(() => {
    setCurrentDateIndex(0)
    setRatings({})
    navigateTo('marketing')
  }, [navigateTo])

  useEffect(() => {
    // Allow hash navigation for direct linking
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'demo' || hash === 'marketing') { setScreen('marketing'); return }
      if (hash === 'waitlist') { setScreen('waitlist'); return }
      if (['lobby', 'session', 'survey', 'results'].includes(hash)) {
        setScreen(hash as Screen)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className={`transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
      {screen === 'waitlist' && (
        <WaitlistPage />
      )}
      {screen === 'marketing' && (
        <MarketingPage onStartDemo={() => navigateTo('lobby')} />
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
        />
      )}
    </div>
  )
}
