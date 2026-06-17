import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization?.replace('Bearer ', '')
  if (auth !== process.env.VITE_BROADCAST_SECRET) return res.status(401).json({ error: 'Unauthorized' })

  const { name, email, department, role, reporting_manager, phone } = req.body
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' })

  try {
    // Create auth user (no password — they'll use magic link / OTP to log in)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // skip email confirmation step
    })
    if (authErr) throw authErr
    const userId = authData.user.id

    // Create participant record
    const { error: partErr } = await supabaseAdmin.from('participants').insert({
      user_id: userId,
      name,
      email,
      department: department || null,
      role: role || null,
      reporting_manager: reporting_manager || null,
      phone: phone || null,
    })
    if (partErr) {
      // Roll back auth user if participant insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      throw partErr
    }

    // Generate magic link so they can log in immediately
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkErr) throw linkErr
    const magicLink = linkData.properties?.action_link

    // Send welcome email
    await transporter.sendMail({
      from: `"Sapphire Leadership Academy" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to the Sapphire Leadership Academy',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
          <div style="background:linear-gradient(90deg,#0A3480,#0F52BA);padding:28px 32px;border-radius:12px 12px 0 0">
            <p style="color:white;font-size:13px;font-weight:600;letter-spacing:1px;margin:0;text-transform:uppercase">Sapphire Leadership Academy</p>
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">
            <p style="font-size:20px;font-weight:700;margin:0 0 8px">Welcome, ${name}.</p>
            <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px">
              You've been added to the Sapphire Leadership Academy platform. Click the button below to access your dashboard — no password needed.
            </p>
            <a href="${magicLink}" style="display:inline-block;background:#0F52BA;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px">
              Access My Dashboard →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.5">
              This link expires in 24 hours. If it expires, go to
              <a href="${process.env.VITE_APP_URL || 'https://sapphire-leadership-academy.vercel.app'}/login" style="color:#0F52BA">the login page</a>
              and enter your email to get a new one.
            </p>
          </div>
        </div>
      `,
    })

    return res.status(200).json({ success: true, userId })
  } catch (err) {
    console.error('add-participant error:', err)
    return res.status(500).json({ error: err.message })
  }
}
