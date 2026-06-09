import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${process.env.BROADCAST_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { recipients, subject, body } = req.body
  if (!recipients?.length || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const results = await Promise.allSettled(
    recipients.map(r =>
      transporter.sendMail({
        from: `"Sapphire Leadership Academy" <${process.env.GMAIL_USER}>`,
        to: r.email,
        subject,
        html: buildHtml(r.name, body),
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  res.status(200).json({ sent, failed })
}

function buildHtml(name, body) {
  const lines = body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .split('\n').map(l => `<p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.7">${l || '&nbsp;'}</p>`).join('')
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:32px auto">
  <div style="background:linear-gradient(90deg,#0A3480,#0F52BA);padding:24px 32px;border-radius:12px 12px 0 0">
    <p style="color:white;font-weight:700;font-size:15px;margin:0;letter-spacing:.5px">SAPPHIRE LEADERSHIP ACADEMY</p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none">
    <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi ${name},</p>
    ${lines}
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center">
    <p style="color:#9ca3af;font-size:12px;margin:0">Sapphire Virtual Networks · Leadership Academy 2026</p>
  </div>
</div></body></html>`
}
