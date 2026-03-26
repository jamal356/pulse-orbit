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
// These rotate between each date transition
export const sponsors: Sponsor[] = [
  {
    brand: 'The Palm Jumeirah',
    tagline: 'Where every sunset tells a story',
    category: 'Hospitality',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=85',
    cta: 'Book a sunset dinner',
    ctaUrl: '#',
    accent: '#C9956B',
  },
  {
    brand: 'Maison Francis Kurkdjian',
    tagline: 'The art of emotion, bottled',
    category: 'Fragrance',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=85',
    cta: 'Discover the collection',
    ctaUrl: '#',
    accent: '#D4AF7A',
  },
  {
    brand: 'Porsche Dubai',
    tagline: 'Drive your story forward',
    category: 'Automotive',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85',
    cta: 'Book a test drive',
    ctaUrl: '#',
    accent: '#C0C0C0',
  },
  {
    brand: 'AMAN Dubai',
    tagline: 'Peace beyond measure',
    category: 'Luxury Resorts',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=85',
    cta: 'Experience serenity',
    ctaUrl: '#',
    accent: '#8B7355',
  },
]
