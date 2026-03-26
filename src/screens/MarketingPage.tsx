import { useEffect, useState, useRef } from 'react'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  onStartDemo: () => void
}

/* --- Scroll reveal hook --- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

/* --- Pulse heartbeat SVG --- */
const PulseLine = () => (
  <svg width="120" height="24" viewBox="0 0 120 24" fill="none" className="opacity-60">
    <path d="M0 12h30l5-10 5 20 5-20 5 10h70" stroke="#E040A0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* --- Pain points data --- */
const painPoints = [
  {
    stat: '3 hrs',
    label: 'Average time texting before a first date',
    pain: 'That you could have spent actually meeting someone.',
  },
  {
    stat: '53%',
    label: 'of dating app users say profiles are misleading',
    pain: 'Filters, old photos, borrowed bios.',
  },
  {
    stat: '72%',
    label: 'feel disappointed meeting someone in person',
    pain: 'Zero chemistry. All that time — wasted.',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Book a Seat',
    desc: 'Pick a live session. AED 75 reserves your spot. Everyone pays — everyone shows up.',
    icon: '🎯',
  },
  {
    step: '02',
    title: '5 Dates. 5 Minutes Each.',
    desc: 'Camera on. Real conversation. You see chemistry, body language, energy — in seconds.',
    icon: '⚡',
  },
  {
    step: '03',
    title: 'Mutual Match? Connected.',
    desc: 'Both like each other? Contact details shared instantly. No waiting. No games.',
    icon: '💫',
  },
]

const marketStats = [
  { value: '$9.6B', label: 'Global dating app market (2026)' },
  { value: '42%', label: 'MENA users dissatisfied with current apps' },
  { value: '68M', label: 'Singles in GCC countries' },
  { value: '82%', label: 'Prefer video-first over text-first' },
]

const revenueStreams = [
  { title: 'Session Fees', desc: 'AED 75 per session. Pay-to-play ensures quality and commitment.', pct: '60%' },
  { title: 'Premium Membership', desc: 'Priority booking, session replays, extended profiles.', pct: '25%' },
  { title: 'Sponsored Moments', desc: 'Premium brand placements during transition screens. Captive, engaged audience.', pct: '15%' },
]

const cities = [
  { name: 'Dubai', flag: '🇦🇪', status: 'LAUNCH', active: true },
  { name: 'Riyadh', flag: '🇸🇦', status: 'Q3 2026', active: false },
  { name: 'Doha', flag: '🇶🇦', status: 'Q4 2026', active: false },
  { name: 'Cairo', flag: '🇪🇬', status: '2027', active: false },
  { name: 'London', flag: '🇬🇧', status: '2027', active: false },
]

export default function MarketingPage({ onStartDemo }: Props) {
  const [heroVisible, setHeroVisible] = useState(false)
  const problem = useReveal()
  const solution = useReveal()
  const market = useReveal()
  const revenue = useReveal()
  const expansion = useReveal()
  const cta = useReveal()

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-[#2A2A2E] text-[#F5F5F7] relative overflow-x-hidden">
      <BackgroundOrbs />

      {/* =================== HERO =================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className={`relative z-10 flex flex-col items-center max-w-3xl transition-all duration-1000 ease-out ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

          {/* Logo */}
          <div className="relative mb-12 md:mb-16">
            <h1 className="text-6xl md:text-8xl font-semibold tracking-tight font-display">
              Pulse
            </h1>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#7A7A80]/30" />
              <PulseLine />
              <div className="h-px w-8 bg-[#7A7A80]/30" />
            </div>
          </div>

          {/* The hook — problem-first */}
          <h2
            className="text-[2.5rem] md:text-[4.5rem] md:leading-[1.08] leading-tight mb-6 italic"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
          >
            You've texted for weeks.
            <br />
            <span className="text-[#E040A0]">Met for five minutes.</span>
            <br />
            Felt nothing.
          </h2>

          <p className="text-base md:text-lg text-[#98989D] mb-10 max-w-xl leading-relaxed">
            Dating apps are designed to keep you swiping — not connecting.
            Pulse puts you face-to-face in 5-minute live video dates.
            You see chemistry instantly. No more wasted time.
          </p>

          {/* CTA */}
          <button
            onClick={onStartDemo}
            className="group relative px-11 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-[#E040A0] text-white"
            style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.38)' }}
          >
            <span className="flex items-center gap-2.5">
              Experience the Demo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <p className="mt-4 text-xs text-[#7A7A80]">Interactive product walkthrough — 2 minutes</p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-[0.65rem] text-[#7A7A80] uppercase tracking-widest font-medium">Scroll for the pitch</span>
          <svg className="w-5 h-5 text-[#7A7A80]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      </section>

      {/* =================== THE PROBLEM =================== */}
      <section ref={problem.ref} className={`py-20 md:py-32 px-6 transition-all duration-1000 ${problem.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-6 text-center">The Problem</h3>
          <h2
            className="text-3xl md:text-[3rem] md:leading-[1.12] font-bold mb-6 text-center font-display"
          >
            Dating apps are broken.
            <br />
            <span className="text-[#98989D]">Everyone knows it.</span>
          </h2>
          <p className="text-center text-[#98989D] max-w-2xl mx-auto mb-14 leading-relaxed">
            Swipe. Match. Text for days. Meet in person. Feel zero chemistry. Repeat.
            The current model wastes your most valuable resource — time — and profits from keeping you stuck in the loop.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {painPoints.map((p, i) => (
              <div
                key={i}
                className="glass-tile rounded-2xl p-7 text-center"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <p className="text-4xl md:text-5xl font-bold text-[#E040A0] mb-3 font-display">{p.stat}</p>
                <p className="text-sm text-[#E0E0E5] mb-3 leading-relaxed">{p.label}</p>
                <p className="text-xs text-[#7A7A80] italic">{p.pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== THE SOLUTION =================== */}
      <section ref={solution.ref} className={`py-20 md:py-32 px-6 transition-all duration-1000 ${solution.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-6 text-center">The Solution</h3>
          <h2 className="text-3xl md:text-[3rem] md:leading-[1.12] font-bold mb-6 text-center font-display">
            Skip the texting.
            <br />
            <span className="text-[#E040A0]">See the chemistry.</span>
          </h2>
          <p className="text-center text-[#98989D] max-w-2xl mx-auto mb-14 leading-relaxed">
            Pulse runs live speed dating sessions. Five people, five minutes each, face-to-face on video.
            Body language doesn't lie. You know in 30 seconds what takes weeks to discover over text.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {howItWorks.map((step, i) => (
              <div
                key={i}
                className="glass-tile rounded-2xl p-7 text-center group hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="text-[#E040A0] font-display font-semibold text-lg mb-4">{step.step}</div>
                <div className="text-3xl mb-4">{step.icon}</div>
                <h4 className="font-bold text-lg text-white mb-2">{step.title}</h4>
                <p className="text-sm text-[#E0E0E5] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Key differentiators */}
          <div className="mt-14 glass-tile rounded-2xl p-8 md:p-10">
            <h4 className="text-xs tracking-[0.3em] uppercase text-[#7A7A80] font-semibold mb-6 text-center">Why This Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Paid entry = serious people', desc: 'When you pay AED 75, you show up. No ghosts, no time-wasters, no fake profiles.' },
                { title: 'Camera on = no catfishing', desc: 'What you see is what you get. No old photos, no filters, no carefully crafted persona.' },
                { title: 'Time-boxed = real chemistry', desc: '5 minutes is enough to feel a spark. Not enough to overthink it.' },
                { title: 'Mutual matching = no rejection loop', desc: 'You only find out if someone liked you when you liked them too. Clean, dignified.' },
              ].map((d, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#E040A0] mt-2 shrink-0" />
                  <div>
                    <p className="font-semibold text-white mb-1">{d.title}</p>
                    <p className="text-sm text-[#98989D] leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== MARKET OPPORTUNITY =================== */}
      <section ref={market.ref} className={`py-20 md:py-32 px-6 transition-all duration-1000 ${market.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-6 text-center">Market Opportunity</h3>
          <h2 className="text-3xl md:text-[3rem] md:leading-[1.12] font-bold mb-6 text-center font-display">
            The MENA dating market is
            <br />
            <span className="text-[#E040A0]">massively underserved.</span>
          </h2>
          <p className="text-center text-[#98989D] max-w-2xl mx-auto mb-14 leading-relaxed">
            Western dating apps don't fit the culture. Arranged introductions don't fit the generation.
            Pulse sits in the gap — structured, respectful, but real.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketStats.map((s, i) => (
              <div key={i} className="glass-tile rounded-2xl p-6 text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#E040A0] mb-2 font-display">{s.value}</p>
                <p className="text-xs text-[#98989D] leading-relaxed">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== REVENUE MODEL =================== */}
      <section ref={revenue.ref} className={`py-20 md:py-32 px-6 transition-all duration-1000 ${revenue.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-6 text-center">Business Model</h3>
          <h2 className="text-3xl md:text-[3rem] md:leading-[1.12] font-bold mb-14 text-center font-display">
            Three revenue streams.
            <br />
            <span className="text-[#98989D]">Day one.</span>
          </h2>

          <div className="space-y-4">
            {revenueStreams.map((r, i) => (
              <div key={i} className="glass-tile rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                <div className="shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(224,64,160,0.10)] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#E040A0] font-display">{r.pct}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-white mb-1">{r.title}</h4>
                  <p className="text-sm text-[#98989D] leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Unit economics */}
          <div className="mt-10 glass-tile rounded-2xl p-8 text-center">
            <h4 className="text-xs tracking-[0.3em] uppercase text-[#7A7A80] font-semibold mb-6">Unit Economics (Per Session)</h4>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              {[
                { label: 'Revenue / session', value: 'AED 750', sub: '10 participants × AED 75' },
                { label: 'COGS', value: 'AED ~80', sub: 'Video infrastructure + hosting' },
                { label: 'Gross margin', value: '~89%', sub: 'Software-like margins' },
              ].map((e, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-[#E040A0] font-display">{e.value}</p>
                  <p className="text-sm text-[#E0E0E5] font-medium mt-1">{e.label}</p>
                  <p className="text-xs text-[#7A7A80] mt-0.5">{e.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================== EXPANSION =================== */}
      <section ref={expansion.ref} className={`py-20 md:py-28 px-6 transition-all duration-1000 ${expansion.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xs tracking-[0.3em] uppercase text-[#E040A0] font-semibold mb-6">Expansion</h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">
            Launch Dubai. Scale the region.
          </h2>
          <p className="text-[#98989D] text-sm mb-12 max-w-lg mx-auto">City-by-city rollout. Each city is a self-contained market with its own sessions.</p>

          <div className="flex flex-wrap justify-center gap-4">
            {cities.map((c, i) => (
              <div
                key={i}
                className={`glass-tile rounded-2xl p-5 md:p-6 min-w-[130px] md:min-w-[150px] text-center transition-all duration-300 ${c.active ? '' : 'opacity-50'}`}
                style={c.active ? { borderColor: '#E040A0', boxShadow: '0 8px 32px rgba(224,64,160,0.12)' } : {}}
              >
                <span className="text-3xl md:text-4xl block mb-2">{c.flag}</span>
                <p className="font-bold text-white mb-1">{c.name}</p>
                <span className={`text-[0.65rem] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  c.active
                    ? 'bg-[rgba(224,64,160,0.10)] text-[#E040A0] border border-[rgba(224,64,160,0.25)]'
                    : 'bg-white/[0.03] text-[#B0B0B8] border border-white/[0.06]'
                }`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== FINAL CTA =================== */}
      <section ref={cta.ref} className={`py-24 md:py-36 px-6 relative transition-all duration-1000 ${cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl md:text-[3.5rem] md:leading-[1.08] font-bold mb-6 font-display"
          >
            See it in action.
          </h2>
          <p className="text-base md:text-lg text-[#98989D] mb-10 max-w-lg mx-auto leading-relaxed">
            Walk through a complete Pulse session — from lobby to match reveal.
            Two minutes. No signup required.
          </p>

          <button
            onClick={onStartDemo}
            className="group relative px-12 py-4 rounded-full text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-[#E040A0] text-white"
            style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.38)' }}
          >
            <span className="flex items-center gap-2.5">
              Launch Product Demo
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="border-t border-white/[0.06] py-10 px-6 bg-[#2A2A2E]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <span className="text-xl font-semibold font-display text-[#E040A0]">Pulse</span>
            <span className="text-xs text-[#98989D]">Dubai, 2026</span>
          </div>
          <p className="text-xs text-[#98989D] italic">Skip the texting. See the chemistry.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#7A7A80]">jamal@hakadian.com</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
