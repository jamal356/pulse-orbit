import { useState, useEffect } from 'react'
import { candidates } from '../data/people'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  dateIndex: number
  onRate: (name: string, rating: 'like' | 'pass') => void
}

export default function MatchSurvey({ dateIndex, onRate }: Props) {
  const person = candidates[dateIndex] || candidates[0]
  const [visible, setVisible] = useState(false)
  const [decided, setDecided] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  const handleRate = (rating: 'like' | 'pass') => {
    setDecided(true)
    setTimeout(() => {
      onRate(person.name, rating)
    }, 800)
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-[#2A2A2E]">
      <BackgroundOrbs />

      <div className={`relative z-10 flex flex-col items-center px-6 max-w-md w-full transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Header */}
        <p className="text-[0.7rem] tracking-[0.25em] uppercase text-[#B0B0B8] mb-6 font-medium">
          Date {dateIndex + 1} of 5 complete
        </p>

        {/* Person photo */}
        <div className="relative mb-6">
          <img
            src={person.photo}
            alt={person.name}
            className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover"
            style={{ border: '3px solid #E040A0', boxShadow: '0 8px 30px rgba(224,64,160,0.15)' }}
          />
        </div>

        {/* Person name */}
        <h2 className="text-2xl md:text-3xl font-bold font-display mb-1 text-white">{person.name}, {person.age}</h2>
        <p className="text-sm text-[#98989D] mb-2">{person.location}</p>
        <p className="text-sm text-[#E0E0E5] italic mb-8 text-center">{person.bio}</p>

        {/* The question */}
        <h3
          className="text-xl md:text-2xl font-display italic mb-10 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: '#F5F5F7' }}
        >
          Did you feel the chemistry?
        </h3>

        {/* Like / Pass buttons */}
        <div className={`flex gap-5 w-full max-w-xs transition-all duration-500 ${decided ? 'opacity-30 pointer-events-none scale-95' : ''}`}>
          <button
            onClick={() => handleRate('pass')}
            className="flex-1 glass-button rounded-2xl py-5 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="text-3xl">❄️</span>
            <span className="text-sm font-semibold text-[#E0E0E5]">Not this time</span>
          </button>

          <button
            onClick={() => handleRate('like')}
            className="flex-1 rounded-2xl py-5 flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            style={{
              backgroundColor: 'rgba(224,64,160,0.10)',
              border: '1px solid rgba(224,64,160,0.25)',
              boxShadow: '0 2px 8px rgba(224,64,160,0.08)',
            }}
          >
            <span className="text-3xl">🔥</span>
            <span className="text-sm font-semibold text-[#E040A0]">I felt it</span>
          </button>
        </div>

        {decided && (
          <div className="mt-6 animate-scale-in">
            <div className="w-5 h-5 rounded-full bg-[#E040A0] animate-pulse mx-auto" style={{ boxShadow: '0 0 20px rgba(224,64,160,0.4)' }} />
          </div>
        )}
      </div>
    </div>
  )
}
