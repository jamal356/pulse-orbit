import { useState, useEffect, useMemo } from 'react'
import { candidates } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  ratings: Record<string, 'like' | 'pass'>
  onRestart: () => void
}

// Simulate their ratings — some mutual, some not
const theirRatings: Record<string, 'like' | 'pass'> = {
  Sofia: 'like',
  Layla: 'pass',
  Amira: 'like',
  Nour: 'like',
  Yasmine: 'pass',
}

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

function makeConfetti(count: number): ConfettiPiece[] {
  const colors = ['#E040A0', '#F050B0', '#6060FF', '#30D158', '#FF9F0A', '#C82E88', '#B0B0FF']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 3 + Math.random() * 4,
  }))
}

export default function MatchResults({ ratings, onRestart }: Props) {
  const [visible, setVisible] = useState(false)
  const [revealIndex, setRevealIndex] = useState(-1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confetti] = useState(() => makeConfetti(60))
  const [showSummary, setShowSummary] = useState(false)

  const mutualMatches = useMemo(() => {
    return candidates.filter(c =>
      ratings[c.name] === 'like' && theirRatings[c.name] === 'like'
    )
  }, [ratings])

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)

    // Staggered reveal
    candidates.forEach((_, i) => {
      setTimeout(() => setRevealIndex(i), 1200 + i * 600)
    })

    // Show confetti and summary after all reveals
    setTimeout(() => {
      setShowConfetti(true)
      setTimeout(() => setShowSummary(true), 800)
    }, 1200 + candidates.length * 600 + 400)
  }, [])

  return (
    <div className="min-h-screen bg-[#2A2A2E] relative overflow-hidden">
      <BackgroundOrbs />

      {/* Confetti */}
      {showConfetti && mutualMatches.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-30">
          {confetti.map(p => (
            <div
              key={p.id}
              className="absolute top-0 rounded-full"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size * 1.5}px`,
                backgroundColor: p.color,
                animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between glass-strong">
        <h1 className="text-2xl font-bold font-display text-[#E040A0]">Pulse</h1>
        <div className="glass-button rounded-full px-4 py-1.5 text-sm text-[#98989D]">Session Complete</div>
      </header>

      <div className={`relative z-10 max-w-lg mx-auto px-4 pb-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Title */}
        <div className="text-center pt-8 pb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Your Matches</h2>
          <p className="text-sm text-[#98989D]">Let's see who felt the chemistry too.</p>
        </div>

        {/* Results cards */}
        <div className="space-y-3 mb-10">
          {candidates.map((person, i) => {
            const isRevealed = i <= revealIndex
            const yourRating = ratings[person.name] || 'pass'
            const theirRating = theirRatings[person.name]
            const isMutual = yourRating === 'like' && theirRating === 'like'

            return (
              <div
                key={person.name}
                className={`glass-tile rounded-2xl overflow-hidden transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isMutual && isRevealed ? 'ring-1 ring-[rgba(224,64,160,0.40)]' : ''}`}
                style={isMutual && isRevealed ? { boxShadow: '0 4px 20px rgba(224,64,160,0.15)' } : {}}
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Photo */}
                  <img
                    src={person.photo}
                    alt={person.name}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    style={{ border: isMutual && isRevealed ? '2px solid #E040A0' : '2px solid rgba(255,255,255,0.15)' }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{person.name}, {person.age}</p>
                    <p className="text-xs text-[#98989D]">{person.location}</p>
                  </div>

                  {/* Result */}
                  {isRevealed ? (
                    <div className="shrink-0 text-center animate-scale-in">
                      {isMutual ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="px-3 py-1.5 rounded-full bg-[rgba(224,64,160,0.15)] border border-[rgba(224,64,160,0.25)]">
                            <span className="text-sm font-bold text-[#E040A0]">💫 Match!</span>
                          </div>
                        </div>
                      ) : yourRating === 'like' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-[#7A7A80]">You liked</span>
                          <span className="text-xs text-[#7A7A80]">They passed</span>
                        </div>
                      ) : theirRating === 'like' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs text-[#7A7A80]">They liked</span>
                          <span className="text-xs text-[#7A7A80]">You passed</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7A7A80]">No match</span>
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 w-10 h-10 glass-button rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#7A7A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Mutual match action */}
                {isMutual && isRevealed && (
                  <div className="px-4 pb-4 animate-slide-up" style={{ animationDuration: '0.3s' }}>
                    <button className="w-full rounded-xl py-3 text-sm font-semibold bg-[#E040A0] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Send {person.name} a Message
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {showSummary && (
          <div className="animate-slide-up space-y-6">
            {/* Match summary */}
            <div className="glass-tile rounded-2xl p-6 text-center">
              <h3 className="text-xs tracking-[0.3em] uppercase text-[#B0B0B8] font-semibold mb-4">Session Summary</h3>
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#E040A0] font-display">5</p>
                  <p className="text-xs text-[#98989D] mt-1">People Met</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#E040A0] font-display">{mutualMatches.length}</p>
                  <p className="text-xs text-[#98989D] mt-1">Mutual Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#E040A0] font-display">25</p>
                  <p className="text-xs text-[#98989D] mt-1">Minutes Total</p>
                </div>
              </div>

              {mutualMatches.length > 0 ? (
                <p className="text-sm text-[#E0E0E5] leading-relaxed">
                  {mutualMatches.length} mutual {mutualMatches.length === 1 ? 'match' : 'matches'} tonight.
                  Contact details have been shared. No more guessing — just real connection.
                </p>
              ) : (
                <p className="text-sm text-[#E0E0E5] leading-relaxed">
                  No mutual matches tonight — and that's okay. Every session is different.
                  The next one starts tomorrow.
                </p>
              )}
            </div>

            {/* The investor insight */}
            <div className="glass-tile rounded-2xl p-6">
              <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-4 text-center">What Just Happened</h3>
              <div className="space-y-4">
                {[
                  { metric: '25 minutes', insight: 'vs. 3+ hours of texting on traditional apps' },
                  { metric: 'Zero catfishing', insight: 'Camera on means what you see is what you get' },
                  { metric: 'Instant clarity', insight: 'You knew within seconds if there was chemistry' },
                  { metric: 'No time wasted', insight: 'Every interaction was face-to-face and real' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#E040A0] mt-2 shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-white">{item.metric}</span>
                      <span className="text-sm text-[#98989D]"> — {item.insight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA: Book next session / Restart demo */}
            <div className="space-y-3">
              <button className="w-full py-4 rounded-full bg-[#E040A0] text-white text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.3)' }}>
                Book Next Session — AED 75
              </button>
              <button
                onClick={onRestart}
                className="w-full py-3 rounded-full glass-button text-sm font-semibold text-[#98989D] hover:text-white transition-colors"
              >
                ← Back to Pitch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
