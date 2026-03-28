export interface Sponsor {
  brand: string
  tagline: string
  category: string
  image: string
  logo?: string
  cta: string
  ctaUrl: string
  accent: string // brand color for subtle tinting
}

// Premium sponsor rotation — luxury, hospitality, fragrance, automotive, travel
// RULE: Image must be brand-neutral (no visible competitor logos).
// If the brand is X, the image must either show X's actual assets or
// show the *category* without any brand marks visible.
export const sponsors: Sponsor[] = [
  {
    brand: 'The Palm Jumeirah',
    tagline: 'Where every sunset tells a story',
    category: 'Hospitality',
    // Aerial view of The Palm — no competing hotel branding visible
    image: 'https://images.unsplash.com/photo-1640361689498-7e498729d5de?w=3840&q=95',
    cta: 'Book a sunset dinner',
    ctaUrl: '#',
    accent: '#C9956B',
  },
  {
    brand: 'Amouage',
    tagline: 'The gift of kings',
    category: 'Fragrance',
    // Abstract perfume mist / golden liquid — no brand labels visible
    image: 'https://images.unsplash.com/photo-1594035910387-fea081e83b63?w=3840&q=95',
    cta: 'Discover the collection',
    ctaUrl: '#',
    accent: '#D4AF7A',
  },
  {
    brand: 'Porsche Dubai',
    tagline: 'Drive your story forward',
    category: 'Automotive',
    // Porsche 911 rear — brand-coherent, Porsche badge visible not a competitor
    image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=3840&q=95',
    cta: 'Book a test drive',
    ctaUrl: '#',
    accent: '#C0C0C0',
  },
  {
    brand: 'One&Only The Palm',
    tagline: 'Where time stands still',
    category: 'Luxury Resorts',
    // Luxury infinity pool overlooking ocean — no hotel branding visible
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=3840&q=95',
    cta: 'Experience serenity',
    ctaUrl: '#',
    accent: '#8B7355',
  },
]
