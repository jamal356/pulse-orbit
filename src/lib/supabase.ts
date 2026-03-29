import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing — submissions will fall back to localStorage only.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Submit a waitlist application to Supabase.
 * Uploads photo to Storage, inserts row into waitlist table.
 * Returns the waitlist position number.
 */
export async function submitWaitlistEntry(
  data: Record<string, string>,
  photoFile?: File | Blob | null,
): Promise<{ position: number | null; error: string | null }> {
  if (!supabase) {
    console.warn('Supabase not configured — skipping remote submission')
    return { position: null, error: 'not_configured' }
  }

  let photoUrl: string | null = null

  // 1. Upload photo if provided
  if (photoFile) {
    const ext = photoFile instanceof File ? photoFile.name.split('.').pop() : 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('waitlist-photos')
      .upload(fileName, photoFile, {
        contentType: photoFile.type || 'image/jpeg',
        cacheControl: '31536000',
      })

    if (uploadError) {
      console.error('Photo upload failed:', uploadError.message)
      // Continue without photo — don't block the submission
    } else if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('waitlist-photos')
        .getPublicUrl(uploadData.path)
      photoUrl = urlData.publicUrl
    }
  }

  // 2. Insert waitlist entry
  const { data: inserted, error: insertError } = await supabase
    .from('waitlist')
    .insert({
      email: data.email || null,
      first_name: data.firstName || null,
      age: data.age || null,
      gender: data.gender || null,
      looking_for: data.lookingFor || null,
      city: data.city || null,
      attraction: data.attraction || null,
      friday_night: data.friday || null,
      dealbreaker: data.dealbreaker || null,
      photo_url: photoUrl,
    })
    .select('position')
    .single()

  if (insertError) {
    console.error('Waitlist insert failed:', insertError.message)
    return { position: null, error: insertError.message }
  }

  return { position: inserted?.position ?? null, error: null }
}
