import { useEffect, useRef, useState } from 'react'

interface Props {
  onEnter: () => void
  onDemo: () => void
}

const PK = { r: 200, g: 62, b: 136 }

interface Dot {
  x: number; y: number; vx: number; vy: number
  sz: number; a: number; pk: boolean; ph: number
}

function makeDots(w: number, h: number): Dot[] {
  const n = Math.min(70, Math.floor(w * h / 9000))
  return Array.from({ length: n }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    sz: Math.random() * 2 + 0.5, a: Math.random() * 0.35 + 0.1,
    pk: Math.random() > 0.6, ph: Math.random() * Math.PI * 2,
  }))
}

export default function LandingPage({ onEnter, onDemo }: Props) {
  const cvs = useRef<HTMLCanvasElement>(null)
  const raf = useRef(0)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const c = cvs.current; if (!c) return
    const ctx = c.getContext('2d'); if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    let w = window.innerWidth, h = window.innerHeight
    c.width = w * dpr; c.height = h * dpr
    c.style.width = w + 'px'; c.style.height = h + 'px'
    ctx.scale(dpr, dpr)
    const dots = makeDots(w, h)
    const cd = Math.min(120, w * 0.16)
    const t0 = performance.now()

    const ekg = (b: number) => {
      if (b > .36 && b < .41) return -14 * Math.sin(((b - .36) / .05) * Math.PI)
      if (b > .43 && b < .46) return 10 * Math.sin(((b - .43) / .03) * Math.PI)
      if (b > .46 && b < .53) return -48 * Math.sin(((b - .46) / .07) * Math.PI)
      if (b > .53 && b < .57) return 16 * Math.sin(((b - .53) / .04) * Math.PI)
      if (b > .60 && b < .69) return -18 * Math.sin(((b - .60) / .09) * Math.PI)
      return 0
    }

    const drawHB = (p: number) => {
      const cy = h * 0.40, sx = -w * .1, ex = w * 1.1, tw = ex - sx
      const cx2 = sx + tw * p
      ctx.beginPath(); ctx.moveTo(sx, cy)
      for (let x = sx; x < Math.min(cx2, ex); x += 1.5) {
        ctx.lineTo(x, cy + ekg(((x - sx) / tw * 3) % 1))
      }
      const g = ctx.createLinearGradient(Math.max(sx, cx2 - tw * .25), 0, cx2, 0)
      g.addColorStop(0, 'rgba(200,62,136,0)')
      g.addColorStop(.6, 'rgba(200,62,136,.3)')
      g.addColorStop(1, 'rgba(200,62,136,.65)')
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
      const rg = ctx.createRadialGradient(cx2, cy, 0, cx2, cy, 25)
      rg.addColorStop(0, 'rgba(200,62,136,.5)')
      rg.addColorStop(1, 'rgba(200,62,136,0)')
      ctx.fillStyle = rg; ctx.fillRect(cx2 - 25, cy - 25, 50, 50)
      ctx.beginPath(); ctx.arc(cx2, cy, 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill()
    }

    const frame = () => {
      const t = (performance.now() - t0) / 1000
      ctx.clearRect(0, 0, w, h)
      const fi = Math.min(t / 1.5, 1)

      for (const d of dots) {
        d.x += d.vx; d.y += d.vy
        if (d.x < -10) d.x = w + 10; if (d.x > w + 10) d.x = -10
        if (d.y < -10) d.y = h + 10; if (d.y > h + 10) d.y = -10
        d.a = (Math.sin(t * .4 + d.ph) * .1 + .28) * (d.sz / 2.5)
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < cd) {
            const a2 = (1 - dist / cd) * .08 * fi
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y)
            ctx.strokeStyle = (dots[i].pk || dots[j].pk)
              ? `rgba(200,62,136,${a2})` : `rgba(255,255,255,${a2 * .5})`
            ctx.lineWidth = .5; ctx.stroke()
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.sz, 0, Math.PI * 2)
        ctx.fillStyle = (d.pk ? 'rgba(200,62,136,' : 'rgba(255,255,255,') + (d.a * fi) + ')'
        ctx.fill()
        if (d.pk && d.sz > 1.5) {
          const gl = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.sz * 4)
          gl.addColorStop(0, `rgba(200,62,136,${d.a * .2 * fi})`)
          gl.addColorStop(1, 'rgba(200,62,136,0)')
          ctx.fillStyle = gl; ctx.fillRect(d.x - d.sz * 4, d.y - d.sz * 4, d.sz * 8, d.sz * 8)
        }
      }
      if (t > .6) {
        const p0 = Math.min((t - .6) / 2.6, 1)
        drawHB(p0 < 1 ? p0 : ((t - 3.2) / 4) % 1)
      }

      /* animated pink ring */
      const ringProgress = Math.min(Math.max((t - 0.3) / 1.8, 0), 1)
      const ease = 1 - Math.pow(1 - ringProgress, 3)
      const cx = w / 2, cy2 = h * 0.40
      const outerR = Math.min(w, h) * 0.32 * ease
      const innerR = outerR * 0.62

      if (ringProgress > 0) {
        ctx.save()
        ctx.globalAlpha = ease * 0.25
        ctx.beginPath(); ctx.arc(cx, cy2, outerR, 0, Math.PI * 2)
        ctx.arc(cx, cy2, innerR, 0, Math.PI * 2, true)
        ctx.fillStyle = `rgba(${PK.r},${PK.g},${PK.b},1)`
        ctx.fill()

        /* ring glow */
        const rGlow = ctx.createRadialGradient(cx, cy2, innerR * .8, cx, cy2, outerR * 1.3)
        rGlow.addColorStop(0, 'rgba(200,62,136,0)')
        rGlow.addColorStop(.4, `rgba(200,62,136,${.12 * ease})`)
        rGlow.addColorStop(.7, `rgba(200,62,136,${.06 * ease})`)
        rGlow.addColorStop(1, 'rgba(200,62,136,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = rGlow
        ctx.fillRect(cx - outerR * 1.3, cy2 - outerR * 1.3, outerR * 2.6, outerR * 2.6)

        /* pulse animation on ring */
        const pulsePhase = (t * 1.2) % (Math.PI * 2)
        ctx.globalAlpha = .08 + Math.sin(pulsePhase) * .04
        ctx.beginPath(); ctx.arc(cx, cy2, outerR + 4, 0, Math.PI * 2)
        ctx.arc(cx, cy2, outerR - 2, 0, Math.PI * 2, true)
        ctx.fillStyle = 'rgba(200,62,136,1)'; ctx.fill()
        ctx.restore()
      }

      raf.current = requestAnimationFrame(frame)
    }
    frame()
    const onR = () => {
      w = window.innerWidth; h = window.innerHeight
      c.width = w * dpr; c.height = h * dpr
      c.style.width = w + 'px'; c.style.height = h + 'px'
      ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr, dpr)
    }
    window.addEventListener('resize', onR)
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener('resize', onR) }
  }, [])

  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3400),
      setTimeout(() => setStep(4), 4600),
      setTimeout(() => setStep(5), 5600),
    ]
    return () => ts.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#08060a' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,62,136,0.04) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(200,62,136,0.03) 0%, transparent 50%)', animation: 'lp-amb 5s ease-in-out infinite' }} />
      <canvas ref={cvs} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}>

        {/* PULSE label */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '.7rem', fontWeight: 600,
          letterSpacing: '.35em', textTransform: 'uppercase' as const,
          color: 'rgba(200,62,136,0.7)', marginBottom: 8,
          opacity: step >= 1 ? 1 : 0,
          transform: step >= 1 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 1s cubic-bezier(.16,1,.3,1)',
          filter: step >= 1 ? 'none' : 'blur(8px)',
        }}>Pulse</p>

        {/* Heartbeat icon */}
        <div style={{
          opacity: step >= 1 ? 1 : 0, marginBottom: 14,
          transform: step >= 1 ? 'scale(1)' : 'scale(0.5)',
          transition: 'all 1.2s cubic-bezier(.16,1,.3,1)',
          filter: step >= 1 ? 'none' : 'blur(8px)',
        }}>
          <svg width="56" height="28" viewBox="0 0 56 28" fill="none" style={{ animation: step >= 1 ? 'lp-hb 2s ease-in-out infinite 1.5s' : 'none' }}>
            <path d="M2 14h12l5-12 8 24 5-12h12" stroke="rgba(200,62,136,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Main tagline */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(2rem, 8vw, 3.2rem)', fontWeight: 600, fontStyle: 'italic',
          color: 'white', letterSpacing: '.01em', marginBottom: 10, textAlign: 'center',
          opacity: step >= 2 ? 1 : 0,
          transform: step >= 2 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'all 1.2s cubic-bezier(.16,1,.3,1)',
          filter: step >= 2 ? 'none' : 'blur(10px)',
        }}>You'll know.</h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(.85rem, 3vw, 1rem)',
          color: 'rgba(255,255,255,0.4)', letterSpacing: '.02em', textAlign: 'center',
          opacity: step >= 3 ? 1 : 0,
          transform: step >= 3 ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 1s cubic-bezier(.16,1,.3,1)',
          filter: step >= 3 ? 'none' : 'blur(6px)',
        }}>The first date you'll actually remember.</p>

        {/* CTA */}
        <div style={{
          marginTop: 44,
          opacity: step >= 4 ? 1 : 0,
          transform: step >= 4 ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.9)',
          transition: 'all .9s cubic-bezier(.16,1,.3,1)',
        }}>
          <button onClick={onEnter} className="active:scale-95 transition-transform" style={{
            background: 'linear-gradient(135deg, #c83e88 0%, #9b2d6b 100%)',
            padding: '16px 52px', borderRadius: '999px', color: 'white',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '.95rem',
            letterSpacing: '.03em', border: 'none', cursor: 'pointer',
            boxShadow: '0 0 50px rgba(200,62,136,.2), 0 4px 24px rgba(0,0,0,.4)',
            WebkitTapHighlightColor: 'transparent',
          }}>Get Started</button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-3" style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1.5rem)',
        opacity: step >= 5 ? 1 : 0, transition: 'opacity 1.2s ease',
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: '.6rem', letterSpacing: '.25em',
          textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)',
        }}>UAE &nbsp;·&nbsp; Launching Soon &nbsp;·&nbsp; By Application Only</p>
        <button onClick={onDemo} className="active:opacity-60 transition-opacity" style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,.15)',
          fontSize: '.55rem', letterSpacing: '.2em', textTransform: 'uppercase' as const,
          cursor: 'pointer', padding: '8px 16px',
          fontFamily: "'DM Sans', sans-serif", WebkitTapHighlightColor: 'transparent',
        }}>Investor Walkthrough</button>
      </div>

      <style>{`
        @keyframes lp-amb{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes lp-hb{0%,100%{opacity:.7;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.15)}}
      `}</style>
    </div>
  )
}
