import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSession } from '../hooks/useSession'
import { useVideo } from '../hooks/useVideo'
import { useTimer } from '../hooks/useTimer'
import { dark } from '../theme'
import BackgroundOrbs from '../components/BackgroundOrbs'
import { conversationStarters } from '../data/people'
import { reportUser, blockUser, type Report } from '../lib/safety'
import { loadLiveSessionBundle, type LiveSessionBundle } from '../lib/session'
import {
  joinVideoChannel,
  leaveVideoChannel,
  broadcastPeerId,
  onPeerIdReceived,
  onSessionEvent,
  type PeerIdBroadcast,
} from '../lib/realtime'

type SessionPhase = 'intro' | 'live' | 'transition' | 'rating'

interface Props {
  user: { id: string; display_name: string; photo_url: string | null }
  /** Real session id from /api/session-create, or null for demo/dev mode. */
  sessionId: string | null
  onNavigate: (screen: string, data?: unknown) => void
}

const INTRO_DURATION = 5
const LIVE_DURATION = 300
const TRANSITION_DURATION = 30
const AD_SKIP_DELAY = 5
const EXTEND_WINDOW = 30
const DEMO_ROUND_COUNT = 9

/* ââ Demo interstitial ads (UAE brands) âââââââââââââââââââââââââââââââââ */
const DEMO_ADS = [
  { brand: 'Emirates NBD', tagline: 'Banking on your future', cta: 'Open an Account', gradient: 'linear-gradient(135deg, #0066b3 0%, #004080 100%)', icon: '\u{1F3E6}' },
  { brand: 'Careem', tagline: 'Your ride, your way', cta: 'Book a Ride', gradient: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', icon: '\u{1F697}' },
  { brand: 'noon', tagline: 'Shop what you love', cta: 'Shop Now', gradient: 'linear-gradient(135deg, #FEEE00 0%, #E6D500 100%)', icon: '\u{1F6CD}ï¸' },
  { brand: 'Talabat', tagline: 'Everything you crave, delivered', cta: 'Order Now', gradient: 'linear-gradient(135deg, #FF5A00 0%, #CC4800 100%)', icon: '\u{1F355}' },
  { brand: 'du', tagline: 'Letâs connect', cta: 'Explore Plans', gradient: 'linear-gradient(135deg, #00B5E2 0%, #0088AA 100%)', icon: '\u{1F4F1}' },
  { brand: 'Namshi', tagline: 'Fashion for everyone', cta: 'Shop Collection', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', icon: '\u{1F457}' },
  { brand: 'The Entertainer', tagline: 'Buy one get one free', cta: 'Get the App', gradient: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)', icon: '\u{1F389}' },
  { brand: 'Etisalat by e&', tagline: 'Together matters', cta: 'Learn More', gradient: 'linear-gradient(135deg, #469B3D 0%, #2E6B28 100%)', icon: '\u{1F4F6}' },
  { brand: 'Mumzworld', tagline: 'Everything for moms & babies', cta: 'Shop Deals', gradient: 'linear-gradient(135deg, #FF69B4 0%, #CC5590 100%)', icon: '\u{1F476}' },
]

export default function LiveSession({ user, sessionId, onNavigate }: Props) {
  const [bundle, setBundle] = useState<LiveSessionBundle | null>(null)
  const [bundleError, setBundleError] = useState<string | null>(null)
  const [bundleLoading, setBundleLoading] = useState<boolean>(!!sessionId)

  useEffect(() => {
    if (!sessionId) {
      setBundle(null)
      setBundleError(null)
      setBundleLoading(false)
      return
    }
    let cancelled = false
    setBundleLoading(true)
    setBundleError(null)
    loadLiveSessionBundle(sessionId, user.id)
      .then((b) => {
        if (cancelled) return
        setBundle(b)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('loadLiveSessionBundle failed:', err)
        setBundleError(err instanceof Error ? err.message : 'Could not load session')
      })
      .finally(() => {
        if (!cancelled) setBundleLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionId, user.id])

  const totalRounds = bundle ? Math.max(bundle.myRounds.length, 1) : DEMO_ROUND_COUNT
  const { sendSpark, requestExtend, sparks } = useSession(sessionId ?? 'demo-session', user.id)
  const {
    localStream,
    remoteStream,
    myPeerId,
    startCamera,
    stopCamera,
    connectToPeer,
    disconnect,
  } = useVideo()

  const [phase, setPhase] = useState<SessionPhase>('intro')
  const [currentRound, setCurrentRound] = useState(1)
  const [currentPartner, setCurrentPartner] = useState<{ id: string | null; name: string; photo: string } | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [userSparkSent, setUserSparkSent] = useState(false)
  const [userExtendRequested, setUserExtendRequested] = useState(false)
  const [isExtended, setIsExtended] = useState(false)
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false)
  const [emergencyTriggered, setEmergencyTriggered] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(conversationStarters[0])
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState<Report['reason'] | null>(null)

  /* ââ State for ads & questions ââââââââââââââââââââââââââââââââââââââââ */
  const [adCountdown, setAdCountdown] = useState(AD_SKIP_DELAY)
  const [adSkippable, setAdSkippable] = useState(false)
  const [adTimeRemaining, setAdTimeRemaining] = useState(TRANSITION_DURATION)
  const [questionVisible, setQuestionVisible] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  const currentRoundData = bundle ? bundle.myRounds[currentRound - 1] ?? null : null

  const handleRoundEnded = useCallback(() => {
    disconnect()
    setPhase('transition')
    setUserSparkSent(false)
    setUserExtendRequested(false)
    setIsExtended(false)
  }, [disconnect])

  const timerServerSync = useMemo(() => {
    if (phase !== 'live') return undefined
    if (!sessionId || !currentRoundData) return undefined
    return {
      sessionId,
      roundId: currentRoundData.id,
      onEnded: handleRoundEnded,
    }
  }, [phase, sessionId, currentRoundData, handleRoundEnded])

  const timer = useTimer(timerServerSync)

  // Initialize camera
  useEffect(() => {
    const init = async () => {
      try {
        await startCamera()
      } catch (err) {
        console.error('Camera init error:', err)
      }
    }
    init()
    return () => {
      stopCamera()
      disconnect()
    }
  }, [startCamera, stopCamera, disconnect])

  // Set up video refs
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  // Partner data
  useEffect(() => {
    if (currentRoundData) {
      setCurrentPartner({
        id: currentRoundData.partner.id,
        name: currentRoundData.partner.name,
        photo: currentRoundData.partner.photo || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1280&q=90',
      })
      return
    }
    if (bundleLoading) return
    const partners = ['Sofia', 'Layla', 'Amira', 'Nour', 'Yasmine', 'Dana', 'Hana', 'Mariam', 'Reem']
    const photos = [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1280&q=90',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1280&q=90',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1280&q=90',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=1280&q=90',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1280&q=90',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1280&q=90',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1280&q=90',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1280&q=90',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1280&q=90',
    ]
    setCurrentPartner({
      id: null,
      name: partners[(currentRound - 1) % partners.length] || 'Partner',
      photo: photos[(currentRound - 1) % photos.length] || photos[0],
    })
  }, [currentRound, currentRoundData, bundleLoading])

  // Round state machine
  useEffect(() => {
    if (phase === 'intro') {
      const timeout = setTimeout(() => {
        setPhase('live')
        if (!bundle) {
          timer.start(LIVE_DURATION)
        }
      }, INTRO_DURATION * 1000)
      return () => clearTimeout(timeout)
    }

    if (phase === 'live' && timer.seconds === 0 && timer.isRunning === false && !bundle) {
      disconnect()
      setPhase('transition')
      setUserSparkSent(false)
      setUserExtendRequested(false)
      setIsExtended(false)
    }
  }, [phase, timer.seconds, timer.isRunning, timer, disconnect, bundle])

  // Transition auto-advance (fallback if user doesn't skip ad)
  useEffect(() => {
    if (phase === 'transition') {
      const timeout = setTimeout(() => {
        if (currentRound >= totalRounds) {
          setPhase('rating')
          onNavigate('survey', {
            sessionId,
            rounds: bundle?.allRounds ?? [],
          })
        } else {
          setCurrentRound(currentRound + 1)
          setPhase('intro')
        }
      }, TRANSITION_DURATION * 1000)
      return () => clearTimeout(timeout)
    }
  }, [phase, currentRound, totalRounds, sessionId, bundle, onNavigate])

  /* ââ Ad countdown during transition ââââââââââââââââââââââââââââââââââ */
  useEffect(() => {
    if (phase !== 'transition') return
    setAdCountdown(AD_SKIP_DELAY)
    setAdSkippable(false)
    setAdTimeRemaining(TRANSITION_DURATION)
    const skipInterval = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          setAdSkippable(true)
          clearInterval(skipInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    const adInterval = setInterval(() => {
      setAdTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(adInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      clearInterval(skipInterval)
      clearInterval(adInterval)
    }
  }, [phase])

  // Video peer exchange
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    joinVideoChannel(sessionId).catch((err) => {
      if (!cancelled) console.error('joinVideoChannel failed:', err)
    })
    return () => {
      cancelled = true
      leaveVideoChannel().catch(() => {})
    }
  }, [sessionId])

  useEffect(() => {
    if (phase !== 'live' || !sessionId || !currentRoundData) return
    let unsub: (() => void) | undefined
    try {
      unsub = onSessionEvent('round_end', (evt: unknown) => {
        const e = evt as { round_id?: string } | null
        if (e?.round_id !== currentRoundData.id) return
        handleRoundEnded()
      })
    } catch (err) {
      console.error('round_end subscribe failed:', err)
    }
    return () => unsub?.()
  }, [phase, sessionId, currentRoundData, handleRoundEnded])

  useEffect(() => {
    if (
      phase !== 'live' ||
      !sessionId ||
      !currentRoundData ||
      !myPeerId
    ) {
      return
    }
    const partnerUserId = currentRoundData.partner.id
    const roundId = currentRoundData.id
    const initiator = user.id < partnerUserId
    let cancelled = false
    const broadcastTimers: ReturnType<typeof setTimeout>[] = []
    let unsub: (() => void) | undefined

    try {
      unsub = onPeerIdReceived((evt: PeerIdBroadcast) => {
        if (cancelled) return
        if (evt.roundId !== roundId) return
        if (evt.peerId === myPeerId) return
        if (evt.senderUserId === user.id) return
        if (evt.senderUserId !== partnerUserId) return
        if (!initiator) return
        try {
          connectToPeer(evt.peerId)
        } catch (err) {
          console.error('connectToPeer failed:', err)
        }
      })
    } catch (err) {
      console.error('onPeerIdReceived setup failed:', err)
    }

    const fire = () => {
      if (cancelled) return
      broadcastPeerId(roundId, myPeerId, user.id).catch((err) => {
        if (!cancelled) console.error('broadcastPeerId failed:', err)
      })
    }
    fire()
    broadcastTimers.push(setTimeout(fire, 1500))
    broadcastTimers.push(setTimeout(fire, 3000))

    return () => {
      cancelled = true
      broadcastTimers.forEach(clearTimeout)
      unsub?.()
    }
  }, [phase, sessionId, currentRoundData, myPeerId, user.id, connectToPeer])

  // Rotate conversation starters
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuestion(conversationStarters[Math.floor(Math.random() * conversationStarters.length)])
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  // Handle mutual spark
  useEffect(() => {
    if (userSparkSent && sparks.received && !sparks.mutual) {
      // Flash animation placeholder
    }
  }, [userSparkSent, sparks])

  const handleSpark = useCallback(() => {
    if (userSparkSent || phase !== 'live') return
    setUserSparkSent(true)
    sendSpark()
  }, [userSparkSent, phase, sendSpark])

  const handleExtend = useCallback(() => {
    if (userExtendRequested || phase !== 'live' || timer.seconds > EXTEND_WINDOW) return
    setUserExtendRequested(true)
    setIsExtended(true)
    if (sessionId && currentRoundData) {
      timer.extend().catch((err) => console.error('extend failed:', err))
    }
    requestExtend()
  }, [userExtendRequested, phase, timer, requestExtend, sessionId, currentRoundData])

  const handleReport = useCallback(async () => {
    if (!reportReason || !currentPartner || isSubmittingReport) return
    setIsSubmittingReport(true)
    setReportError(null)
    try {
      if (currentPartner.id && sessionId) {
        await reportUser(
          user.id,
          currentPartner.id,
          reportReason as Report['reason'],
          sessionId,
        )
        await blockUser(user.id, currentPartner.id).catch(() => {})
      } else {
        console.warn('Report skipped: partner id unavailable (demo mode)', {
          partner: currentPartner.name,
          reason: reportReason,
        })
      }
      setShowReport(false)
      setReportReason(null)
      disconnect()
      setPhase('transition')
    } catch (err) {
      console.error('Report submit failed:', err)
      setReportError('Could not submit report. Please try again.')
    } finally {
      setIsSubmittingReport(false)
    }
  }, [reportReason, currentPartner, isSubmittingReport, user.id, sessionId, disconnect])

  const handleEmergencyExit = useCallback(() => {
    setEmergencyTriggered(true)
    setTimeout(() => {
      stopCamera()
      disconnect()
      onNavigate('home')
    }, 1200)
  }, [stopCamera, disconnect, onNavigate])

  /* ââ New handlers ââââââââââââââââââââââââââââââââââââââââââââââââââââ */
  const handleNextQuestion = useCallback(() => {
    const idx = Math.floor(Math.random() * conversationStarters.length)
    setCurrentQuestion(conversationStarters[idx])
  }, [])

  const handleSkipAd = useCallback(() => {
    if (currentRound >= totalRounds) {
      setPhase('rating')
      onNavigate('survey', { sessionId, rounds: bundle?.allRounds ?? [] })
    } else {
      setCurrentRound((prev) => prev + 1)
      setPhase('intro')
    }
  }, [currentRound, totalRounds, onNavigate, sessionId, bundle])

  const timerMin = Math.floor(timer.seconds / 60)
  const timerSec = timer.seconds % 60
  const showExtendButton = timer.seconds <= EXTEND_WINDOW && timer.seconds > 0 && !isExtended && phase === 'live'

  /* ââââââââââââââââââââââ RENDER ââââââââââââââââââââââââââââââââââââ */

  if (emergencyTriggered) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,59,48,0.15)' }}>
            <svg className="w-8 h-8 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-white font-semibold mb-2">Session ended</p>
          <p className="text-sm text-white/50 max-w-xs">This date has been terminated. The interaction has been flagged for review.</p>
        </div>
      </div>
    )
  }

  if (bundleLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: dark.bg }}>
        <BackgroundOrbs />
        <div className="relative z-10 text-center px-6">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 animate-pulse" style={{ backgroundColor: dark.accentSoft }} />
          <p className="text-sm" style={{ color: dark.textSoft }}>Loading session...</p>
        </div>
      </div>
    )
  }

  if (bundleError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: dark.bg }}>
        <BackgroundOrbs />
        <div className="relative z-10 text-center px-6 max-w-sm">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,59,48,0.12)' }}>
            <svg className="w-7 h-7 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base font-semibold mb-2" style={{ color: dark.text }}>Couldn't start the session</p>
          <p className="text-sm mb-5" style={{ color: dark.textSoft }}>{bundleError}</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.text }}
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  /* ââ Transition phase: Full-screen interstitial ad âââââââââââââââââââ */
  if (phase === 'transition') {
    const ad = DEMO_ADS[(currentRound - 1) % DEMO_ADS.length]
    return (
      <div className="fixed inset-0 flex flex-col" style={{ background: ad.gradient, touchAction: 'manipulation' }}>
        {/* Ad badge */}
        <div className="absolute top-4 left-4 z-10">
          <div
            className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)' }}
          >
            Sponsored
          </div>
        </div>

        {/* Skip / countdown + visible ad timer */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Visible countdown timer */}
          <div
            className="rounded-full px-3 py-1.5 text-xs font-mono font-bold"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', minWidth: '44px', textAlign: 'center' }}
          >
            0:{String(adTimeRemaining).padStart(2, '0')}
          </div>
          {adSkippable ? (
            <button
              onClick={handleSkipAd}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', backdropFilter: 'blur(8px)', WebkitTapHighlightColor: 'transparent' }}
            >
              Skip Ad
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div
              className="rounded-full px-4 py-2 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.6)' }}
            >
              Skip in {adCountdown}s
            </div>
          )}
        </div>

        {/* Ad content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-6xl sm:text-7xl mb-4 sm:mb-6" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
            {ad.icon}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 text-center" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {ad.brand}
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 text-center max-w-sm">
            {ad.tagline}
          </p>
          <button
            className="px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 shadow-xl"
            style={{ backgroundColor: 'white', color: '#1a1a1a', WebkitTapHighlightColor: 'transparent' }}
          >
            {ad.cta}
          </button>
        </div>

        {/* Next round indicator */}
        <div className="px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {Array.from({ length: totalRounds }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all"
                style={{
                  width: i === currentRound ? '20px' : '8px',
                  backgroundColor: i < currentRound ? 'rgba(255,255,255,0.8)' : i === currentRound ? 'white' : 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
          <p className="text-xs text-white/50">
            {currentRound < totalRounds
              ? `Match ${currentRound + 1} of ${totalRounds} coming up`
              : 'Session complete â results incoming'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: dark.bg, touchAction: 'manipulation' }}>
      <BackgroundOrbs />

      {/* Mutual spark glow */}
      {sparks.mutual && (
        <div
          className="fixed inset-0 pointer-events-none z-40 transition-opacity duration-1000"
          style={{
            boxShadow: 'inset 0 0 80px rgba(200,62,136,0.35), inset 0 0 200px rgba(200,62,136,0.15)',
          }}
        />
      )}

      {/* Mutual spark celebration */}
      {sparks.mutual && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="text-center animate-scale-in">
            <div className="text-6xl mb-2" style={{ animation: 'spark-pulse 0.8s ease-in-out infinite' }}>{'â¨'}</div>
            <p className="text-sm font-semibold tracking-wide" style={{ color: dark.accent, textShadow: '0 0 20px rgba(200,62,136,0.5)' }}>
              Mutual Spark!
            </p>
          </div>
        </div>
      )}

      {/* Emergency exit confirm modal */}
      {showEmergencyConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-3xl p-6 max-w-sm mx-4 w-full animate-scale-in border"
            style={{ backgroundColor: dark.bgDeep, borderColor: dark.border, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(255,59,48,0.15)' }}>
                <svg className="w-7 h-7 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: dark.text }}>End this date immediately?</h3>
              <p className="text-sm leading-relaxed" style={{ color: dark.textSoft }}>
                This will disconnect instantly. The interaction will be flagged and reviewed by our safety team.
              </p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handleEmergencyExit}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                style={{ backgroundColor: '#FF3B30', WebkitTapHighlightColor: 'transparent' }}
              >
                End Date Now
              </button>
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.textSoft, WebkitTapHighlightColor: 'transparent' }}
              >
                Cancel
              </button>
            </div>
            <p className="text-[0.65rem] text-center mt-4" style={{ color: dark.textFaint }}>
              Your safety is our priority. All reports are confidential.
            </p>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-3xl p-6 max-w-sm mx-4 w-full animate-scale-in border"
            style={{ backgroundColor: dark.bgDeep, borderColor: dark.border }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: dark.text }}>Report this person</h3>
            <div className="space-y-2 mb-6">
              {([
                { value: 'inappropriate', label: 'Inappropriate behavior' },
                { value: 'harassment', label: 'Harassment' },
                { value: 'fake_profile', label: 'Fake profile' },
                { value: 'underage', label: 'Appears underage' },
                { value: 'spam', label: 'Spam' },
                { value: 'other', label: 'Other' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setReportReason(value)}
                  className="w-full p-3 rounded-lg text-left text-sm transition-all border"
                  style={{
                    backgroundColor: reportReason === value ? dark.accentSoft : dark.surface,
                    borderColor: reportReason === value ? dark.accent : dark.border,
                    color: dark.text,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {reportError && (
              <p className="text-xs mb-3 text-center" style={{ color: '#FF3B30' }}>
                {reportError}
              </p>
            )}

            <div className="space-y-2.5">
              <button
                onClick={handleReport}
                disabled={!reportReason || isSubmittingReport}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-50"
                style={{ backgroundColor: '#FF3B30', WebkitTapHighlightColor: 'transparent' }}
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowReport(false)
                  setReportReason(null)
                  setReportError(null)
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.textSoft, WebkitTapHighlightColor: 'transparent' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main video area */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">

        {/* Remote video (full screen) */}
        <div className="flex-1 relative overflow-hidden min-h-0" style={{ backgroundColor: dark.bgDeep }}>
          {currentPartner ? (
            <>
              {/* Blurred backdrop */}
              <img
                src={currentPartner.photo}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ filter: 'blur(40px) brightness(0.5) saturate(0.8)', transform: 'scale(1.15)' }}
              />
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="relative w-full h-full object-contain bg-black pointer-events-none"
                />
              ) : (
                <img
                  src={currentPartner.photo}
                  alt={currentPartner.name}
                  className="relative w-full h-full object-contain pointer-events-none"
                />
              )}
            </>
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: dark.bgDeep }} />
          )}

          {/* Top bar: round info + extend + safety */}
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className="rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.text }}
              >
                Round {currentRound}/{totalRounds}
              </div>
              {isExtended && (
                <div style={{ backgroundColor: dark.accentSoft, color: dark.accent }} className="rounded-full px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold animate-scale-in">
                  +2 min
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {showExtendButton && (
                <button
                  onClick={handleExtend}
                  disabled={userExtendRequested}
                  className="group flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 transition-all active:scale-95 border"
                  style={{
                    backgroundColor: userExtendRequested ? dark.accentSoft : dark.surface,
                    borderColor: userExtendRequested ? dark.accent : dark.border,
                    color: userExtendRequested ? dark.accent : dark.textSoft,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span className="text-sm sm:text-base">{'â'}</span>
                  <span className="text-[0.65rem] sm:text-[0.7rem] font-semibold">{userExtendRequested ? 'Waiting...' : '+2 min'}</span>
                </button>
              )}

              {/* Safety button */}
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="group flex items-center gap-1 sm:gap-1.5 rounded-full px-3 sm:px-3.5 py-2 transition-all active:scale-95 border"
                style={{
                  backgroundColor: 'rgba(255,59,48,0.12)',
                  borderColor: 'rgba(255,59,48,0.35)',
                  boxShadow: '0 0 12px rgba(255,59,48,0.15)',
                  WebkitTapHighlightColor: 'transparent',
                }}
                title="Safety"
              >
                <svg className="w-4 h-4 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Intro phase message */}
          {phase === 'intro' && currentPartner && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="text-center animate-fade-in px-4">
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Round {currentRound} of {totalRounds}</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  Meeting {currentPartner.name}
                </h2>
              </div>
            </div>
          )}

          {/* Partner info card (bottom left, above control bar on mobile) */}
          {phase === 'live' && currentPartner && (
            <div className="absolute bottom-2 left-3 sm:bottom-4 sm:left-4 z-20 animate-slide-up">
              <div
                className="rounded-2xl px-3 sm:px-4 py-2 sm:py-3 max-w-[220px] sm:max-w-[280px] backdrop-blur-xl border"
                style={{ backgroundColor: `${dark.surface}90`, borderColor: dark.border }}
              >
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <img
                    src={currentPartner.photo}
                    alt={currentPartner.name}
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 2px rgba(200,62,136,0.3)' }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm truncate" style={{ color: dark.text }}>{currentPartner.name}</p>
                    <p className="text-[0.6rem] sm:text-[0.7rem]" style={{ color: dark.textSoft }}>Connecting...</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse bg-[#30D158]" />
                    <span className="text-[0.55rem] sm:text-[0.65rem]" style={{ color: '#30D158' }}>Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation starter (icebreaker, interactive) */}
          {phase === 'live' && questionVisible && currentQuestion && (
            <div className="absolute bottom-14 sm:bottom-20 left-3 right-[100px] sm:left-4 sm:right-[170px] z-20 animate-slide-up">
              <div
                className="rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-xl border"
                style={{ backgroundColor: `${dark.surface}E6`, borderColor: dark.accentBorder }}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.6rem] sm:text-[0.65rem] uppercase tracking-[0.15em] mb-0.5 sm:mb-1 font-medium" style={{ color: dark.accent }}>
                      Icebreaker
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: dark.text }}>
                      {currentQuestion}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 sm:gap-1.5 shrink-0">
                    <button
                      onClick={handleNextQuestion}
                      className="rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-all active:scale-90 border"
                      style={{ backgroundColor: dark.accentSoft, borderColor: dark.accent, WebkitTapHighlightColor: 'transparent' }}
                      title="Next question"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: dark.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setQuestionVisible(false)}
                      className="rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-all active:scale-90"
                      style={{ backgroundColor: `${dark.surface}80`, WebkitTapHighlightColor: 'transparent' }}
                      title="Hide questions"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: dark.textFaint }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Local video PiP (bottom right) */}
          <div
            className="absolute bottom-2 right-3 sm:bottom-4 sm:right-4 z-20 w-[80px] h-[110px] sm:w-[110px] sm:h-[150px] md:w-[140px] md:h-[190px] overflow-hidden rounded-2xl shadow-2xl border-[3px] sm:border-4"
            style={{ borderColor: 'rgba(45,212,191,0.5)', boxShadow: '0 0 15px rgba(45,212,191,0.2), 0 8px 32px rgba(0,0,0,0.4)' }}
          >
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: dark.bgDeep }}>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-1.5 animate-pulse" style={{ color: dark.textFaint }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-[8px] sm:text-[9px]" style={{ color: dark.textFaint }}>Starting...</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-medium" style={{ backgroundColor: 'rgba(45,212,191,0.15)', color: '#2DD4BF' }}>
              You
            </div>
          </div>
        </div>

        {/* Control bar (bottom) */}
        <div
          className="relative z-30 px-3 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-3 border-t"
          style={{ backgroundColor: dark.surface, borderColor: dark.border, paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
        >
          {/* Timer */}
          <div
            className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 border"
            style={{
              backgroundColor: timer.seconds <= 30 && !isExtended ? 'rgba(255,159,10,0.15)' : dark.surface,
              borderColor: timer.seconds <= 30 && !isExtended ? 'rgba(255,159,10,0.3)' : dark.border,
            }}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${timer.seconds <= 30 && !isExtended ? 'bg-[#FF9F0A]' : ''}`}
              style={{ backgroundColor: timer.seconds <= 30 && !isExtended ? '#FF9F0A' : dark.accent }}
            />
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: timer.seconds <= 30 && !isExtended ? '#FF9F0A' : dark.accent }}
            >
              {String(timerMin).padStart(2, '0')}:{String(timerSec).padStart(2, '0')}
            </span>
          </div>

          {/* Spark button */}
          <button
            onClick={handleSpark}
            disabled={userSparkSent || phase !== 'live'}
            className="shrink-0 relative transition-all duration-300 active:scale-90"
            style={{
              opacity: userSparkSent || phase !== 'live' ? 0.6 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
            title="Send a spark"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border"
              style={{
                backgroundColor: sparks.mutual ? dark.accentSoft : dark.surface,
                borderColor: sparks.mutual ? dark.accent : dark.border,
                boxShadow: sparks.mutual ? '0 0 20px rgba(200,62,136,0.4)' : undefined,
              }}
            >
              <span className="text-lg" style={{ animation: sparks.mutual ? 'spark-pulse 0.8s ease-in-out infinite' : undefined }}>
                {sparks.mutual ? '\u{1F496}' : 'â¨'}
              </span>
            </div>
          </button>

          {/* Question toggle button */}
          <button
            onClick={() => setQuestionVisible(!questionVisible)}
            className="shrink-0 transition-all active:scale-90"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title={questionVisible ? 'Hide icebreaker' : 'Show icebreaker'}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center border"
              style={{
                backgroundColor: questionVisible ? dark.accentSoft : dark.surface,
                borderColor: questionVisible ? dark.accent : dark.border,
              }}
            >
              <svg className="w-5 h-5" style={{ color: questionVisible ? dark.accent : dark.textSoft }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </button>

          {/* Report button */}
          <button
            onClick={() => setShowReport(true)}
            className="shrink-0 relative transition-all active:scale-90 ml-auto"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title="Report this person"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border"
              style={{
                backgroundColor: 'rgba(255,59,48,0.08)',
                borderColor: 'rgba(255,59,48,0.25)',
              }}
            >
              <svg className="w-4 h-4 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spark-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  )
}
