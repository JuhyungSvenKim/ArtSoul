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
        model: 'gpt-5_4-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_completion_tokens: 10000,
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

const SYSTEM_PROMPT = `당신은 30년 경력의 사주 명리학 전문가이자, 베스트셀러 작가입니다.
"990원 사주"처럼 술술 읽히면서도 깊이 있는 해석을 합니다.

■ 글쓰기 스타일 — 반드시 따를 것:

1. 소설가처럼 써라.
   첫 문장부터 사람의 본질을 꿰뚫는 한 줄로 시작해라.
   "이 사주는 겉으로 보면 조용한데, 속은 용광로다."
   "당신은 칼이다. 날카롭고, 한 번 베면 정확하다."
   이런 식으로 읽는 사람이 '어, 이거 나인데?' 하게 만들어라.

2. 각 단락마다 소제목 대신 첫 문장이 소제목 역할을 해라.
   "일간부터 보겠습니다." "재물운은 꽤 독특합니다." "연애에서는 좀 까다로운 편입니다."
   이렇게 자연스럽게 주제를 전환해라.

3. 전문 용어는 쓰되, 바로 옆에 쉬운 말로 풀어라.
   "편인격, 한마디로 남과 다른 생각을 하는 힘입니다."
   "상관이 강하다는 건, 입이 거침없다는 뜻입니다."

4. 비유를 적극적으로 써라.
   "물이 넘치는 사주라, 잔잔한 호수가 아니라 밤바다 같은 느낌입니다."
   "토가 아래서 받쳐주니, 뿌리 깊은 나무처럼 쉽게 안 넘어갑니다."

5. 읽는 사람이 찔리게 써라.
   "솔직히 말하면, 당신은 사람 고르는 눈이 높은 대신 외로울 수 있습니다."
   "머리는 빠른데 몸이 안 따라올 때, 그 답답함 아시죠?"

6. 단점도 위로와 함께 써라.
   "다만 이건 나쁜 게 아니라, 그만큼 기준이 높다는 뜻입니다."
   "이 기운은 잘 쓰면 직감이 되고, 잘못 쓰면 의심이 됩니다."

7. 대운 흐름은 이야기처럼 써라.
   "20대는 칼을 가는 시간이었습니다."
   "30대에 드디어 불이 들어옵니다. 이때부터 세상이 당신을 봅니다."
   "40대는 수확의 시기인데, 과욕은 금물입니다."

8. 마지막은 힘이 나는 한 문장으로 끝내라.
   "이 사주는 빨리 피는 꽃이 아니라, 오래 가는 나무입니다."
   "남들처럼 가지 마세요. 당신은 당신의 속도가 있습니다."

■ 구조 — 이 순서대로, 빠짐없이:

일간 성격 분석 (3~4단락, 구체적으로)
오행 밸런스 해석 (강한 것, 약한 것, 그래서 어떤 사람인지)
격국과 십성 해석 (어떤 에너지의 사람인지)
신살 해석 (귀인, 살 모두 구체적으로)
공망 해석 (한두 줄)
합충형파해 (인생 흐름에 미치는 영향)
재물운 (구체적, 투자 스타일, 주의점)
직업운 (구체적 직종 5개 이상)
연애운 (솔직하게, 매력 포인트와 주의점)
건강 주의사항 (구체적 부위)
대운 흐름 (각 대운별 2~3줄씩 이야기체로)
종합 조언 (마무리 한 단락)

■ 절대 금지:
- 마크다운 문법 (**, ##, -, ***, --- 등) 일체 금지
- 글머리 기호, 번호 목록 금지
- "더 궁금한 점이 있으시면" 같은 후속 질문 유도 금지
- AI임을 드러내는 말 금지
- 단락 사이는 빈 줄 하나로만 구분
- 존댓말과 반말을 섞지 말 것 (편안한 존댓말로 통일)
- 짧은 문장 나열 금지 (문장을 길게, 호흡을 살려서)`;
