import { photos } from '../data/people'
import type { Candidate } from '../data/people'

interface Props {
  match: Candidate
  onClose: () => void
}

/* ─── THE MATCH CARD ──────────────────────────────────────────
   A beautiful, shareable memory card celebrating a mutual match.
   Both profile photos, heart + arrow motif, date & time.
   Private between the two people — can be saved to profile
   as a keepsake or shared between them.
   ──────────────────────────────────────────────────────────── */

export default function MatchCard({ match, onClose }: Props) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fade-in"
      onClick={onClose}>
      <div className="relative max-w-sm w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* The Card */}
        <div className="rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(165deg, #1a1020 0%, #0f0a15 40%, #1a0a18 100%)',
          boxShadow: '0 30px 100px rgba(224,64,160,0.25), 0 0 0 1px rgba(224,64,160,0.10)',
        }}>

          {/* Top — decorative line */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #E040A0, transparent)' }} />

          <div className="px-8 pt-8 pb-6">

            {/* Pulse branding — subtle */}
            <div className="text-center mb-6">
              <p className="text-[0.55rem] uppercase tracking-[0.25em] text-white/25 mb-1">A Pulse Moment</p>
            </div>

            {/* ── Photo pair with heart ── */}
            <div className="flex items-center justify-center gap-0 mb-6 relative">
              {/* User photo */}
              <div className="relative z-10">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                  style={{ border: '3px solid rgba(224,64,160,0.4)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                  <img src={photos.user} alt="You" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Heart icon — overlapping center */}
              <div className="relative z-20 -mx-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #E040A0 0%, #C82E88 100%)',
                    boxShadow: '0 4px 20px rgba(224,64,160,0.5)',
                  }}>
                  {/* Heart + Arrow SVG */}
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                {/* Arrow through heart — decorative */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-6 -right-6 h-[1.5px] -rotate-12 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(224,64,160,0.6), rgba(224,64,160,0.6), transparent)' }}>
                  {/* Arrow tip */}
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{ borderLeft: '5px solid rgba(224,64,160,0.6)', borderTop: '3px solid transparent', borderBottom: '3px solid transparent' }} />
                </div>
              </div>

              {/* Match photo */}
              <div className="relative z-10">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden"
                  style={{ border: '3px solid rgba(224,64,160,0.4)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
                  <img src={match.photo} alt={match.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* ── Names ── */}
            <div className="text-center mb-5">
              <p className="text-xl sm:text-2xl font-display mb-1"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, color: 'rgba(255,255,255,0.9)' }}>
                You & {match.name}
              </p>
              <div className="flex items-center justify-center gap-2 text-[0.65rem] text-white/30">
                <span>{match.location}</span>
                <span>·</span>
                <span>{match.age}</span>
              </div>
            </div>

            {/* ── "It's a Match" text ── */}
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl mb-2"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 300,
                  fontStyle: 'italic',
                  background: 'linear-gradient(135deg, #E040A0, #F080C0, #E040A0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                It's a Match
              </h2>
              <p className="text-xs text-white/35" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                You both felt the spark
              </p>
            </div>

            {/* ── Date & time stamp ── */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass-tile">
                <svg className="w-3.5 h-3.5 text-[#E040A0]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[0.7rem] text-white/40">{dateStr} · {timeStr}</span>
              </div>
            </div>

            {/* ── Tagline ── */}
            <p className="text-center text-xs text-white/20 mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
              "Your story started here."
            </p>
          </div>

          {/* Bottom — decorative line */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, transparent, #E040A0, transparent)' }} />

          {/* Action buttons */}
          <div className="px-6 py-5 space-y-2.5 glass-tile">
            <button className="w-full py-3.5 rounded-xl text-sm font-semibold bg-[#E040A0] text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ boxShadow: '0 4px 20px rgba(224,64,160,0.3)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save to My Memories
            </button>
            <div className="flex gap-2">
              <button className="flex-1 py-3 rounded-xl text-xs font-semibold glass-button text-white/60 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message {match.name}
              </button>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-xs font-semibold glass-button text-white/40 active:scale-[0.98] transition-transform">
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Floating sparkles around the card */}
        <div className="absolute -top-4 -left-4 text-2xl pointer-events-none" style={{ animation: 'spark-float 3s ease-in-out infinite' }}>✨</div>
        <div className="absolute -top-2 -right-6 text-xl pointer-events-none" style={{ animation: 'spark-float 3s ease-in-out infinite 0.5s' }}>💫</div>
        <div className="absolute -bottom-3 left-8 text-lg pointer-events-none" style={{ animation: 'spark-float 3s ease-in-out infinite 1s' }}>✨</div>
        <div className="absolute -bottom-4 -right-3 text-xl pointer-events-none" style={{ animation: 'spark-float 3s ease-in-out infinite 1.5s' }}>💖</div>
      </div>

      <style>{`
        @keyframes spark-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-8px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
