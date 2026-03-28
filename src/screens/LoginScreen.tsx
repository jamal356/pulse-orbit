import { useState, useEffect, useCallback, useRef } from 'react'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onComplete: () => void
}

/* ─── LOGIN / SIGNUP ──────────────────────────────────────
   Simulated phone-based auth flow for the demo.
   Phase 1: Enter phone number
   Phase 2: OTP verification (auto-fills for demo)
   Phase 3: Quick profile setup (name, photo, age)
   Phase 4: Brief welcome → navigate to Discover
   ──────────────────────────────────────────────────────────── */

type AuthPhase = 'phone' | 'otp' | 'profile' | 'welcome'

function createAuthSounds() {
  let ctx: AudioContext | null = null
  const getCtx = () => { if (!ctx) ctx = new AudioContext(); return ctx }
  return {
    tap() {
      try {
        const c = getCtx()
        const osc = c.createOscillator(); const gain = c.createGain()
        osc.type = 'sine'; osc.frequency.value = 900
        gain.gain.setValueAtTime(0.06, c.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
        osc.connect(gain).connect(c.destination)
        osc.start(c.currentTime); osc.stop(c.currentTime + 0.08)
      } catch { /* */ }
    },
    success() {
      try {
        const c = getCtx()
        ;[800, 1000, 1200].forEach((freq, i) => {
          const osc = c.createOscillator(); const gain = c.createGain()
          osc.type = 'sine'; osc.frequency.value = freq
          gain.gain.setValueAtTime(0, c.currentTime + i * 0.1)
          gain.gain.linearRampToValueAtTime(0.1, c.currentTime + i * 0.1 + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.4)
          osc.connect(gain).connect(c.destination)
          osc.start(c.currentTime + i * 0.1); osc.stop(c.currentTime + i * 0.1 + 0.4)
        })
      } catch { /* */ }
    },
    cleanup() { if (ctx) ctx.close().catch(() => {}) }
  }
}

const DEMO_PHONE = '+971 55 123 4567'
const DEMO_OTP = ['4', '8', '2', '7']

export default function LoginScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<AuthPhase>('phone')
  const [visible, setVisible] = useState(false)
  const [phone, setPhone] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', ''])
  const [otpFocusIndex, setOtpFocusIndex] = useState(0)
  const [verifying, setVerifying] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileAge, setProfileAge] = useState('')
  const [profileGender, setProfileGender] = useState<'male' | 'female' | null>(null)
  const soundRef = useRef(createAuthSounds())
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const autoFillTimer = useRef<number | null>(null)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    return () => {
      soundRef.current.cleanup()
      if (autoFillTimer.current) clearTimeout(autoFillTimer.current)
    }
  }, [])

  // Auto-fill phone for demo convenience
  useEffect(() => {
    if (phase === 'phone') {
      const timer = setTimeout(() => setPhone(DEMO_PHONE), 800)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Auto-fill OTP digits sequentially for demo
  useEffect(() => {
    if (phase !== 'otp') return
    let i = 0
    const fillNext = () => {
      if (i < 4) {
        setOtpDigits(prev => {
          const next = [...prev]
          next[i] = DEMO_OTP[i]
          return next
        })
        setOtpFocusIndex(Math.min(i + 1, 3))
        i++
        autoFillTimer.current = window.setTimeout(fillNext, 400)
      } else {
        // All filled → auto verify
        autoFillTimer.current = window.setTimeout(() => {
          setVerifying(true)
          setTimeout(() => {
            soundRef.current.success()
            setPhase('profile')
          }, 1200)
        }, 600)
      }
    }
    autoFillTimer.current = window.setTimeout(fillNext, 800)
    return () => { if (autoFillTimer.current) clearTimeout(autoFillTimer.current) }
  }, [phase])

  // Auto-fill profile for demo
  useEffect(() => {
    if (phase !== 'profile') return
    const timers = [
      setTimeout(() => setProfileName('Jamal'), 600),
      setTimeout(() => setProfileAge('32'), 1000),
      setTimeout(() => setProfileGender('male'), 1400),
      setTimeout(() => {
        soundRef.current.success()
        setPhase('welcome')
      }, 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [phase])

  // Welcome → navigate out
  useEffect(() => {
    if (phase !== 'welcome') return
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [phase, onComplete])

  const handlePhoneSubmit = useCallback(() => {
    soundRef.current.tap()
    setPhase('otp')
  }, [])

  // ── PHONE ENTRY ──
  if (phase === 'phone') {
    return (
      <div className="fixed inset-0 bg-[#FAF7F2] flex items-center justify-center overflow-hidden">
        <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center mb-10">
            <div className="flex justify-center mb-2">
              <PulseLogo variant="full" color="accent" size="lg" />
            </div>
            <p className="text-sm text-[#8A7E78]">Live speed dating. Real chemistry.</p>
          </div>

          <div className="glass-tile rounded-3xl p-6" style={{ border: '1px solid rgba(42,37,40,0.08)' }}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8A7E78] font-semibold mb-4 text-center">Sign in with your phone</p>

            <div className="relative mb-4">
              <div className="glass-button rounded-2xl px-4 py-4 flex items-center gap-3" style={{ background: 'rgba(42,37,40,0.03)' }}>
                <span className="text-lg">🇦🇪</span>
                <span className="text-[#2A2528] font-mono text-base tracking-wide">{phone || '+971 __ ___ ____'}</span>
                {!phone && <div className="w-0.5 h-5 bg-[#C83E88] animate-pulse" />}
              </div>
            </div>

            <button onClick={handlePhoneSubmit}
              disabled={!phone}
              className={`w-full py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all ${phone ? 'hover:scale-[1.02] active:scale-[0.98]' : 'opacity-40'}`}
              style={{ background: phone ? 'linear-gradient(135deg, #C83E88 0%, #B83278 100%)' : 'rgba(200,62,136,0.2)', boxShadow: phone ? '0 4px 20px rgba(200,62,136,0.35)' : 'none' }}>
              Send Code
            </button>

            <p className="text-center text-[0.6rem] text-[#8A7E78] mt-4 leading-relaxed">
              By continuing, you agree to Pulse's Terms of Service and Privacy Policy.
              Standard message rates may apply.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── OTP VERIFICATION ──
  if (phase === 'otp') {
    return (
      <div className="fixed inset-0 bg-[#FAF7F2] flex items-center justify-center overflow-hidden">
        <div className="relative z-10 w-full max-w-md mx-auto px-6 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(200,62,136,0.12)' }}>
              <span className="text-2xl">📱</span>
            </div>
            <h2 className="text-xl font-bold text-[#2A2528] mb-1">Verify your number</h2>
            <p className="text-sm text-[#8A7E78]">
              We sent a code to <span className="text-[#2A2528] font-mono">{phone}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            {otpDigits.map((digit, i) => (
              <div key={i}
                ref={el => { otpRefs.current[i] = el as unknown as HTMLInputElement }}
                className={`w-14 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono transition-all duration-300 ${
                  i === otpFocusIndex && !digit ? 'ring-2 ring-[#C83E88]' : ''
                } ${digit ? 'text-[#2A2528]' : 'text-[#8A7E78]'}`}
                style={{
                  background: digit ? 'rgba(200,62,136,0.10)' : 'rgba(42,37,40,0.03)',
                  border: `1.5px solid ${digit ? 'rgba(200,62,136,0.30)' : 'rgba(42,37,40,0.08)'}`,
                }}>
                {digit || '·'}
              </div>
            ))}
          </div>

          {verifying && (
            <div className="text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#C83E88] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-[#C83E88] animate-pulse" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 rounded-full bg-[#C83E88] animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-sm text-[#C83E88] font-semibold">Verifying...</p>
            </div>
          )}

          <p className="text-center text-xs text-[#8A7E78] mt-6">
            Didn't receive a code? <span className="text-[#C83E88]">Resend</span>
          </p>
        </div>
      </div>
    )
  }

  // ── PROFILE SETUP ──
  if (phase === 'profile') {
    return (
      <div className="fixed inset-0 bg-[#FAF7F2] flex items-center justify-center overflow-hidden">
        <div className="relative z-10 w-full max-w-md mx-auto px-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#2A2528] mb-1">Quick profile setup</h2>
            <p className="text-sm text-[#8A7E78]">Just the basics — we'll keep it simple</p>
          </div>

          <div className="glass-tile rounded-3xl p-6 space-y-4" style={{ border: '1px solid rgba(42,37,40,0.08)' }}>
            {/* Photo placeholder */}
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden"
                style={{ background: 'rgba(200,62,136,0.08)', border: '2px dashed rgba(200,62,136,0.25)' }}>
                {profileName ? (
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=3840&q=95" alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl">📷</span>
                )}
              </div>
            </div>

            {/* Name */}
            <div className={`glass-button rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-500 ${profileName ? 'ring-1 ring-[#C83E88]/30' : ''}`} style={{ background: 'rgba(42,37,40,0.03)' }}>
              <span className="text-sm text-[#8A7E78]">Name</span>
              <span className={`font-semibold flex-1 text-right transition-all duration-500 ${profileName ? 'text-[#2A2528]' : 'text-[#8A7E78]'}`}>
                {profileName || '—'}
              </span>
            </div>

            {/* Age */}
            <div className={`glass-button rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all duration-500 ${profileAge ? 'ring-1 ring-[#C83E88]/30' : ''}`} style={{ background: 'rgba(42,37,40,0.03)' }}>
              <span className="text-sm text-[#8A7E78]">Age</span>
              <span className={`font-semibold flex-1 text-right transition-all duration-500 ${profileAge ? 'text-[#2A2528]' : 'text-[#8A7E78]'}`}>
                {profileAge || '—'}
              </span>
            </div>

            {/* Gender */}
            <div className="flex gap-3">
              <div className={`flex-1 glass-button rounded-2xl py-3.5 text-center text-sm font-semibold transition-all duration-500 ${profileGender === 'male' ? 'ring-2 text-[#2DD4BF]' : 'text-[#8A7E78]'}`}
                style={{background: 'rgba(42,37,40,0.03)', ...( profileGender === 'male' ? { borderColor: '#2DD4BF', boxShadow: '0 0 15px rgba(45,212,191,0.2)' } : {})}}>
                Male
              </div>
              <div className={`flex-1 glass-button rounded-2xl py-3.5 text-center text-sm font-semibold transition-all duration-500 ${profileGender === 'female' ? 'ring-2 text-[#C83E88]' : 'text-[#8A7E78]'}`}
                style={{background: 'rgba(42,37,40,0.03)', ...(profileGender === 'female' ? { borderColor: '#C83E88', boxShadow: '0 0 15px rgba(200,62,136,0.2)' } : {})}}>
                Female
              </div>
            </div>

            {/* Filling indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${profileName ? 'bg-[#30D158]' : 'bg-[#7A7A80]/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${profileAge ? 'bg-[#30D158]' : 'bg-[#7A7A80]/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${profileGender ? 'bg-[#30D158]' : 'bg-[#7A7A80]/30'}`} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── WELCOME ──
  return (
    <div className="fixed inset-0 bg-[#FAF7F2] flex items-center justify-center overflow-hidden">
      <div className="relative z-10 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: 'rgba(48,209,88,0.12)', border: '2px solid rgba(48,209,88,0.30)' }}>
          <svg className="w-10 h-10 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#2A2528] mb-2 font-display" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Welcome to Pulse, {profileName}
        </h2>
        <p className="text-sm text-[#8A7E78] mb-2">Your profile is ready. Time to meet someone new.</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C83E88] animate-pulse" />
          <span className="text-xs text-[#C83E88]/70">Finding people near you...</span>
        </div>
      </div>
    </div>
  )
}
