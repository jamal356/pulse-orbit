import { useEffect, useState, useCallback, useRef } from 'react'
import { useLobby } from '../hooks/useLobby'
import { useVideo } from '../hooks/useVideo'
import { dark } from '../theme'
import BackgroundOrbs from '../components/BackgroundOrbs'
import PulseLogo from '../components/PulseLogo'
import { conversationStarters } from '../data/people'

interface Props {
  user: { id: string; display_name: string; photo_url: string | null }
  onNavigate: (screen: string, data?: unknown) => void
}

const COUNTDOWN_START = 30
const STARTERS_ROTATION = 10000

export default function Lobby({ user, onNavigate }: Props) {
  const { participants, count } = useLobby(user.id)
  const { localStream, startCamera, stopCamera } = useVideo()

  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [ready, setReady_local] = useState(false)
  const [currentStarter, setCurrentStarter] = useState(conversationStarters[0])
  const videoRef = useRef<HTMLVideoElement>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Request camera on mount
  useEffect(() => {
    const init = async () => {
      try {
        await startCamera()
        setCameraPermission('granted')
      } catch (err) {
        console.error('Camera access denied:', err)
        setCameraPermission('denied')
      }
    }
    init()

    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Set up local video preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Start countdown when 5+ people present
  useEffect(() => {
    if (count >= 5 && countdown === null) {
      setCountdown(COUNTDOWN_START)
    } else if (count < 5 && countdown !== null) {
      setCountdown(null)
    }
  }, [count, countdown])

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Check if enough people ready
          const readyCount = participants.filter((p) => p.joinedAt).length
          if (readyCount >= 4) {
            // Transition to session
            onNavigate('live-session', {
              sessionId: `session-${Date.now()}`,
              participants,
              rounds: 5,
            })
            return null
          } else {
            // Reset countdown
            return COUNTDOWN_START
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [countdown, participants, onNavigate])

  // Rotate conversation starters
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStarter(conversationStarters[Math.floor(Math.random() * conversationStarters.length)])
    }, STARTERS_ROTATION)
    return () => clearInterval(interval)
  }, [])

  const handleReady = useCallback(() => {
    setReady_local(true)
  }, [setReady_local])

  const handleRetryCamera = useCallback(async () => {
    try {
      await startCamera()
      setCameraPermission('granted')
    } catch (err) {
      console.error('Camera retry failed:', err)
    }
  }, [startCamera])

  const handleLeaveLobby = useCallback(() => {
    stopCamera()
    onNavigate('home')
  }, [stopCamera, onNavigate])

  if (cameraPermission === 'denied') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: dark.bg }}>
        <BackgroundOrbs />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: dark.accentSoft }}>
            <svg className="w-8 h-8" style={{ color: dark.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: dark.text }}>Camera access required</h2>
            <p className="text-sm mb-6" style={{ color: dark.textSoft }}>
              Pulse is a video dating platform. We need camera access to connect you with people.
            </p>
          </div>
          <button
            onClick={handleRetryCamera}
            className="w-full py-3 rounded-xl font-semibold transition-all active:scale-95"
            style={{ backgroundColor: dark.accent, color: 'white' }}
          >
            Grant Camera Access
          </button>
          <button
            onClick={handleLeaveLobby}
            className="w-full py-2.5 rounded-xl font-medium transition-all active:scale-95"
            style={{ backgroundColor: dark.surface, color: dark.textSoft }}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: dark.bg }}>
      <BackgroundOrbs />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: dark.border }}>
        <button
          onClick={handleLeaveLobby}
          className="text-sm font-medium transition-opacity hover:opacity-70 active:scale-95"
          style={{ color: dark.textSoft }}
        >
          ← Back
        </button>
        <div>
          <PulseLogo variant="symbol" color="white" size="sm" />
        </div>
        <div />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20">

        {/* Camera preview circle */}
        <div className="mb-8">
          <div
            className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 shadow-2xl"
            style={{ borderColor: dark.accent, boxShadow: `0 0 30px rgba(200,62,136,0.3)` }}
          >
            {localStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: dark.bgDeep }}>
                <svg className="w-12 h-12" style={{ color: dark.textFaint }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Participant count */}
        <div className="mb-6 text-center">
          <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: dark.text }}>
            {count}
            <span style={{ color: dark.textSoft, fontSize: '0.6em' }}> of 5</span>
          </div>
          <p style={{ color: dark.textSoft }}>people ready to connect</p>
        </div>

        {/* Participant avatars grid */}
        <div className="mb-8 w-full max-w-xs">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-full border-2 overflow-hidden flex items-center justify-center"
                style={{
                  borderColor: i < count ? dark.accent : dark.border,
                  backgroundColor: i < count ? dark.accentSoft : dark.surface,
                }}
              >
                {i < count && participants[i]?.photoUrl ? (
                  <img
                    src={participants[i].photoUrl}
                    alt={participants[i].displayName}
                    className="w-full h-full object-cover"
                  />
                ) : i < count ? (
                  <span className="text-xs font-medium text-center px-1" style={{ color: dark.textFaint }}>
                    {participants[i]?.displayName.split(' ')[0]}
                  </span>
                ) : (
                  <svg className="w-5 h-5" style={{ color: dark.textFaint }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Countdown */}
        {countdown !== null && (
          <div className="mb-8 text-center animate-pulse">
            <p className="text-sm mb-2" style={{ color: dark.textSoft }}>Session starts in</p>
            <div className="text-5xl font-bold" style={{ color: dark.accent }}>
              {countdown}
            </div>
          </div>
        )}

        {/* Conversation starter */}
        <div className="mb-8 w-full max-w-sm">
          <div
            className="rounded-2xl p-5 text-center border transition-all duration-700"
            style={{ borderColor: dark.accentBorder, backgroundColor: dark.surface }}
          >
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: dark.textFaint }}>Conversation starter</p>
            <p className="text-sm leading-relaxed" style={{ color: dark.text }}>
              {currentStarter}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="relative z-10 px-6 py-6 border-t" style={{ borderColor: dark.border }}>
        <button
          onClick={handleReady}
          disabled={ready || count < 5}
          className="w-full py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: ready || count < 5 ? dark.accentSoft : dark.accent,
            color: 'white',
          }}
        >
          {ready ? "You're Ready ✓" : "I'm Ready to Connect"}
        </button>
        <p className="text-xs mt-3 text-center" style={{ color: dark.textFaint }}>
          {count < 5
            ? `${5 - count} more people needed to start`
            : countdown !== null
              ? 'Confirm participation in the countdown'
              : 'Waiting for countdown...'}
        </p>
      </div>
    </div>
  )
}
