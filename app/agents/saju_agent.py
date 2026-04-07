"""LangGraph 사주 챗봇 에이전트

Gemini API를 사용한 사주 해석 챗봇.
Tool: 사주 계산, RAG 지식 검색
"""

from __future__ import annotations

import json
from typing import Annotated, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.core.config import settings
from app.models.saju import SajuProfile
from app.services.rag import search_knowledge
from app.services.saju.calculator import calculate_saju
from app.services.saju.art_dna import generate_art_dna

# ── LangChain Tools ──────────────────────────────────────────────
from langchain_core.tools import tool


@tool
async def saju_calculate_tool(
    birth_year: int,
    birth_month: int,
    birth_day: int,
    birth_hour: int,
    gender: str,
) -> str:
    """생년월일시와 성별로 사주팔자를 계산합니다.
    사주의 네 기둥(년주, 월주, 일주, 시주), 오행 밸런스, 격국, 신살을 반환합니다."""
    profile = calculate_saju(birth_year, birth_month, birth_day, birth_hour, gender)
    return profile.model_dump_json()


@tool
async def saju_knowledge_search_tool(query: str) -> str:
    """사주, 오행, 격국, 신살, 예술 추천에 관한 지식을 검색합니다.
    사주 해석이나 예술 추천에 필요한 배경 지식을 찾을 때 사용합니다."""
    results = await search_knowledge(query, match_count=3)
    if not results:
        return "관련 지식을 찾지 못했습니다."
    texts = []
    for r in results:
        texts.append(f"[{r['title']}] {r['content']}")
    return "\n\n".join(texts)


@tool
async def art_dna_generate_tool(ohaeng_scores_json: str, mbti: str = "") -> str:
    """오행 점수를 기반으로 Art DNA(추천 화풍, 색감, 무드)를 생성합니다.
    ohaeng_scores_json은 {"wood":25.0,"fire":12.5,...} 형태의 JSON 문자열입니다."""
    from app.models.saju import OhaengScores
    scores = OhaengScores(**json.loads(ohaeng_scores_json))
    art_dna = generate_art_dna(scores, mbti if mbti else None)
    return art_dna.model_dump_json()


TOOLS = [saju_calculate_tool, saju_knowledge_search_tool, art_dna_generate_tool]

SYSTEM_PROMPT = """당신은 ArtSoul의 사주 × 미술 추천 전문가입니다.

## 역할
- 사용자의 사주팔자를 분석하고 오행 밸런스를 해석합니다.
- 사주와 MBTI를 결합하여 개인 맞춤형 예술 추천(Art DNA)을 제공합니다.
- 사주의 격국, 신살, 대운을 쉽고 재미있게 설명합니다.

## 규칙
1. 사주 계산이 필요하면 saju_calculate_tool을 사용합니다.
2. 해석에 필요한 배경 지식은 saju_knowledge_search_tool로 검색합니다.
3. Art DNA 생성이 필요하면 art_dna_generate_tool을 사용합니다.
4. 답변은 친근하고 이해하기 쉬운 한국어로 합니다.
5. 미신이 아닌 문화적 콘텐츠임을 인지하고, 재미와 인사이트에 초점을 맞춥니다.
6. 예술 추천 시 구체적인 작가명, 작품명, 미술관 정보를 포함합니다.

## 응답 형식
- 사주 분석 시: 네 기둥 요약 → 오행 밸런스 → 격국/신살 해석 → 대운 흐름 → Art DNA
- 일반 질문 시: 간결하고 명확한 답변
"""


# ── LangGraph State ──────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    saju_profile: dict | None
    user_id: str


def _create_llm():
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.7,
        convert_system_message_to_human=True,
    ).bind_tools(TOOLS)


# ── 노드 함수들 ─────────────────────────────────────────────────
async def agent_node(state: AgentState) -> dict:
    """LLM 에이전트 노드 – 메시지를 보고 도구 호출 여부 판단"""
    llm = _create_llm()

    messages = state["messages"]
    # 시스템 메시지가 없으면 추가
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages

    # 사주 프로필이 있으면 컨텍스트에 추가
    profile = state.get("saju_profile")
    if profile:
        ctx = f"\n\n[사용자 사주 프로필 컨텍스트]\n{json.dumps(profile, ensure_ascii=False, indent=2)}"
        messages = messages + [
            SystemMessage(content=ctx)
        ]

    response = await llm.ainvoke(messages)
    return {"messages": [response]}


def should_continue(state: AgentState) -> str:
    """도구 호출이 있으면 tools 노드로, 없으면 종료"""
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END


# ── 그래프 빌드 ──────────────────────────────────────────────────
def build_agent_graph():
    """LangGraph 에이전트 그래프 빌드"""
    tool_node = ToolNode(TOOLS)

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)

    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    return graph.compile()


# ── 편의 함수 ────────────────────────────────────────────────────
_compiled_graph = None


def get_agent():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_agent_graph()
    return _compiled_graph


async def chat(
    user_message: str,
    history: list[dict] | None = None,
    saju_profile: dict | None = None,
    user_id: str = "",
) -> tuple[str, list[str]]:
    """에이전트와 대화. (응답 텍스트, 참조 소스 리스트) 반환."""
    agent = get_agent()

    messages = []
    if history:
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            else:
                messages.append(AIMessage(content=content))

    messages.append(HumanMessage(content=user_message))

    result = await agent.ainvoke({
        "messages": messages,
        "saju_profile": saju_profile,
        "user_id": user_id,
    })

    # 최종 AI 응답 추출
    ai_messages = [m for m in result["messages"] if isinstance(m, AIMessage)]
    reply = ai_messages[-1].content if ai_messages else "죄송합니다, 응답을 생성하지 못했습니다."

    # 사용된 소스 수집
    sources = []
    for m in result["messages"]:
        if isinstance(m, ToolMessage) and m.name == "saju_knowledge_search_tool":
            content = m.content
            # [제목] 패턴에서 제목 추출
            import re
            titles = re.findall(r"\[(.+?)\]", content)
            sources.extend(titles)

    return reply, sources
