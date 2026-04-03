import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { dark } from '../theme'
import PulseLogo from '../components/PulseLogo'

interface Props {
  onNavigate: (screen: string) => void
}

const interestsList = [
  'Travel', 'Music', 'Food', 'Fitness', 'Art', 'Tech', 'Fashion',
  'Photography', 'Film', 'Reading', 'Gaming', 'Cooking', 'Dance',
  'Nature', 'Sports', 'Startups', 'Wellness', 'Coffee', 'Wine', 'Adventure',
]

interface FormData {
  name: string
  age: string
  gender: string
  city: string
  interests: string[]
  bio: string
  photo: File | null
}

export default function ProfileSetup({ onNavigate: _onNavigate }: Props) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    age: '',
    gender: '',
    city: '',
    interests: [],
    bio: '',
    photo: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nextAnimation, setNextAnimation] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const ageInputRef = useRef<HTMLInputElement>(null)
  const cityInputRef = useRef<HTMLInputElement>(null)
  const bioInputRef = useRef<HTMLTextAreaElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const dragOverRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 0) nameInputRef.current?.focus()
      else if (step === 1) ageInputRef.current?.focus()
      else if (step === 3) cityInputRef.current?.focus()
      else if (step === 5) bioInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [step])

  useEffect(() => {
    setNextAnimation(true)
    const timer = setTimeout(() => setNextAnimation(false), 300)
    return () => clearTimeout(timer)
  }, [step])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value })
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.name.trim()) {
      goNext()
    }
  }

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value === '' || parseInt(value) <= 150) {
      setFormData({ ...formData, age: value })
    }
  }

  const handleAgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.age) {
      const age = parseInt(formData.age)
      if (age >= 18) goNext()
    }
  }

  const handleGenderSelect = (selected: string) => {
    setFormData({ ...formData, gender: selected })
    setTimeout(() => goNext(), 300)
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, city: e.target.value })
  }

  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.city.trim()) {
      goNext()
    }
  }

  const handleInterestToggle = (interest: string) => {
    const updated = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : formData.interests.length < 5
        ? [...formData.interests, interest]
        : formData.interests
    setFormData({ ...formData, interests: updated })
  }

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, bio: e.target.value })
  }

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragOverRef.current = false
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        setFormData({ ...formData, photo: file })
      }
    }
  }

  const handlePhotoClick = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] })
    }
  }

  const goNext = () => {
    setError('')

    if (step === 0 && !formData.name.trim()) {
      setError('Please enter your name')
      return
    }
    if (step === 1) {
      const age = parseInt(formData.age)
      if (!formData.age || age < 18) {
        setError('You must be 18 or older')
        return
      }
    }
    if (step === 2 && !formData.gender) {
      setError('Please select your gender identity')
      return
    }
    if (step === 3 && !formData.city.trim()) {
      setError('Please enter your city')
      return
    }
    if (step === 4 && formData.interests.length === 0) {
      setError('Pick at least one interest')
      return
    }
    if (step === 5) {
      setStep(6)
      return
    }
    if (step === 6 && !formData.photo) {
      setError('Please upload a photo')
      return
    }

    if (step < 6) setStep(step + 1)
  }

  const goBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleComplete = async () => {
    if (!formData.photo) {
      setError('Please upload a photo')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase!.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext = formData.photo.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}-profile.${ext}`
      await supabase!.storage
        .from('profile-photos')
        .upload(fileName, formData.photo, { upsert: true })

      const { data: urlData } = supabase!.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      await supabase!.from('users').upsert({
        id: user.id,
        email: user.email,
        display_name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        city: formData.city,
        bio: formData.bio || null,
        interests: formData.interests,
        photo_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })

      window.location.hash = 'home'
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
      setLoading(false)
    }
  }

  const progressPercent = ((step + 1) / 7) * 100

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '2rem',
              }}
            >
              What should we call you?
            </h2>
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Your name..."
              value={formData.name}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: dark.surface,
                border: `1px solid ${dark.border}`,
                borderRadius: '8px',
                color: dark.text,
                outline: 'none',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = dark.accent
                e.currentTarget.style.backgroundColor = dark.surfaceHover
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = dark.border
                e.currentTarget.style.backgroundColor = dark.surface
              }}
            />
            <p style={{ marginTop: '1rem', color: dark.textSoft, fontSize: '0.9rem' }}>
              Press Enter to continue
            </p>
          </div>
        )

      case 1:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '2rem',
              }}
            >
              How young are you?
            </h2>
            <input
              ref={ageInputRef}
              type="text"
              placeholder="18"
              value={formData.age}
              onChange={handleAgeChange}
              onKeyDown={handleAgeKeyDown}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: dark.surface,
                border: `1px solid ${dark.border}`,
                borderRadius: '8px',
                color: dark.text,
                outline: 'none',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = dark.accent
                e.currentTarget.style.backgroundColor = dark.surfaceHover
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = dark.border
                e.currentTarget.style.backgroundColor = dark.surface
              }}
            />
            {formData.age && parseInt(formData.age) < 18 && (
              <p style={{ marginTop: '1rem', color: dark.accent, fontSize: '0.9rem' }}>
                Must be 18+
              </p>
            )}
          </div>
        )

      case 2:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '2.5rem',
              }}
            >
              I identify as...
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '280px', margin: '0 auto' }}>
              {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((option) => (
                <button
                  key={option}
                  onClick={() => handleGenderSelect(option)}
                  style={{
                    padding: '1rem',
                    fontSize: '1rem',
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor:
                      formData.gender === option ? dark.accent : dark.surface,
                    color: formData.gender === option ? dark.bg : dark.text,
                    border: `1px solid ${
                      formData.gender === option ? dark.accent : dark.border
                    }`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    fontWeight: formData.gender === option ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (formData.gender !== option) {
                      e.currentTarget.style.backgroundColor = dark.surfaceHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.gender !== option) {
                      e.currentTarget.style.backgroundColor = dark.surface
                    }
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '2rem',
              }}
            >
              Where are you based?
            </h2>
            <input
              ref={cityInputRef}
              type="text"
              placeholder="City, Country"
              value={formData.city}
              onChange={handleCityChange}
              onKeyDown={handleCityKeyDown}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '0.875rem 1rem',
                fontSize: '1rem',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: dark.surface,
                border: `1px solid ${dark.border}`,
                borderRadius: '8px',
                color: dark.text,
                outline: 'none',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = dark.accent
                e.currentTarget.style.backgroundColor = dark.surfaceHover
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = dark.border
                e.currentTarget.style.backgroundColor = dark.surface
              }}
            />
          </div>
        )

      case 4:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '0.5rem',
              }}
            >
              Pick what lights you up
            </h2>
            <p style={{ color: dark.textSoft, marginBottom: '2rem', fontSize: '0.9rem' }}>
              Choose up to 5
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.75rem',
                justifyContent: 'center',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              {interestsList.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  style={{
                    padding: '0.625rem 1rem',
                    fontSize: '0.9rem',
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: formData.interests.includes(interest)
                      ? dark.accent
                      : dark.surface,
                    color: formData.interests.includes(interest)
                      ? dark.bg
                      : dark.text,
                    border: `1px solid ${
                      formData.interests.includes(interest)
                        ? dark.accent
                        : dark.border
                    }`,
                    borderRadius: '20px',
                    cursor:
                      formData.interests.includes(interest) ||
                      formData.interests.length < 5
                        ? 'pointer'
                        : 'not-allowed',
                    opacity:
                      formData.interests.includes(interest) ||
                      formData.interests.length < 5
                        ? 1
                        : 0.5,
                    transition: 'all 200ms ease',
                    fontWeight: formData.interests.includes(interest) ? 600 : 500,
                  }}
                  disabled={
                    !formData.interests.includes(interest) &&
                    formData.interests.length >= 5
                  }
                  onMouseEnter={(e) => {
                    if (
                      formData.interests.includes(interest) ||
                      formData.interests.length < 5
                    ) {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '0.5rem',
              }}
            >
              Tell us something unforgettable
            </h2>
            <p style={{ color: dark.textSoft, marginBottom: '2rem', fontSize: '0.9rem' }}>
              Your bio (optional)
            </p>
            <textarea
              ref={bioInputRef}
              placeholder="Say something that makes you stand out..."
              value={formData.bio}
              onChange={handleBioChange}
              style={{
                width: '100%',
                maxWidth: '500px',
                minHeight: '140px',
                padding: '1rem',
                fontSize: '0.95rem',
                fontFamily: "'DM Sans', sans-serif",
                backgroundColor: dark.surface,
                border: `1px solid ${dark.border}`,
                borderRadius: '8px',
                color: dark.text,
                outline: 'none',
                resize: 'none',
                transition: 'all 200ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = dark.accent
                e.currentTarget.style.backgroundColor = dark.surfaceHover
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = dark.border
                e.currentTarget.style.backgroundColor = dark.surface
              }}
            />
            <p style={{ marginTop: '1.5rem', color: dark.textSoft, fontSize: '0.85rem' }}>
              {formData.bio.length} / 500 characters
            </p>
          </div>
        )

      case 6:
        return (
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '2.5rem',
                fontWeight: 600,
                color: dark.text,
                marginBottom: '2rem',
              }}
            >
              Show your best self
            </h2>
            <div
              onDrop={handlePhotoDrop}
              onDragOver={(e) => {
                e.preventDefault()
                dragOverRef.current = true
              }}
              onDragLeave={() => {
                dragOverRef.current = false
              }}
              onClick={handlePhotoClick}
              style={{
                width: '100%',
                maxWidth: '300px',
                aspectRatio: '1',
                margin: '0 auto',
                borderRadius: '12px',
                border: `2px dashed ${dragOverRef.current ? dark.accent : dark.border}`,
                backgroundColor: dragOverRef.current
                  ? dark.accentSoft
                  : dark.surface,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'all 200ms ease',
              }}
            >
              {formData.photo ? (
                <img
                  src={URL.createObjectURL(formData.photo)}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div
                    style={{
                      fontSize: '2.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    📸
                  </div>
                  <p style={{ color: dark.textSoft, fontSize: '0.9rem' }}>
                    Drag or click to upload
                  </p>
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: dark.bg,
        color: dark.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          backgroundColor: dark.surface,
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${dark.accent} 0%, ${dark.accent}cc 100%)`,
            transition: 'width 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          paddingTop: '2rem',
          maxWidth: '100%',
        }}
      >
        {step > 0 ? (
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              color: dark.text,
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              transition: 'opacity 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            ←
          </button>
        ) : (
          <div style={{ width: '2.5rem' }} />
        )}

        <PulseLogo variant="symbol" color="white" size="sm" />

        <div style={{ width: '2.5rem' }} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          animation: nextAnimation
            ? 'slideUp 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            : 'none',
        }}
      >
        {getStepContent()}
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            margin: '0 1.5rem 1.5rem',
            backgroundColor: 'rgba(200, 62, 136, 0.1)',
            border: `1px solid ${dark.accent}`,
            borderRadius: '8px',
            color: dark.accent,
            fontSize: '0.9rem',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          padding: '0 1.5rem 2rem',
          justifyContent: 'center',
          maxWidth: '100%',
        }}
      >
        {step === 5 && (
          <button
            onClick={() => setStep(6)}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: dark.surface,
              color: dark.text,
              border: `1px solid ${dark.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = dark.surfaceHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = dark.surface
            }}
          >
            Skip
          </button>
        )}

        {(step === 0 || step === 1 || step === 3 || step === 4 || step === 5) && (
          <button
            onClick={goNext}
            disabled={loading}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: dark.accent,
              color: dark.bg,
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.85'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.opacity = '1'
            }}
          >
            {step === 4 || step === 5 ? 'Next' : 'Continue'}
          </button>
        )}

        {step === 6 && (
          <button
            onClick={handleComplete}
            disabled={loading}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: dark.accent,
              color: dark.bg,
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.85'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.opacity = '1'
            }}
          >
            {loading ? 'Setting up...' : 'Complete'}
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
