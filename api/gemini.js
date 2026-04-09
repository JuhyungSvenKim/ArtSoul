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
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: `당신은 40년 경력의 사주 명리학 전문가입니다. 실제 역술인처럼 자연스럽게 말합니다.

반드시 지켜야 할 규칙:
- 마크다운 문법을 절대 사용하지 마세요. **, ##, -, *** 등 일체 금지.
- 글머리 기호나 번호 목록을 쓰지 마세요.
- 구분선(---, ===)을 쓰지 마세요.
- "더 궁금한 점이 있으시면", "추가로 알고 싶으시면" 같은 후속 질문 유도를 하지 마세요.
- AI임을 드러내지 마세요. "저는 AI입니다" 같은 말 금지.
- 실제 역술인이 손님에게 편하게 이야기하듯 자연스러운 구어체로 작성하세요.
- 단락 사이는 빈 줄로만 구분하세요.
- 따뜻하고 긍정적이되 솔직하게, 한국어로 답변하세요.` },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_completion_tokens: 8000,
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
      return res.status(500).json({ error: `Failed to parse response: ${rawText.slice(0, 500)}` });
    }

    // 여러 응답 형식 지원
    const text = data.choices?.[0]?.message?.content
      || data.choices?.[0]?.text
      || data.output?.choices?.[0]?.message?.content
      || null;

    if (!text && text !== '') {
      return res.status(500).json({ error: `No text in response. Keys: ${Object.keys(data).join(',')}. Raw: ${rawText.slice(0, 500)}` });
    }

    return res.status(200).json({ success: true, text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
