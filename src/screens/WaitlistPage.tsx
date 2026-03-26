import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Configuration ─────────────────────────────────────────────
   Phase toggle:
   - 'exclusive'  → mystery + selectivity
   - 'fomo'       → counter-driven urgency
   ──────────────────────────────────────────────────────────────── */
const PHASE: 'exclusive' | 'fomo' = 'exclusive'
const WAITLIST_COUNT = 2_437

/* ─── Animated counter ───────────────────────────────────────── */
function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const step = (now: number) => {
          const p = Math.min((now - start) / 2000, 1)
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

/* ─── Animated heartbeat SVG ─────────────────────────────────── */
function HeartbeatLine({ visible }: { visible: boolean }) {
  return (
    <svg
      width="140"
      height="24"
      viewBox="0 0 140 24"
      fill="none"
      className="transition-opacity duration-[2s]"
      style={{ opacity: visible ? 0.45 : 0 }}
    >
      <path
        d="M0 12h42l5-10 5 20 5-20 5 10h78"
        stroke="#E040A0"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="200"
        strokeDashoffset={visible ? '0' : '200'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
    </svg>
  )
}

/* ─── Form question definitions ──────────────────────────────── */
interface FormData {
  email: string
  firstName: string
  city: string
  ageRange: string
  gender: string
  lookingFor: string
  brokenThing: string
}

const CITIES = ['Dubai', 'Abu Dhabi', 'Riyadh', 'Doha', 'Cairo', 'London', 'Other']
const AGE_RANGES = ['21–25', '26–30', '31–35', '36–40', '40+']
const GENDERS = ['Man', 'Woman', 'Non-binary']
const LOOKING_FOR = ['Men', 'Women', 'Everyone']

/* ─── Single-question step component ─────────────────────────── */
function FormStep({
  active,
  stepNumber,
  totalSteps,
  question,
  children,
  onNext,
  canProceed,
  isLast,
}: {
  active: boolean
  stepNumber: number
  totalSteps: number
  question: string
  children: React.ReactNode
  onNext: () => void
  canProceed: boolean
  isLast?: boolean
}) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) {
      e.preventDefault()
      onNext()
    }
  }, [canProceed, onNext])

  if (!active) return null

  return (
    <div
      className="flex flex-col items-center text-center animate-fade-in"
      onKeyDown={handleKeyDown}
    >
      {/* Progress — minimal dots */}
      <div className="flex items-center gap-2 mb-10">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === stepNumber ? '20px' : '4px',
              height: '4px',
              background: i <= stepNumber
                ? 'rgba(224,64,160,0.5)'
                : 'rgba(255,255,255,0.10)',
            }}
          />
        ))}
      </div>

      {/* Question */}
      <p
        className="text-lg sm:text-xl font-light tracking-wide mb-8"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          color: 'rgba(255,255,255,0.70)',
          fontStyle: 'italic',
        }}
      >
        {question}
      </p>

      {/* Answer area */}
      <div className="w-full max-w-sm mb-8">
        {children}
      </div>

      {/* Continue */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="px-6 py-2.5 rounded-full text-sm tracking-wide transition-all duration-500"
        style={{
          border: `1px solid ${canProceed ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.06)'}`,
          color: canProceed ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)',
          cursor: canProceed ? 'pointer' : 'default',
        }}
        onMouseEnter={e => {
          if (canProceed) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = canProceed ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.15)'
        }}
      >
        {isLast ? 'Submit' : 'Continue'}
      </button>

      {/* Keyboard hint */}
      {canProceed && (
        <p className="mt-4 text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.12)' }}>
          press Enter ↵
        </p>
      )}
    </div>
  )
}

/* ─── Pill selector ──────────────────────────────────────────── */
function PillSelect({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map(opt => {
        const selected = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all duration-400"
            style={{
              background: selected ? 'rgba(224,64,160,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected ? 'rgba(224,64,160,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: selected ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.40)',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Text input styled for the form ─────────────────────────── */
function FormInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoFocus = true,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-0 py-3 text-center text-white text-lg tracking-wide bg-transparent border-0 border-b focus:outline-none transition-all duration-500 placeholder:text-white/20"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        borderBottomColor: value ? 'rgba(224,64,160,0.3)' : 'rgba(255,255,255,0.10)',
      }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [heroPhase, setHeroPhase] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(0)
  const [complete, setComplete] = useState(false)
  const [completePhase, setCompletePhase] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormData>({
    email: '',
    firstName: '',
    city: '',
    ageRange: '',
    gender: '',
    lookingFor: '',
    brokenThing: '',
  })

  const update = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  /* Hero reveal */
  useEffect(() => {
    const t1 = setTimeout(() => setHeroPhase(1), 400)
    const t2 = setTimeout(() => setHeroPhase(2), 1400)
    const t3 = setTimeout(() => setHeroPhase(3), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  /* Email submit → enter form flow */
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) return
    setShowForm(true)
    setStep(0)
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }

  /* Advance to next step */
  const nextStep = useCallback(() => {
    if (step < 5) {
      setStep(s => s + 1)
    } else {
      /* All done — show completion */
      setComplete(true)
      setTimeout(() => setCompletePhase(1), 300)
      setTimeout(() => setCompletePhase(2), 1200)
      setTimeout(() => setCompletePhase(3), 2200)
      // Here you'd POST form data to your backend
      console.log('Application submitted:', form)
    }
  }, [step, form])

  /* Auto-advance on pill selection (with slight delay for visual feedback) */
  const handlePillSelect = useCallback((field: keyof FormData, value: string) => {
    update(field, value)
    setTimeout(() => nextStep(), 350)
  }, [update, nextStep])

  const TOTAL_STEPS = 6

  return (
    <div
      className="min-h-screen relative overflow-hidden cursor-default"
      style={{ background: 'linear-gradient(170deg, #1C1A22 0%, #16141C 40%, #12111A 100%)' }}
    >
      {/* ─── Ambient light ─── */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '900px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(224,64,160,0.06) 0%, rgba(160,50,180,0.03) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-[-10%] left-[-5%]"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(80,50,120,0.08) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: heroPhase >= 1 ? 0.55 : 0,
              transform: heroPhase >= 1 ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <span
              className="text-[clamp(0.75rem,1.8vw,0.9rem)] font-normal tracking-[0.35em] uppercase"
              style={{ fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.5)' }}
            >
              Pulse
            </span>
          </div>

          {/* Heartbeat */}
          <div className="my-5">
            <HeartbeatLine visible={heroPhase >= 1} />
          </div>

          {/* Tagline */}
          <h1
            className="transition-all duration-[2.2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(3.2rem, 11vw, 7.5rem)',
              fontWeight: 300,
              fontStyle: 'italic',
              lineHeight: 0.95,
              letterSpacing: '-0.015em',
              color: 'rgba(255,255,255,0.95)',
              opacity: heroPhase >= 2 ? 1 : 0,
              transform: heroPhase >= 2 ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            You'll know.
          </h1>

          <div className="h-14 sm:h-16" />

          {/* Email CTA */}
          <div
            className="transition-all duration-[2s] ease-out"
            style={{
              opacity: heroPhase >= 3 ? 1 : 0,
              transform: heroPhase >= 3 ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            {!showForm ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col items-center gap-5">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    placeholder="Your email"
                    required
                    className="w-64 px-5 py-3 rounded-full text-white placeholder:text-white/25 text-sm tracking-wide focus:outline-none transition-all duration-500 text-center sm:text-left"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(224,64,160,0.3)'
                      e.target.style.background = 'rgba(255,255,255,0.06)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.10)'
                      e.target.style.background = 'rgba(255,255,255,0.04)'
                    }}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-500"
                    style={{
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                    }}
                  >
                    {PHASE === 'exclusive' ? 'Request access' : 'Join waitlist'}
                  </button>
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {PHASE === 'exclusive'
                    ? 'By invitation only'
                    : <><AnimatedCounter target={WAITLIST_COUNT} /> already in line</>
                  }
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <p className="text-sm tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Almost there — takes 30 seconds.
                </p>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="mt-2 animate-float" style={{ opacity: 0.2 }}>
                  <path d="M8 4v16m0 0l-5-5m5 5l5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ NATIVE FORM — one question at a time ═══ */}
      {showForm && !complete && (
        <section ref={formRef} className="relative min-h-screen flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">

            {/* Step 0: First name */}
            <FormStep
              active={step === 0}
              stepNumber={0}
              totalSteps={TOTAL_STEPS}
              question="What's your first name?"
              onNext={nextStep}
              canProceed={form.firstName.trim().length > 0}
            >
              <FormInput
                value={form.firstName}
                onChange={v => update('firstName', v)}
                placeholder="First name only"
              />
            </FormStep>

            {/* Step 1: City */}
            <FormStep
              active={step === 1}
              stepNumber={1}
              totalSteps={TOTAL_STEPS}
              question={`${form.firstName}, where are you based?`}
              onNext={nextStep}
              canProceed={form.city.length > 0}
            >
              <PillSelect
                options={CITIES}
                value={form.city}
                onChange={v => handlePillSelect('city', v)}
              />
            </FormStep>

            {/* Step 2: Age range */}
            <FormStep
              active={step === 2}
              stepNumber={2}
              totalSteps={TOTAL_STEPS}
              question="What's your age range?"
              onNext={nextStep}
              canProceed={form.ageRange.length > 0}
            >
              <PillSelect
                options={AGE_RANGES}
                value={form.ageRange}
                onChange={v => handlePillSelect('ageRange', v)}
              />
            </FormStep>

            {/* Step 3: Gender */}
            <FormStep
              active={step === 3}
              stepNumber={3}
              totalSteps={TOTAL_STEPS}
              question="I am a…"
              onNext={nextStep}
              canProceed={form.gender.length > 0}
            >
              <PillSelect
                options={GENDERS}
                value={form.gender}
                onChange={v => handlePillSelect('gender', v)}
              />
            </FormStep>

            {/* Step 4: Looking for */}
            <FormStep
              active={step === 4}
              stepNumber={4}
              totalSteps={TOTAL_STEPS}
              question="Interested in…"
              onNext={nextStep}
              canProceed={form.lookingFor.length > 0}
            >
              <PillSelect
                options={LOOKING_FOR}
                value={form.lookingFor}
                onChange={v => handlePillSelect('lookingFor', v)}
              />
            </FormStep>

            {/* Step 5: The open question — investor gold */}
            <FormStep
              active={step === 5}
              stepNumber={5}
              totalSteps={TOTAL_STEPS}
              question="What's broken about dating right now?"
              onNext={nextStep}
              canProceed={form.brokenThing.trim().length > 0}
              isLast
            >
              <textarea
                value={form.brokenThing}
                onChange={e => update('brokenThing', e.target.value)}
                placeholder="Be honest — we're building this for you."
                autoFocus
                rows={3}
                className="w-full px-0 py-3 text-center text-white text-base tracking-wide bg-transparent border-0 border-b focus:outline-none transition-all duration-500 placeholder:text-white/20 resize-none"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderBottomColor: form.brokenThing ? 'rgba(224,64,160,0.3)' : 'rgba(255,255,255,0.10)',
                }}
              />
            </FormStep>
          </div>
        </section>
      )}

      {/* ═══ COMPLETION — the payoff ═══ */}
      {complete && (
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="flex flex-col items-center text-center">

            {/* Checkmark */}
            <div
              className="mb-8 transition-all duration-[1.5s] ease-out"
              style={{
                opacity: completePhase >= 1 ? 1 : 0,
                transform: completePhase >= 1 ? 'scale(1)' : 'scale(0.5)',
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(224,64,160,0.10)',
                  border: '1px solid rgba(224,64,160,0.25)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke="#E040A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Message */}
            <h2
              className="mb-3 transition-all duration-[1.8s] ease-out"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                fontWeight: 300,
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.90)',
                opacity: completePhase >= 2 ? 1 : 0,
                transform: completePhase >= 2 ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              We'll find you, {form.firstName}.
            </h2>

            <p
              className="text-sm tracking-wide transition-all duration-[1.8s] ease-out"
              style={{
                color: 'rgba(255,255,255,0.35)',
                opacity: completePhase >= 2 ? 1 : 0,
              }}
            >
              Your application is in. We'll be in touch before launch.
            </p>

            {/* Position in line (FOMO seed — even in exclusive phase) */}
            <div
              className="mt-10 transition-all duration-[2s] ease-out"
              style={{
                opacity: completePhase >= 3 ? 1 : 0,
                transform: completePhase >= 3 ? 'translateY(0)' : 'translateY(8px)',
              }}
            >
              <div
                className="px-6 py-3 rounded-full"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  You're #{Math.floor(Math.random() * 200 + 180)} in line · {form.city || 'Dubai'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 py-6" style={{ zIndex: 10 }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[11px] tracking-wider" style={{ color: 'rgba(255,255,255,0.12)' }}>
            Dubai 2026
          </span>
          <a
            href="mailto:jamal@hakadian.com"
            className="text-[11px] tracking-wider transition-colors duration-500"
            style={{ color: 'rgba(255,255,255,0.12)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.30)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.12)'}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
