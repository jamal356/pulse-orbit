import { useState, useCallback, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import MarketingPage from './screens/MarketingPage'
import LoginScreen from './screens/LoginScreen'
import ProfileSetup from './screens/ProfileSetup'
import HomeScreen from './screens/HomeScreen'
import Discover from './screens/Discover'
import Lobby from './screens/Lobby'
import LiveSession from './screens/LiveSession'
import MatchSurvey from './screens/MatchSurvey'
import MatchResults from './screens/MatchResults'
import SpeedDate from './screens/SpeedDate'
import AiSupport from './screens/AiSupport'
import InvestorClose from './screens/InvestorClose'
import VideoDate from './screens/VideoDate'
import ProfileScreen from './screens/ProfileScreen'
import WaitlistPage from './screens/WaitlistPage'
import type { Candidate } from './data/people'

type ScreenType = 'marketing' | 'login' | 'profile-setup' | 'home' | 'lobby' | 'live-session' | 'discover' | 'speeddate' | 'transition' | 'survey' | 'results' | 'videodate' | 'profile' | 'waitlist'

const DEMO_SCREENS: ScreenType[] = ['marketing', 'login', 'profile-setup', 'home', 'discover', 'speeddate', 'lobby', 'live-session', 'survey', 'results']

function getRoute(): 'pitch' | 'product' {
  return window.location.hash.replace('#', '') === 'pitch' ? 'pitch' : 'product'
}

function getInitialScreen(): ScreenType {
  const hash = window.location.hash.replace('#', '')
  if (hash === 'pitch') return 'marketing'
  if (hash === 'demo' || hash === 'marketing') return 'marketing'
  if (['login', 'profile-setup', 'home', 'discover', 'lobby', 'live-session', 'survey', 'results', 'videodate', 'profile', 'waitlist'].includes(hash)) {
    return hash as ScreenType
  }
  return 'marketing'
}

export default function App() {
  const { user, profile, loading } = useAuth()
  const [route, setRoute] = useState<'pitch' | 'product'>(getRoute)
  const [screen, setScreen] = useState<ScreenType>(getInitialScreen)
  const [transitioning, setTransitioning] = useState(false)
  const [speedDateTarget, setSpeedDateTarget] = useState<Candidate | null>(null)
  const [showAura, setShowAura] = useState(false)
  const [matchesData, setMatchesData] = useState<any>(null)

  const navigateTo = useCallback((next: ScreenType, data?: any) => {
    setTransitioning(true)
    if (next === 'results' && data?.matches) {
      setMatchesData(data.matches)
    }
    setTimeout(() => {
      setScreen(next)
      setTransitioning(false)
      window.scrollTo(0, 0)
      window.location.hash = next
    }, 400)
  }, [])

  const handleVideoDate = useCallback(() => {
    navigateTo('videodate')
  }, [navigateTo])

  const handleQuickMatch = useCallback(() => {
    navigateTo('discover')
  }, [navigateTo])

  const handleGroupSession = useCallback(() => {
    navigateTo('lobby')
  }, [navigateTo])

  const handleDiscoverSpeedDate = useCallback((candidate: Candidate) => {
    setSpeedDateTarget(candidate)
    navigateTo('speeddate')
  }, [navigateTo])

  const handleSpeedDateComplete = useCallback(() => {
    setSpeedDateTarget(null)
    navigateTo('home')
  }, [navigateTo])

  const handleDiscoverToGroup = useCallback(() => {
    navigateTo('lobby')
  }, [navigateTo])

  const handleLoginComplete = useCallback(() => {
    if (profile) {
      navigateTo('home')
    } else {
      navigateTo('profile-setup')
    }
  }, [profile, navigateTo])

  const handleProfileSetupComplete = useCallback(() => {
    navigateTo('home')
  }, [navigateTo])

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'pitch') {
        setRoute('pitch')
        return
      }
      setRoute('product')
      if (hash === 'demo' || hash === 'marketing') {
        setScreen('marketing')
        return
      }
      if (hash === 'waitlist') {
        setScreen('waitlist')
        return
      }
      if (['login', 'profile-setup', 'home', 'discover', 'lobby', 'live-session', 'survey', 'results', 'videodate', 'profile'].includes(hash)) {
        setScreen(hash as ScreenType)
      }
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const isDev = import.meta.env.VITE_DEV_MODE === 'true'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40">Loading...</div>
      </div>
    )
  }

  if (route === 'pitch') {
    return (
      <InvestorClose
        ratings={{}}
        onRestart={() => {
          window.location.hash = ''
          setRoute('product')
          setScreen('marketing')
        }}
      />
    )
  }

  // Determine which screen to show based on auth state
  let currentScreen = screen

  // Unauthenticated users: only marketing, login, pitch, waitlist
  if (!user) {
    if (!['marketing', 'login', 'waitlist'].includes(screen)) {
      currentScreen = 'marketing'
    }
  }
  // Authenticated users without profile: only profile-setup or login
  else if (!profile) {
    if (!['profile-setup', 'login'].includes(screen)) {
      currentScreen = 'profile-setup'
    }
  }
  // Authenticated users with profile: full app access
  // (any screen is allowed)

  return (
    <div className={`transition-opacity duration-400 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
      {currentScreen === 'marketing' && (
        <MarketingPage onStartDemo={() => navigateTo('login')} />
      )}
      {currentScreen === 'login' && (
        <LoginScreen onNavigate={handleLoginComplete} />
      )}
      {currentScreen === 'profile-setup' && (
        <ProfileSetup onNavigate={handleProfileSetupComplete} />
      )}
      {currentScreen === 'waitlist' && (
        <WaitlistPage />
      )}
      {currentScreen === 'home' && user && profile && (
        <HomeScreen
          onQuickMatch={handleQuickMatch}
          onGroupSession={handleGroupSession}
          onVideoDate={handleVideoDate}
        />
      )}
      {currentScreen === 'discover' && (
        <Discover
          onSpeedDate={handleDiscoverSpeedDate}
          onGroupSession={handleDiscoverToGroup}
        />
      )}
      {currentScreen === 'lobby' && user && profile && (
        <Lobby user={{ id: user.id, display_name: profile.display_name, photo_url: profile.photo_url }} onNavigate={() => navigateTo('live-session')} />
      )}
      {currentScreen === 'live-session' && user && profile && (
        <LiveSession
          user={{ id: user.id, display_name: profile.display_name, photo_url: profile.photo_url }}
          sessionData={{ sessionId: 'session-default', participants: [], rounds: 5 }}
          onNavigate={(next) => navigateTo((next === 'home' ? 'home' : 'survey') as ScreenType)}
        />
      )}
      {currentScreen === 'survey' && user && profile && (
        <MatchSurvey
          user={{ id: user.id }}
          sessionId="session-default"
          rounds={[]}
          onNavigate={(screen, data) => navigateTo(screen, data)}
        />
      )}
      {currentScreen === 'results' && user && profile && (
        <MatchResults
          user={{ id: user.id, display_name: profile.display_name || '', photo_url: profile.photo_url || '' }}
          sessionId="session-default"
          matches={matchesData || []}
          onNavigate={(screen, data) => navigateTo(screen as ScreenType, data)}
        />
      )}
      {currentScreen === 'speeddate' && speedDateTarget && (
        <SpeedDate
          candidate={speedDateTarget}
          onComplete={handleSpeedDateComplete}
        />
      )}
      {currentScreen === 'videodate' && (
        <VideoDate onBack={() => navigateTo('home')} />
      )}
      {currentScreen === 'profile' && user && profile && (
        <ProfileScreen user={user} profile={profile} />
      )}

      {showAura && (
        <AiSupport onClose={() => setShowAura(false)} />
      )}

      {!['marketing', 'login', 'profile-setup', 'waitlist'].includes(screen) && !showAura && (
        <button
          onClick={() => setShowAura(true)}
          className="fixed z-[90] left-1/2 -translate-x-1/2 group"
          style={{ top: '0.65rem' }}
          title="Ask Aura">
          <div className="relative flex items-center gap-2 pl-2.5 pr-4 py-2 rounded-full transition-all duration-500 group-hover:scale-[1.06] group-active:scale-[0.96]"
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
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(200,62,136,0.08) 0%, transparent 70%)',
              }} />

            <div className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0">
              <div className="absolute inset-[-2px] rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(200,62,136,0.5), rgba(128,64,224,0.5), rgba(200,62,136,0.5))',
                  animation: 'aura-ring-spin 6s linear infinite',
                  filter: 'blur(3px)',
                }} />
              <div className="relative rounded-full overflow-hidden"
                style={{
                  width: '22px', height: '22px',
                  background: 'radial-gradient(circle at 35% 30%, #E040A0, #9040D0 55%, #5020C0 100%)',
                  boxShadow: '0 0 12px rgba(200,62,136,0.4), 0 2px 6px rgba(0,0,0,0.2) inset',
                }}>
                <div className="absolute top-[3px] left-[4px] w-[8px] h-[5px] rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(1px)',
                  }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.85), rgba(255,200,230,0.3))',
                      animation: 'aura-breathe 3s ease-in-out infinite',
                    }} />
                </div>
              </div>
            </div>

            <span className="text-[0.65rem] font-semibold text-white/55 group-hover:text-white/80 transition-colors duration-300"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.06em' }}>
              Aura
            </span>
          </div>
        </button>
      )}

      {isDev && (
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
      )}

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
