import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  onClose: () => void
}

/* ─── AURA — Pulse's AI Concierge ─────────────────────────
   Not a chatbot. Not a help desk widget. Aura is the intelligence
   layer of Pulse — she knows your preferences, your history,
   and how to make your experience better.

   Design philosophy (Ive/Jobs):
   - Form follows function: she's a presence, not an icon
   - Her visual is a breathing gradient orb — alive, warm, ambient
   - She speaks in first person, has personality, remembers context
   - No "How can I help you?" corporate speak
   - Integrated into the product, not bolted on

   Production: powered by Claude API with full user context.
   Handles: billing, safety, tech support, date coaching,
   session recommendations, profile optimization.
   ──────────────────────────────────────────────────────────── */

interface Message {
  id: number
  role: 'user' | 'aura'
  text: string
}

const DEMO_CONVERSATION: { role: 'user' | 'aura'; text: string }[] = [
  { role: 'user', text: 'How do I upgrade to Premium?' },
  { role: 'aura', text: 'Premium gives you unlimited Quick Matches — 1-to-1 speed dates whenever you get a mutual like. It\'s AED 99/month. You\'ve already had 3 matches this week, so you\'d get a lot of value from it. Want me to set it up?' },
  { role: 'user', text: 'Someone was rude during my last call' },
  { role: 'aura', text: 'I\'m sorry that happened. I\'ve flagged the session for review — our moderation system will look at it within minutes. That person won\'t appear in your matches again. If you ever feel uncomfortable during a call, tap the shield icon to end it immediately. Your safety comes first.' },
  { role: 'user', text: 'My camera was laggy last session' },
  { role: 'aura', text: 'I checked your last session — your connection dropped to 3G briefly around minute 3, which caused the lag. Try WiFi next time and close background apps. I\'ve added a complimentary session to your account as a courtesy.' },
]

const SUGGESTIONS = [
  'Upgrade my plan',
  'Report someone',
  'Fix video quality',
  'How does matching work?',
]

export default function AiSupport({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [visible, setVisible] = useState(false)
  const [typing, setTyping] = useState(false)
  const [demoStep, setDemoStep] = useState(-1) // -1 = aura intro
  const [orbPulse, setOrbPulse] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(0)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    // Aura's intro — she speaks first, with personality
    const timer = setTimeout(() => {
      setOrbPulse(true)
      setTimeout(() => {
        const id = msgIdRef.current++
        setMessages([{ id, role: 'aura', text: 'Hey — I\'m Aura, your Pulse concierge. I can help with anything from upgrading your plan to fixing a glitchy call. What\'s on your mind?' }])
        setOrbPulse(false)
        setDemoStep(0)
      }, 1200)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const playNextStep = useCallback(() => {
    if (demoStep < 0 || demoStep >= DEMO_CONVERSATION.length) return
    const step = DEMO_CONVERSATION[demoStep]

    if (step.role === 'user') {
      const id = msgIdRef.current++
      setMessages(prev => [...prev, { id, role: 'user', text: step.text }])

      // Aura responds
      const nextStep = DEMO_CONVERSATION[demoStep + 1]
      if (nextStep && nextStep.role === 'aura') {
        setTimeout(() => {
          setTyping(true)
          setOrbPulse(true)
          setTimeout(() => {
            setTyping(false)
            setOrbPulse(false)
            const aiId = msgIdRef.current++
            setMessages(prev => [...prev, { id: aiId, role: 'aura', text: nextStep.text }])
            setDemoStep(prev => prev + 2)
          }, 1200 + Math.random() * 800)
        }, 300)
      } else {
        setDemoStep(prev => prev + 1)
      }
    }
  }, [demoStep])

  // Auto-play conversation
  useEffect(() => {
    if (demoStep > 0 && demoStep < DEMO_CONVERSATION.length && demoStep % 2 === 0) {
      const timer = setTimeout(playNextStep, 2000)
      return () => clearTimeout(timer)
    }
    if (demoStep === 0) {
      const timer = setTimeout(playNextStep, 1800)
      return () => clearTimeout(timer)
    }
  }, [demoStep, playNextStep])

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(13,13,17,0.97)', backdropFilter: 'blur(30px)' }}>

      {/* Header — Aura's identity */}
      <header className="shrink-0 px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(224,64,160,0.06)' }}>
        <div className="flex items-center gap-3">
          {/* Aura's orb — a living, breathing light */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Outer glow ring */}
            <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${orbPulse ? 'scale-125 opacity-60' : 'scale-100 opacity-30'}`}
              style={{
                background: 'radial-gradient(circle, rgba(224,64,160,0.3), rgba(128,64,224,0.2), transparent 70%)',
                filter: 'blur(6px)',
              }} />
            {/* Inner orb */}
            <div className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-700 ${orbPulse ? 'scale-110' : 'scale-100'}`}
              style={{
                background: 'radial-gradient(circle at 35% 35%, #E040A0 0%, #8040E0 50%, #4020A0 100%)',
                boxShadow: `0 0 ${orbPulse ? '25' : '12'}px rgba(224,64,160,${orbPulse ? '0.5' : '0.25'})`,
              }}>
              {/* Core light */}
              <div className="w-3 h-3 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(224,64,160,0.6) 100%)',
                  boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                  animation: 'aura-breathe 3s ease-in-out infinite',
                }} />
            </div>
          </div>

          <div>
            <h1 className="text-base font-bold text-white tracking-wide">Aura</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#30D158]" style={{ boxShadow: '0 0 4px rgba(48,209,88,0.5)' }} />
              <span className="text-[0.6rem] text-[#30D158]/80 font-medium">Your Pulse concierge</span>
            </div>
          </div>
        </div>

        <button onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-[#7A7A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {msg.role === 'aura' && (
              <div className="w-6 h-6 rounded-full shrink-0 mr-2.5 mt-1 flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #E040A0, #8040E0)',
                  boxShadow: '0 0 8px rgba(224,64,160,0.3)',
                }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, white, rgba(224,64,160,0.5))' }} />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
            }`}
              style={{
                background: msg.role === 'user'
                  ? 'rgba(224,64,160,0.12)'
                  : 'rgba(255,255,255,0.04)',
                border: msg.role === 'user'
                  ? '1px solid rgba(224,64,160,0.15)'
                  : '1px solid rgba(255,255,255,0.04)',
              }}>
              <p className="text-[0.82rem] text-white/90 leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing — Aura's orb pulses */}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-6 h-6 rounded-full shrink-0 mr-2.5 mt-1 flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #E040A0, #8040E0)',
                boxShadow: '0 0 12px rgba(224,64,160,0.4)',
                animation: 'aura-breathe 1s ease-in-out infinite',
              }}>
              <div className="w-2 h-2 rounded-full" style={{ background: 'radial-gradient(circle, white, rgba(224,64,160,0.5))' }} />
            </div>
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0]" style={{ animation: 'aura-dot 1.4s ease-in-out infinite' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0]" style={{ animation: 'aura-dot 1.4s ease-in-out 0.2s infinite' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#E040A0]" style={{ animation: 'aura-dot 1.4s ease-in-out 0.4s infinite' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick suggestions */}
      <div className="shrink-0 px-5 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {SUGGESTIONS.map(s => (
            <button key={s}
              className="shrink-0 px-3.5 py-2 rounded-full text-[0.7rem] font-medium text-white/50 hover:text-white/80 transition-colors whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[0.82rem] text-white/25 flex-1">Ask Aura anything...</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E040A0, #8040E0)' }}>
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aura-breathe {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes aura-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
