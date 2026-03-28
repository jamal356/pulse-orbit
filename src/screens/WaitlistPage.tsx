import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Configuration ─────────────────────────────────────────────
   Phase toggle:
   - 'exclusive'  → mystery + selectivity
   - 'fomo'       → counter-driven urgency
   ──────────────────────────────────────────────────────────────── */
const PHASE: 'exclusive' | 'fomo' = 'exclusive'
const WAITLIST_COUNT = 2_437

/* ─── Palette — warm ivory, like a luxury invitation ──────────── */
const P = {
  bg: '#FAF7F2',         // warm ivory
  bgDeep: '#F2EDE6',     // slightly deeper warmth
  text: '#2A2528',        // warm charcoal (not pure black)
  textSoft: '#8A7E78',   // warm mid-gray
  textFaint: '#C2B8AE',  // warm light
  textGhost: '#DDD5CC',  // barely there
  accent: '#C83E88',     // deeper, more refined pink (less neon)
  accentSoft: 'rgba(200,62,136,0.08)',
  accentBorder: 'rgba(200,62,136,0.20)',
  accentGlow: 'rgba(200,62,136,0.06)',
  border: 'rgba(42,37,40,0.08)',
  borderFocus: 'rgba(200,62,136,0.30)',
  surface: 'rgba(42,37,40,0.03)',
  surfaceHover: 'rgba(42,37,40,0.05)',
}

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
      style={{ opacity: visible ? 0.35 : 0 }}
    >
      <path
        d="M0 12h42l5-10 5 20 5-20 5 10h78"
        stroke={P.accent}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="200"
        strokeDashoffset={visible ? '0' : '200'}
        style={{ transition: 'stroke-dashoffset 2s ease-out' }}
      />
    </svg>
  )
}

/* ─── Form types ──────────────────────────────────────────────── */
interface FormData {
  email: string
  firstName: string
  city: string
  ageRange: string
  gender: string
  lookingFor: string
  photo: string
}

const CITIES = ['Dubai', 'Abu Dhabi', 'Riyadh', 'Doha', 'Cairo', 'London', 'Other']
const AGE_RANGES = ['21–25', '26–30', '31–35', '36–40', '40+']
const GENDERS = ['Man', 'Woman', 'Non-binary']
const LOOKING_FOR = ['Men', 'Women', 'Everyone']

/* ─── Single-question step ────────────────────────────────────── */
function FormStep({
  active, stepNumber, totalSteps, question, children, onNext, canProceed, isLast,
}: {
  active: boolean; stepNumber: number; totalSteps: number; question: string;
  children: React.ReactNode; onNext: () => void; canProceed: boolean; isLast?: boolean;
}) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) { e.preventDefault(); onNext() }
  }, [canProceed, onNext])

  if (!active) return null

  return (
    <div className="flex flex-col items-center text-center animate-fade-in" onKeyDown={handleKeyDown}>
      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-10">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-500"
            style={{
              width: i === stepNumber ? '20px' : '4px', height: '4px',
              background: i <= stepNumber ? P.accent : P.textGhost,
            }} />
        ))}
      </div>

      <p className="text-lg sm:text-xl font-light tracking-wide mb-8"
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: P.textSoft, fontStyle: 'italic' }}>
        {question}
      </p>

      <div className="w-full max-w-sm mb-8">{children}</div>

      <button onClick={onNext} disabled={!canProceed}
        className="px-6 py-2.5 rounded-full text-sm tracking-wide transition-all duration-500"
        style={{
          border: `1px solid ${canProceed ? P.accentBorder : P.border}`,
          color: canProceed ? P.accent : P.textGhost,
          background: canProceed ? P.accentSoft : 'transparent',
          cursor: canProceed ? 'pointer' : 'default',
        }}>
        {isLast ? 'Submit' : 'Continue'}
      </button>

      {canProceed && (
        <p className="mt-4 text-[10px] tracking-widest uppercase" style={{ color: P.textGhost }}>
          press Enter ↵
        </p>
      )}
    </div>
  )
}

/* ─── Pill selector ──────────────────────────────────────────── */
function PillSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map(opt => {
        const selected = value === opt
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className="px-5 py-2.5 rounded-full text-sm tracking-wide transition-all duration-400"
            style={{
              background: selected ? P.accentSoft : P.surface,
              border: `1px solid ${selected ? P.accentBorder : P.border}`,
              color: selected ? P.accent : P.textSoft,
            }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Text input ─────────────────────────────────────────────── */
function FormInput({ value, onChange, placeholder, type = 'text', autoFocus = true }: {
  value: string; onChange: (v: string) => void; placeholder: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} autoFocus={autoFocus}
      className="w-full px-0 py-3 text-center text-lg tracking-wide bg-transparent border-0 border-b focus:outline-none transition-all duration-500"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        color: P.text,
        borderBottomColor: value ? P.accentBorder : P.border,
        caretColor: P.accent,
      }} />
  )
}

/* ─── Photo upload ──────────────────────────────────────────── */
function PhotoUpload({ value, onChange, firstName }: { value: string; onChange: (v: string) => void; firstName: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
        let { width, height } = img
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize } }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        onChange(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [onChange])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative cursor-pointer group"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}>
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden flex items-center justify-center transition-all duration-500"
          style={{
            border: value ? `2px solid ${P.accentBorder}` : dragging ? `2px solid ${P.accent}` : `2px dashed ${P.textGhost}`,
            background: value ? 'transparent' : P.surface,
            boxShadow: value ? `0 0 40px ${P.accentGlow}` : 'none',
          }}>
          {value ? (
            <img src={value} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                <path d="M12 5v14m-7-7h14" stroke={P.textSoft} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] tracking-wide text-center" style={{ color: P.textFaint }}>Tap to upload</span>
            </div>
          )}
        </div>
        {value && (
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white/80 text-xs tracking-wide">Change photo</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
      <p className="text-[11px] tracking-wide text-center leading-relaxed" style={{ color: P.textFaint }}>
        {value ? `This is how ${firstName || 'you'}'ll appear when the room opens.` : "High quality · Face clearly visible · This is what they'll see."}
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Warm ivory, luxury invitation aesthetic
   Think: Hermès mailer, gallery opening, handwritten note.
   Every dating app is dark. This is different. This is refined.
   ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [heroPhase, setHeroPhase] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [step, setStep] = useState(0)
  const [complete, setComplete] = useState(false)
  const [completePhase, setCompletePhase] = useState(0)
  const formRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState<FormData>({
    email: '', firstName: '', city: '', ageRange: '', gender: '', lookingFor: '', photo: '',
  })

  const update = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setHeroPhase(1), 400)
    const t2 = setTimeout(() => setHeroPhase(2), 1400)
    const t3 = setTimeout(() => setHeroPhase(3), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) return
    setShowForm(true)
    setStep(0)
    setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 300)
  }

  const nextStep = useCallback(() => {
    if (step < 5) { setStep(s => s + 1) }
    else {
      setComplete(true)
      setTimeout(() => setCompletePhase(1), 300)
      setTimeout(() => setCompletePhase(2), 1200)
      setTimeout(() => setCompletePhase(3), 2200)
      console.log('Application submitted:', form)
    }
  }, [step, form])

  const handlePillSelect = useCallback((field: keyof FormData, value: string) => {
    update(field, value)
    setTimeout(() => nextStep(), 350)
  }, [update, nextStep])

  const TOTAL_STEPS = 6

  return (
    <div className="min-h-screen relative overflow-hidden cursor-default"
      style={{ background: `linear-gradient(170deg, ${P.bg} 0%, ${P.bgDeep} 50%, ${P.bg} 100%)` }}>

      {/* Ambient warmth — subtle radial glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: '1000px', height: '700px', background: `radial-gradient(ellipse, ${P.accentGlow} 0%, transparent 60%)` }} />
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <div className="relative z-10 flex flex-col items-center text-center">

          {/* Logo */}
          <div className="transition-all duration-[2s] ease-out"
            style={{ opacity: heroPhase >= 1 ? 0.5 : 0, transform: heroPhase >= 1 ? 'translateY(0)' : 'translateY(8px)' }}>
            <span className="text-[clamp(0.75rem,1.8vw,0.9rem)] font-normal tracking-[0.35em] uppercase"
              style={{ fontFamily: "'DM Sans', sans-serif", color: P.textSoft }}>
              Pulse
            </span>
          </div>

          {/* Heartbeat */}
          <div className="my-5">
            <HeartbeatLine visible={heroPhase >= 1} />
          </div>

          {/* Tagline */}
          <h1 className="transition-all duration-[2.2s] ease-out"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(3.2rem, 11vw, 7.5rem)',
              fontWeight: 300, fontStyle: 'italic', lineHeight: 0.95, letterSpacing: '-0.015em',
              color: P.text,
              opacity: heroPhase >= 2 ? 1 : 0,
              transform: heroPhase >= 2 ? 'translateY(0)' : 'translateY(16px)',
            }}>
            You'll know.
          </h1>

          <div className="h-14 sm:h-16" />

          {/* Email CTA */}
          <div className="transition-all duration-[2s] ease-out"
            style={{ opacity: heroPhase >= 3 ? 1 : 0, transform: heroPhase >= 3 ? 'translateY(0)' : 'translateY(10px)' }}>
            {!showForm ? (
              <form onSubmit={handleEmailSubmit} className="flex flex-col items-center gap-5">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    placeholder="Your email" required
                    className="w-64 px-5 py-3 rounded-full text-sm tracking-wide focus:outline-none transition-all duration-500 text-center sm:text-left"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: P.surface, color: P.text,
                      border: `1px solid ${P.border}`,
                      caretColor: P.accent,
                    }}
                    onFocus={e => { e.target.style.borderColor = P.borderFocus; e.target.style.background = 'rgba(200,62,136,0.03)' }}
                    onBlur={e => { e.target.style.borderColor = P.border; e.target.style.background = P.surface }} />
                  <button type="submit"
                    className="px-6 py-3 rounded-full text-sm tracking-wide transition-all duration-500"
                    style={{ border: `1px solid ${P.accentBorder}`, color: P.accent, background: P.accentSoft }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,62,136,0.12)'; e.currentTarget.style.borderColor = P.accent }}
                    onMouseLeave={e => { e.currentTarget.style.background = P.accentSoft; e.currentTarget.style.borderColor = P.accentBorder }}>
                    {PHASE === 'exclusive' ? 'Request access' : 'Join waitlist'}
                  </button>
                </div>
                <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: P.textFaint }}>
                  {PHASE === 'exclusive'
                    ? 'By invitation only'
                    : <><AnimatedCounter target={WAITLIST_COUNT} /> already in line</>}
                </p>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <p className="text-sm tracking-wide" style={{ color: P.textSoft }}>Almost there — takes 30 seconds.</p>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="mt-2 animate-float" style={{ opacity: 0.25 }}>
                  <path d="M8 4v16m0 0l-5-5m5 5l5-5" stroke={P.textSoft} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ NATIVE FORM ═══ */}
      {showForm && !complete && (
        <section ref={formRef} className="relative min-h-screen flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md">
            <FormStep active={step === 0} stepNumber={0} totalSteps={TOTAL_STEPS}
              question="What's your first name?" onNext={nextStep} canProceed={form.firstName.trim().length > 0}>
              <FormInput value={form.firstName} onChange={v => update('firstName', v)} placeholder="First name only" />
            </FormStep>

            <FormStep active={step === 1} stepNumber={1} totalSteps={TOTAL_STEPS}
              question={`${form.firstName}, where are you based?`} onNext={nextStep} canProceed={form.city.length > 0}>
              <PillSelect options={CITIES} value={form.city} onChange={v => handlePillSelect('city', v)} />
            </FormStep>

            <FormStep active={step === 2} stepNumber={2} totalSteps={TOTAL_STEPS}
              question="What's your age range?" onNext={nextStep} canProceed={form.ageRange.length > 0}>
              <PillSelect options={AGE_RANGES} value={form.ageRange} onChange={v => handlePillSelect('ageRange', v)} />
            </FormStep>

            <FormStep active={step === 3} stepNumber={3} totalSteps={TOTAL_STEPS}
              question="I am a…" onNext={nextStep} canProceed={form.gender.length > 0}>
              <PillSelect options={GENDERS} value={form.gender} onChange={v => handlePillSelect('gender', v)} />
            </FormStep>

            <FormStep active={step === 4} stepNumber={4} totalSteps={TOTAL_STEPS}
              question="Interested in…" onNext={nextStep} canProceed={form.lookingFor.length > 0}>
              <PillSelect options={LOOKING_FOR} value={form.lookingFor} onChange={v => handlePillSelect('lookingFor', v)} />
            </FormStep>

            <FormStep active={step === 5} stepNumber={5} totalSteps={TOTAL_STEPS}
              question="This is your first impression." onNext={nextStep} canProceed={form.photo.length > 0} isLast>
              <PhotoUpload value={form.photo} onChange={v => update('photo', v)} firstName={form.firstName} />
            </FormStep>
          </div>
        </section>
      )}

      {/* ═══ COMPLETION ═══ */}
      {complete && (
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="flex flex-col items-center text-center max-w-sm w-full">

            {/* Profile photo with warm glow aura */}
            <div className="mb-10 transition-all duration-[1.5s] ease-out"
              style={{ opacity: completePhase >= 1 ? 1 : 0, transform: completePhase >= 1 ? 'scale(1)' : 'scale(0.5)' }}>
              {form.photo ? (
                <div className="relative">
                  {/* Warm radial glow behind photo — the user is "glowing" in the system */}
                  <div className="absolute inset-0 rounded-full"
                    style={{
                      width: '160px', height: '160px', top: '-24px', left: '-24px',
                      background: `radial-gradient(circle, rgba(200,62,136,0.15) 0%, rgba(200,62,136,0.04) 50%, transparent 70%)`,
                      animation: 'completionGlow 3s ease-in-out infinite',
                    }} />
                  <div className="w-28 h-28 rounded-full overflow-hidden relative z-10"
                    style={{ border: `2.5px solid ${P.accent}`, boxShadow: `0 0 50px rgba(200,62,136,0.12), 0 4px 20px rgba(0,0,0,0.06)` }}>
                    <img src={form.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center z-20"
                    style={{ background: P.accent, boxShadow: `0 2px 12px rgba(200,62,136,0.3)` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: P.accentSoft, border: `2px solid ${P.accent}` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke={P.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Headline */}
            <h2 className="mb-3 transition-all duration-[1.8s] ease-out"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 300, fontStyle: 'italic',
                color: P.text,
                opacity: completePhase >= 2 ? 1 : 0,
                transform: completePhase >= 2 ? 'translateY(0)' : 'translateY(12px)',
              }}>
              We'll find you, {form.firstName}.
            </h2>

            <p className="text-sm tracking-wide transition-all duration-[1.8s] ease-out"
              style={{ color: P.textSoft, opacity: completePhase >= 2 ? 1 : 0 }}>
              Your application is in. We'll be in touch before launch.
            </p>

            {/* Queue badge — premium membership card feel, not a deli ticket */}
            <div className="mt-8 transition-all duration-[2s] ease-out"
              style={{ opacity: completePhase >= 3 ? 1 : 0, transform: completePhase >= 3 ? 'translateY(0)' : 'translateY(8px)' }}>
              <div className="px-7 py-3 rounded-full"
                style={{ background: 'rgba(200,62,136,0.06)', border: `1px solid ${P.accentBorder}` }}>
                <p className="text-[11px] tracking-[0.2em] uppercase font-medium" style={{ color: P.accent }}>
                  #{Math.floor(Math.random() * 200 + 180)} in line · {form.city || 'Dubai'}
                </p>
              </div>
            </div>

            {/* What happens next — fills the empty space with purpose */}
            <div className="mt-16 w-full transition-all duration-[2.5s] ease-out"
              style={{ opacity: completePhase >= 3 ? 1 : 0, transform: completePhase >= 3 ? 'translateY(0)' : 'translateY(16px)' }}>
              <p className="text-[10px] tracking-[0.25em] uppercase mb-8" style={{ color: P.textFaint }}>
                What happens next
              </p>
              <div className="flex items-start justify-between gap-4">
                {[
                  { num: '01', label: 'Review', desc: 'We review your profile' },
                  { num: '02', label: 'Match', desc: 'We find your people' },
                  { num: '03', label: 'Invite', desc: 'You get early access' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center text-center gap-2.5">
                    <span className="text-[10px] tracking-[0.2em] font-medium" style={{ color: P.accent }}>
                      {item.num}
                    </span>
                    <span className="text-[13px] tracking-wide font-medium"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: P.text }}>
                      {item.label}
                    </span>
                    <span className="text-[11px] leading-relaxed" style={{ color: P.textSoft }}>
                      {item.desc}
                    </span>
                    {/* Connector line between steps */}
                    {i < 2 && (
                      <div className="absolute" style={{
                        width: '1px', height: '1px', /* visual connector handled by spacing */
                      }} />
                    )}
                  </div>
                ))}
              </div>
              {/* Subtle progress line connecting the three steps */}
              <div className="mt-6 mx-auto" style={{ width: '60%', height: '1px', background: `linear-gradient(90deg, transparent, ${P.accentBorder}, transparent)` }} />
            </div>

            {/* Share prompt — gives user something to do */}
            <div className="mt-12 transition-all duration-[3s] ease-out"
              style={{ opacity: completePhase >= 3 ? 0.7 : 0 }}>
              <p className="text-[11px] tracking-wide" style={{ color: P.textFaint, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px' }}>
                Know someone who should be here?
              </p>
            </div>
          </div>

          {/* CSS animation for the glow pulse */}
          <style>{`
            @keyframes completionGlow {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.08); }
            }
          `}</style>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="absolute bottom-0 left-0 right-0 px-6 py-6" style={{ zIndex: 10 }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[11px] tracking-wider" style={{ color: P.textGhost }}>Dubai 2026</span>
          <a href="mailto:jamal@hakadian.com"
            className="text-[11px] tracking-wider transition-colors duration-500"
            style={{ color: P.textGhost }}
            onMouseEnter={e => e.currentTarget.style.color = P.textSoft}
            onMouseLeave={e => e.currentTarget.style.color = P.textGhost}>
            Contact
          </a>
        </div>
      </footer>
    </div>
  )
}
