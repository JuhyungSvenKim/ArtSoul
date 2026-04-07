import type { SajuInput, SajuResult } from './types'
import { getYeonju, getWolju, getIlju, getSiju } from './ganji'
import { getSipsungResult } from './sipsung'
import { getTwelveStage } from './twelve-stages'
import { getGongmang } from './gongmang'
import { analyzeRelations } from './relations'
import { getGyeokguk } from './gyeokguk'
import { analyzeSinsal } from './sinsal'
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

  // 12운성 (일간 기준)
  const d = ilju.cheonganIdx
  const twelveStages = {
    yeonjuCg: getTwelveStage(d, yeonju.cheonganIdx),  // 천간은 12운성 대상 아님 → 지지 기준
    yeonjuJj: getTwelveStage(d, yeonju.jijiIdx),
    woljuCg: getTwelveStage(d, wolju.jijiIdx),        // 실무에서는 지지만 봄
    woljuJj: getTwelveStage(d, wolju.jijiIdx),
    iljuJj: getTwelveStage(d, ilju.jijiIdx),
    sijuCg: getTwelveStage(d, siju.jijiIdx),
    sijuJj: getTwelveStage(d, siju.jijiIdx),
  }

  // 격국
  const gyeokguk = getGyeokguk(ilju, wolju, yeonju, siju)

  // 신살
  const sinsal = analyzeSinsal({ yeonju, wolju, ilju, siju })

  // 공망
  const gongmang = getGongmang(ilju.cheonganIdx, ilju.jijiIdx)

  // 합/충/형/파/해
  const relations = analyzeRelations({ yeonju, wolju, ilju, siju })

  // 대운
  const { daeun, daeunStartAge } = getDaeun(year, month, day, gender, yeonju, wolju)

  return {
    input,
    solarDate,
    yeonju, wolju, ilju, siju,
    sipsung,
    twelveStages,
    gyeokguk,
    sinsal,
    gongmang,
    relations,
    daeun,
    daeunStartAge,
    jeolgiName,
  }
}

// ── AI 해석용 프롬프트 변환 ─────────────────────────
export function sajuToAIPrompt(result: SajuResult): string {
  const { yeonju, wolju, ilju, siju, sipsung, twelveStages, gyeokguk, sinsal, gongmang, relations, daeun, daeunStartAge, input } = result
  const p = (g: typeof yeonju) => `${g.cheongan}${g.jiji}(${g.cheonganKor}${g.jijiKor}/${g.ohaeng})`

  const sinsalStr = sinsal.length > 0
    ? sinsal.map(s => `${s.name}(${s.position})`).join(', ')
    : '없음'

  const relStr = relations.length > 0
    ? relations.map(r => `${r.detail}(${r.positions.join('-')})`).join(', ')
    : '없음'

  return `
[사주팔자]
연주: ${p(yeonju)}
월주: ${p(wolju)}
일주: ${p(ilju)} ← 일간(본인)
시주: ${p(siju)}

[성별] ${input.gender}

[십성]
연주 - 천간: ${sipsung.yeonjuCg}, 지지: ${sipsung.yeonjuJj}
월주 - 천간: ${sipsung.woljuCg}, 지지: ${sipsung.woljuJj}
일주 - 지지: ${sipsung.iljuJj}
시주 - 천간: ${sipsung.sijuCg}, 지지: ${sipsung.sijuJj}

[12운성]
연지: ${twelveStages.yeonjuJj}, 월지: ${twelveStages.woljuJj}, 일지: ${twelveStages.iljuJj}, 시지: ${twelveStages.sijuJj}

[격국] ${gyeokguk.name} - ${gyeokguk.description}

[신살] ${sinsalStr}

[공망] ${gongmang.jiji1Kor}(${gongmang.jiji1}), ${gongmang.jiji2Kor}(${gongmang.jiji2})

[합충형파해] ${relStr}

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
    twelve_stages: result.twelveStages,
    gyeokguk: result.gyeokguk,
    sinsal: result.sinsal,
    gongmang: result.gongmang,
    relations: result.relations,
    daeun: result.daeun,
    daeun_start_age: result.daeunStartAge,
    solar_date: result.solarDate,
    created_at: new Date().toISOString(),
  }
}

export type { SajuInput, SajuResult, Ganji, DaeunItem, SipsungResult, TwelveStagesResult } from './types'
export type { TwelveStage } from './twelve-stages'
export type { Gongmang } from './gongmang'
export type { RelationItem } from './relations'
export type { GyeokgukResult } from './gyeokguk'
export type { SinsalItem } from './sinsal'
export { lunarToSolar } from './lunar'
