export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  try {
    const { artwork } = req.body;
    if (!artwork || !artwork.title) {
      return res.status(400).json({ error: 'artwork with title is required' });
    }

    const prompt = buildCuratorPrompt(artwork);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: CURATOR_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_completion_tokens: 1000,
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ error: `OpenAI API error: ${rawText}` });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: `Failed to parse response` });
    }

    const text = data.choices?.[0]?.message?.content || null;
    if (!text) {
      return res.status(500).json({ error: 'No text in response' });
    }

    return res.status(200).json({ success: true, description: text.trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

function buildCuratorPrompt(artwork) {
  const parts = [`작품명: ${artwork.title}`];
  if (artwork.artistName) parts.push(`작가: ${artwork.artistName}`);
  if (artwork.genre) parts.push(`장르/재료: ${artwork.genre}`);
  if (artwork.subject) parts.push(`소재: ${artwork.subject}`);
  if (artwork.style) parts.push(`표현 스타일: ${artwork.style}`);
  if (artwork.color) parts.push(`색감/톤: ${artwork.color}`);
  if (artwork.energy) parts.push(`구도/기운: ${artwork.energy}`);
  if (artwork.primaryOhaeng) parts.push(`주 오행: ${artwork.primaryOhaeng}`);
  if (artwork.secondaryOhaeng) parts.push(`보조 오행: ${artwork.secondaryOhaeng}`);
  if (artwork.eumYang) parts.push(`음양: ${artwork.eumYang}`);
  if (artwork.sizeCmW && artwork.sizeCmH) parts.push(`크기: ${artwork.sizeCmW}×${artwork.sizeCmH}cm`);
  if (artwork.userDescription) parts.push(`작가의 설명: ${artwork.userDescription}`);
  return parts.join('\n');
}

const CURATOR_SYSTEM_PROMPT = `당신은 서울 최고 갤러리의 수석 큐레이터입니다.
작품 정보를 받으면, 감성적이면서도 전문적인 작품 설명을 작성합니다.

■ 작성 규칙:

1. 3~5문장으로 간결하게.
2. 첫 문장은 작품의 핵심 인상을 담은 감성적 한 줄.
   예: "고요한 산수 속에 숨겨진 한 줄기 바람의 이야기."
3. 중간에 재료, 기법, 색감의 특징을 자연스럽게 녹여라.
4. 오행(목화토금수) 정보가 있으면, 기운과 에너지를 시적으로 풀어라.
   예: "수(水)의 깊은 기운이 캔버스 위에 잔잔히 스민다."
   단, "오행"이라는 단어를 직접 쓰지 마라. 기운, 에너지, 흐름 등으로 표현.
5. 마지막 문장은 작품이 놓일 공간이나 감상자에게 줄 감정을 언급.
   예: "거실 한켠에 걸어두면, 하루의 피로가 천천히 녹아내릴 작품."
6. 작가가 직접 쓴 설명이 있으면, 그 의도를 존중하되 더 풍성하게 다듬어라.

■ 금지:
- 마크다운 문법 일체 금지
- "이 작품은"으로 시작 금지 (변화를 줘라)
- 과장된 수식어 남발 금지 (우아한, 아름다운 등 1회 이하)
- 작가 이름 반복 금지
- 가격 언급 금지`;
