# ArtSoul - 사주 × MBTI × AI 미술 추천 엔진

사주팔자와 MBTI를 분석하여 개인 맞춤형 예술 취향(Art DNA)을 생성하는 AI 백엔드 서비스입니다.

## 기술 스택

- **Backend**: Python FastAPI
- **AI**: Google Gemini API + LangGraph 에이전트
- **RAG**: Supabase pgvector (임베딩 기반 지식 검색)
- **DB**: Supabase (PostgreSQL)

## 프로젝트 구조

```
app/
├── main.py                    # FastAPI 앱 엔트리포인트
├── api/
│   └── saju.py               # API 라우터 (analyze, chat, profile)
├── agents/
│   └── saju_agent.py         # LangGraph 사주 챗봇 에이전트
├── core/
│   └── config.py             # 설정 (환경변수)
├── data/
│   └── knowledge/
│       └── saju_knowledge.py # RAG용 사주 지식 데이터
├── models/
│   └── saju.py               # Pydantic 모델 (사주, 오행, Art DNA)
└── services/
    ├── rag.py                # RAG 서비스 (임베딩 + 검색)
    ├── supabase_db.py        # Supabase DB 서비스
    └── saju/
        ├── calculator.py     # 사주 계산 엔진
        └── art_dna.py        # Art DNA 생성 엔진
```

## 설정

### 1. 환경변수

```bash
cp .env.example .env
# .env 파일에 API 키 입력
```

### 2. Supabase 스키마 생성

`supabase_schema.sql` 파일의 SQL을 Supabase SQL Editor에서 실행합니다.

### 3. 의존성 설치 및 실행

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API 엔드포인트

### POST /api/saju/analyze

생년월일시 → 사주 분석 + Art DNA 생성

```json
{
  "birth_year": 1990,
  "birth_month": 5,
  "birth_day": 15,
  "birth_hour": 14,
  "gender": "male",
  "mbti": "INFP"
}
```

### POST /api/saju/chat

사주 챗봇 대화 (LangGraph 에이전트)

```json
{
  "user_id": "abc123",
  "message": "내 사주에서 도화살이 있다고 하는데, 어떤 의미인가요?",
  "session_id": "optional-session-id"
}
```

### GET /api/saju/profile/{user_id}

저장된 사주 프로필 조회

## 핵심 기능

1. **사주 계산 엔진**: 만세력 기반 사주팔자 계산 (년주/월주/일주/시주 + 오행 밸런스 + 격국 + 신살 + 대운)
2. **RAG 지식 검색**: 사주 해석, 오행 이론, 격국/신살 사전을 Supabase pgvector로 임베딩하여 유사도 검색
3. **Art DNA 생성**: 오행 밸런스 + MBTI → 추천 화풍/색감/무드/미술 시대
4. **사주 챗봇**: LangGraph 에이전트 (사주 계산 Tool + RAG Tool + Gemini 해석)
