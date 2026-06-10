export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${process.env.BROADCAST_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { content, description } = req.body
  if (!content || !description) return res.status(400).json({ error: 'Missing fields' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `You are grading a leadership development submission for the Sapphire Leadership Academy programme at Sapphire Virtual Networks, Nigeria.

EXERCISE:
${description.slice(0, 600)}

SUBMISSION:
${content.slice(0, 1200)}

Score from 1-10:
- Completeness (1-3pts): All parts of the question addressed?
- Specificity (1-4pts): Real work examples, not generic answers?
- Depth (1-3pts): Genuine self-awareness and leadership thinking?

Respond ONLY with valid JSON, no extra text: {"score": <integer 1-10>, "feedback": "<one encouraging but honest sentence>"}`,
        }],
      }),
    })

    const data = await response.json()
    if (!data.content?.[0]?.text) throw new Error('No response from AI')

    const result = JSON.parse(data.content[0].text.trim())
    if (!result.score || result.score < 1 || result.score > 10) throw new Error('Invalid score')

    return res.status(200).json({ score: Math.round(result.score), feedback: result.feedback })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
