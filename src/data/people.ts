export const photos = {
  sofia: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80',
  layla: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  amira: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  nour: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80',
  yasmine: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  user: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
}

export type Gender = 'male' | 'female'

export interface Candidate {
  name: string
  age: number
  location: string
  photo: string
  bio: string
  tags: string[]
  gender: Gender
}

/* ── Gender-based color tokens ────────────────────────────── */
export const genderColors = {
  female: {
    primary: '#E040A0',
    rgb: '224,64,160',
  },
  male: {
    primary: '#2DD4BF',
    rgb: '45,212,191',
  },
} as const

/** The demo user is male */
export const USER_GENDER: Gender = 'male'
export const USER_COLOR = genderColors.male

export const candidates: Candidate[] = [
  {
    name: 'Sofia',
    age: 28,
    location: 'Dubai Marina',
    photo: photos.sofia,
    bio: 'Interior designer who believes great spaces tell stories',
    tags: ['Creative', 'Foodie', 'Travel'],
    gender: 'female',
  },
  {
    name: 'Layla',
    age: 31,
    location: 'Downtown Dubai',
    photo: photos.layla,
    bio: 'Runs a wellness brand, obsessed with breathwork',
    tags: ['Wellness', 'Entrepreneur', 'Music'],
    gender: 'female',
  },
  {
    name: 'Amira',
    age: 26,
    location: 'Abu Dhabi',
    photo: photos.amira,
    bio: 'Art curator by day, salsa dancer by night',
    tags: ['Art', 'Dance', 'Coffee'],
    gender: 'female',
  },
  {
    name: 'Nour',
    age: 29,
    location: 'Riyadh',
    photo: photos.nour,
    bio: 'Product manager at a fintech startup, weekend hiker',
    tags: ['Tech', 'Hiking', 'Podcasts'],
    gender: 'female',
  },
  {
    name: 'Yasmine',
    age: 33,
    location: 'JBR, Dubai',
    photo: photos.yasmine,
    bio: 'Fashion buyer who collects vintage cameras',
    tags: ['Fashion', 'Photography', 'Travel'],
    gender: 'female',
  },
]

export const conversationStarters = [
  "What's one thing on your bucket list you'd do tomorrow if money didn't matter?",
  "If you could have dinner with anyone, dead or alive, who would it be?",
  "What's your most unpopular opinion?",
  "What's the best trip you've ever taken?",
  "If you could master any skill overnight, what would it be?",
  "What does your perfect weekend look like?",
  "What's the most spontaneous thing you've ever done?",
  "What's a small thing that makes your day instantly better?",
  "If your life had a soundtrack, what song would play right now?",
  "What's something you're passionate about that surprises people?",
]
