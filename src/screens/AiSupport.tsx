import { useState, useEffect, useRef, useCallback } from 'react'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  onClose: () => void
}

/* ─── AI SUPPORT ──────────────────────────────────────────
   Fully AI-powered customer service. No human agents.
   Demo shows a chat-style interface with typing indicators
   and pre-scripted responses to showcase the capability.

   In production: powered by Claude API for natural conversation,
   handling billing, technical issues, date feedback, safety reports.
   ──────────────────────────────────────────────────────────── */

interface Message {
  id: number
  role: 'user' | 'ai'
  text: string
  time: string
}

const DEMO_CONVERSATION: { role: 'user' | 'ai'; text: string }[] = [
  { role: 'user', text: 'How do I upgrade to Premium?' },
  { role: 'ai', text: 'Premium unlocks 1-to-1 speed dates with your matches, priority session access, and unlimited profile boosts. It\'s AED 99/month — would you like me to take you to the upgrade page?' },
  { role: 'user', text: 'What happens if someone is inappropriate during a video call?' },
  { role: 'ai', text: 'Safety is our top priority. You can tap the shield icon during any call to instantly end it and flag the user. Our AI moderation reviews flags within minutes. Confirmed violations result in immediate account suspension. You\'ll never be matched with that person again.' },
  { role: 'user', text: 'My video quality was poor in the last session' },
  { role: 'ai', text: 'I can see your last session had intermittent connectivity — looks like your connection dipped to 2G briefly around the 3-minute mark. For best results, use WiFi and close background apps. I\'ve credited you a free session as a courtesy. Want me to run a connection test now?' },
]

const QUICK_ACTIONS = [
  { emoji: '💳', label: 'Billing & Plans' },
  { emoji: '🛡️', label: 'Report a User' },
  { emoji: '📹', label: 'Video Issues' },
  { emoji: '❓', label: 'How It Works' },
]

function getNow(): string {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function AiSupport({ onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'ai', text: 'Hi! I\'m Pulse AI — your 24/7 support assistant. I can help with billing, technical issues, safety reports, or anything about how Pulse works. What can I help with?', time: getNow() },
  ])
  const [visible, setVisible] = useState(false)
  const [typing, setTyping] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef(1)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const playDemoStep = useCallback(() => {
    if (demoStep >= DEMO_CONVERSATION.length) return
    const step = DEMO_CONVERSATION[demoStep]

    if (step.role === 'user') {
      // User message appears instantly
      const id = msgIdRef.current++
      setMessages(prev => [...prev, { id, role: 'user', text: step.text, time: getNow() }])
      setDemoStep(prev => prev + 1)

      // Then AI responds with typing delay
      setTimeout(() => {
        setTyping(true)
        const nextStep = DEMO_CONVERSATION[demoStep + 1]
        if (nextStep && nextStep.role === 'ai') {
          setTimeout(() => {
            setTyping(false)
            const aiId = msgIdRef.current++
            setMessages(prev => [...prev, { id: aiId, role: 'ai', text: nextStep.text, time: getNow() }])
            setDemoStep(prev => prev + 1)
          }, 1500 + Math.random() * 1000)
        }
      }, 400)
    }
  }, [demoStep])

  // Auto-play demo conversation
  useEffect(() => {
    if (demoStep === 0) {
      const timer = setTimeout(playDemoStep, 2000)
      return () => clearTimeout(timer)
    }
    if (demoStep > 0 && demoStep < DEMO_CONVERSATION.length && demoStep % 2 === 0) {
      const timer = setTimeout(playDemoStep, 2500)
      return () => clearTimeout(timer)
    }
  }, [demoStep, playDemoStep])

  return (
    <div className="fixed inset-0 bg-[#1a1a1e] flex flex-col overflow-hidden z-[100]">
      <BackgroundOrbs />

      {/* Header */}
      <header className={`relative z-10 shrink-0 px-5 py-3 flex items-center justify-between transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ borderBottom: '1px solid rgba(224,64,160,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E040A0, #8040E0)' }}>
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Pulse AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              <span className="text-[0.65rem] text-[#30D158]">Always online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full glass-button flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
          <svg className="w-5 h-5 text-[#98989D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Quick actions */}
      <div className={`relative z-10 shrink-0 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {QUICK_ACTIONS.map(action => (
          <button key={action.label}
            className="shrink-0 glass-button rounded-full px-4 py-2 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            <span className="text-sm">{action.emoji}</span>
            <span className="text-xs font-semibold text-[#B0B0B8] whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'rounded-br-md'
                : 'rounded-bl-md'
            }`}
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, rgba(224,64,160,0.20), rgba(224,64,160,0.10))'
                  : 'rgba(255,255,255,0.06)',
                border: msg.role === 'user'
                  ? '1px solid rgba(224,64,160,0.20)'
                  : '1px solid rgba(255,255,255,0.06)',
              }}>
              <p className="text-sm text-white leading-relaxed">{msg.text}</p>
              <p className={`text-[0.55rem] mt-1.5 ${msg.role === 'user' ? 'text-[#E040A0]/50 text-right' : 'text-[#7A7A80]'}`}>
                {msg.role === 'ai' && '🤖 '}
                {msg.time}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-button rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" style={{ animationDelay: '0.15s' }} />
              <div className="w-2 h-2 rounded-full bg-[#E040A0] animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="relative z-10 shrink-0 px-4 py-3" style={{ borderTop: '1px solid rgba(224,64,160,0.08)' }}>
        <div className="glass-tile rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-[#7A7A80] flex-1">Ask Pulse AI anything...</span>
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #E040A0, #C030A0)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <p className="text-center text-[0.55rem] text-[#7A7A80] mt-2">
          Powered by AI · Available 24/7 · Handles billing, safety, and support
        </p>
      </div>
    </div>
  )
}
