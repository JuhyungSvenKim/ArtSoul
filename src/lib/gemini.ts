/**
 * Gemini API 호출 (Vercel 서버리스 프록시 사용)
 * API 키는 서버에만 존재하므로 브라우저에 노출되지 않음
 */
export async function callGemini(prompt: string): Promise<string> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API 요청 실패 (${response.status})`);
  }

  const data = await response.json();
  if (!data.success || !data.text) {
    throw new Error(data.error || 'AI 응답을 파싱할 수 없습니다');
  }

  return data.text;
}
