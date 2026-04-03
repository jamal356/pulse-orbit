import type { VercelRequest, VercelResponse } from '@vercel/node'

interface Match {
  user_a: string
  user_b: string
  match_id: string
}

interface ResponseBody {
  matches?: Match[]
  error?: string
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function supabaseRequest(
  method: string,
  table: string,
  data?: Record<string, unknown>,
  params?: string
) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
  if (params) url.search = params

  const options: RequestInit = {
    method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  const res = await fetch(url.toString(), options)
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Supabase error: ${res.status} ${error}`)
  }

  return res.json()
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<ResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { session_id } = req.body || {}

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' })
    }

    const ratings = await supabaseRequest(
      'GET',
      'ratings',
      undefined,
      `session_id=eq.${session_id}`
    )

    const mutualsMap = new Map<string, Set<string>>()

    for (const rating of ratings) {
      if (rating.rating !== 'like') continue

      const key = rating.rater_id
      if (!mutualsMap.has(key)) {
        mutualsMap.set(key, new Set())
      }
      mutualsMap.get(key)!.add(rating.rated_id)
    }

    const matches: Match[] = []
    const processed = new Set<string>()

    for (const [raterId, ratedIds] of mutualsMap.entries()) {
      for (const ratedId of ratedIds) {
        if (processed.has(`${raterId}-${ratedId}`) || processed.has(`${ratedId}-${raterId}`)) {
          continue
        }

        const ratedLikes = mutualsMap.get(ratedId)
        if (ratedLikes?.has(raterId)) {
          const match = await supabaseRequest('POST', 'matches', {
            session_id,
            user_a: raterId,
            user_b: ratedId,
            status: 'active',
          })

          const matchId = match[0]?.id
          if (matchId) {
            matches.push({
              user_a: raterId,
              user_b: ratedId,
              match_id: matchId,
            })
          }

          processed.add(`${raterId}-${ratedId}`)
          processed.add(`${ratedId}-${raterId}`)
        }
      }
    }

    await supabaseRequest('PATCH', 'sessions', { status: 'completed' }, `id=eq.${session_id}`)

    return res.status(200).json({ matches })
  } catch (err) {
    console.error('Match computation error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
