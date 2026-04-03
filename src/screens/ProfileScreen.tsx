import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '../hooks/useAuth'
import BackgroundOrbs from '../components/BackgroundOrbs'

interface Props {
  user: User
  profile: UserProfile
}

export default function ProfileScreen({ profile }: Props) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundOrbs />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur rounded-lg p-6 border border-white/10">
            <div className="flex items-start gap-6">
              {profile.photo_url && (
                <img
                  src={profile.photo_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{profile.display_name}</h2>
                <div className="text-white/60 space-y-1">
                  <p>{profile.age} years old • {profile.city || 'Location not set'}</p>
                  <p className="text-sm">{profile.email}</p>
                  {profile.phone && <p className="text-sm">{profile.phone}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-3">About</h3>
            <p className="text-white/70">{profile.bio || 'No bio yet'}</p>
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="bg-white/5 backdrop-blur rounded-lg p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span
                    key={interest}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white/80 text-sm border border-white/10"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Account</h3>
            <div className="space-y-3 text-sm text-white/70">
              <p>Verified: {profile.is_verified ? 'Yes' : 'No'}</p>
              <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
              {profile.last_seen && (
                <p>Last seen: {new Date(profile.last_seen).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
