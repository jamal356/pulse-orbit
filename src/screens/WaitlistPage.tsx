import { useState, useEffect, useRef, useCallback } from 'react'
import PulseLogo from '../components/PulseLogo'
import { submitWaitlistEntry } from '../lib/supabase'

/* ═══════════════════════════════════════════════════════════════
   WAITLIST — The experience starts here.

   Design philosophy:
   Jobs didn't make you fill out forms. He made you feel something
   first, then the action felt inevitable.

   This page IS the first date with Pulse. Every micro-interaction
   should feel considered, alive, intentional. The onboarding isn't
   a survey — it's self-discovery. You learn about yourself while
   Pulse learns about you.

   Psychology:
   1. Create desire before asking for anything
   2. Each step reveals something about the product
   3. Questions feel personal, not administrative
   4. Scarcity is felt, not stated
   5. The completion feels like acceptance, not submission
   ═══════════════════════════════════════════════════════════════ */

const serif = "'Cormorant Garamond', Georgia, serif"
const sans = "'DM Sans', sans-serif"

const P = {
  bg: '#FAF7F2',
  bgDeep: '#F2EDE6',
  text: '#2A2528',
  textSoft: '#8A7E78',
  textFaint: '#C2B8AE',
  textGhost: '#DDD5CC',
  accent: '#C83E88',
  accentSoft: 'rgba(200,62,136,0.08)',
  accentBorder: 'rgba(200,62,136,0.20)',
  accentGlow: 'rgba(200,62,136,0.06)',
  border: 'rgba(42,37,40,0.08)',
}

/* ─── Onboarding question types ─── */
interface TextQuestion { type: 'text'; id: string; question: string; placeholder: string; sub?: string }
interface ChoiceQuestion { type: 'choice'; id: string; question: string; options: { label: string; icon?: string }[]; sub?: string }
interface AgeQuestion { type: 'age'; id: string; question: string; sub?: string }
interface PhotoQuestion { type: 'photo'; id: string; question: string; sub?: string }
type Question = TextQuestion | ChoiceQuestion | AgeQuestion | PhotoQuestion

/* ─── The questions — designed to intrigue, not interrogate ─── */
const QUESTIONS: Question[] = [
  {
    type: 'text', id: 'email',
    question: 'Where do we reach you?',
    placeholder: 'your@email.com',
    sub: 'We only write when it matters.',
  },
  {
    type: 'text', id: 'firstName',
    question: 'What do people call you?',
    placeholder: 'First name',
    sub: 'Just the one your friends use.',
  },
  {
    type: 'age', id: 'age',
    question: 'How many trips around the sun?',
    sub: 'We match within compatible ranges. No judgment.',
  },
  {
    type: 'choice', id: 'gender',
    question: 'I am…',
    options: [
      { label: 'A woman', icon: '♀' },
      { label: 'A man', icon: '♂' },
      { label: 'Non-binary', icon: '◎' },
    ],
  },
  {
    type: 'choice', id: 'lookingFor',
    question: 'I want to meet…',
    options: [
      { label: 'Women', icon: '♀' },
      { label: 'Men', icon: '♂' },
      { label: 'Everyone', icon: '✦' },
    ],
  },
  {
    type: 'choice', id: 'city',
    question: 'Where are you based?',
    options: [
      { label: 'Dubai' },
      { label: 'Abu Dhabi' },
      { label: 'Sharjah' },
      { label: 'Riyadh' },
      { label: 'Doha' },
      { label: 'Cairo' },
      { label: 'London' },
      { label: 'Paris' },
      { label: 'Somewhere else' },
    ],
    sub: 'We launch UAE first. Your city is next.',
  },
  {
    type: 'choice', id: 'attraction',
    question: 'What draws you to someone first?',
    options: [
      { label: 'Their voice', icon: '🎙' },
      { label: 'Their eyes', icon: '👁' },
      { label: 'Their humor', icon: '✨' },
      { label: 'Their mind', icon: '🧠' },
      { label: 'Their energy', icon: '⚡' },
    ],
    sub: 'There are no wrong answers. Only honest ones.',
  },
  {
    type: 'choice', id: 'friday',
    question: 'Your ideal Friday night?',
    options: [
      { label: 'Rooftop drinks', icon: '🌃' },
      { label: 'Home cooking', icon: '🍳' },
      { label: 'Live music', icon: '🎵' },
      { label: 'Gallery opening', icon: '🎨' },
      { label: 'Spontaneous adventure', icon: '🗺' },
    ],
  },
  {
    type: 'choice', id: 'dealbreaker',
    question: 'Biggest dealbreaker on a first date?',
    options: [
      { label: 'Phone on the table', icon: '📱' },
      { label: 'No curiosity', icon: '😶' },
      { label: 'Talks only about themselves', icon: '🪞' },
      { label: 'No eye contact', icon: '👀' },
      { label: 'Negativity', icon: '🌧' },
    ],
    sub: 'This helps Aura, our AI, prepare you before each date.',
  },
  {
    type: 'photo', id: 'photo',
    question: 'Last thing. Show us you.',
    sub: 'This is what they see when the camera turns on. Make it count.',
  },
]

const TOTAL_STEPS = QUESTIONS.length

/* ═══════════════════════════════════════════════════════════════ */
export default function WaitlistPage() {
  const [heroPhase, setHeroPhase] = useState(0)
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(0)
  const [complete, setComplete] = useState(false)
  const [completePhase, setCompletePhase] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [ageValue, setAgeValue] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [showCustomCity, setShowCustomCity] = useState(false)
  const [waitlistNumber, setWaitlistNumber] = useState(() => Math.floor(Math.random() * 200 + 180))
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null)
  const [cardGenerating, setCardGenerating] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Hero entrance
  useEffect(() => {
    const t1 = setTimeout(() => setHeroPhase(1), 400)
    const t2 = setTimeout(() => setHeroPhase(2), 1200)
    const t3 = setTimeout(() => setHeroPhase(3), 2400)
    const t4 = setTimeout(() => setHeroPhase(4), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }, [])

  const currentQ = QUESTIONS[step]
  const currentAnswer = currentQ ? answers[currentQ.id] || '' : ''

  const canProceed = (() => {
    if (!currentQ) return false
    if (currentQ.type === 'text') return currentAnswer.trim().length > 0
    if (currentQ.type === 'age') return ageValue.length > 0 && parseInt(ageValue) >= 18 && parseInt(ageValue) <= 99
    if (currentQ.type === 'choice') return currentAnswer.length > 0
    if (currentQ.type === 'photo') return currentAnswer.length > 0
    return false
  })()

  const nextStep = useCallback(async () => {
    if (currentQ?.type === 'age') {
      setAnswer('age', ageValue)
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
    } else {
      // Submit
      setComplete(true)
      setTimeout(() => setCompletePhase(1), 300)
      setTimeout(() => setCompletePhase(2), 1200)
      setTimeout(() => setCompletePhase(3), 2200)

      const finalAnswers: Record<string, string> = { ...answers, age: ageValue }

      // localStorage backup (fallback if Supabase is not configured)
      const submissions = JSON.parse(localStorage.getItem('pulse-waitlist') || '[]')
      submissions.push({ ...finalAnswers, photo: '[uploaded]', timestamp: new Date().toISOString() })
      localStorage.setItem('pulse-waitlist', JSON.stringify(submissions))

      // Convert photo data URL to Blob for Supabase Storage upload
      let photoBlob: Blob | null = null
      if (finalAnswers.photo && finalAnswers.photo.startsWith('data:')) {
        try {
          const res = await fetch(finalAnswers.photo)
          photoBlob = await res.blob()
        } catch { /* photo conversion failed — submit without it */ }
      }

      // Submit to Supabase (table + photo storage)
      submitWaitlistEntry(finalAnswers, photoBlob)
        .then(({ position }) => {
          if (position) setWaitlistNumber(position)
        })
        .catch(() => { /* silent — localStorage backup exists */ })
    }
  }, [step, currentQ, answers, ageValue, setAnswer])

  const handleChoiceSelect = useCallback((id: string, value: string) => {
    // "Somewhere else" on city → show text input instead of auto-advancing
    if (id === 'city' && value === 'Somewhere else') {
      setShowCustomCity(true)
      setCustomCity('')
      return
    }
    setShowCustomCity(false)
    setAnswer(id, value)
    // Auto-advance on choice with a beat of delay
    setTimeout(() => {
      if (step < TOTAL_STEPS - 1) {
        setStep(s => s + 1)
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
      }
    }, 400)
  }, [setAnswer, step])

  const handleCustomCitySubmit = useCallback(() => {
    if (customCity.trim()) {
      setAnswer('city', customCity.trim())
      setShowCustomCity(false)
      setTimeout(() => {
        if (step < TOTAL_STEPS - 1) {
          setStep(s => s + 1)
          setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)
        }
      }, 300)
    }
  }, [customCity, setAnswer, step])

  const handlePhotoUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const max = 800
        let { width, height } = img
        if (width > height) { if (width > max) { height = (height * max) / width; width = max } }
        else { if (height > max) { width = (width * max) / height; height = max } }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        setAnswer('photo', canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }, [setAnswer])

  /* ─── Generate personalized share card (1080x1080 square) ─── */
  const generateShareCard = useCallback(async () => {
    setCardGenerating(true)
    const S = 1080 // Square — displays well everywhere
    const canvas = document.createElement('canvas')
    canvas.width = S; canvas.height = S
    const ctx = canvas.getContext('2d')!

    // Background — deep warm black with grain texture
    const grad = ctx.createLinearGradient(0, 0, 0, S)
    grad.addColorStop(0, '#0F0D0C')
    grad.addColorStop(0.4, '#1A1618')
    grad.addColorStop(0.6, '#1A1618')
    grad.addColorStop(1, '#0F0D0C')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, S, S)

    // Large ambient glow — centered on photo area
    const glow1 = ctx.createRadialGradient(S / 2, S * 0.44, 0, S / 2, S * 0.44, S * 0.5)
    glow1.addColorStop(0, 'rgba(200,62,136,0.14)')
    glow1.addColorStop(0.4, 'rgba(200,62,136,0.05)')
    glow1.addColorStop(1, 'transparent')
    ctx.fillStyle = glow1
    ctx.fillRect(0, 0, S, S)

    // Top edge glow
    const glow2 = ctx.createLinearGradient(0, 0, 0, S * 0.15)
    glow2.addColorStop(0, 'rgba(200,62,136,0.06)')
    glow2.addColorStop(1, 'transparent')
    ctx.fillStyle = glow2
    ctx.fillRect(0, 0, S, S * 0.15)

    ctx.textAlign = 'center'

    // ── Top: PULSE brand ──
    ctx.fillStyle = 'rgba(200,62,136,0.85)'
    ctx.font = '500 26px "DM Sans", sans-serif'
    ctx.letterSpacing = '12px'
    ctx.fillText('PULSE', S / 2, S * 0.10)

    // ── "You'll know." — hero tagline ──
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = 'italic 300 90px "Cormorant Garamond", Georgia, serif'
    ctx.letterSpacing = '-1px'
    ctx.fillText("You'll know.", S / 2, S * 0.24)

    // Thin divider
    ctx.strokeStyle = 'rgba(200,62,136,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(S * 0.40, S * 0.28)
    ctx.lineTo(S * 0.60, S * 0.28)
    ctx.stroke()

    // ── Name — proper case ──
    const rawName = (answers.firstName || 'Someone').trim()
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase()

    // ── Photo + personal section ──
    if (answers.photo) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = answers.photo
        })
        if (img.complete && img.naturalWidth > 0) {
          const r = 90, cx = S / 2, pcY = S * 0.45

          // Photo glow ring
          const pglow = ctx.createRadialGradient(cx, pcY, r - 10, cx, pcY, r + 50)
          pglow.addColorStop(0, 'rgba(200,62,136,0.08)')
          pglow.addColorStop(1, 'transparent')
          ctx.fillStyle = pglow
          ctx.fillRect(cx - r - 50, pcY - r - 50, (r + 50) * 2, (r + 50) * 2)

          // Outer ring
          ctx.strokeStyle = 'rgba(200,62,136,0.15)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(cx, pcY, r + 12, 0, Math.PI * 2)
          ctx.stroke()

          // Photo circle
          ctx.save()
          ctx.beginPath()
          ctx.arc(cx, pcY, r, 0, Math.PI * 2)
          ctx.clip()
          ctx.drawImage(img, cx - r, pcY - r, r * 2, r * 2)
          ctx.restore()

          // Inner ring
          ctx.strokeStyle = 'rgba(200,62,136,0.4)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(cx, pcY, r + 2, 0, Math.PI * 2)
          ctx.stroke()

          // Name below photo
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.font = 'italic 300 50px "Cormorant Garamond", Georgia, serif'
          ctx.letterSpacing = '0px'
          ctx.fillText(`${name} is in.`, S / 2, S * 0.61)
          ctx.fillStyle = 'rgba(255,255,255,0.4)'
          ctx.font = '400 30px "DM Sans", sans-serif'
          ctx.fillText('Are you?', S / 2, S * 0.66)
        }
      } catch {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = 'italic 300 54px "Cormorant Garamond", Georgia, serif'
        ctx.fillText(`${name} is in.`, S / 2, S * 0.44)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.font = '400 34px "DM Sans", sans-serif'
        ctx.fillText('Are you?', S / 2, S * 0.50)
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = 'italic 300 54px "Cormorant Garamond", Georgia, serif'
      ctx.letterSpacing = '0px'
      ctx.fillText(`${name} is in.`, S / 2, S * 0.44)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.font = '400 34px "DM Sans", sans-serif'
      ctx.fillText('Are you?', S / 2, S * 0.50)
    }

    // ── Position badge ──
    const badgeY = answers.photo ? S * 0.72 : S * 0.58
    const city = answers.city || 'UAE'
    const badgeW = 280, badgeH = 44, badgeR = 22
    const badgeX = (S - badgeW) / 2
    ctx.fillStyle = 'rgba(200,62,136,0.10)'
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR)
    ctx.fill()
    ctx.strokeStyle = 'rgba(200,62,136,0.22)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = 'rgba(200,62,136,0.8)'
    ctx.font = '500 16px "DM Sans", sans-serif'
    ctx.letterSpacing = '3px'
    ctx.fillText(`#${waitlistNumber} \u00B7 ${city.toUpperCase()}`, S / 2, badgeY + 28)

    // ── Bottom: Manifesto line — prominent ──
    // Divider
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    const divY = S * 0.83
    ctx.moveTo(S * 0.15, divY)
    ctx.lineTo(S * 0.85, divY)
    ctx.stroke()

    // Manifesto
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = 'italic 300 28px "Cormorant Garamond", Georgia, serif'
    ctx.letterSpacing = '0.5px'
    ctx.fillText('For people who want to feel something.', S / 2, S * 0.89)

    // "By application only"
    ctx.fillStyle = 'rgba(255,255,255,0.18)'
    ctx.font = '400 14px "DM Sans", sans-serif'
    ctx.letterSpacing = '5px'
    ctx.fillText('BY APPLICATION ONLY', S / 2, S * 0.95)

    const url = canvas.toDataURL('image/png', 1.0)
    setShareCardUrl(url)
    setCardGenerating(false)
  }, [answers, waitlistNumber])

  // Share URL only — WhatsApp/iMessage generate preview from OG tags
  const handleShare = useCallback(async () => {
    const siteLink = window.location.origin || 'https://pulse-orbit-jamal356s-projects.vercel.app'
    if (navigator.share) {
      navigator.share({
        text: "I'm in. Are you?",
        url: siteLink,
      }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(`I'm in. Are you? ${siteLink}`).catch(() => {})
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }, [])

  // Save card to device — separate action, for stories/posts
  const handleSaveCard = useCallback(() => {
    if (!shareCardUrl) return
    const a = document.createElement('a')
    a.href = shareCardUrl
    a.download = 'pulse-invite.png'
    a.click()
  }, [shareCardUrl])

  // Generate share card when completion animation finishes
  useEffect(() => {
    if (completePhase >= 3 && !shareCardUrl && !cardGenerating) {
      generateShareCard()
    }
  }, [completePhase, shareCardUrl, cardGenerating, generateShareCard])

  const handleStart = useCallback(() => {
    setStarted(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canProceed) { e.preventDefault(); nextStep() }
  }, [canProceed, nextStep])

  const progress = step / TOTAL_STEPS

  return (
    <div className="min-h-screen relative overflow-hidden cursor-default"
      style={{ background: `linear-gradient(170deg, ${P.bg} 0%, ${P.bgDeep} 50%, ${P.bg} 100%)` }}
      onKeyDown={handleKeyDown}>

      {/* ── Animated pulse rings — start outside text, expand outward ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Rings start at 550px (already past all text) and expand out */}
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute top-1/2 left-1/2"
            style={{
              width: '550px', height: '550px',
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(200,62,136,0.0)',
              borderRadius: '50%',
              animation: `pulse-ring 7s ${i * 2.3}s ease-out infinite`,
            }} />
        ))}
      </div>

      {/* Progress bar — thin, elegant, top of viewport */}
      {started && !complete && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: P.border }}>
          <div className="h-full transition-all duration-700 ease-out"
            style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${P.accent}, #A030D0)` }} />
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6" style={{ zIndex: 1 }}>
        <div className="relative flex flex-col items-center text-center max-w-lg">

          {/* Logo — draw-in animation */}
          <div className="transition-all duration-[2s] ease-out mb-4"
            style={{ opacity: heroPhase >= 1 ? 1 : 0, transform: heroPhase >= 1 ? 'translateY(0)' : 'translateY(8px)' }}>
            <PulseLogo size="lg" color="accent" />
          </div>

          {/* Tagline — the hook */}
          <h1 className="transition-all duration-[2.2s] ease-out"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(3.5rem, 12vw, 8rem)',
              fontWeight: 300, fontStyle: 'italic', lineHeight: 0.9, letterSpacing: '-0.02em',
              color: P.text,
              opacity: heroPhase >= 2 ? 1 : 0,
              transform: heroPhase >= 2 ? 'translateY(0)' : 'translateY(20px)',
            }}>
            You'll know.
          </h1>

          {/* Sub — one line, emotional, not descriptive */}
          <p className="mt-6 transition-all duration-[2s] ease-out"
            style={{
              fontFamily: serif, fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontStyle: 'italic',
              color: P.textSoft, lineHeight: 1.7, letterSpacing: '0.01em',
              opacity: heroPhase >= 3 ? 1 : 0,
              transform: heroPhase >= 3 ? 'translateY(0)' : 'translateY(10px)',
            }}>
            The first date you'll actually remember.
          </p>

          {/* CTA — appears last, feels inevitable */}
          <div className="mt-10 transition-all duration-[2s] ease-out"
            style={{
              opacity: heroPhase >= 4 ? 1 : 0,
              transform: heroPhase >= 4 ? 'translateY(0)' : 'translateY(10px)',
            }}>
            {!started ? (
              <div className="flex flex-col items-center gap-5">
                <button onClick={handleStart}
                  className="px-10 py-4 rounded-full transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    background: P.accent,
                    color: 'white',
                    fontFamily: sans, fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.04em',
                    boxShadow: '0 4px 30px rgba(200,62,136,0.25)',
                    border: 'none', cursor: 'pointer',
                  }}>
                  I want in
                </button>
                <p style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textFaint }}>
                  Launching soon · By application only
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-fade-in">
                <p style={{ fontFamily: serif, fontSize: '1rem', fontStyle: 'italic', color: P.textSoft }}>
                  Let's get to know each other.
                </p>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none" className="mt-2 animate-float" style={{ opacity: 0.25 }}>
                  <path d="M8 4v16m0 0l-5-5m5 5l5-5" stroke={P.textSoft} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Manifesto — anchored to bottom of hero viewport */}
        <p className="absolute bottom-8 left-0 right-0 text-center px-6"
          style={{
            fontFamily: serif,
            fontSize: 'clamp(0.9rem, 2.5vw, 1.15rem)',
            fontStyle: 'italic',
            fontWeight: 300,
            color: P.textSoft,
            animation: 'manifesto-in 2s 4s ease-out both',
          }}>
          For people who want to feel something.
        </p>
      </section>

      {/* ═══ ONBOARDING — Each question is a full-screen moment ═══ */}
      {started && !complete && (
        <section ref={formRef} className="relative min-h-screen flex items-center justify-center px-6 py-20">
          <div className="w-full max-w-md animate-fade-in" key={step}>

            {/* Step counter */}
            <div className="flex items-center justify-center gap-1.5 mb-12">
              {QUESTIONS.map((_, i) => (
                <div key={i} className="rounded-full transition-all duration-500"
                  style={{
                    width: i === step ? '24px' : '5px',
                    height: '5px',
                    background: i < step ? P.accent : i === step ? P.accent : P.textGhost,
                    opacity: i < step ? 0.4 : 1,
                  }} />
              ))}
            </div>

            {/* Question */}
            <h2 className="text-center mb-3"
              style={{
                fontFamily: serif, fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
                fontWeight: 300, fontStyle: 'italic', color: P.text, lineHeight: 1.2,
              }}>
              {currentQ.question}
            </h2>

            {currentQ.sub && (
              <p className="text-center mb-10"
                style={{ fontFamily: sans, fontSize: '0.8rem', color: P.textFaint, lineHeight: 1.5 }}>
                {currentQ.sub}
              </p>
            )}
            {!currentQ.sub && <div className="mb-10" />}

            {/* ── Text input ── */}
            {currentQ.type === 'text' && (
              <div className="flex flex-col items-center">
                <input
                  type={currentQ.id === 'email' ? 'email' : 'text'}
                  value={currentAnswer}
                  onChange={e => setAnswer(currentQ.id, e.target.value)}
                  placeholder={currentQ.placeholder}
                  autoFocus
                  className="w-full max-w-xs px-0 py-3 text-center text-lg tracking-wide bg-transparent border-0 border-b-[1.5px] focus:outline-none transition-all duration-500"
                  style={{
                    fontFamily: sans, color: P.text,
                    borderBottomColor: currentAnswer ? P.accent : P.textGhost,
                    caretColor: P.accent,
                  }}
                />
              </div>
            )}

            {/* ── Age input — smooth, not a range picker ── */}
            {currentQ.type === 'age' && (
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={ageValue}
                  onChange={e => {
                    const v = e.target.value
                    if (v === '' || (parseInt(v) >= 0 && parseInt(v) <= 99)) setAgeValue(v)
                  }}
                  placeholder="25"
                  min={18} max={99}
                  autoFocus
                  className="w-24 px-0 py-3 text-center text-4xl tracking-wide bg-transparent border-0 border-b-[1.5px] focus:outline-none transition-all duration-500"
                  style={{
                    fontFamily: serif, fontWeight: 300, color: P.text,
                    borderBottomColor: ageValue ? P.accent : P.textGhost,
                    caretColor: P.accent,
                    /* hide spinners */
                    MozAppearance: 'textfield',
                  }}
                />
                {ageValue && parseInt(ageValue) < 18 && (
                  <p className="mt-4 text-center" style={{ fontFamily: sans, fontSize: '0.75rem', color: '#FF6B6B' }}>
                    You must be 18 or older to join Pulse.
                  </p>
                )}
              </div>
            )}

            {/* ── Choice grid ── */}
            {currentQ.type === 'choice' && (
              <div className={`flex flex-wrap justify-center gap-3 ${currentQ.options.length > 5 ? 'max-w-sm mx-auto' : ''}`}>
                {currentQ.options.map(opt => {
                  const selected = currentAnswer === opt.label
                  return (
                    <button key={opt.label}
                      onClick={() => handleChoiceSelect(currentQ.id, opt.label)}
                      className="flex items-center gap-2.5 px-5 py-3.5 rounded-full transition-all duration-400 hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: selected
                          ? 'linear-gradient(135deg, rgba(200,62,136,0.12), rgba(200,62,136,0.06))'
                          : 'rgba(42,37,40,0.03)',
                        border: `1px solid ${selected ? P.accent : P.border}`,
                        color: selected ? P.accent : P.textSoft,
                        fontFamily: sans, fontSize: '0.9rem',
                        boxShadow: selected ? '0 2px 16px rgba(200,62,136,0.1)' : 'none',
                        cursor: 'pointer',
                      }}>
                      {opt.icon && <span className="text-base">{opt.icon}</span>}
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Custom city text input (when "Somewhere else" selected) ── */}
            {currentQ.type === 'choice' && currentQ.id === 'city' && showCustomCity && (
              <div className="flex flex-col items-center mt-8 animate-fade-in">
                <p className="mb-4" style={{ fontFamily: sans, fontSize: '0.8rem', color: P.textSoft }}>
                  We love that. Tell us where.
                </p>
                <input
                  type="text"
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && customCity.trim()) { e.stopPropagation(); handleCustomCitySubmit() } }}
                  placeholder="Your city"
                  autoFocus
                  className="w-full max-w-xs px-0 py-3 text-center text-lg tracking-wide bg-transparent border-0 border-b-[1.5px] focus:outline-none transition-all duration-500"
                  style={{
                    fontFamily: sans, color: P.text,
                    borderBottomColor: customCity.trim() ? P.accent : P.textGhost,
                    caretColor: P.accent,
                  }}
                />
                <button onClick={handleCustomCitySubmit} disabled={!customCity.trim()}
                  className="mt-6 px-8 py-3 rounded-full transition-all duration-500"
                  style={{
                    background: customCity.trim() ? P.accent : 'transparent',
                    color: customCity.trim() ? 'white' : P.textGhost,
                    border: `1px solid ${customCity.trim() ? P.accent : P.border}`,
                    fontFamily: sans, fontSize: '0.85rem', fontWeight: 500,
                    cursor: customCity.trim() ? 'pointer' : 'default',
                    boxShadow: customCity.trim() ? '0 4px 20px rgba(200,62,136,0.2)' : 'none',
                  }}>
                  Continue
                </button>
              </div>
            )}

            {/* ── Photo upload ── */}
            {currentQ.type === 'photo' && (
              <div className="flex flex-col items-center gap-6">
                <div className="relative cursor-pointer group"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePhotoUpload(f) }}>
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden flex items-center justify-center transition-all duration-700"
                    style={{
                      border: currentAnswer ? `3px solid ${P.accent}` : `2px dashed ${P.textGhost}`,
                      background: currentAnswer ? 'transparent' : 'rgba(42,37,40,0.02)',
                      boxShadow: currentAnswer ? `0 0 50px ${P.accentGlow}, 0 0 100px rgba(200,62,136,0.04)` : 'none',
                    }}>
                    {currentAnswer ? (
                      <img src={currentAnswer} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 px-6">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: P.accentSoft }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14m-7-7h14" stroke={P.accent} strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span style={{ fontFamily: sans, fontSize: '0.75rem', color: P.textFaint }}>
                          Tap to upload
                        </span>
                      </div>
                    )}
                  </div>
                  {currentAnswer && (
                    <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span style={{ fontFamily: sans, fontSize: '0.75rem', color: 'white' }}>Change</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }} />
              </div>
            )}

            {/* Continue button (text + age + photo only — choices auto-advance) */}
            {(currentQ.type === 'text' || currentQ.type === 'age' || currentQ.type === 'photo') && (
              <div className="flex flex-col items-center mt-10">
                <button onClick={nextStep} disabled={!canProceed}
                  className="px-8 py-3 rounded-full transition-all duration-500"
                  style={{
                    background: canProceed ? P.accent : 'transparent',
                    color: canProceed ? 'white' : P.textGhost,
                    border: `1px solid ${canProceed ? P.accent : P.border}`,
                    fontFamily: sans, fontSize: '0.85rem', fontWeight: 500,
                    cursor: canProceed ? 'pointer' : 'default',
                    boxShadow: canProceed ? '0 4px 20px rgba(200,62,136,0.2)' : 'none',
                  }}>
                  {step === TOTAL_STEPS - 1 ? 'Apply' : 'Continue'}
                </button>
                {canProceed && (
                  <p className="mt-3" style={{ fontFamily: sans, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textGhost }}>
                    press Enter ↵
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ COMPLETION — You've been accepted ═══ */}
      {complete && (
        <section className="relative min-h-screen flex items-center justify-center px-6">
          <div className="flex flex-col items-center text-center max-w-sm w-full">

            {/* Photo with glow */}
            <div className="mb-10 transition-all duration-[1.5s] ease-out"
              style={{ opacity: completePhase >= 1 ? 1 : 0, transform: completePhase >= 1 ? 'scale(1)' : 'scale(0.5)' }}>
              {answers.photo ? (
                <div className="relative">
                  <div className="absolute inset-[-20px] rounded-full"
                    style={{
                      background: `radial-gradient(circle, rgba(200,62,136,0.15) 0%, transparent 70%)`,
                      animation: 'glow-pulse 3s ease-in-out infinite',
                    }} />
                  <div className="w-28 h-28 rounded-full overflow-hidden relative z-10"
                    style={{ border: `2.5px solid ${P.accent}`, boxShadow: '0 0 50px rgba(200,62,136,0.12)' }}>
                    <img src={answers.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center z-20"
                    style={{ background: P.accent, boxShadow: '0 2px 12px rgba(200,62,136,0.3)' }}>
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

            {/* Welcome — tight, personal */}
            <h2 className="mb-2 transition-all duration-[1.8s] ease-out"
              style={{
                fontFamily: serif,
                fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 300, fontStyle: 'italic',
                color: P.text,
                opacity: completePhase >= 2 ? 1 : 0,
                transform: completePhase >= 2 ? 'translateY(0)' : 'translateY(12px)',
              }}>
              You're in, {answers.firstName}.
            </h2>

            <p className="transition-all duration-[1.8s] ease-out"
              style={{ fontFamily: sans, fontSize: '0.82rem', color: P.textSoft, opacity: completePhase >= 2 ? 1 : 0, lineHeight: 1.6 }}>
              You're on the list. We go live soon.
            </p>

            {/* Position badge */}
            <div className="mt-6 transition-all duration-[2s] ease-out"
              style={{ opacity: completePhase >= 3 ? 1 : 0, transform: completePhase >= 3 ? 'translateY(0)' : 'translateY(8px)' }}>
              <div className="px-7 py-3 rounded-full"
                style={{ background: P.accentSoft, border: `1px solid ${P.accentBorder}` }}>
                <p style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 500, color: P.accent }}>
                  #{waitlistNumber} in line · {answers.city || 'UAE'}
                </p>
              </div>
            </div>

            {/* ── Share ── */}
            <div className="mt-12 w-full flex flex-col items-center gap-6 transition-all duration-[3s] ease-out"
              style={{ opacity: completePhase >= 3 ? 1 : 0, transform: completePhase >= 3 ? 'translateY(0)' : 'translateY(16px)' }}>

              <p style={{ fontFamily: serif, fontSize: '1rem', fontStyle: 'italic', color: P.text }}>
                Know someone who belongs here?
              </p>

              {/* Primary: share the link */}
              <button onClick={handleShare}
                className="px-8 py-3 rounded-full transition-all duration-500 hover:scale-[1.03] active:scale-[0.97]"
                style={{
                  background: P.accent,
                  color: 'white',
                  fontFamily: sans, fontSize: '0.85rem', fontWeight: 500,
                  boxShadow: '0 4px 24px rgba(200,62,136,0.25)',
                  border: 'none', cursor: 'pointer',
                }}>
                {copiedLink ? 'Link copied' : 'Send them Pulse'}
              </button>

              {/* Secondary: save personalized card */}
              {shareCardUrl && (
                <button onClick={handleSaveCard}
                  className="transition-all duration-500 hover:opacity-80"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: sans, fontSize: '0.72rem', color: P.textFaint,
                    textDecoration: 'underline', textUnderlineOffset: '3px',
                  }}>
                  Save your personal invite card
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative px-6 py-6 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <a href="mailto:jamal@hakadian.com"
            className="transition-colors duration-500"
            style={{ fontFamily: sans, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: P.textGhost, textDecoration: 'none' }}>
            Contact
          </a>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes pulse-ring {
          0% {
            width: 550px; height: 550px;
            opacity: 0;
            border-color: rgba(200,62,136,0);
          }
          8% {
            opacity: 0.2;
            border-color: rgba(200,62,136,0.18);
          }
          50% {
            opacity: 0.07;
            border-color: rgba(200,62,136,0.07);
          }
          100% {
            width: 1400px; height: 1400px;
            opacity: 0;
            border-color: rgba(200,62,136,0);
          }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        @keyframes manifesto-in {
          0% { opacity: 0; transform: translateY(12px); letter-spacing: 0.15em; }
          100% { opacity: 1; transform: translateY(0); letter-spacing: 0; }
        }
        .animate-float { animation: float 2s ease-in-out infinite; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  )
}
