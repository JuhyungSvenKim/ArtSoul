"""ArtSoul Backend – FastAPI 메인 앱

사주 × MBTI × AI 미술 추천 엔진
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.saju import router as saju_router
from app.services.rag import init_knowledge_base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작 시 RAG 지식 베이스 초기화"""
    try:
        result = await init_knowledge_base()
        print(f"[RAG] Knowledge base initialized: {result}")
    except Exception as e:
        print(f"[RAG] Knowledge base init skipped (set API keys to enable): {e}")
    yield


app = FastAPI(
    title="ArtSoul API",
    description="사주 × MBTI × AI 미술 추천 엔진",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터
app.include_router(saju_router)


@app.get("/")
async def root():
    return {
        "service": "ArtSoul API",
        "version": "1.0.0",
        "endpoints": {
            "analyze": "POST /api/saju/analyze",
            "chat": "POST /api/saju/chat",
            "profile": "GET /api/saju/profile/{user_id}",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
