-- ArtSoul Supabase Schema
-- Supabase SQL Editor에서 실행하세요

-- 1. pgvector 확장
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. 사주 지식 테이블 (RAG용)
CREATE TABLE IF NOT EXISTS saju_knowledge (
    id BIGSERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saju_knowledge_embedding
    ON saju_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- 3. 유사도 검색 함수
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

-- 4. 사주 프로필 테이블
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

-- 5. 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS 정책 (필요 시 활성화)
-- ALTER TABLE saju_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
