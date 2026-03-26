interface Props {
  showParticles?: boolean
}

export default function BackgroundOrbs({ showParticles }: Props) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Orb 1: Pulse magenta, top-right */}
      <div
        className="absolute"
        style={{
          width: 600,
          height: 600,
          top: '-10%',
          right: '-5%',
          background: 'radial-gradient(circle, rgba(224,64,160,0.12) 0%, transparent 70%)',
          animation: 'morph-1 18s ease-in-out infinite alternate',
        }}
      />
      {/* Orb 2: Blue-purple, bottom-left */}
      <div
        className="absolute"
        style={{
          width: 800,
          height: 800,
          bottom: '-15%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(96,96,255,0.08) 0%, transparent 70%)',
          animation: 'morph-2 22s ease-in-out infinite alternate',
        }}
      />
      {/* Orb 3: Pulse magenta subtle, center */}
      {showParticles !== false && (
        <div
          className="absolute"
          style={{
            width: 400,
            height: 400,
            top: '40%',
            left: '45%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(224,64,160,0.07) 0%, transparent 70%)',
            animation: 'morph-3 15s ease-in-out infinite alternate',
          }}
        />
      )}
      <style>{`
        @keyframes morph-1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes morph-2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-25px, 30px) scale(0.95); }
        }
        @keyframes morph-3 {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(calc(-50% + 15px), calc(-50% - 15px)) scale(1.04); }
        }
      `}</style>
    </div>
  )
}
