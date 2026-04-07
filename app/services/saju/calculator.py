"""사주팔자 계산 엔진

만세력 기반으로 생년월일시 → 사주 네 기둥(년주·월주·일주·시주) 산출.
오행 밸런스, 격국, 신살, 대운을 계산한다.
"""

from __future__ import annotations

from datetime import date, datetime

from app.models.saju import (
    CHEONGAN,
    CHEONGAN_OHAENG,
    JIJI,
    JIJI_OHAENG,
    DaeunPeriod,
    Gyeokguk,
    Ohaeng,
    OhaengScores,
    SajuPillar,
    SajuProfile,
    Sinsal,
)

# ── 절기(Solar Terms) 기준 월 경계 (양력 근사) ────────────────────
# 각 월의 절기 시작일 (평년 기준 근사값)
MONTH_SOLAR_TERMS = {
    1: (2, 4),   # 입춘 ~2/4
    2: (3, 6),   # 경칩 ~3/6
    3: (4, 5),   # 청명 ~4/5
    4: (5, 6),   # 입하 ~5/6
    5: (6, 6),   # 망종 ~6/6
    6: (7, 7),   # 소서 ~7/7
    7: (8, 7),   # 입추 ~8/7
    8: (9, 8),   # 백로 ~9/8
    9: (10, 8),  # 한로 ~10/8
    10: (11, 7), # 입동 ~11/7
    11: (12, 7), # 대설 ~12/7
    12: (1, 6),  # 소한 ~1/6
}


def _get_saju_month(solar_month: int, solar_day: int) -> int:
    """절기 기반 사주 월(인월=1 기준) 산출. 반환값 1~12."""
    for saju_month in range(12, 0, -1):
        term_month, term_day = MONTH_SOLAR_TERMS[saju_month]
        if (solar_month > term_month) or (
            solar_month == term_month and solar_day >= term_day
        ):
            return saju_month
    return 12


# ── 기준일: 1900-01-31 (경자일, 일진 인덱스 0) ──────────────────
_BASE_DATE = date(1900, 1, 31)
_BASE_DAY_GAN = 6   # 경(庚) = index 6
_BASE_DAY_JI = 0    # 자(子) = index 0


def _year_pillar(year: int) -> SajuPillar:
    """연주 계산 (입춘 기준 보정은 caller에서 처리)"""
    idx = (year - 4) % 60
    gan = CHEONGAN[idx % 10]
    ji = JIJI[idx % 12]
    return SajuPillar(
        cheongan=gan, jiji=ji,
        cheongan_ohaeng=CHEONGAN_OHAENG[gan],
        jiji_ohaeng=JIJI_OHAENG[ji],
    )


def _month_pillar(year_gan_idx: int, saju_month: int) -> SajuPillar:
    """월주 계산 – 연간에 따른 월간 산출"""
    # 월간 공식: (연간 인덱스 * 2 + 사주월) % 10
    month_gan_idx = (year_gan_idx * 2 + saju_month) % 10
    month_ji_idx = (saju_month + 1) % 12  # 인월=1 → 지지 인(寅)=2
    gan = CHEONGAN[month_gan_idx]
    ji = JIJI[month_ji_idx]
    return SajuPillar(
        cheongan=gan, jiji=ji,
        cheongan_ohaeng=CHEONGAN_OHAENG[gan],
        jiji_ohaeng=JIJI_OHAENG[ji],
    )


def _day_pillar(birth_date: date) -> SajuPillar:
    """일주 계산 – 기준일로부터 일수 차이"""
    delta = (birth_date - _BASE_DATE).days
    gan_idx = (_BASE_DAY_GAN + delta) % 10
    ji_idx = (_BASE_DAY_JI + delta) % 12
    gan = CHEONGAN[gan_idx]
    ji = JIJI[ji_idx]
    return SajuPillar(
        cheongan=gan, jiji=ji,
        cheongan_ohaeng=CHEONGAN_OHAENG[gan],
        jiji_ohaeng=JIJI_OHAENG[ji],
    )


def _hour_pillar(day_gan_idx: int, hour: int) -> SajuPillar:
    """시주 계산 – 일간에 따른 시간 산출"""
    # 시간 → 시지 (자시=23~1, 축시=1~3, ...)
    hour_ji_idx = ((hour + 1) // 2) % 12
    # 시간 공식: (일간 인덱스 * 2 + 시지 인덱스) % 10
    hour_gan_idx = (day_gan_idx * 2 + hour_ji_idx) % 10
    gan = CHEONGAN[hour_gan_idx]
    ji = JIJI[hour_ji_idx]
    return SajuPillar(
        cheongan=gan, jiji=ji,
        cheongan_ohaeng=CHEONGAN_OHAENG[gan],
        jiji_ohaeng=JIJI_OHAENG[ji],
    )


# ── 오행 밸런스 ──────────────────────────────────────────────────
def _calc_ohaeng_scores(pillars: list[SajuPillar]) -> OhaengScores:
    scores = {o: 0.0 for o in Ohaeng}
    for p in pillars:
        scores[p.cheongan_ohaeng] += 1.0
        scores[p.jiji_ohaeng] += 1.0
    total = sum(scores.values())
    if total > 0:
        for k in scores:
            scores[k] = round(scores[k] / total * 100, 1)
    return OhaengScores(
        wood=scores[Ohaeng.WOOD],
        fire=scores[Ohaeng.FIRE],
        earth=scores[Ohaeng.EARTH],
        metal=scores[Ohaeng.METAL],
        water=scores[Ohaeng.WATER],
    )


# ── 격국 판단 ────────────────────────────────────────────────────
_GYEOKGUK_TABLE = {
    Ohaeng.WOOD: {
        "strong": Gyeokguk(name="건록격", description="목 기운이 강하여 자기 주장이 뚜렷하고 독립적", strength="strong"),
        "weak": Gyeokguk(name="편인격", description="목 기운이 약해 학문과 사색을 좋아하며 내면이 깊음", strength="weak"),
    },
    Ohaeng.FIRE: {
        "strong": Gyeokguk(name="양인격", description="화 기운이 넘쳐 열정적이고 행동력이 강함", strength="strong"),
        "weak": Gyeokguk(name="식신격", description="화 기운이 부족해 예술적 감각과 표현력이 뛰어남", strength="weak"),
    },
    Ohaeng.EARTH: {
        "strong": Gyeokguk(name="비견격", description="토 기운이 강해 안정적이고 신뢰감을 줌", strength="strong"),
        "weak": Gyeokguk(name="정관격", description="토 기운이 약해 질서와 규율을 중시함", strength="weak"),
    },
    Ohaeng.METAL: {
        "strong": Gyeokguk(name="편관격", description="금 기운이 강해 결단력과 추진력이 있음", strength="strong"),
        "weak": Gyeokguk(name="상관격", description="금 기운이 약해 창의적이고 변화를 추구함", strength="weak"),
    },
    Ohaeng.WATER: {
        "strong": Gyeokguk(name="정재격", description="수 기운이 강해 지혜롭고 재물 복이 있음", strength="strong"),
        "weak": Gyeokguk(name="편재격", description="수 기운이 약해 유연하고 적응력이 뛰어남", strength="weak"),
    },
}


def _determine_gyeokguk(day_pillar: SajuPillar, scores: OhaengScores) -> Gyeokguk:
    day_ohaeng = day_pillar.cheongan_ohaeng
    score_map = scores.model_dump()
    day_score = score_map[day_ohaeng.value]
    strength = "strong" if day_score >= 25 else "weak"
    table = _GYEOKGUK_TABLE.get(day_ohaeng)
    if table:
        return table[strength]
    return Gyeokguk(name="보통격", description="균형 잡힌 사주", strength="balanced")


# ── 신살 계산 ────────────────────────────────────────────────────
_SINSAL_RULES: list[dict] = [
    {
        "name": "역마살",
        "check": lambda pillars: pillars[0].jiji in ("인", "신", "사", "해"),
        "description": "이동과 변화가 많으며 해외 인연이 있음",
        "effect": "neutral",
    },
    {
        "name": "도화살",
        "check": lambda pillars: pillars[2].jiji in ("자", "오", "묘", "유"),
        "description": "매력적이며 예술적 감각이 뛰어남. 대인관계가 좋음",
        "effect": "positive",
    },
    {
        "name": "화개살",
        "check": lambda pillars: pillars[2].jiji in ("진", "술", "축", "미"),
        "description": "학문, 종교, 예술에 재능이 있으며 정신세계가 깊음",
        "effect": "positive",
    },
    {
        "name": "귀문관살",
        "check": lambda pillars: (
            pillars[2].cheongan in ("임", "계")
            and pillars[2].jiji in ("술", "해")
        ),
        "description": "직감력이 뛰어나고 영적 감수성이 높음",
        "effect": "neutral",
    },
    {
        "name": "천을귀인",
        "check": lambda pillars: (
            pillars[2].cheongan in ("갑", "무", "경")
            and any(p.jiji in ("축", "미") for p in pillars)
        ),
        "description": "귀인의 도움을 받으며 위기를 모면하는 복이 있음",
        "effect": "positive",
    },
    {
        "name": "양인살",
        "check": lambda pillars: (
            pillars[2].cheongan == "갑" and any(p.jiji == "묘" for p in pillars)
        ) or (
            pillars[2].cheongan == "병" and any(p.jiji == "오" for p in pillars)
        ),
        "description": "강한 의지와 추진력이 있으나 과격해질 수 있음",
        "effect": "negative",
    },
    {
        "name": "문창귀인",
        "check": lambda pillars: (
            pillars[2].cheongan in ("갑", "을")
            and any(p.jiji in ("사", "오") for p in pillars)
        ),
        "description": "학문과 문필에 재능이 있어 시험운과 학업운이 좋음",
        "effect": "positive",
    },
]


def _calc_sinsal(pillars: list[SajuPillar]) -> list[Sinsal]:
    results = []
    for rule in _SINSAL_RULES:
        if rule["check"](pillars):
            results.append(
                Sinsal(
                    name=rule["name"],
                    description=rule["description"],
                    effect=rule["effect"],
                )
            )
    return results


# ── 대운 계산 ────────────────────────────────────────────────────
def _calc_daeun(
    year_pillar: SajuPillar,
    month_pillar: SajuPillar,
    gender: str,
    birth_year: int,
) -> list[DaeunPeriod]:
    """대운 계산 – 10년 단위 대운 흐름"""
    year_gan_idx = CHEONGAN.index(year_pillar.cheongan)
    month_gan_idx = CHEONGAN.index(month_pillar.cheongan)
    month_ji_idx = JIJI.index(month_pillar.jiji)

    # 양남음녀 순행, 음남양녀 역행
    is_yang = year_gan_idx % 2 == 0
    forward = (is_yang and gender == "male") or (not is_yang and gender == "female")
    direction = 1 if forward else -1

    daeun_list = []
    start_age = 3  # 대운 시작 나이 (근사값)

    for i in range(1, 9):
        gan_idx = (month_gan_idx + i * direction) % 10
        ji_idx = (month_ji_idx + i * direction) % 12
        gan = CHEONGAN[gan_idx]
        ji = JIJI[ji_idx]
        ohaeng = CHEONGAN_OHAENG[gan]

        age_start = start_age + (i - 1) * 10
        age_end = age_start + 9

        description = _daeun_description(ohaeng, gan, ji)
        daeun_list.append(
            DaeunPeriod(
                start_age=age_start,
                end_age=age_end,
                cheongan=gan,
                jiji=ji,
                ohaeng=ohaeng,
                description=description,
            )
        )

    return daeun_list


def _daeun_description(ohaeng: Ohaeng, gan: str, ji: str) -> str:
    descs = {
        Ohaeng.WOOD: f"{gan}{ji}운 - 성장과 발전의 시기. 새로운 시작에 유리하며 학업과 자기계발에 좋은 시기",
        Ohaeng.FIRE: f"{gan}{ji}운 - 열정과 표현의 시기. 사회 활동이 활발해지며 명예운이 상승",
        Ohaeng.EARTH: f"{gan}{ji}운 - 안정과 축적의 시기. 부동산이나 재산 증식에 유리하며 안정을 추구",
        Ohaeng.METAL: f"{gan}{ji}운 - 결실과 수확의 시기. 그동안의 노력이 결실을 맺으며 정리와 마무리",
        Ohaeng.WATER: f"{gan}{ji}운 - 지혜와 유동의 시기. 변화와 이동이 많으며 학문적 성취에 유리",
    }
    return descs.get(ohaeng, f"{gan}{ji}운")


# ── 메인 계산 함수 ───────────────────────────────────────────────
def calculate_saju(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    gender: str,
) -> SajuProfile:
    """생년월일시 + 성별 → SajuProfile 반환"""

    birth_date = date(birth_year, birth_month, birth_day)
    saju_month = _get_saju_month(birth_month, birth_day)

    # 입춘 이전이면 전년도로 계산
    adjusted_year = birth_year
    if birth_month == 1 or (birth_month == 2 and birth_day < 4):
        adjusted_year -= 1

    yp = _year_pillar(adjusted_year)
    year_gan_idx = CHEONGAN.index(yp.cheongan)

    mp = _month_pillar(year_gan_idx, saju_month)
    dp = _day_pillar(birth_date)
    day_gan_idx = CHEONGAN.index(dp.cheongan)
    hp = _hour_pillar(day_gan_idx, birth_hour)

    pillars = [yp, mp, dp, hp]
    scores = _calc_ohaeng_scores(pillars)
    gyeokguk = _determine_gyeokguk(dp, scores)
    sinsal_list = _calc_sinsal(pillars)
    daeun_list = _calc_daeun(yp, mp, gender, birth_year)

    return SajuProfile(
        year_pillar=yp,
        month_pillar=mp,
        day_pillar=dp,
        hour_pillar=hp,
        ohaeng_scores=scores,
        gyeokguk=gyeokguk,
        sinsal_list=sinsal_list,
        daeun_list=daeun_list,
    )
