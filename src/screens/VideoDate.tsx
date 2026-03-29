import { useState, useEffect, useRef, useCallback } from 'react'
import Peer from 'peerjs'
import type { MediaConnection, DataConnection } from 'peerjs'

/* ═══════════════════════════════════════════════════════════
   VIDEO DATE — Real WebRTC 1-on-1 Video
   ═══════════════════════════════════════════════════════════

   This is the real thing. Two people. Two cameras. One timer.

   Architecture:
   - PeerJS handles WebRTC signaling + STUN/TURN
   - Room codes: 6-char alphanumeric, shareable
   - Host creates room → gets code → shares it
   - Guest enters code → joins → video starts
   - 5-minute date timer → auto-ends → rate

   State machine:
   lobby → connecting → live → ended → rating
   ═══════════════════════════════════════════════════════════ */

const serif = "'Cormorant Garamond', Georgia, serif"
const sans = "'DM Sans', sans-serif"

const DATE_DURATION = 5 * 60 // 5 minutes in seconds

type Phase = 'lobby' | 'connecting' | 'live' | 'ended' | 'rating'
type Rating = 'like' | 'pass' | null

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface Props {
  onBack: () => void
}

export default function VideoDate({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DATE_DURATION)
  const [rating, setRating] = useState<Rating>(null)
  const [partnerRating, setPartnerRating] = useState<Rating>(null)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [partnerName, setPartnerName] = useState('')
  const [userName] = useState(() => localStorage.getItem('pulse-name') || '')
  const [nameInput, setNameInput] = useState('')
  const [copied, setCopied] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const callRef = useRef<MediaConnection | null>(null)
  const dataRef = useRef<DataConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Get camera ──
  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setCameraReady(true)
      return stream
    } catch {
      setError('Camera access denied. Please allow camera and microphone.')
      return null
    }
  }, [])

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      peerRef.current?.destroy()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── Timer ──
  useEffect(() => {
    if (phase === 'live') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setPhase('ended')
            // Send time-up signal to peer
            dataRef.current?.send({ type: 'time-up' })
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }
  }, [phase])

  // ── Setup data channel handlers ──
  const setupDataChannel = useCallback((conn: DataConnection) => {
    dataRef.current = conn
    conn.on('data', (data: unknown) => {
      const msg = data as { type: string; name?: string; rating?: Rating }
      if (msg.type === 'name') setPartnerName(msg.name || 'Someone')
      if (msg.type === 'time-up') {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeLeft(0)
        setPhase('ended')
      }
      if (msg.type === 'rating') setPartnerRating(msg.rating || null)
    })
    conn.on('open', () => {
      conn.send({ type: 'name', name: userName || nameInput })
    })
  }, [userName, nameInput])

  // ── Create room (host) ──
  const createRoom = useCallback(async () => {
    const stream = await getMedia()
    if (!stream) return

    const code = generateRoomCode()
    setRoomCode(code)
    setIsHost(true)
    setPhase('connecting')

    // PeerJS ID = room code (host)
    const peer = new Peer(`pulse-${code}`)
    peerRef.current = peer

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        setError('Room code already in use. Try again.')
        setPhase('lobby')
      } else {
        console.error('Peer error:', err)
      }
    })

    peer.on('open', () => {
      // Waiting for guest...
    })

    // Guest calls us
    peer.on('call', (call) => {
      callRef.current = call
      call.answer(stream)
      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setPhase('live')
      })
    })

    // Guest data channel
    peer.on('connection', (conn) => {
      setupDataChannel(conn)
    })

    // Save name
    if (nameInput) localStorage.setItem('pulse-name', nameInput)
  }, [getMedia, nameInput, setupDataChannel])

  // ── Join room (guest) ──
  const joinRoom = useCallback(async () => {
    if (joinCode.length !== 6) {
      setError('Enter a 6-character room code')
      return
    }

    const stream = await getMedia()
    if (!stream) return

    setPhase('connecting')

    const peer = new Peer()
    peerRef.current = peer

    peer.on('open', () => {
      // Call the host
      const call = peer.call(`pulse-${joinCode.toUpperCase()}`, stream)
      if (!call) {
        setError('Could not connect. Check the room code.')
        setPhase('lobby')
        return
      }
      callRef.current = call
      call.on('stream', (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setPhase('live')
      })
      call.on('error', () => {
        setError('Connection failed. The room may not exist.')
        setPhase('lobby')
      })

      // Data channel to host
      const conn = peer.connect(`pulse-${joinCode.toUpperCase()}`)
      setupDataChannel(conn)
    })

    peer.on('error', (err) => {
      console.error('Peer error:', err)
      setError('Connection failed. Check the room code and try again.')
      setPhase('lobby')
    })

    if (nameInput) localStorage.setItem('pulse-name', nameInput)
  }, [joinCode, getMedia, nameInput, setupDataChannel])

  // ── Send rating ──
  const submitRating = useCallback((r: Rating) => {
    setRating(r)
    dataRef.current?.send({ type: 'rating', rating: r })
  }, [])

  // ── Copy room code ──
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomCode])

  const isMatch = rating === 'like' && partnerRating === 'like'
  const bothRated = rating !== null && partnerRating !== null

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: '#1E1B18' }}>

      {/* ═══ LOBBY ═══ */}
      {phase === 'lobby' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-10">
              <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C83E88' }}>
                Live video date
              </p>
              <h1 className="mt-3" style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 300, fontStyle: 'italic', color: 'white', lineHeight: 1.2 }}>
                Real people. <span style={{ color: '#C83E88' }}>Real time.</span>
              </h1>
              <p className="mt-3" style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                5 minutes on camera. No filters, no delays, no games.
              </p>
            </div>

            {/* Name input */}
            <div className="mb-8">
              <label style={{ fontFamily: sans, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Your first name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full mt-2 px-4 py-3 rounded-xl text-white outline-none transition-all focus:ring-1 focus:ring-[#C83E88]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: sans, fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Two paths */}
            <div className="space-y-4">
              {/* Create room */}
              <button
                onClick={createRoom}
                disabled={!nameInput.trim()}
                className="w-full py-4 rounded-2xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100"
                style={{
                  background: nameInput.trim() ? 'linear-gradient(135deg, #C83E88, #A030D0)' : 'rgba(255,255,255,0.06)',
                  fontFamily: sans, fontSize: '1rem',
                  boxShadow: nameInput.trim() ? '0 4px 24px rgba(200,62,136,0.3)' : 'none',
                }}>
                Create a room
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontFamily: sans, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>or join one</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Join room */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ROOM CODE"
                  maxLength={6}
                  className="flex-1 px-4 py-3 rounded-xl text-white text-center outline-none tracking-[0.3em] transition-all focus:ring-1 focus:ring-[#C83E88]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600,
                  }}
                />
                <button
                  onClick={joinRoom}
                  disabled={joinCode.length !== 6 || !nameInput.trim()}
                  className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                  style={{
                    background: joinCode.length === 6 && nameInput.trim() ? 'rgba(200,62,136,0.2)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(200,62,136,0.3)',
                    fontFamily: sans,
                  }}>
                  Join
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-center" style={{ fontFamily: sans, fontSize: '0.8rem', color: '#FF6B6B' }}>
                {error}
              </p>
            )}

            {/* Back */}
            <button onClick={onBack} className="mt-8 w-full text-center transition-colors hover:text-white"
              style={{ fontFamily: sans, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              ← Back to home
            </button>
          </div>
        </div>
      )}

      {/* ═══ CONNECTING ═══ */}
      {phase === 'connecting' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            {/* Local video preview */}
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden mb-8"
              style={{ border: '2px solid rgba(200,62,136,0.3)', boxShadow: '0 0 40px rgba(200,62,136,0.15)' }}>
              <video ref={localVideoRef} autoPlay muted playsInline
                className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(30,27,24,0.8)' }}>
                  <div className="w-6 h-6 border-2 border-[#C83E88] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {isHost ? (
              <>
                <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C83E88' }}>
                  Your room code
                </p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <p style={{ fontFamily: 'monospace', fontSize: '2.5rem', fontWeight: 700, color: 'white', letterSpacing: '0.25em' }}>
                    {roomCode}
                  </p>
                  <button onClick={copyCode}
                    className="px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: copied ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)',
                      color: copied ? '#30D158' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${copied ? 'rgba(48,209,88,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      fontFamily: sans,
                    }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="mt-4" style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Share this code with your date.<br />
                  Waiting for them to join...
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#C83E88] border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              <>
                <p style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  Connecting to room...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#C83E88] border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ LIVE VIDEO DATE ═══ */}
      {(phase === 'live' || phase === 'ended') && (
        <div className="min-h-screen relative">
          {/* Remote video — full screen */}
          <video ref={remoteVideoRef} autoPlay playsInline
            className="absolute inset-0 w-full h-full object-cover" />

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />

          {/* Timer + partner name */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-6 pt-6 z-10">
            <div>
              {partnerName && (
                <p style={{ fontFamily: serif, fontSize: '1.2rem', fontWeight: 400, color: 'white' }}>
                  {partnerName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: timeLeft <= 60 ? 'rgba(255,59,48,0.2)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${timeLeft <= 60 ? 'rgba(255,59,48,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}>
              <div className={`w-2 h-2 rounded-full ${phase === 'live' ? 'animate-pulse' : ''}`}
                style={{ background: timeLeft <= 60 ? '#FF3B30' : '#30D158' }} />
              <span style={{
                fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600,
                color: timeLeft <= 60 ? '#FF3B30' : 'white',
              }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Local video — small PIP */}
          <div className="absolute bottom-24 right-4 z-10 w-28 h-40 rounded-2xl overflow-hidden"
            style={{
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
            <video ref={localVideoRef} autoPlay muted playsInline
              className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          </div>

          {/* End date button (during live) */}
          {phase === 'live' && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center z-10">
              <button
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current)
                  setPhase('ended')
                  dataRef.current?.send({ type: 'time-up' })
                }}
                className="px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,59,48,0.15)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,59,48,0.3)',
                  color: '#FF3B30',
                  fontFamily: sans, fontSize: '0.85rem', fontWeight: 600,
                }}>
                End date
              </button>
            </div>
          )}

          {/* Time's up overlay */}
          {phase === 'ended' && (
            <div className="absolute inset-0 flex items-center justify-center z-20"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
              <div className="text-center px-6">
                <p style={{ fontFamily: serif, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 300, fontStyle: 'italic', color: 'white' }}>
                  Time's up
                </p>
                <p className="mt-2" style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  {partnerName ? `How was your date with ${partnerName}?` : 'How was your date?'}
                </p>
                <div className="mt-8 flex gap-4 justify-center">
                  <button
                    onClick={() => { submitRating('pass'); setPhase('rating') }}
                    className="px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontFamily: sans, fontSize: '1rem', color: 'rgba(255,255,255,0.7)',
                    }}>
                    Pass
                  </button>
                  <button
                    onClick={() => { submitRating('like'); setPhase('rating') }}
                    className="px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #C83E88, #A030D0)',
                      boxShadow: '0 4px 24px rgba(200,62,136,0.3)',
                      fontFamily: sans, fontSize: '1rem', color: 'white', fontWeight: 600,
                    }}>
                    Like
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ RATING RESULTS ═══ */}
      {phase === 'rating' && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            {!bothRated ? (
              <>
                <div className="w-8 h-8 mx-auto border-2 border-[#C83E88] border-t-transparent rounded-full animate-spin" />
                <p className="mt-6" style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                  Waiting for {partnerName || 'your date'} to rate...
                </p>
                <p className="mt-2" style={{ fontFamily: sans, fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  You voted: <span style={{ color: rating === 'like' ? '#C83E88' : 'rgba(255,255,255,0.5)' }}>{rating === 'like' ? 'Like' : 'Pass'}</span>
                </p>
              </>
            ) : isMatch ? (
              <>
                <div className="text-6xl mb-6">✨</div>
                <h2 style={{ fontFamily: serif, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 300, fontStyle: 'italic', color: 'white' }}>
                  It's a <span style={{ color: '#C83E88' }}>match</span>
                </h2>
                <p className="mt-3" style={{ fontFamily: sans, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  You and {partnerName || 'your date'} both liked each other.
                </p>
                <button onClick={onBack} className="mt-10 px-10 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #C83E88, #A030D0)',
                    boxShadow: '0 4px 24px rgba(200,62,136,0.3)',
                    fontFamily: sans, fontSize: '1rem',
                  }}>
                  Back to home
                </button>
              </>
            ) : (
              <>
                <p style={{ fontFamily: serif, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
                  Not a match this time
                </p>
                <p className="mt-3" style={{ fontFamily: sans, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Every session is different. The next one could be the one.
                </p>
                <button onClick={onBack} className="mt-10 px-10 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: sans, fontSize: '1rem', color: 'rgba(255,255,255,0.7)',
                  }}>
                  Back to home
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
