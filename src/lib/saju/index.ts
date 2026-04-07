import type { SajuInput, SajuResult } from './types'
import { getYeonju, getWolju, getIlju, getSiju } from './ganji'
import { getSipsungResult } from './sipsung'
import { getTwelveStage } from './twelve-stages'
import { getGongmang } from './gongmang'
import { analyzeRelations } from './relations'
import { getGyeokguk } from './gyeokguk'
import { analyzeSinsal, groupSinsalByPillar, interpretByPillar } from './sinsal'
import { analyzeYongsin } from './yongsin'
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
    yeonjuCg: getTwelveStage(d, yeonju.cheonganIdx),
    yeonjuJj: getTwelveStage(d, yeonju.jijiIdx),
    woljuCg: getTwelveStage(d, wolju.jijiIdx),
    woljuJj: getTwelveStage(d, wolju.jijiIdx),
    iljuJj: getTwelveStage(d, ilju.jijiIdx),
    sijuCg: getTwelveStage(d, siju.jijiIdx),
    sijuJj: getTwelveStage(d, siju.jijiIdx),
  }

  // 격국
  const gyeokguk = getGyeokguk(ilju, wolju, yeonju, siju)

  // 신살
  const sinsal = analyzeSinsal({ yeonju, wolju, ilju, siju })
  const sinsalByPillar = groupSinsalByPillar(sinsal)
  const pillarInterpretations = interpretByPillar(sinsalByPillar)

  // 공망
  const gongmang = getGongmang(ilju.cheonganIdx, ilju.jijiIdx)

  // 합/충/형/파/해
  const relations = analyzeRelations({ yeonju, wolju, ilju, siju })

  // 용신 분석
  const yongsin = analyzeYongsin({ yeonju, wolju, ilju, siju }, sipsung)

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
    sinsalByPillar,
    pillarInterpretations,
    gongmang,
    relations,
    yongsin,
    daeun,
    daeunStartAge,
    jeolgiName,
  }
}

// ── AI 해석용 프롬프트 변환 (자평명리 관점) ────────────
export function sajuToAIPrompt(result: SajuResult): string {
  const { yeonju, wolju, ilju, siju, sipsung, twelveStages, gyeokguk, sinsalByPillar, pillarInterpretations, gongmang, relations, yongsin, daeun, daeunStartAge, input } = result
  const p = (g: typeof yeonju) => `${g.cheongan}${g.jiji}(${g.cheonganKor}${g.jijiKor}/${g.ohaeng})`

  const relStr = relations.length > 0
    ? relations.map(r => `${r.detail}(${r.positions.join('-')})`).join(', ')
    : '없음'

  // 주별 신살 포맷
  const pillarSinsalStr = pillarInterpretations.map(pi => {
    const names = pi.sinsalNames.length > 0 ? pi.sinsalNames.join(', ') : '없음'
    return `${pi.position}(${pi.meaning}): [${names}]`
  }).join('\n')

  return `
## 사주 원국

[사주팔자]
연주: ${p(yeonju)}
월주: ${p(wolju)}
일주: ${p(ilju)} ← 일간(본인)
시주: ${p(siju)}
성별: ${input.gender}

## 메인 분석 (자평명리 핵심)

[오행 분포]
목: ${yongsin.ohaengBalance.목}개(${yongsin.ohaengPercent.목}%), 화: ${yongsin.ohaengBalance.화}개(${yongsin.ohaengPercent.화}%), 토: ${yongsin.ohaengBalance.토}개(${yongsin.ohaengPercent.토}%), 금: ${yongsin.ohaengBalance.금}개(${yongsin.ohaengPercent.금}%), 수: ${yongsin.ohaengBalance.수}개(${yongsin.ohaengPercent.수}%)

[일간 강약] ${yongsin.dayStrength} — ${yongsin.strengthReason}

[용신] ${yongsin.yongsin} — ${yongsin.yongsinDescription}
희신: ${yongsin.huisin} / 기신: ${yongsin.gisin} / 구신: ${yongsin.gusin}

[십성]
연주 - 천간: ${sipsung.yeonjuCg}, 지지: ${sipsung.yeonjuJj}
월주 - 천간: ${sipsung.woljuCg}, 지지: ${sipsung.woljuJj}
일주 - 지지: ${sipsung.iljuJj}
시주 - 천간: ${sipsung.sijuCg}, 지지: ${sipsung.sijuJj}

[격국] ${gyeokguk.name} — ${gyeokguk.description}

[12운성]
연지: ${twelveStages.yeonjuJj}, 월지: ${twelveStages.woljuJj}, 일지: ${twelveStages.iljuJj}, 시지: ${twelveStages.sijuJj}

## 보정 분석 (파생 피처)

[신살 — 주별 배치]
${pillarSinsalStr}

[공망] ${gongmang.jiji1Kor}(${gongmang.jiji1}), ${gongmang.jiji2Kor}(${gongmang.jiji2})

[합충형파해] ${relStr}

## 대운

시작: ${daeunStartAge.toFixed(1)}세
${daeun.slice(0, 8).map(d =>
  `${d.startAge}~${d.endAge}세: ${d.ganji.cheongan}${d.ganji.jiji}(${d.ganji.cheonganKor}${d.ganji.jijiKor})`
).join('\n')}

## 사주 총평
${yongsin.summary}
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
    yongsin: result.yongsin,
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
export type { SinsalItem, SinsalByPillar, PillarInterpretation } from './sinsal'
export type { YongsinResult } from './yongsin'
export { lunarToSolar } from './lunar'
