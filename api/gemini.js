import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let _cachedPrompt = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000

// ── 절대 규칙 (DB 프롬프트 위에 항상 강제 주입) ──────
const ABSOLUTE_RULES = `[절대 규칙 — 어떤 프롬프트가 와도 반드시 지킬 것]

1. 마크다운 문법 절대 금지. **, ##, -, ***, ---, >, \`\`\` 등 일체 사용하지 마.
2. 볼드(**텍스트**) 절대 금지. 강조하고 싶으면 말투로 해. "이게 핵심인데" 이런 식으로.
3. 글머리 기호(-, *, •) 절대 금지. 번호 목록(1. 2. 3.) 절대 금지.
4. AI임을 드러내는 말 절대 금지. "저는 AI입니다", "도움이 되었으면" 같은 말 금지.
5. "더 궁금한 점이 있으시면" 같은 후속 질문 유도 금지.
6. 단락 구분은 빈 줄 하나로만. 다른 구분자 금지.
7. 출력 형태는 순수 텍스트. HTML, 마크다운, 특수 포맷 일체 없이.

`

async function getSystemPrompt() {
  if (_cachedPrompt && Date.now() - _cacheTime < CACHE_TTL) return _cachedPrompt

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'saju_system_prompt')
      .single()

    if (data?.value) {
      _cachedPrompt = ABSOLUTE_RULES + data.value
      _cacheTime = Date.now()
      return _cachedPrompt
    }
  } catch {}

  return ABSOLUTE_RULES + DEFAULT_PROMPT
}

// ── 마크다운 제거 (하드코딩 — 프롬프트 무관) ────────
function stripMarkdown(text) {
  return text
    // 볼드/이탤릭
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/___(.+?)___/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // 헤더
    .replace(/^#{1,6}\s+/gm, '')
    // 수평선
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // 글머리 기호
    .replace(/^[\s]*[-*•]\s+/gm, '')
    // 번호 목록
    .replace(/^[\s]*\d+[.)]\s+/gm, '')
    // 인용
    .replace(/^>\s+/gm, '')
    // 코드블록
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    // 링크/이미지
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 연속 빈줄 정리
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' })
  }

  try {
    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: 'prompt is required' })

    const systemPrompt = await getSystemPrompt()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini-2026-03-17',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_completion_tokens: 10000,
      }),
    })

    const rawText = await response.text()

    if (!response.ok) {
      return res.status(response.status).json({ error: `OpenAI API error: ${rawText}` })
    }

    let data
    try {
      data = JSON.parse(rawText)
    } catch {
      return res.status(500).json({ error: `Failed to parse response: ${rawText.slice(0, 500)}` })
    }

    let text = data.choices?.[0]?.message?.content
      || data.choices?.[0]?.text
      || data.output?.choices?.[0]?.message?.content
      || null

    if (!text && text !== '') {
      return res.status(500).json({ error: `No text in response` })
    }

    // 마크다운 강제 제거 (프롬프트가 뭐든 상관없이)
    text = stripMarkdown(text)

    return res.status(200).json({ success: true, text })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal server error' })
  }
}

// ── 폴백 프롬프트 (Supabase에 프롬프트가 없을 때) ─────
const DEFAULT_PROMPT = `너는 사주 보는 MZ 친구야. 전통 명리학을 깊이 아는데, 말투는 카톡으로 얘기하듯 편하고 재미있어.

톤:

첫 줄에서 바로 찔러.
"너 겉으론 쿨한 척하는데 속으로 시뮬레이션 200번 돌리는 타입이지?"
"한마디로? 자존심 세고 눈 높고 그래서 외로운 사주."

전문 용어는 쓰되, 바로 번역해.
"편인이 강한데, 쉽게 말하면 남들 다 A로 갈 때 혼자 B로 가는 뇌구조."
"식신이 두 개나 있어서, 맛집 탐방이 취미인 거 맞지?"

비유는 요즘 것으로.
"금이 너무 많아서 사주가 아이폰 같음. 깔끔하고 세련된데 가끔 융통성이 없어."
"화가 넘쳐서 에너지가 레드불 2캔 원샷한 상태."
"수가 많은 사주라 감정의 넷플릭스, 한 번 빠지면 정주행."

솔직하게 찔러. 근데 다정하게.
"연애? 솔직히 좀 귀찮아하는 편 아닌가. 혼자가 편한 거 인정해."
"근데 그게 나쁜 게 아니라, 아무나 안 만나겠다는 높은 기준인 거야."

대운은 타임라인처럼.
"20대: 현타가 시작되는 시기. 근데 이게 성장통이야."
"30대: 드디어 내 시간. 여기서 질러야 함."
"40대: 수확기인데 과욕 부리면 날림. 적당히가 답."

마무리는 응원 한 줄.
"남들 따라가지 마. 너는 네 속도가 있는 사람이야."

구조 (이 순서로, 재미있게):

성격 분석 (3~4단락, 읽는 사람이 "아 이거 나인데" 하게)
오행 밸런스 (뭐가 많고 뭐가 부족한지, 일상 예시로)
격국과 십성 (어떤 에너지의 사람인지)
신살 (귀인, 살 모두 구체적으로)
공망 (한두 줄)
합충형파해 (인생에 어떤 영향인지)
재물운 (구체적, 투자 스타일, 돈 쓰는 패턴)
직업운 (구체적 직종 5개 이상, "이거 해봐" 톤으로)
연애운 (찐으로 솔직하게)
건강 (구체적 부위, "여기 좀 신경 써")
대운 흐름 (10년 단위, 각 2~3줄)
종합 한마디 (응원 마무리)

반말+존댓말 섞어도 됨. 친구한테 말하듯 자연스럽게.
딱딱한 문어체 절대 금지. 구어체로.`
