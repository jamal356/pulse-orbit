import { useEffect, useState, useRef } from 'react'
import BackgroundOrbs from '../components/BackgroundOrbs'
import { photos, candidates } from '../data/people'

interface Props {
  onNavigate: () => void
}

const herPhotos: Record<string, string> = {
  Sofia: photos.sofia,
  Layla: photos.layla,
  Amira: photos.amira,
  Nour: photos.nour,
  Yasmine: photos.yasmine,
}

interface ChatMsg {
  id: number
  name: string
  msg: string
}

const hypeMessages = ["Let's go!", 'So excited!', 'Ready!', 'Can\'t wait!']

export default function SessionLobby({ onNavigate }: Props) {
  const [countdown, setCountdown] = useState(120)
  const [visible, setVisible] = useState(false)
  const [joined, setJoined] = useState(3)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { id: 1, name: 'Sofia', msg: 'First time here — nervous!' },
    { id: 2, name: 'Ahmed', msg: 'This is going to be great 🔥' },
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(3)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    // Simulate people joining
    const joinTimer = setInterval(() => {
      setJoined(prev => Math.min(prev + 1, 10))
    }, 3000)

    // Simulate chat
    const names = ['Layla', 'James', 'Nour', 'Amira']
    const msgs = ['Hey everyone!', 'Ready for this ⚡', 'First timer here 👋', 'Let\'s goooo', 'So excited!']
    const chatTimer = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)]
      const msg = msgs[Math.floor(Math.random() * msgs.length)]
      setChatMessages(prev => {
        const next = [...prev, { id: msgIdRef.current++, name, msg }]
        return next.slice(-8)
      })
    }, 4500)

    return () => {
      clearInterval(timer)
      clearInterval(joinTimer)
      clearInterval(chatTimer)
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const sendHype = (msg: string) => {
    setChatMessages(prev => {
      const next = [...prev, { id: msgIdRef.current++, name: 'You', msg }]
      return next.slice(-8)
    })
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="min-h-screen bg-[#2A2A2E] flex flex-col relative overflow-hidden">
      <BackgroundOrbs />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-[#E040A0]">Pulse</h1>
        <div className="glass-button rounded-full px-4 py-1.5 text-sm text-[#E0E0E5]">Tonight's Session</div>
      </header>

      <div className={`relative z-10 flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-6 overflow-hidden transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">

          {/* Session info */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 glass-button rounded-full px-5 py-2 mb-5">
              <div className="w-2 h-2 bg-[#E040A0] rounded-full animate-pulse" />
              <span className="text-sm text-[#E0E0E5]">Live Session Starting Soon</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Tonight — 8:00 PM Dubai</h2>
            <p className="text-[#7A7A80]">5 dates. 5 minutes each. Real people.</p>
          </div>

          {/* Countdown */}
          <div className="glass-tile rounded-2xl px-12 py-7 text-center mb-6">
            <p className="text-[0.7rem] tracking-[0.25em] uppercase text-[#B0B0B8] mb-3 font-medium">Session Begins In</p>
            <div className="text-5xl md:text-6xl font-bold font-mono tracking-wider">
              <span className="text-[#E040A0]">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Participants joining */}
          <div className="w-full max-w-md glass-tile rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[0.7rem] tracking-[0.2em] uppercase text-[#B0B0B8] font-semibold">Participants</span>
              <span className="text-sm font-bold text-[#E040A0]">{joined}/10</span>
            </div>

            {/* Participant avatars */}
            <div className="flex flex-wrap gap-3 mb-4">
              {candidates.map((c, i) => (
                <div key={c.name} className={`flex flex-col items-center gap-1 transition-all duration-500 ${i < joined ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}>
                  <img
                    src={herPhotos[c.name] || ''}
                    alt={c.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[rgba(224,64,160,0.30)]"
                  />
                  <span className="text-[0.65rem] text-[#E0E0E5]">{c.name}</span>
                </div>
              ))}
              {/* Placeholder spots */}
              {Array.from({ length: Math.max(0, 5 - candidates.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-1 opacity-20">
                  <div className="w-10 h-10 rounded-full bg-[#424245] flex items-center justify-center text-[#7A7A80] text-sm">?</div>
                  <span className="text-[0.65rem] text-[#7A7A80]">Waiting</span>
                </div>
              ))}
            </div>

            {/* Fill bar */}
            <div className="h-2 rounded-full bg-[#424245] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#E040A0] transition-all duration-1000 ease-out"
                style={{ width: `${(joined / 10) * 100}%` }}
              />
            </div>
          </div>

          {/* Payment confirmation */}
          <div className="glass-button rounded-full px-6 py-3 mb-6 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#30D158]/15 flex items-center justify-center">
              <svg className="w-3 h-3 text-[#30D158]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-sm text-[#E0E0E5]">Session confirmed — <span className="text-[#E040A0] font-semibold">AED 75</span></span>
          </div>

          <button
            onClick={onNavigate}
            className="group relative px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-[#E040A0] shadow-lg shadow-[rgba(224,64,160,0.25)]"
          >
            <span className="relative text-white flex items-center gap-2.5">
              I'm Ready
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </span>
          </button>
        </div>

        {/* Live Chat Sidebar */}
        <div className="w-full lg:w-72 glass-tile rounded-2xl p-4 flex flex-col max-h-[300px] lg:max-h-none lg:self-stretch">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#7A7A80]/15">
            <div className="w-2 h-2 bg-[#E040A0] rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-[#E0E0E5] tracking-wider uppercase">Live Chat</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 scrollbar-thin scrollbar-thumb-[#7A7A80]/20">
            {chatMessages.map(m => (
              <div key={m.id} className="animate-slide-up" style={{ animationDuration: '0.3s' }}>
                <span className={`text-xs font-semibold ${m.name === 'You' ? 'text-[#E040A0]' : 'text-white'}`}>{m.name}</span>
                <span className="text-xs text-[#E0E0E5] ml-1.5">{m.msg}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hypeMessages.map((msg, i) => (
              <button
                key={i}
                onClick={() => sendHype(msg)}
                className="text-[0.7rem] px-2.5 py-1 rounded-full glass-button text-[#E0E0E5] hover:text-white transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
