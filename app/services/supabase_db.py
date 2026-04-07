"""Supabase DB 서비스 – 사주 프로필 저장/조회

테이블 스키마 (Supabase SQL Editor에서 생성 필요):
```sql
CREATE TABLE IF NOT EXISTS saju_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    birth_year INT NOT NULL,
    birth_month INT NOT NULL,
    birth_day INT NOT NULL,
    birth_hour INT NOT NULL,
    gender TEXT NOT NULL,
    mbti TEXT,
    profile JSONB NOT NULL,
    art_dna JSONB NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
"""

from __future__ import annotations

import uuid

import httpx

from app.core.config import settings


def _headers() -> dict:
    return {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _url(table: str) -> str:
    return f"{settings.supabase_url}/rest/v1/{table}"


# ── 사주 프로필 ──────────────────────────────────────────────────
async def save_profile(
    user_id: str,
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    gender: str,
    mbti: str | None,
    profile_json: dict,
    art_dna_json: dict,
    summary: str,
) -> dict | None:
    """사주 프로필 저장 (upsert)"""
    payload = {
        "user_id": user_id,
        "birth_year": birth_year,
        "birth_month": birth_month,
        "birth_day": birth_day,
        "birth_hour": birth_hour,
        "gender": gender,
        "mbti": mbti,
        "profile": profile_json,
        "art_dna": art_dna_json,
        "summary": summary,
    }
    headers = _headers()
    headers["Prefer"] = "return=representation,resolution=merge-duplicates"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            _url("saju_profiles"),
            headers=headers,
            json=payload,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            return data[0] if isinstance(data, list) else data
        return None


async def get_profile(user_id: str) -> dict | None:
    """사주 프로필 조회"""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _url("saju_profiles"),
            headers=_headers(),
            params={"user_id": f"eq.{user_id}", "select": "*"},
        )
        if resp.status_code == 200:
            rows = resp.json()
            return rows[0] if rows else None
        return None


# ── 채팅 세션 ────────────────────────────────────────────────────
async def get_or_create_session(
    user_id: str,
    session_id: str | None = None,
) -> tuple[str, list[dict]]:
    """채팅 세션 조회 또는 생성. (session_id, messages) 반환."""
    if session_id:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                _url("chat_sessions"),
                headers=_headers(),
                params={"session_id": f"eq.{session_id}", "select": "*"},
            )
            if resp.status_code == 200 and resp.json():
                row = resp.json()[0]
                return row["session_id"], row.get("messages", [])

    # 새 세션 생성
    new_id = session_id or str(uuid.uuid4())
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            _url("chat_sessions"),
            headers=_headers(),
            json={
                "session_id": new_id,
                "user_id": user_id,
                "messages": [],
            },
        )
    return new_id, []


async def append_messages(
    session_id: str,
    messages: list[dict],
) -> None:
    """채팅 메시지 추가"""
    # 기존 메시지 가져오기
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            _url("chat_sessions"),
            headers=_headers(),
            params={"session_id": f"eq.{session_id}", "select": "messages"},
        )
        existing = []
        if resp.status_code == 200 and resp.json():
            existing = resp.json()[0].get("messages", [])

        existing.extend(messages)

        await client.patch(
            _url("chat_sessions") + f"?session_id=eq.{session_id}",
            headers=_headers(),
            json={"messages": existing},
        )
