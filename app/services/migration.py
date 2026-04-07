"""자동 마이그레이션 – 앱 시작 시 테이블/함수 자동 생성

Supabase PostgreSQL에 직접 연결하여 DDL 실행.
수동으로 SQL Editor 갈 필요 없음.
"""

from __future__ import annotations

import asyncpg

from app.core.config import settings

_MIGRATIONS = [
    "CREATE EXTENSION IF NOT EXISTS vector;",
    """
    CREATE TABLE IF NOT EXISTS saju_knowledge (
        id BIGSERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(768),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE OR REPLACE FUNCTION match_saju_knowledge(
        query_embedding VECTOR(768),
        match_threshold FLOAT DEFAULT 0.5,
        match_count INT DEFAULT 5
    ) RETURNS TABLE (
        id BIGINT,
        category TEXT,
        title TEXT,
        content TEXT,
        similarity FLOAT
    ) LANGUAGE plpgsql AS $$
    BEGIN
        RETURN QUERY
        SELECT
            sk.id,
            sk.category,
            sk.title,
            sk.content,
            1 - (sk.embedding <=> query_embedding) AS similarity
        FROM saju_knowledge sk
        WHERE 1 - (sk.embedding <=> query_embedding) > match_threshold
        ORDER BY sk.embedding <=> query_embedding
        LIMIT match_count;
    END;
    $$;
    """,
    """
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
    """,
    """
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        messages JSONB DEFAULT '[]'::JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
]


async def run_migrations() -> dict:
    """PostgreSQL 직접 연결로 마이그레이션 실행"""
    if not settings.database_url:
        return {"status": "skipped", "reason": "DATABASE_URL not set"}

    results = {"success": 0, "failed": 0, "errors": []}

    conn = await asyncpg.connect(settings.database_url)
    try:
        for i, sql in enumerate(_MIGRATIONS):
            try:
                await conn.execute(sql)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Migration {i+1}: {e}")
    finally:
        await conn.close()

    return results
