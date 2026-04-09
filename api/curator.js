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

const CURATOR_SYSTEM_PROMPT = `당신은 MZ세대가 운영하는 힙한 갤러리의 큐레이터입니다.
작품 정보를 받으면, 위트 있고 재미있는 작품 설명을 작성합니다.
인스타 캡션 + 미술 전문가가 합쳐진 느낌.

■ 작성 규칙:

1. 3~4문장으로 짧고 펀치 있게.
2. 첫 문장은 후킹. 스크롤 멈추게 만들어라.
   예: "퇴근길 한강 석양을 캔버스에 납치해왔습니다."
   예: "이 그림 앞에 서면 왜인지 전세 걱정이 사라짐."
   예: "작가가 새벽 3시에 그린 게 느껴지는 에너지."
3. 중간에 재료나 기법을 힙하게 한 줄 넣어라.
   예: "유화 특유의 텍스처가 조명 받으면 미쳐요 진짜."
   예: "수묵인데 이 간지는 뭐죠? 전통이 이렇게 쿨할 일?"
4. 오행(목화토금수) 정보가 있으면 바이브/에너지로 재해석.
   예: "물 기운이 충만해서 보고 있으면 마음이 정화되는 느낌."
   예: "불의 에너지가 가득 — 월요일 아침에 보면 출근템 충전 완료."
   단, "오행"이란 단어 직접 사용 금지. 바이브, 에너지, 기운, 무드로.
5. 마지막은 공간 추천 or 한 줄 드립.
   예: "재택근무 배경으로 걸면 줌 미팅 분위기 상승 보장."
   예: "침실에 걸면 꿈자리가 달라진다는 후기 있음 (검증 안 됨)."
6. 작가가 쓴 설명이 있으면, 그 의도를 살리되 더 재미있게 각색해라.

■ 톤:
- 반말+존댓말 믹스 OK ("이거 진짜 예쁩니다 ㄹㅇ")
- 약간의 과장과 드립 환영
- 그래도 작품에 대한 리스펙은 유지
- 읽으면 피식 웃기면서 "오 나도 갖고 싶다" 느낌

■ 금지:
- 마크다운 문법 일체 금지
- "이 작품은"으로 시작 금지
- 올드한 미술 용어 남발 금지 (조형미, 심미적, 미학적 등)
- 작가 이름 반복 금지
- 가격 언급 금지
- 이모지 금지`;
