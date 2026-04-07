"""RAG 서비스 – Supabase pgvector + Gemini Embedding

사주 지식 데이터를 임베딩하여 Supabase에 저장하고,
질의 시 유사도 검색으로 관련 지식을 검색한다.
"""

from __future__ import annotations

import json
from typing import Optional

import google.generativeai as genai
import httpx

from app.core.config import settings
from app.data.knowledge.saju_knowledge import SAJU_KNOWLEDGE_CHUNKS


def _get_supabase_headers() -> dict:
    return {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _supabase_rest_url(table: str) -> str:
    return f"{settings.supabase_url}/rest/v1/{table}"


async def embed_text(text: str) -> list[float]:
    """Gemini Embedding API로 텍스트 임베딩 생성"""
    genai.configure(api_key=settings.gemini_api_key)
    result = genai.embed_content(
        model=settings.embedding_model,
        content=text,
        task_type="retrieval_document",
    )
    return result["embedding"]


async def embed_query(text: str) -> list[float]:
    """검색 질의용 임베딩"""
    genai.configure(api_key=settings.gemini_api_key)
    result = genai.embed_content(
        model=settings.embedding_model,
        content=text,
        task_type="retrieval_query",
    )
    return result["embedding"]


async def init_knowledge_base() -> dict:
    """지식 데이터를 임베딩하여 Supabase saju_knowledge 테이블에 업로드.

    테이블 스키마 (Supabase SQL Editor에서 생성 필요):
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS saju_knowledge (
        id BIGSERIAL PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(768),
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX ON saju_knowledge
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

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
    ```
    """
    results = {"inserted": 0, "skipped": 0, "errors": []}

    async with httpx.AsyncClient(timeout=30) as client:
        # 기존 데이터 확인
        resp = await client.get(
            _supabase_rest_url("saju_knowledge"),
            headers=_get_supabase_headers(),
            params={"select": "title"},
        )
        existing_titles = set()
        if resp.status_code == 200:
            existing_titles = {row["title"] for row in resp.json()}

        for chunk in SAJU_KNOWLEDGE_CHUNKS:
            if chunk["title"] in existing_titles:
                results["skipped"] += 1
                continue

            try:
                embedding = await embed_text(chunk["content"])
                payload = {
                    "category": chunk["category"],
                    "title": chunk["title"],
                    "content": chunk["content"],
                    "embedding": embedding,
                }
                resp = await client.post(
                    _supabase_rest_url("saju_knowledge"),
                    headers=_get_supabase_headers(),
                    json=payload,
                )
                if resp.status_code in (200, 201):
                    results["inserted"] += 1
                else:
                    results["errors"].append(
                        f"{chunk['title']}: {resp.status_code} {resp.text}"
                    )
            except Exception as e:
                results["errors"].append(f"{chunk['title']}: {e}")

    return results


async def search_knowledge(
    query: str,
    match_count: int = 5,
    match_threshold: float = 0.5,
) -> list[dict]:
    """질의에 대해 유사 지식 검색 (Supabase RPC)"""
    query_emb = await embed_query(query)

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{settings.supabase_url}/rest/v1/rpc/match_saju_knowledge",
            headers=_get_supabase_headers(),
            json={
                "query_embedding": query_emb,
                "match_threshold": match_threshold,
                "match_count": match_count,
            },
        )
        if resp.status_code == 200:
            return resp.json()
        return []


async def search_knowledge_by_category(
    query: str,
    category: str,
    match_count: int = 3,
) -> list[dict]:
    """카테고리를 필터링하여 유사 지식 검색"""
    results = await search_knowledge(query, match_count=match_count * 2)
    filtered = [r for r in results if r.get("category") == category]
    return filtered[:match_count]
