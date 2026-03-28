/* ═══════════════════════════════════════════════════════════════
   PULSE DESIGN SYSTEM — Two palettes, one brand.

   WARM LIGHT: Acquisition, browsing, onboarding.
   Think: Apple Store, Hermès mailer, gallery opening.

   WARM DARK: Live video, immersion, focus on faces.
   Think: Cinema, Netflix player, theater stage.

   Both share the same accent pink (#C83E88) as the
   unifying thread. The warm-dark is brown-black (#1E1B18),
   not the cold blue-black (#1C1A22) of generic dark modes.
   ═══════════════════════════════════════════════════════════════ */

export const light = {
  bg: '#FAF7F2',
  bgDeep: '#F2EDE6',
  text: '#2A2528',
  textSoft: '#8A7E78',
  textFaint: '#C2B8AE',
  textGhost: '#DDD5CC',
  accent: '#C83E88',
  accentOld: '#E040A0',          // legacy neon — avoid
  accentSoft: 'rgba(200,62,136,0.08)',
  accentMid: 'rgba(200,62,136,0.15)',
  accentBorder: 'rgba(200,62,136,0.20)',
  accentGlow: 'rgba(200,62,136,0.06)',
  border: 'rgba(42,37,40,0.08)',
  borderFocus: 'rgba(200,62,136,0.30)',
  surface: 'rgba(42,37,40,0.03)',
  surfaceHover: 'rgba(42,37,40,0.05)',
}

export const dark = {
  bg: '#1E1B18',                   // warm brown-black (not cold blue)
  bgDeep: '#161412',
  bgGradient: 'linear-gradient(170deg, #1E1B18 0%, #161412 40%, #1E1B18 100%)',
  text: 'rgba(255,255,255,0.92)',
  textSoft: 'rgba(255,255,255,0.55)',
  textFaint: 'rgba(255,255,255,0.30)',
  textGhost: 'rgba(255,255,255,0.15)',
  accent: '#C83E88',
  accentSoft: 'rgba(200,62,136,0.12)',
  accentBorder: 'rgba(200,62,136,0.25)',
  accentGlow: 'rgba(200,62,136,0.08)',
  border: 'rgba(255,255,255,0.06)',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.08)',
}

/* High-quality, brand-coherent imagery */
export const imagery = {
  // Dubai skyline & lifestyle — all Unsplash 4K quality
  heroProfiles: [
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=3840&q=95',    // woman, warm tones
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=3840&q=95',    // woman, studio
    'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=3840&q=95',    // woman, natural
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=3840&q=95',    // man, warm portrait
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=3840&q=95',    // man, outdoor
  ],
  // Dubai venue/lifestyle backgrounds — match location names
  dubaiMarina: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=3840&q=95',
  difc: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=3840&q=95',
  jumeirah: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=3840&q=95',
  downtown: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=3840&q=95',
}
