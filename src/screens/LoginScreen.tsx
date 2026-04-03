import { useState, useEffect, useRef } from 'react'
import PulseLogo from '../components/PulseLogo'
import { dark } from '../theme'
import * as authLib from '../lib/auth'

interface Props {
  onNavigate: (screen: string) => void
}

type AuthMode = 'sign_in' | 'sign_up'
type AuthStep = 'credentials' | 'otp'

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isValidPhone = (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\D/g, ''))
const isValidPassword = (pw: string) => pw.length >= 8

export default function LoginScreen({ onNavigate }: Props) {
  const [mode, setMode] = useState<AuthMode>('sign_in')
  const [step, setStep] = useState<AuthStep>('credentials')
  const [usePhone, setUsePhone] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  const handleSignUpEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) { setError('Invalid email'); return }
    if (!isValidPassword(password)) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')
    try {
      await authLib.signUp(email, password)
      onNavigate('profile-setup')
    } catch (err: any) {
      setError(err.message || 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignInEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidEmail(email)) { setError('Invalid email'); return }
    if (!password) { setError('Enter your password'); return }

    setLoading(true)
    setError('')
    try {
      const data = await authLib.signIn(email, password)
      const { data: profile } = await (await import('../lib/supabase')).supabase?.from('users').select('*').eq('id', data.user.id).single() || {}
      onNavigate(profile ? 'home' : 'profile-setup')
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(phone)) { setError('Invalid phone number'); return }

    setLoading(true)
    setError('')
    try {
      await authLib.signInWithOtp(phone)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otpCode.join('')
    if (code.length !== 6) { setError('Enter all 6 digits'); return }

    setOtpLoading(true)
    setError('')
    try {
      const data = await authLib.verifyOtp(phone, code)
      if (!data.user) { setError('Authentication failed'); return }
      const { data: profile } = await (await import('../lib/supabase')).supabase?.from('users').select('*').eq('id', data.user.id).single() || {}
      onNavigate(profile ? 'home' : 'profile-setup')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otpCode]
    newOtp[index] = value
    setOtpCode(newOtp)

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  if (step === 'otp') {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: dark.bg }}>
        <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <PulseLogo variant="full" color="white" size="lg" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: dark.text, fontFamily: "'Cormorant Garamond', serif" }}>Verify your code</h2>
            <p style={{ color: dark.textSoft, fontSize: '0.875rem' }}>We sent a 6-digit code to {phone}</p>
          </div>

          <form onSubmit={handleOTPSubmit} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(i, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl transition-all"
                  style={{
                    background: dark.surface,
                    border: `2px solid ${digit ? dark.accentBorder : dark.border}`,
                    color: dark.text,
                  }}
                />
              ))}
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={otpLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: otpLoading ? 'rgba(200,62,136,0.3)' : dark.accent,
                opacity: otpLoading ? 0.6 : 1,
              }}>
              {otpLoading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setError('') }}
              className="w-full py-3 text-sm font-medium rounded-xl transition-all"
              style={{ background: dark.surface, color: dark.text }}>
              Back
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (usePhone && step === 'credentials') {
    return (
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: dark.bg }}>
        <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <PulseLogo variant="full" color="white" size="lg" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: dark.text, fontFamily: "'Cormorant Garamond', serif" }}>Sign in with phone</h2>
          </div>

          <form onSubmit={handlePhoneOTP} className="space-y-4">
            <div>
              <input
                type="tel"
                placeholder="+971 XX XXX XXXX"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError('') }}
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{
                  background: dark.surface,
                  border: `2px solid ${phone ? dark.accentBorder : dark.border}`,
                  color: dark.text,
                }}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: loading ? 'rgba(200,62,136,0.3)' : dark.accent,
                opacity: loading || !phone ? 0.6 : 1,
              }}>
              {loading ? 'Sending...' : 'Send Code'}
            </button>

            <button
              type="button"
              onClick={() => { setUsePhone(false); setError('') }}
              className="w-full py-3 text-sm font-medium rounded-xl transition-all"
              style={{ background: dark.surface, color: dark.text }}>
              Use email instead
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: dark.bg }}>
      <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PulseLogo variant="full" color="white" size="lg" />
          </div>
          <p className="text-sm" style={{ color: dark.textSoft }}>Live speed dating. Real chemistry.</p>
        </div>

        <form onSubmit={mode === 'sign_up' ? handleSignUpEmail : handleSignInEmail} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{
                background: dark.surface,
                border: `2px solid ${email ? dark.accentBorder : dark.border}`,
                color: dark.text,
              }}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full px-4 py-3 rounded-xl transition-all"
              style={{
                background: dark.surface,
                border: `2px solid ${password ? dark.accentBorder : dark.border}`,
                color: dark.text,
              }}
            />
          </div>

          {mode === 'sign_up' && (
            <div>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{
                  background: dark.surface,
                  border: `2px solid ${confirmPassword ? dark.accentBorder : dark.border}`,
                  color: dark.text,
                }}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all"
            style={{
              background: loading ? 'rgba(200,62,136,0.3)' : dark.accent,
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Loading...' : mode === 'sign_up' ? 'Sign Up' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => { setUsePhone(true); setError('') }}
            className="w-full py-3 text-sm font-medium rounded-xl transition-all"
            style={{ background: dark.surface, color: dark.text }}>
            Use phone instead
          </button>

          <div className="text-center pt-2">
            <p className="text-xs" style={{ color: dark.textSoft }}>
              {mode === 'sign_in' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setEmail(''); setPassword(''); setConfirmPassword('') }}
                className="font-semibold transition-colors"
                style={{ color: dark.accent }}>
                {mode === 'sign_in' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
