/* ═══════════════════════════════════════════════════════════════
   PULSE BRAND MARK

   The symbol: a single heartbeat pulse line. Clean, minimal,
   instantly recognizable. It IS the brand — not decoration.

   Think: Apple's apple. Nike's swoosh. Pulse's pulse.

   Three variants:
   - 'symbol'  → just the pulse line (app icon, favicon, compact)
   - 'wordmark' → "Pulse" text only (when space is tight)
   - 'full'    → pulse line + "Pulse" text (headers, marketing)

   Two color modes:
   - 'accent'  → #C83E88 pink (on light backgrounds)
   - 'white'   → white (on dark/image backgrounds)

   The pulse line animates on mount: a single draw-in that feels
   like a heartbeat appearing. Subtle. Confident. Alive.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  variant?: 'symbol' | 'wordmark' | 'full'
  color?: 'accent' | 'white'
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
  className?: string
}

const sizes = {
  sm: { symbol: 24, text: '1rem', gap: 6 },
  md: { symbol: 32, text: '1.35rem', gap: 8 },
  lg: { symbol: 44, text: '1.8rem', gap: 10 },
}

const colors = {
  accent: '#C83E88',
  white: 'rgba(255,255,255,0.92)',
}

export default function PulseLogo({
  variant = 'full',
  color = 'accent',
  size = 'md',
  animate = true,
  className = '',
}: Props) {
  const s = sizes[size]
  const c = colors[color]

  const PulseSymbol = () => (
    <svg
      width={s.symbol}
      height={s.symbol * 0.5}
      viewBox="0 0 80 40"
      fill="none"
      className={animate ? 'pulse-line-draw' : ''}
    >
      <path
        d="M0 20 H22 L28 6 L34 34 L40 6 L46 34 L52 20 H80"
        stroke={c}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animate ? '200' : '0'}
        strokeDashoffset="0"
      />
    </svg>
  )

  const PulseText = () => (
    <span
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: s.text,
        fontWeight: 600,
        color: c,
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      Pulse
    </span>
  )

  if (variant === 'symbol') {
    return (
      <div className={className}>
        <PulseSymbol />
        <style>{pulseAnimation}</style>
      </div>
    )
  }

  if (variant === 'wordmark') {
    return (
      <div className={className}>
        <PulseText />
      </div>
    )
  }

  // 'full' — symbol + text
  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      <PulseSymbol />
      <PulseText />
      <style>{pulseAnimation}</style>
    </div>
  )
}

const pulseAnimation = `
  @keyframes pulse-draw {
    from { stroke-dashoffset: 200; }
    to { stroke-dashoffset: 0; }
  }
  .pulse-line-draw path {
    animation: pulse-draw 1.2s ease-out forwards;
  }
`
