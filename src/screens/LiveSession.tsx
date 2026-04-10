import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from '../hooks/useSession'
import { useVideo } from '../hooks/useVideo'
import { useTimer } from '../hooks/useTimer'
import { dark } from '../theme'
import BackgroundOrbs from '../components/BackgroundOrbs'
import { conversationStarters } from '../data/people'
import { reportUser, blockUser, type Report } from '../lib/safety'

type SessionPhase = 'intro' | 'live' | 'transition' | 'rating'

interface Props {
  user: { id: string; display_name: string; photo_url: string | null }
  sessionData: {
    sessionId: string
    participants: Array<{ userId: string; displayName: string; photoUrl: string | null }>
    rounds: number
  }
  onNavigate: (screen: string, data?: unknown) => void
}

const INTRO_DURATION = 5
const LIVE_DURATION = 300
const TRANSITION_DURATION = 15
const EXTEND_WINDOW = 30

export default function LiveSession({ user, sessionData, onNavigate }: Props) {
  const { sendSpark, requestExtend, sparks } = useSession(sessionData.sessionId, user.id)
  const { localStream, remoteStream, startCamera, stopCamera, disconnect } = useVideo()
  const timer = useTimer()

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

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

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

  // Partner data — prefer real session participants; fall back to demo stub when empty
  useEffect(() => {
    const real = sessionData.participants?.[currentRound - 1]
    if (real) {
      setCurrentPartner({
        id: real.userId,
        name: real.displayName,
        photo: real.photoUrl || '',
      })
      return
    }
    const partners = ['Sofia', 'Layla', 'Amira', 'Nour', 'Yasmine']
    const photos = [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1280&q=90',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1280&q=90',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1280&q=90',
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=1280&q=90',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1280&q=90',
    ]
    setCurrentPartner({
      id: null,
      name: partners[currentRound - 1] || 'Partner',
      photo: photos[currentRound - 1] || photos[0],
    })
  }, [currentRound, sessionData.participants])

  // Round state machine
  useEffect(() => {
    if (phase === 'intro') {
      const timeout = setTimeout(() => {
        setPhase('live')
        timer.start(LIVE_DURATION)
      }, INTRO_DURATION * 1000)
      return () => clearTimeout(timeout)
    }

    if (phase === 'live' && timer.seconds === 0) {
      disconnect()
      setPhase('transition')
      setUserSparkSent(false)
      setUserExtendRequested(false)
      setIsExtended(false)
    }
  }, [phase, timer.seconds, disconnect, timer])

  useEffect(() => {
    if (phase === 'transition') {
      const timeout = setTimeout(() => {
        if (currentRound >= sessionData.rounds) {
          setPhase('rating')
          onNavigate('match-survey', { sessionId: sessionData.sessionId })
        } else {
          setCurrentRound(currentRound + 1)
          setPhase('intro')
        }
      }, TRANSITION_DURATION * 1000)
      return () => clearTimeout(timeout)
    }
  }, [phase, currentRound, sessionData, onNavigate])

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
      // Flash animation would be here
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
    requestExtend()
  }, [userExtendRequested, phase, timer.seconds, requestExtend])

  const handleReport = useCallback(async () => {
    if (!reportReason || !currentPartner || isSubmittingReport) return
    setIsSubmittingReport(true)
    setReportError(null)
    try {
      if (currentPartner.id) {
        await reportUser(
          user.id,
          currentPartner.id,
          reportReason as Report['reason'],
          sessionData.sessionId,
        )
        // Block so round-robin pairing never rejoins this partner
        await blockUser(user.id, currentPartner.id).catch(() => {})
      } else {
        // Demo / no-backend mode — no real user id to report against
        console.warn('Report skipped: partner id unavailable (demo mode)', {
          partner: currentPartner.name,
          reason: reportReason,
        })
      }
      setShowReport(false)
      setReportReason(null)
      // Separate reporter from reported: end round immediately
      disconnect()
      setPhase('transition')
    } catch (err) {
      console.error('Report submit failed:', err)
      setReportError('Could not submit report. Please try again.')
    } finally {
      setIsSubmittingReport(false)
    }
  }, [reportReason, currentPartner, isSubmittingReport, user.id, sessionData.sessionId, disconnect])

  const handleEmergencyExit = useCallback(() => {
    setEmergencyTriggered(true)
    setTimeout(() => {
      stopCamera()
      disconnect()
      onNavigate('home')
    }, 1200)
  }, [stopCamera, disconnect, onNavigate])

  const minutes = Math.floor(timer.seconds / 60)
  const seconds = timer.seconds % 60
  const showExtendButton = timer.seconds <= EXTEND_WINDOW && timer.seconds > 0 && !isExtended && phase === 'live'

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

  if (phase === 'transition') {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: dark.bg }}>
        <BackgroundOrbs />
        <div className="relative z-10 text-center px-6">
          <div className="text-sm mb-4" style={{ color: dark.textSoft }}>Next up</div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-6" style={{ color: dark.text }}>
            {currentRound < sessionData.rounds
              ? `Match ${currentRound + 1}`
              : 'Session Complete'}
          </h1>
          <div className="inline-flex items-center gap-2" style={{ color: dark.textFaint }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dark.accent }} />
            <span className="text-sm">{TRANSITION_DURATION}s</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: dark.bg }}>
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
            <div className="text-6xl mb-2" style={{ animation: 'spark-pulse 0.8s ease-in-out infinite' }}>✨</div>
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
                style={{ backgroundColor: '#FF3B30' }}
              >
                End Date Now
              </button>
              <button
                onClick={() => setShowEmergencyConfirm(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.textSoft }}
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
                style={{ backgroundColor: '#FF3B30' }}
              >
                {isSubmittingReport ? 'Submitting…' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowReport(false)
                  setReportReason(null)
                  setReportError(null)
                }}
                className="w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.textSoft }}
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
        <div className="flex-1 relative" style={{ backgroundColor: dark.bgDeep }}>
          {currentPartner ? (
            <>
              {/* Blurred backdrop to fill wide/tall viewports without awkward crop */}
              <img
                src={currentPartner.photo}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: 'blur(40px) brightness(0.5) saturate(0.8)', transform: 'scale(1.15)' }}
              />
              {/* Foreground photo — always fully visible */}
              <img
                src={currentPartner.photo}
                alt={currentPartner.name}
                className="relative w-full h-full object-contain"
              />
            </>
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: dark.bgDeep }} />
          )}

          {/* Top bar: round info + extend + safety */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="rounded-full px-4 py-1.5 text-xs font-semibold border"
                style={{ backgroundColor: dark.surface, borderColor: dark.border, color: dark.text }}
              >
                Round {currentRound} of {sessionData.rounds}
              </div>
              {isExtended && (
                <div style={{ backgroundColor: dark.accentSoft, color: dark.accent }} className="rounded-full px-3 py-1.5 text-xs font-semibold animate-scale-in">
                  +2 min
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {showExtendButton && (
                <button
                  onClick={handleExtend}
                  disabled={userExtendRequested}
                  className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all active:scale-95 border"
                  style={{
                    backgroundColor: userExtendRequested ? dark.accentSoft : dark.surface,
                    borderColor: userExtendRequested ? dark.accent : dark.border,
                    color: userExtendRequested ? dark.accent : dark.textSoft,
                  }}
                >
                  <span className="text-base">⏳</span>
                  <span className="text-[0.7rem] font-semibold">{userExtendRequested ? 'Waiting...' : '+2 min'}</span>
                </button>
              )}

              {/* Safety button */}
              <button
                onClick={() => setShowEmergencyConfirm(true)}
                className="group flex items-center gap-1.5 rounded-full px-3.5 py-2 transition-all active:scale-95 border"
                style={{
                  backgroundColor: 'rgba(255,59,48,0.12)',
                  borderColor: 'rgba(255,59,48,0.35)',
                  boxShadow: '0 0 12px rgba(255,59,48,0.15)',
                }}
                title="Safety — emergency exit"
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
              <div className="text-center animate-fade-in">
                <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Round {currentRound} of {sessionData.rounds}</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Meeting {currentPartner.name}
                </h2>
              </div>
            </div>
          )}

          {/* Partner info card (bottom left) */}
          {phase === 'live' && currentPartner && (
            <div className="absolute bottom-4 left-4 z-20 animate-slide-up">
              <div
                className="rounded-2xl px-4 py-3 max-w-[280px] backdrop-blur-xl border"
                style={{ backgroundColor: `${dark.surface}90`, borderColor: dark.border }}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <img
                    src={currentPartner.photo}
                    alt={currentPartner.name}
                    className="w-9 h-9 rounded-full object-cover"
                    style={{ boxShadow: 'inset 0 0 0 2px rgba(200,62,136,0.3)' }}
                  />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: dark.text }}>{currentPartner.name}</p>
                    <p className="text-[0.7rem]" style={{ color: dark.textSoft }}>Connecting...</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-[#30D158]" />
                    <span className="text-[0.65rem]" style={{ color: '#30D158' }}>Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Conversation starter (center) */}
          {phase === 'live' && currentQuestion && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[90%] max-w-xl animate-scale-in">
              <div
                className="rounded-2xl px-6 py-4 text-center backdrop-blur-xl border"
                style={{ backgroundColor: `${dark.surface}90`, borderColor: dark.border }}
              >
                <p className="text-[0.7rem] uppercase tracking-[0.2em] mb-1.5 font-medium" style={{ color: dark.textFaint }}>
                  Conversation starter
                </p>
                <p className="text-base md:text-lg font-medium leading-relaxed" style={{ color: dark.text }}>
                  {currentQuestion}
                </p>
              </div>
            </div>
          )}

          {/* Local video PiP (bottom right) */}
          <div
            className="absolute bottom-4 right-4 z-20 w-[100px] h-[140px] md:w-[130px] md:h-[180px] overflow-hidden rounded-2xl shadow-2xl border-4"
            style={{ borderColor: 'rgba(45,212,191,0.5)', boxShadow: '0 0 15px rgba(45,212,191,0.2), 0 8px 32px rgba(0,0,0,0.4)' }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ backgroundColor: 'rgba(45,212,191,0.15)', color: '#2DD4BF' }}>
              You
            </div>
          </div>
        </div>

        {/* Control bar (bottom) */}
        <div
          className="relative z-20 px-3 py-2 md:py-3 flex items-center gap-2 md:gap-3 border-t"
          style={{ backgroundColor: dark.surface, borderColor: dark.border }}
        >

          {/* Timer */}
          <div
            className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 border"
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
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Spark button */}
          <button
            onClick={handleSpark}
            disabled={userSparkSent || phase !== 'live'}
            className="shrink-0 relative transition-all duration-300 active:scale-90"
            style={{
              opacity: userSparkSent || phase !== 'live' ? 0.6 : 1,
            }}
            title="Send a spark"
          >
            <div
              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 border"
              style={{
                backgroundColor: sparks.mutual ? dark.accentSoft : dark.surface,
                borderColor: sparks.mutual ? dark.accent : dark.border,
                boxShadow: sparks.mutual ? `0 0 20px rgba(200,62,136,0.4)` : undefined,
              }}
            >
              <span className="text-lg" style={{ animation: sparks.mutual ? 'spark-pulse 0.8s ease-in-out infinite' : undefined }}>
                {sparks.mutual ? '💖' : '✨'}
              </span>
            </div>
          </button>

          {/* Report button */}
          <button
            onClick={() => setShowReport(true)}
            className="shrink-0 relative transition-all active:scale-90 ml-auto"
            title="Report this person"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border"
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
