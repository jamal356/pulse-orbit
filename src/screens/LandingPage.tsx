import { useEffect, useRef, useState } from 'react'

interface Props {
  onEnter: () => void
  onDemo: () => void
}

export default function LandingPage({ onEnter, onDemo }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState(0)

  /* ââ Premium fonts ââ */
  useEffect(() => {
    const link = document.createElement('link')
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=Inter:wght@200;300;400&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      link.parentNode?.removeChild(link)
    }
  }, [])

  /* ââ Choreographed entrance ââ */
  useEffect(() => {
    const delays = [100, 700, 1500, 2300, 3100, 3700]
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [])

  /* ââ Particle field ââ */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let id: number
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = innerWidth + 'px'
      canvas.style.height = innerHeight + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const pts = Array.from({ length: 24 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 0.9 + 0.2,
      a: Math.random() * 0.2 + 0.03,
    }))

    const loop = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -5) p.x = innerWidth + 5
        if (p.x > innerWidth + 5) p.x = -5
        if (p.y < -5) p.y = innerHeight + 5
        if (p.y > innerHeight + 5) p.y = -5
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,62,136,${p.a})`
        ctx.fill()
      }
      id = requestAnimationFrame(loop)
    }
    loop()
    addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(id)
      removeEventListener('resize', resize)
    }
  }, [])

  /* ââ Helpers ââ */
  const reveal = (s: number): React.CSSProperties => ({
    opacity: step >= s ? 1 : 0,
    transform: step >= s ? 'translateY(0)' : 'translateY(14px)',
    transition:
      'opacity 1.2s cubic-bezier(0.16,1,0.3,1), transform 1.2s cubic-bezier(0.16,1,0.3,1)',
  })

  const RING_R = 140
  const RING_C = 2 * Math.PI * RING_R

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#08070b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: '"Inter",-apple-system,BlinkMacSystemFont,sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: '140vmax',
          height: '140vmax',
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(200,62,136,0.035) 0%,rgba(200,62,136,0.008) 45%,transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Vignette for depth */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 65% 55% at 50% 48%,transparent 0%,rgba(4,3,6,0.5) 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ââ The Ring ââ */}
      <svg
        viewBox="0 0 300 300"
        style={{
          position: 'absolute',
          width: 'min(460px, 80vw)',
          height: 'min(460px, 80vw)',
          zIndex: 1,
          overflow: 'visible' as const,
          animation: step >= 1 ? 'ringBreathe 6s ease-in-out infinite' : 'none',
        }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="150"
          cy="150"
          r={RING_R}
          fill="none"
          stroke="rgba(200,62,136,0.15)"
          strokeWidth="0.5"
          filter="url(#glow)"
          style={{
            strokeDasharray: RING_C,
            strokeDashoffset: step >= 1 ? 0 : RING_C,
            transition: 'stroke-dashoffset 2.8s cubic-bezier(0.65,0,0.35,1)',
          }}
        />
      </svg>

      {/* ââ Content ââ */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 32px',
          marginTop: '-2vh',
        }}
      >
        {/* Wordmark + heartbeat */}
        <div
          style={{
            ...reveal(2),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '28px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 200,
              letterSpacing: '0.42em',
              color: 'rgba(200,62,136,0.65)',
              textTransform: 'uppercase' as const,
            }}
          >
            Pulse
          </span>
          <svg
            width="44"
            height="14"
            viewBox="0 0 100 60"
            style={{ overflow: 'visible' }}
          >
            <path
              d="M0,30 L25,30 L32,30 L36,8 L42,52 L48,22 L52,38 L56,28 L62,30 L100,30"
              fill="none"
              stroke="rgba(200,62,136,0.4)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 180,
                strokeDashoffset: step >= 2 ? 0 : 180,
                transition:
                  'stroke-dashoffset 1.8s cubic-bezier(0.65,0,0.35,1) 0.2s',
              }}
            />
          </svg>
        </div>

        {/* Tagline */}
        <h1
          style={{
            ...reveal(3),
            fontFamily: '"Cormorant Garamond",Georgia,serif',
            fontSize: 'clamp(36px, 7.5vw, 58px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.93)',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textAlign: 'center' as const,
          }}
        >
          You&apos;ll know.
        </h1>

        {/* Subtitle */}
        <p
          style={{
            ...reveal(4),
            fontSize: 'clamp(13px, 2.4vw, 16px)',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.32)',
            margin: '20px 0 0',
            letterSpacing: '0.03em',
            textAlign: 'center' as const,
            lineHeight: 1.6,
          }}
        >
          The first date you&apos;ll actually remember.
        </p>

        {/* CTA */}
        <button
          onClick={onEnter}
          className="active:scale-95 transition-transform"
          style={{
            ...reveal(5),
            marginTop: '48px',
            padding: '15px 56px',
            background: 'transparent',
            border: 'none',
            boxShadow: 'inset 0 0 0 1px rgba(200,62,136,0.3)',
            borderRadius: '100px',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '11.5px',
            fontWeight: 300,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, {
              background: 'rgba(200,62,136,0.08)',
              color: 'rgba(255,255,255,0.95)',
              boxShadow: 'inset 0 0 0 1px rgba(200,62,136,0.5), 0 0 40px rgba(200,62,136,0.08)',
            })
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              background: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              boxShadow: 'inset 0 0 0 1px rgba(200,62,136,0.3)',
            })
          }}
        >
          Get Started
        </button>
      </div>

      {/* ââ Footer ââ */}
      <div
        style={{
          ...reveal(6),
          position: 'absolute',
          bottom: 'max(28px, env(safe-area-inset-bottom, 16px))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 300,
            letterSpacing: '0.32em',
            color: 'rgba(255,255,255,0.16)',
            textTransform: 'uppercase' as const,
          }}
        >
          UAE&ensp;&middot;&ensp;Launching Soon&ensp;&middot;&ensp;By Application
          Only
        </span>
        <button
          onClick={onDemo}
          className="active:opacity-60 transition-opacity"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.1)',
            fontSize: '8px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: '4px 8px',
            transition: 'color 0.4s',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = 'rgba(200,62,136,0.4)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.1)')
          }
        >
          Investor Walkthrough
        </button>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes ringBreathe {
          0%, 100% {
            filter: drop-shadow(0 0 18px rgba(200,62,136,0.04))
                    drop-shadow(0 0 40px rgba(200,62,136,0.02));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 28px rgba(200,62,136,0.07))
                    drop-shadow(0 0 55px rgba(200,62,136,0.03));
            transform: scale(1.004);
          }
        }
      `}</style>
    </div>
  )
}
