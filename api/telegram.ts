import type { VercelRequest, VercelResponse } from '@vercel/node'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const SITE = process.env.SITE_URL || 'https://pulse-orbit-jamal356s-projects.vercel.app'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

async function supabaseQuery(table: string, params: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  return r.json()
}

const WELCOME = `*Welcome to Pulse*

The first date you'll actually remember.

Live video speed dating. Five people. Five minutes each. Camera on. No swiping. No texting strangers for weeks. Just *real chemistry, in real time*.

Launching in Dubai - By application only

[Join the waitlist](${SITE}) and be among the first.

Type /status to check your waitlist position.
Type /share to invite someone.`

const SHARE_TEXT = `I'm in. Are you?\n\nPulse - live video speed dating. The first date you'll actually remember.\n\n${SITE}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Pulse Bot webhook active' })
  }
  try {
    const { message } = req.body || {}
    if (!message?.text) return res.status(200).json({ ok: true })
    const chatId = message.chat.id
    const text = message.text.trim().toLowerCase()
    const firstName = message.from?.first_name || 'there'

    if (text === '/start') {
      await tg('sendMessage', { chat_id: chatId, text: WELCOME, parse_mode: 'Markdown', disable_web_page_preview: false })
    } else if (text === '/status') {
      let reply = `Hey ${firstName}!\n\nTo check your waitlist position, make sure you've signed up at ${SITE}\n\nOnce you complete the application, you'll receive your position number.`
      if (SUPABASE_URL) {
        try {
          const rows = await supabaseQuery('waitlist', 'select=position,first_name&order=created_at.desc&limit=1')
          if (rows && rows.length > 0) {
            const total = rows[0].position || '???'
            reply = `Hey ${firstName}!\n\nWaitlist stats\nTotal signups: ${total}+\nStatus: Applications open\nLaunch: Dubai, 2026\n\nSign up at ${SITE} if you haven't already!`
          }
        } catch { /* silent */ }
      }
      await tg('sendMessage', { chat_id: chatId, text: reply, parse_mode: 'Markdown' })
    } else if (text === '/share') {
      await tg('sendMessage', { chat_id: chatId, text: `Share this with someone who deserves better than swiping:\n\n${SHARE_TEXT}`, parse_mode: 'Markdown' })
    } else if (text === '/about') {
      await tg('sendMessage', { chat_id: chatId, text: `*About Pulse*\n\nPulse runs live video speed dating sessions. Five people. Five minutes each. Camera on.\n\nBody language doesn't lie. You know in seconds what takes weeks to discover over text.\n\nHow it works:\n1. Book a session\n2. 5 live video dates, 5 minutes each\n3. Mutual matches revealed\n\nWomen join free. Men pay AED 75/session.\n\nThe first date you'll actually remember.\n\n${SITE}`, parse_mode: 'Markdown' })
    } else {
      await tg('sendMessage', { chat_id: chatId, text: `Hey ${firstName}!\n\nI'm the Pulse bot. Here's what I can do:\n\n/start - Welcome & intro\n/status - Waitlist stats\n/share - Share Pulse with a friend\n/about - Learn how Pulse works\n\nOr just head to ${SITE} to join the waitlist`, parse_mode: 'Markdown' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Bot error:', err)
    return res.status(200).json({ ok: true })
  }
}
