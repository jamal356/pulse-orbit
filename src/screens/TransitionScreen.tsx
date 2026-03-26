import { useState, useEffect } from 'react'
import { candidates } from '../data/people'

interface Props {
  dateIndex: number
  onNavigate: () => void
}

const TOTAL = 10

export default function TransitionScreen({ dateIndex, onNavigate }: Props) {
  const nextPerson = candidates[dateIndex] || candidates[0]
  const [count, setCount] = useState(TOTAL)
  const [showSkip, setShowSkip] = useState(false)
  const [showCard, setShowCard] = useState(false)

  // Lock body scroll
  useEffect(() => {
    const prev = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
      document.body.style.overflow = prevBody
    }
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => setShowCard(true), 300)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(onNavigate, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onNavigate])

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 4000)
    return () => clearTimeout(skipTimer)
  }, [])

  const barWidth = (count / TOTAL) * 100

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center" style={{ background: '#2A2A2E' }}>

      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(224,64,160,0.04) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">

        {/* Session progress dots */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map(i => {
            const completed = i <= dateIndex
            const current = i === dateIndex + 1
            return (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width: current ? 12 : 10,
                  height: current ? 12 : 10,
                  borderRadius: '50%',
                  background: completed ? '#E040A0' : current ? '#E040A0' : 'transparent',
                  border: !completed && !current ? '1.5px solid rgba(255,255,255,0.15)' : 'none',
                  boxShadow: completed ? '0 0 8px rgba(224,64,160,0.5)' : current ? '0 0 12px rgba(224,64,160,0.6)' : 'none',
                  animation: current ? 'dot-pulse 1.2s ease-in-out infinite' : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Up next label */}
        <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[#B0B0B8] mb-5 font-medium">
          Up Next — Date {dateIndex + 1} of 5
        </p>

        {/* Next person card */}
        <div
          className="w-full glass-tile rounded-2xl p-6 mb-8"
          style={{
            opacity: showCard ? 1 : 0,
            transform: showCard ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="flex items-center gap-4">
            <img
              src={nextPerson.photo}
              alt={nextPerson.name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
              style={{ boxShadow: '0 0 0 2px #E040A0, 0 0 16px rgba(224,64,160,0.30)' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-xl text-white">{nextPerson.name}</p>
              <p className="text-sm text-[#E0E0E5]">{nextPerson.age} · {nextPerson.location}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {nextPerson.tags.map(tag => (
              <span key={tag} className="text-[0.7rem] px-2.5 py-1 rounded-full font-medium bg-[rgba(224,64,160,0.10)] text-[#E040A0] border border-[rgba(224,64,160,0.20)]">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <p className="text-[0.7rem] tracking-[0.15em] uppercase text-[#B0B0B8] mb-1 font-medium">
          Meeting {nextPerson.name} in
        </p>
        <div
          className="text-6xl md:text-7xl font-display font-semibold text-[#E040A0] mb-1"
          style={{ lineHeight: 1 }}
        >
          {count}
        </div>
        <p className="text-sm text-[#E0E0E5] mb-6">seconds</p>

        {/* Progress bar */}
        <div className="w-full max-w-xs h-[2px] rounded-full overflow-hidden mb-8" style={{ background: '#363639' }}>
          <div
            className="h-full rounded-full bg-[#E040A0]"
            style={{ width: `${barWidth}%`, transition: 'width 1s linear' }}
          />
        </div>

        {/* Skip */}
        <button
          onClick={onNavigate}
          className="transition-all duration-500"
          style={{
            opacity: showSkip ? 1 : 0,
            pointerEvents: showSkip ? 'auto' : 'none',
            transform: showSkip ? 'translateY(0)' : 'translateY(8px)',
            color: '#7A7A80',
            fontSize: '0.85rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F5F5F7')}
          onMouseLeave={e => (e.currentTarget.style.color = '#7A7A80')}
        >
          Skip →
        </button>
      </div>

      <style>{`
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
