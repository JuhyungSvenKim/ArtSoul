import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import CaseCodeArt from "@/components/CaseCodeArt";
import { useOnboardingStore } from "@/stores/onboarding";
import { saveTasteSelections } from "@/services/onboarding";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";

// ── 질문 데이터 ─────────────────────────────────
interface TasteQuestion {
  question: string;
  subtitle: string;
  options: {
    id: string;
    label: string;
    desc: string;
    art?: { element: OhaengElement; energy: EnergyLevel; style: StyleCode };
    tags: string[];
  }[];
}

const QUESTIONS: TasteQuestion[] = [
  {
    question: "퇴근하고 집에 왔어. 벽에 뭐가 걸려있으면 좋겠어?",
    subtitle: "직감으로 골라봐",
    options: [
      { id: "q1-calm", label: "숨 쉴 수 있는 여백", desc: "아무것도 없는 듯한데 계속 보게 되는", art: { element: "A", energy: 1, style: "S2" }, tags: ["여백", "수묵여백", "쿨톤"] },
      { id: "q1-warm", label: "따뜻한 풍경 하나", desc: "노을이나 들판 같은 포근한 거", art: { element: "E", energy: 2, style: "S1" }, tags: ["균형", "사실주의", "어스톤"] },
      { id: "q1-pop", label: "눈이 확 트이는 컬러", desc: "보기만 해도 에너지 충전되는", art: { element: "F", energy: 3, style: "S4" }, tags: ["역동", "팝아트", "비비드"] },
      { id: "q1-minimal", label: "깔끔한 미니멀 한 점", desc: "인테리어 잡지에 나올 것 같은", art: { element: "M", energy: 2, style: "S3" }, tags: ["균형", "미니멀", "뉴트럴"] },
    ]
  },
  {
    question: "미술관에서 발걸음이 멈추는 순간은?",
    subtitle: "솔직하게",
    options: [
      { id: "q2-detail", label: "이걸 어떻게 그렸지..?", desc: "디테일에 감탄하는 타입", art: { element: "M", energy: 5, style: "S1" }, tags: ["밀도", "사실주의", "유화"] },
      { id: "q2-feel", label: "설명은 못 하는데 끌림", desc: "이유 없이 서 있게 되는 그림", art: { element: "A", energy: 4, style: "S5" }, tags: ["유동", "컨템포러리", "모노톤"] },
      { id: "q2-story", label: "이 그림 뒤에 무슨 이야기가?", desc: "서사가 있는 작품에 빠지는 타입", art: { element: "W", energy: 3, style: "S2" }, tags: ["역동", "수묵여백", "자연풍경"] },
      { id: "q2-impact", label: "우와 이거 미쳤다", desc: "임팩트에 한 방 맞는 타입", art: { element: "F", energy: 5, style: "S4" }, tags: ["밀도", "표현주의", "비비드"] },
    ]
  },
  {
    question: "색깔로 말하면 나는?",
    subtitle: "오늘 기분 말고, 평소의 나",
    options: [
      { id: "q3-earth", label: "흙, 나무, 가을 느낌", desc: "브라운, 카키, 머스타드", art: { element: "E", energy: 2, style: "S1" }, tags: ["어스톤", "자연풍경", "정물"] },
      { id: "q3-cool", label: "바다, 새벽, 안개 느낌", desc: "블루, 그레이, 민트", art: { element: "A", energy: 1, style: "S3" }, tags: ["쿨톤", "추상", "미니멀"] },
      { id: "q3-vivid", label: "네온, 축제, 불꽃 느낌", desc: "레드, 핑크, 오렌지", art: { element: "F", energy: 3, style: "S4" }, tags: ["비비드", "팝아트", "웜톤"] },
      { id: "q3-mono", label: "흑백영화, 잉크, 밤 느낌", desc: "블랙, 차콜, 실버", art: { element: "M", energy: 1, style: "S5" }, tags: ["모노톤", "수묵화", "미니멀"] },
    ]
  },
  {
    question: "그림을 산다면 어디에 둘 거야?",
    subtitle: "상상해봐",
    options: [
      { id: "q4-bed", label: "침실 머리맡", desc: "자기 전에 마지막으로 보는 그림", art: { element: "A", energy: 1, style: "S2" }, tags: ["여백", "파스텔", "수묵여백"] },
      { id: "q4-living", label: "거실 메인 벽", desc: "손님 오면 첫눈에 보이는 자리", art: { element: "E", energy: 2, style: "S3" }, tags: ["균형", "뉴트럴", "미니멀"] },
      { id: "q4-desk", label: "내 책상 위", desc: "일하다 고개 들면 보이는 곳", art: { element: "W", energy: 3, style: "S3" }, tags: ["역동", "컨템포러리", "쿨톤"] },
      { id: "q4-cafe", label: "내가 카페 사장이라면", desc: "분위기를 확 바꿔줄 한 점", art: { element: "F", energy: 4, style: "S4" }, tags: ["유동", "팝아트", "비비드"] },
    ]
  },
  {
    question: "주말에 나는 보통",
    subtitle: "이게 그림 취향이랑 관련 있냐고? 있어",
    options: [
      { id: "q5-home", label: "집에서 넷플릭스", desc: "밖에 나가면 지는 거라고 생각함", tags: ["여백", "쿨톤", "미니멀"] },
      { id: "q5-cafe", label: "카페에서 책이나 작업", desc: "조용하지만 사람 있는 곳이 좋음", tags: ["균형", "어스톤", "사실주의"] },
      { id: "q5-active", label: "어딘가 돌아다님", desc: "가만히 있으면 답답해", tags: ["역동", "비비드", "팝아트"] },
      { id: "q5-people", label: "사람 만나서 수다", desc: "에너지는 사람한테서 나옴", tags: ["유동", "웜톤", "표현주의"] },
    ]
  },
  {
    question: "이 중에 끌리는 작품은?",
    subtitle: "순수하게 비주얼만 보고",
    options: [
      { id: "q6-wood", label: "초록빛 생명력", desc: "자라나는 느낌", art: { element: "W", energy: 3, style: "S2" }, tags: ["목", "자연풍경", "동양모던"] },
      { id: "q6-fire", label: "강렬한 붉은 에너지", desc: "뜨거운 느낌", art: { element: "F", energy: 4, style: "S4" }, tags: ["화", "추상", "표현주의"] },
      { id: "q6-metal", label: "차갑고 세련된 빛", desc: "날카로운 느낌", art: { element: "M", energy: 2, style: "S5" }, tags: ["금", "미니멀", "모노톤"] },
      { id: "q6-water", label: "깊고 고요한 물결", desc: "빠져드는 느낌", art: { element: "A", energy: 1, style: "S3" }, tags: ["수", "추상", "쿨톤"] },
    ]
  },
  {
    question: "작가한테 한마디 할 수 있다면?",
    subtitle: "마지막 질문이야",
    options: [
      { id: "q7-pretty", label: "이쁘게 그려주세요", desc: "예쁜 게 최고야", tags: ["사실주의", "파스텔", "자연풍경", "균형"] },
      { id: "q7-weird", label: "좀 이상하게 그려주세요", desc: "평범한 건 재미없어", tags: ["컨템포러리", "표현주의", "추상", "밀도"] },
      { id: "q7-feel", label: "느낌 가는 대로 그려주세요", desc: "결과가 궁금해", tags: ["인상주의", "유동", "수묵여백", "여백"] },
      { id: "q7-soul", label: "영혼을 담아주세요", desc: "그림에 이야기가 있었으면", tags: ["동양모던", "수묵화", "역동", "모노톤"] },
    ]
  },
];

// ── 결과 집계 ─────────────────────────────────
function aggregateTags(selections: { id: string; tags: string[] }[]): string[] {
  const count: Record<string, number> = {};
  selections.forEach(s => s.tags.forEach(t => { count[t] = (count[t] || 0) + 1; }));
  return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
}

// ── 컴포넌트 ─────────────────────────────────
const ArtTastePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, addTasteSelection } = useOnboardingStore();
  const [round, setRound] = useState(0);
  const [selections, setSelections] = useState<{ id: string; tags: string[] }[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sajuHash = location.hash.slice(1);
  const q = QUESTIONS[round];
  const isLast = round >= QUESTIONS.length - 1;

  const goToResult = (allSelections: { id: string; tags: string[] }[]) => {
    // 태그 집계해서 저장
    const topTags = aggregateTags(allSelections);
    try {
      localStorage.setItem("artsoul-taste-tags", JSON.stringify(topTags));
    } catch {}

    // DB에도 저장
    const uid = getCurrentUserId();
    if (uid) {
      supabase.from("art_taste_selections").upsert({
        user_id: uid,
        selections: allSelections,
        top_tags: topTags,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(() => {});
    }

    let hash = sajuHash;
    if (!hash) {
      try {
        const raw = localStorage.getItem("artsoul-saju-input");
        if (raw) hash = btoa(encodeURIComponent(raw));
      } catch {}
    }
    navigate(`/result#${hash}`);
  };

  const handleSelect = async (option: typeof q.options[0]) => {
    setSelectedId(option.id);

    const newSelections = [...selections, { id: option.id, tags: option.tags }];
    setSelections(newSelections);
    addTasteSelection(option.id);

    if (isLast) {
      setSaving(true);
      try { if (userId) await saveTasteSelections(userId, newSelections.map(s => s.id)); } catch {}
      setSaving(false);
      setTimeout(() => goToResult(newSelections), 500);
    } else {
      setTimeout(() => {
        setSelectedId(null);
        setRound(round + 1);
      }, 400);
    }
  };

  const handleSkip = () => {
    setSelectedId(null);
    if (isLast) {
      goToResult(selections);
    } else {
      setRound(round + 1);
    }
  };

  const handleBack = () => {
    if (round > 0) {
      setSelectedId(null);
      setSelections(selections.slice(0, -1));
      setRound(round - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <PageContainer className="pb-8">
      <ProgressBar current={3} total={3} />

      <div className="flex items-center gap-3 mb-1">
        <button onClick={handleBack} className="text-muted-foreground hover:text-foreground text-sm">
          ← {round > 0 ? "이전 질문" : "뒤로"}
        </button>
        <h1 className="text-xl font-display text-gold-gradient font-semibold">미술 취향 테스트</h1>
      </div>
      <p className="text-xs text-muted-foreground mb-6">
        {round + 1}/{QUESTIONS.length}
      </p>

      {q && (
        <div className="animate-fade-in" key={round}>
          {/* 질문 */}
          <div className="mb-5">
            <p className="text-base font-medium text-foreground leading-relaxed">{q.question}</p>
            <p className="text-xs text-muted-foreground mt-1">{q.subtitle}</p>
          </div>

          {/* 선택지 */}
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((opt) => {
              const isSelected = selectedId === opt.id;
              return (
                <button key={opt.id} onClick={() => handleSelect(opt)} disabled={saving || selectedId !== null}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-surface hover:border-primary/30"
                  } active:scale-[0.97] disabled:opacity-70`}>
                  {/* 아트 프리뷰 */}
                  {opt.art && (
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2.5 border border-border/50">
                      <CaseCodeArt element={opt.art.element} energy={opt.art.energy} style={opt.art.style} />
                    </div>
                  )}
                  <p className="text-sm font-medium text-foreground mb-0.5">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      <button onClick={handleSkip} disabled={saving}
        className="w-full py-2.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-6">
        {isLast ? "건너뛰고 결과 보기 →" : "잘 모르겠어, 넘기기 →"}
      </button>
    </PageContainer>
  );
};

export default ArtTastePage;
