/**
 * Gemini Imagen 3 — 케이스코드별 AI 아트 이미지 생성
 * POST /api/generate-art
 * body: { caseCode: "W1-S2" }
 * returns: { success: true, imageUrl: "data:image/png;base64,..." }
 */

// 케이스코드 → 이미지 프롬프트 매핑
const ELEMENT_PROMPT = {
  W: { color: 'green, emerald, forest tones', subject: 'trees, leaves, bamboo, spring nature', mood: 'growth, vitality' },
  F: { color: 'red, orange, warm crimson tones', subject: 'sunset, flames, warm light, passion', mood: 'passion, energy' },
  E: { color: 'yellow, ochre, earthy brown tones', subject: 'mountains, pottery, harvest fields, earth', mood: 'stability, warmth' },
  M: { color: 'white, silver, cool grey tones', subject: 'snow, metal, moon, crystal geometry', mood: 'precision, clarity' },
  A: { color: 'blue, navy, deep ocean tones', subject: 'ocean waves, rain, flowing water, mist', mood: 'depth, mystery' },
}

const ENERGY_PROMPT = {
  1: 'minimal composition, lots of negative space, serene and quiet, zen-like emptiness',
  2: 'balanced and harmonious composition, symmetrical, calm and orderly',
  3: 'dynamic and energetic composition, bold movement, strong diagonal lines',
  4: 'flowing and organic composition, curved lines, soft transitions, fluid movement',
  5: 'dense and detailed composition, rich textures, intricate layers, full coverage',
}

const STYLE_PROMPT = {
  S1: 'classical fine art painting style, Renaissance or Baroque, oil on canvas, museum quality',
  S2: 'traditional East Asian art, ink wash painting, sumi-e, calligraphic brushstrokes, rice paper texture',
  S3: 'modern minimalist art, clean lines, contemporary interior art, Scandinavian aesthetic',
  S4: 'pop art style, bold graphics, vibrant street art, contemporary urban art',
  S5: 'premium unique art piece, gallery collector level, avant-garde, mixed media luxury',
}

function buildPrompt(caseCode) {
  const elementKey = caseCode[0]
  const energy = parseInt(caseCode[1])
  const styleKey = caseCode.split('-')[1]

  const el = ELEMENT_PROMPT[elementKey] || ELEMENT_PROMPT.W
  const en = ENERGY_PROMPT[energy] || ENERGY_PROMPT[3]
  const st = STYLE_PROMPT[styleKey] || STYLE_PROMPT.S3

  return `Create a beautiful fine art painting for interior decoration.
Color palette: ${el.color}.
Subject matter: ${el.subject}.
Mood: ${el.mood}.
Composition: ${en}.
Art style: ${st}.
High quality, suitable for wall display, no text, no watermark, no frame, square format.`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })
  }

  try {
    const { caseCode } = req.body
    if (!caseCode) return res.status(400).json({ error: 'caseCode is required' })

    const prompt = buildPrompt(caseCode)

    // Gemini Imagen 3.1 Flash API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            personGeneration: 'DONT_ALLOW',
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      return res.status(response.status).json({ error: `Imagen API error: ${errText.slice(0, 500)}` })
    }

    const data = await response.json()
    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded

    if (!imageBytes) {
      return res.status(500).json({ error: 'No image generated' })
    }

    return res.status(200).json({
      success: true,
      imageUrl: `data:image/png;base64,${imageBytes}`,
      caseCode,
      prompt,
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal server error' })
  }
}
