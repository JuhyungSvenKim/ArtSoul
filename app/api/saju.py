"""사주 API 라우터

POST /api/saju/analyze  – 사주 분석 + Art DNA
POST /api/saju/chat     – 사주 챗봇 대화
GET  /api/saju/profile/{user_id} – 저장된 프로필 조회
"""

from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, HTTPException

from app.agents.saju_agent import chat as agent_chat
from app.models.saju import (
    ArtDna,
    ChatRequest,
    ChatResponse,
    SajuAnalyzeRequest,
    SajuAnalyzeResponse,
    SajuProfile,
)
from app.services.saju.art_dna import generate_art_dna
from app.services.saju.calculator import calculate_saju
from app.services import supabase_db

router = APIRouter(prefix="/api/saju", tags=["saju"])


def _make_user_id(req: SajuAnalyzeRequest) -> str:
    """생년월일시 + 성별 해시로 임시 user_id 생성"""
    raw = f"{req.birth_year}{req.birth_month}{req.birth_day}{req.birth_hour}{req.gender}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


@router.post("/analyze", response_model=SajuAnalyzeResponse)
async def analyze_saju(req: SajuAnalyzeRequest):
    """생년월일시 → 사주 분석 + Art DNA 생성"""
    # 1) 사주 계산
    profile = calculate_saju(
        req.birth_year, req.birth_month, req.birth_day, req.birth_hour, req.gender
    )

    # 2) Art DNA 생성
    art_dna = generate_art_dna(profile.ohaeng_scores, req.mbti)
    profile.art_dna = art_dna

    # 3) Gemini로 종합 해석 생성
    summary = _build_summary(profile, art_dna, req.mbti)

    # 4) Supabase에 저장 (비동기, 실패해도 응답은 반환)
    user_id = _make_user_id(req)
    try:
        await supabase_db.save_profile(
            user_id=user_id,
            birth_year=req.birth_year,
            birth_month=req.birth_month,
            birth_day=req.birth_day,
            birth_hour=req.birth_hour,
            gender=req.gender,
            mbti=req.mbti,
            profile_json=profile.model_dump(),
            art_dna_json=art_dna.model_dump(),
            summary=summary,
        )
    except Exception:
        pass  # DB 저장 실패해도 분석 결과는 반환

    return SajuAnalyzeResponse(
        profile=profile,
        art_dna=art_dna,
        summary=summary,
    )


def _build_summary(profile: SajuProfile, art_dna: ArtDna, mbti: str | None) -> str:
    """사주 분석 요약문 생성 (동기, Gemini 없이 규칙 기반)"""
    yp, mp, dp, hp = (
        profile.year_pillar,
        profile.month_pillar,
        profile.day_pillar,
        profile.hour_pillar,
    )
    pillars_str = (
        f"년주 {yp.cheongan}{yp.jiji}, 월주 {mp.cheongan}{mp.jiji}, "
        f"일주 {dp.cheongan}{dp.jiji}, 시주 {hp.cheongan}{hp.jiji}"
    )

    scores = profile.ohaeng_scores
    score_parts = []
    for name, val in scores.model_dump().items():
        kr = {"wood": "목", "fire": "화", "earth": "토", "metal": "금", "water": "수"}
        score_parts.append(f"{kr[name]} {val}%")

    sinsal_names = [s.name for s in profile.sinsal_list] if profile.sinsal_list else ["없음"]

    summary = (
        f"📋 사주 네 기둥: {pillars_str}\n"
        f"⚖️ 오행 밸런스: {', '.join(score_parts)}\n"
        f"🏛️ 격국: {profile.gyeokguk.name} - {profile.gyeokguk.description}\n"
        f"⭐ 신살: {', '.join(sinsal_names)}\n"
        f"🎨 Art DNA: {art_dna.description}"
    )

    if mbti:
        summary += f"\n🧠 MBTI {mbti.upper()} 성향이 반영된 맞춤 추천입니다."

    return summary


@router.post("/chat", response_model=ChatResponse)
async def chat_saju(req: ChatRequest):
    """사주 챗봇 대화"""
    # 세션 관리
    session_id, history = await supabase_db.get_or_create_session(
        req.user_id, req.session_id
    )

    # 사주 프로필 로드 (있으면)
    profile_data = await supabase_db.get_profile(req.user_id)
    saju_profile = profile_data.get("profile") if profile_data else None

    # 에이전트 실행
    reply, sources = await agent_chat(
        user_message=req.message,
        history=history,
        saju_profile=saju_profile,
        user_id=req.user_id,
    )

    # 대화 기록 저장
    await supabase_db.append_messages(
        session_id,
        [
            {"role": "user", "content": req.message},
            {"role": "assistant", "content": reply},
        ],
    )

    return ChatResponse(
        reply=reply,
        session_id=session_id,
        sources=sources,
    )


@router.get("/profile/{user_id}")
async def get_saju_profile(user_id: str):
    """저장된 사주 프로필 조회"""
    data = await supabase_db.get_profile(user_id)
    if not data:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다.")
    return data
