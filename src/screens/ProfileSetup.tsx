import { useState, useRef } from 'react'
import { dark } from '../theme'
import PulseLogo from '../components/PulseLogo'
import { supabase } from '../lib/supabase'

interface Props {
  onNavigate: (screen: string) => void
}

const INTERESTS = ['Travel', 'Music', 'Food', 'Fitness', 'Art', 'Tech', 'Fashion', 'Photography', 'Film', 'Reading', 'Gaming', 'Cooking', 'Dance', 'Nature', 'Sports', 'Startups', 'Wellness', 'Coffee', 'Wine', 'Adventure']

export default function ProfileSetup({ onNavigate }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')

  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo must be under 10MB')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (evt) => {
      setPhotoPreview(evt.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest))
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest])
      }
    }
  }

  const handleStep1Submit = () => {
    setError('')
    if (!displayName) { setError('Enter display name'); return }
    if (!age) { setError('Enter your age'); return }
    if (parseInt(age) < 18) { setError('Must be 18 or older'); return }
    if (!gender) { setError('Select your gender'); return }
    setStep(2)
  }

  const handleStep2Submit = () => {
    setError('')
    if (!city) { setError('Enter your city'); return }
    setStep(3)
  }

  const handleStep3Submit = async () => {
    setError('')
    if (!photoFile) { setError('Upload a profile photo'); return }

    setLoading(true)
    try {
      const userId = (await import('../lib/auth')).getUser && (await (await import('../lib/auth')).getUser()).id
      if (!userId) throw new Error('User not authenticated')

      let photoUrl: string | null = null
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg'
        const fileName = `${userId}-profile.${ext}`
        const { error: uploadError } = await supabase?.storage.from('profile-photos').upload(fileName, photoFile, { upsert: true }) || { error: null }
        if (!uploadError && supabase) {
          const { data } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
          photoUrl = data.publicUrl
        }
      }

      const { error: updateError } = await supabase?.from('users').upsert({
        id: userId,
        display_name: displayName,
        age: parseInt(age),
        gender,
        city,
        bio: bio || null,
        interests: selectedInterests,
        photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      }) || { error: null }

      if (updateError) throw updateError
      onNavigate('home')
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'About You',
      subtitle: 'Let us know who you are',
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl transition-all"
            style={{
              background: dark.surface,
              border: `2px solid ${displayName ? dark.accentBorder : dark.border}`,
              color: dark.text,
            }}
          />
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 rounded-xl transition-all"
            style={{
              background: dark.surface,
              border: `2px solid ${age ? dark.accentBorder : dark.border}`,
              color: dark.text,
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className="py-3 px-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: gender === g ? dark.accent : dark.surface,
                  color: gender === g ? 'white' : dark.text,
                  border: `2px solid ${gender === g ? dark.accent : dark.border}`,
                }}>
                {g}
              </button>
            ))}
          </div>
        </div>
      ),
      isValid: displayName && age && gender,
    },
    {
      title: 'Tell Your Story',
      subtitle: 'City, interests, and a little about you',
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl transition-all"
            style={{
              background: dark.surface,
              border: `2px solid ${city ? dark.accentBorder : dark.border}`,
              color: dark.text,
            }}
          />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label style={{ color: dark.textSoft, fontSize: '0.875rem' }}>About you (optional)</label>
              <span style={{ color: dark.textFaint, fontSize: '0.75rem' }}>{bio.length}/300</span>
            </div>
            <textarea
              placeholder="Tell us what makes you interesting..."
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl resize-none h-24 transition-all"
              style={{
                background: dark.surface,
                border: `2px solid ${bio ? dark.accentBorder : dark.border}`,
                color: dark.text,
              }}
            />
          </div>
          <div>
            <label style={{ color: dark.textSoft, fontSize: '0.875rem' }} className="block mb-3">
              Interests (pick up to 5)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className="px-3 py-1.5 rounded-full text-sm transition-all font-medium"
                  style={{
                    background: selectedInterests.includes(interest) ? dark.accent : dark.surface,
                    color: selectedInterests.includes(interest) ? 'white' : dark.text,
                    border: `1.5px solid ${selectedInterests.includes(interest) ? dark.accent : dark.border}`,
                    opacity: !selectedInterests.includes(interest) && selectedInterests.length >= 5 ? 0.4 : 1,
                    pointerEvents: !selectedInterests.includes(interest) && selectedInterests.length >= 5 ? 'none' : 'auto',
                  }}>
                  {interest}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      isValid: city,
    },
    {
      title: 'Your Photo',
      subtitle: 'A clear, recent photo',
      content: (
        <div className="space-y-4">
          <div
            onClick={() => photoInputRef.current?.click()}
            className="relative w-full aspect-square rounded-2xl cursor-pointer overflow-hidden flex items-center justify-center transition-all"
            style={{
              background: photoPreview ? 'transparent' : dark.surface,
              border: `2px dashed ${dark.accentBorder}`,
            }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">📷</div>
                <p style={{ color: dark.textSoft, fontSize: '0.875rem' }}>Tap to upload</p>
              </div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>
          {photoFile && (
            <button
              type="button"
              onClick={() => { setPhotoFile(null); setPhotoPreview(''); photoInputRef.current && (photoInputRef.current.value = '') }}
              className="w-full py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: dark.surface, color: dark.textSoft }}>
              Change photo
            </button>
          )}
        </div>
      ),
      isValid: !!photoFile,
    },
  ]

  const current = steps[step - 1]

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: dark.bg }}>
      <div className="relative z-10 w-full max-w-md mx-auto px-6 flex flex-col h-screen md:h-auto justify-center">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <PulseLogo variant="symbol" color="white" size="md" />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: dark.text, fontFamily: "'Cormorant Garamond', serif" }}>
            {current.title}
          </h2>
          <p style={{ color: dark.textSoft, fontSize: '0.875rem' }}>{current.subtitle}</p>
        </div>

        <div className="flex gap-1 mb-8 justify-center">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width: s === step ? '24px' : '8px',
                height: '8px',
                background: s <= step ? dark.accent : dark.surface,
              }}
            />
          ))}
        </div>

        <div className="space-y-4 flex-1 md:flex-none">{current.content}</div>

        {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep(step - 1); setError('') }}
              className="px-4 py-3 rounded-xl font-medium flex-1 transition-all"
              style={{ background: dark.surface, color: dark.text }}>
              Back
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (step === 1) handleStep1Submit()
              else if (step === 2) handleStep2Submit()
              else handleStep3Submit()
            }}
            disabled={loading || !current.isValid}
            className="font-medium flex-1 rounded-xl py-3 text-white transition-all"
            style={{
              background: loading || !current.isValid ? 'rgba(200,62,136,0.3)' : dark.accent,
              opacity: loading || !current.isValid ? 0.6 : 1,
            }}>
            {loading ? 'Saving...' : step === 3 ? 'Complete Profile' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
