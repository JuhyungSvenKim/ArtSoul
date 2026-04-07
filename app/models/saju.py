"""사주 관련 Pydantic 모델 (프론트엔드 타입과 동기화)"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── 오행 (Five Elements) ──────────────────────────────────────────
class Ohaeng(str, Enum):
    WOOD = "wood"
    FIRE = "fire"
    EARTH = "earth"
    METAL = "metal"
    WATER = "water"


class OhaengScores(BaseModel):
    wood: float = 0.0
    fire: float = 0.0
    earth: float = 0.0
    metal: float = 0.0
    water: float = 0.0


OHAENG_INFO = {
    Ohaeng.WOOD: {
        "name_kr": "목",
        "color": "#4CAF50",
        "accent": "#81C784",
        "mood": "생동감, 성장, 자연",
    },
    Ohaeng.FIRE: {
        "name_kr": "화",
        "color": "#F44336",
        "accent": "#E57373",
        "mood": "열정, 에너지, 강렬함",
    },
    Ohaeng.EARTH: {
        "name_kr": "토",
        "color": "#FF9800",
        "accent": "#FFB74D",
        "mood": "안정, 따뜻함, 포용",
    },
    Ohaeng.METAL: {
        "name_kr": "금",
        "color": "#9E9E9E",
        "accent": "#E0E0E0",
        "mood": "세련됨, 절제, 미니멀",
    },
    Ohaeng.WATER: {
        "name_kr": "수",
        "color": "#2196F3",
        "accent": "#64B5F6",
        "mood": "깊이, 신비, 유동적",
    },
}


# ── 천간 / 지지 ──────────────────────────────────────────────────
CHEONGAN = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

CHEONGAN_OHAENG = {
    "갑": Ohaeng.WOOD, "을": Ohaeng.WOOD,
    "병": Ohaeng.FIRE, "정": Ohaeng.FIRE,
    "무": Ohaeng.EARTH, "기": Ohaeng.EARTH,
    "경": Ohaeng.METAL, "신": Ohaeng.METAL,
    "임": Ohaeng.WATER, "계": Ohaeng.WATER,
}

JIJI_OHAENG = {
    "자": Ohaeng.WATER, "축": Ohaeng.EARTH,
    "인": Ohaeng.WOOD, "묘": Ohaeng.WOOD,
    "진": Ohaeng.EARTH, "사": Ohaeng.FIRE,
    "오": Ohaeng.FIRE, "미": Ohaeng.EARTH,
    "신": Ohaeng.METAL, "유": Ohaeng.METAL,
    "술": Ohaeng.EARTH, "해": Ohaeng.WATER,
}


# ── 사주 기둥 (Four Pillars) ──────────────────────────────────────
class SajuPillar(BaseModel):
    cheongan: str = Field(..., description="천간")
    jiji: str = Field(..., description="지지")
    cheongan_ohaeng: Ohaeng
    jiji_ohaeng: Ohaeng


# ── 신살 ──────────────────────────────────────────────────────────
class Sinsal(BaseModel):
    name: str
    description: str
    effect: str  # "positive" | "negative" | "neutral"


# ── 대운 ──────────────────────────────────────────────────────────
class DaeunPeriod(BaseModel):
    start_age: int
    end_age: int
    cheongan: str
    jiji: str
    ohaeng: Ohaeng
    description: str


# ── 격국 ──────────────────────────────────────────────────────────
class Gyeokguk(BaseModel):
    name: str
    description: str
    strength: str  # "strong" | "weak" | "balanced"


# ── Art DNA ──────────────────────────────────────────────────────
class ArtDna(BaseModel):
    dominant_ohaeng: Ohaeng
    sub_ohaeng: Ohaeng
    recommended_styles: list[str] = Field(default_factory=list)
    color_palette: list[str] = Field(default_factory=list)
    mood_keywords: list[str] = Field(default_factory=list)
    art_period_affinity: list[str] = Field(default_factory=list)
    description: str = ""


# ── 사주 프로필 (전체) ────────────────────────────────────────────
class SajuProfile(BaseModel):
    year_pillar: SajuPillar
    month_pillar: SajuPillar
    day_pillar: SajuPillar
    hour_pillar: SajuPillar
    ohaeng_scores: OhaengScores
    gyeokguk: Gyeokguk
    sinsal_list: list[Sinsal] = Field(default_factory=list)
    daeun_list: list[DaeunPeriod] = Field(default_factory=list)
    art_dna: Optional[ArtDna] = None
    interpretation: str = ""


# ── API 요청/응답 ────────────────────────────────────────────────
class SajuAnalyzeRequest(BaseModel):
    birth_year: int = Field(..., ge=1900, le=2100)
    birth_month: int = Field(..., ge=1, le=12)
    birth_day: int = Field(..., ge=1, le=31)
    birth_hour: int = Field(..., ge=0, le=23)
    gender: str = Field(..., pattern="^(male|female)$")
    mbti: Optional[str] = Field(None, pattern="^[EI][SN][TF][JP]$")


class SajuAnalyzeResponse(BaseModel):
    profile: SajuProfile
    art_dna: ArtDna
    summary: str


class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    sources: list[str] = Field(default_factory=list)
