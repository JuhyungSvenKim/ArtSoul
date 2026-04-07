"""오행 밸런스 → Art DNA 생성

오행의 비율과 조합에 따라 추천 화풍, 색감, 무드, 시대적 친화를 결정한다.
MBTI 정보가 있으면 추가적으로 보정한다.
"""

from __future__ import annotations

from typing import Optional

from app.models.saju import ArtDna, Ohaeng, OhaengScores, OHAENG_INFO

# ── 오행별 Art 매핑 ──────────────────────────────────────────────
_ART_MAP = {
    Ohaeng.WOOD: {
        "styles": ["인상주의", "아르누보", "자연주의", "수묵화"],
        "colors": ["#2E7D32", "#4CAF50", "#81C784", "#A5D6A7", "#C8E6C9"],
        "moods": ["생동감", "성장", "자연", "신선함", "활력"],
        "periods": ["인상주의 시대", "아르누보 운동", "동양 산수화"],
    },
    Ohaeng.FIRE: {
        "styles": ["표현주의", "야수파", "추상표현주의", "팝아트"],
        "colors": ["#C62828", "#F44336", "#E57373", "#FF8A65", "#FFD54F"],
        "moods": ["열정", "강렬함", "에너지", "역동적", "드라마틱"],
        "periods": ["표현주의", "야수파", "추상표현주의"],
    },
    Ohaeng.EARTH: {
        "styles": ["사실주의", "바로크", "르네상스", "민화"],
        "colors": ["#E65100", "#FF9800", "#FFB74D", "#D7CCC8", "#8D6E63"],
        "moods": ["안정", "따뜻함", "포용", "풍요", "고전적"],
        "periods": ["르네상스", "바로크", "한국 민화"],
    },
    Ohaeng.METAL: {
        "styles": ["미니멀리즘", "구성주의", "바우하우스", "현대 설치미술"],
        "colors": ["#455A64", "#9E9E9E", "#E0E0E0", "#ECEFF1", "#B0BEC5"],
        "moods": ["세련됨", "절제", "미니멀", "정밀", "모던"],
        "periods": ["바우하우스", "미니멀리즘", "현대미술"],
    },
    Ohaeng.WATER: {
        "styles": ["초현실주의", "낭만주의", "수채화", "디지털 아트"],
        "colors": ["#0D47A1", "#2196F3", "#64B5F6", "#B3E5FC", "#E1F5FE"],
        "moods": ["깊이", "신비", "유동적", "몽환적", "서정적"],
        "periods": ["초현실주의", "낭만주의", "동양 수묵화"],
    },
}

# ── MBTI 보정 매핑 ───────────────────────────────────────────────
_MBTI_STYLE_BOOST = {
    "INFP": ["초현실주의", "낭만주의", "수채화"],
    "INFJ": ["상징주의", "초현실주의", "수묵화"],
    "ENFP": ["팝아트", "인상주의", "표현주의"],
    "ENFJ": ["르네상스", "바로크", "사실주의"],
    "INTP": ["구성주의", "미니멀리즘", "디지털 아트"],
    "INTJ": ["미니멀리즘", "바우하우스", "현대 설치미술"],
    "ENTP": ["다다이즘", "팝아트", "디지털 아트"],
    "ENTJ": ["구성주의", "바우하우스", "현대미술"],
    "ISFP": ["인상주의", "수채화", "아르누보"],
    "ISFJ": ["사실주의", "민화", "르네상스"],
    "ESFP": ["팝아트", "야수파", "표현주의"],
    "ESFJ": ["바로크", "사실주의", "민화"],
    "ISTP": ["미니멀리즘", "현대 설치미술", "구성주의"],
    "ISTJ": ["사실주의", "미니멀리즘", "고전주의"],
    "ESTP": ["추상표현주의", "팝아트", "거리예술"],
    "ESTJ": ["고전주의", "사실주의", "바로크"],
}

_MBTI_MOOD_BOOST = {
    "I": ["깊이", "내면", "사색"],
    "E": ["활력", "사교적", "역동적"],
    "N": ["몽환적", "영감", "직관적"],
    "S": ["사실적", "실용적", "감각적"],
    "T": ["정밀", "구조적", "논리적"],
    "F": ["서정적", "감성적", "따뜻함"],
    "P": ["자유로운", "즉흥적", "유연한"],
    "J": ["정돈된", "체계적", "고전적"],
}


def generate_art_dna(
    scores: OhaengScores,
    mbti: Optional[str] = None,
) -> ArtDna:
    """오행 점수 + MBTI → Art DNA 생성"""

    score_dict = scores.model_dump()
    sorted_ohaeng = sorted(score_dict.items(), key=lambda x: x[1], reverse=True)

    dominant = Ohaeng(sorted_ohaeng[0][0])
    sub = Ohaeng(sorted_ohaeng[1][0])

    # 주 오행 + 부 오행 조합
    dom_art = _ART_MAP[dominant]
    sub_art = _ART_MAP[sub]

    styles = dom_art["styles"][:3] + sub_art["styles"][:1]
    colors = dom_art["colors"][:3] + sub_art["colors"][:2]
    moods = dom_art["moods"][:3] + sub_art["moods"][:2]
    periods = dom_art["periods"][:2] + sub_art["periods"][:1]

    # MBTI 보정
    if mbti:
        mbti_upper = mbti.upper()
        if mbti_upper in _MBTI_STYLE_BOOST:
            mbti_styles = _MBTI_STYLE_BOOST[mbti_upper]
            for s in mbti_styles:
                if s not in styles:
                    styles.append(s)

        for letter in mbti_upper:
            if letter in _MBTI_MOOD_BOOST:
                for m in _MBTI_MOOD_BOOST[letter]:
                    if m not in moods:
                        moods.append(m)

    # 설명 생성
    dom_info = OHAENG_INFO[dominant]
    sub_info = OHAENG_INFO[sub]
    description = (
        f"{dom_info['name_kr']}({dominant.value})의 기운이 지배적이며, "
        f"{sub_info['name_kr']}({sub.value})의 기운이 보조합니다. "
        f"{dom_info['mood']}의 느낌을 바탕으로 {sub_info['mood']}의 뉘앙스가 가미된 "
        f"예술 작품과 강한 공명을 일으킵니다."
    )

    if mbti:
        description += f" MBTI {mbti.upper()} 성향을 반영하여 스타일이 보정되었습니다."

    return ArtDna(
        dominant_ohaeng=dominant,
        sub_ohaeng=sub,
        recommended_styles=styles,
        color_palette=colors,
        mood_keywords=moods,
        art_period_affinity=periods,
        description=description,
    )
