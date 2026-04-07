import type { SajuInput, SajuResult } from './types'
import { getYeonju, getWolju, getIlju, getSiju } from './ganji'
import { getSipsungResult } from './sipsung'
import { getDaeun } from './daeun'
import { lunarToSolar } from './lunar'

export function getSaju(input: SajuInput): SajuResult {
  let { year, month, day, hour, gender, calendarType } = input

  // 음력 → 양력 변환
  if (calendarType === '음력') {
    const solar = lunarToSolar(year, month, day)
    year = solar.year
    month = solar.month
    day = solar.day
  }

  const solarDate = { year, month, day }

  // 4주 계산
  const yeonju = getYeonju(year, month, day)
  const { ganji: wolju, jeolgiName } = getWolju(year, month, day, yeonju.cheonganIdx)
  const ilju = getIlju(year, month, day)
  const siju = getSiju(hour, ilju.cheonganIdx)

  // 십성
  const sipsung = getSipsungResult(ilju, { yeonju, wolju, siju })

  // 대운
  const { daeun, daeunStartAge } = getDaeun(year, month, day, gender, yeonju, wolju)

  return {
    input,
    solarDate,
    yeonju, wolju, ilju, siju,
    sipsung,
    daeun,
    daeunStartAge,
    jeolgiName,
  }
}

// ── AI 해석용 프롬프트 변환 ─────────────────────────
export function sajuToAIPrompt(result: SajuResult): string {
  const { yeonju, wolju, ilju, siju, sipsung, daeun, daeunStartAge, input } = result
  const p = (g: typeof yeonju) => `${g.cheongan}${g.jiji}(${g.cheonganKor}${g.jijiKor}/${g.ohaeng})`

  return `
[사주팔자]
연주: ${p(yeonju)}
월주: ${p(wolju)}
일주: ${p(ilju)} ← 일간(본인)
시주: ${p(siju)}

[성별] ${input.gender}

[십성 분석]
연주 - 천간: ${sipsung.yeonjuCg}, 지지: ${sipsung.yeonjuJj}
월주 - 천간: ${sipsung.woljuCg}, 지지: ${sipsung.woljuJj}
일주 - 지지: ${sipsung.iljuJj}
시주 - 천간: ${sipsung.sijuCg}, 지지: ${sipsung.sijuJj}

[대운] 시작: ${daeunStartAge.toFixed(1)}세
${daeun.slice(0, 5).map(d =>
  `  ${d.startAge}~${d.endAge}세: ${d.ganji.cheongan}${d.ganji.jiji}`
).join('\n')}
`.trim()
}

// ── Supabase 저장용 직렬화 ──────────────────────────
export function sajuToDBRecord(result: SajuResult, userId: string) {
  return {
    user_id: userId,
    input_data: result.input,
    yeonju: result.yeonju,
    wolju: result.wolju,
    ilju: result.ilju,
    siju: result.siju,
    sipsung: result.sipsung,
    daeun: result.daeun,
    daeun_start_age: result.daeunStartAge,
    solar_date: result.solarDate,
    created_at: new Date().toISOString(),
  }
}

export type { SajuInput, SajuResult, Ganji, DaeunItem, SipsungResult } from './types'
export { lunarToSolar } from './lunar'
