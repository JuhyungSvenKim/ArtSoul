import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import ProgressBar from "@/components/ProgressBar";
import MbtiGrid, { type MbtiType } from "@/components/MbtiGrid";
import { useOnboardingStore } from "@/stores/onboarding";
import { updateUserMbti } from "@/services/onboarding";
import { matchMbtiToArt } from "@/lib/mbti-art-engine";
import {
  MBTI_QUESTIONS, LIKERT_LABELS, shuffleQuestions,
  calculateMbtiResult, type MbtiTestResult,
} from "@/lib/mbti-test-questions";

const TOTAL_QUESTIONS = MBTI_QUESTIONS.length; // 48

const MbtiPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, setMbti: storeMbti } = useOnboardingStore();
  const sajuHash = location.hash.slice(1);

  // 모드: intro(선택화면), direct(직접선택), test(정밀테스트), result(결과)
  const [mode, setMode] = useState<"intro" | "direct" | "test" | "result">("intro");
  const [mbti, setMbti] = useState<MbtiType | null>(null);

  // 테스트 상태
  const [questions] = useState(() => shuffleQuestions());
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [testResult, setTestResult] = useState<MbtiTestResult | null>(null);

  const progress = mode === "test" ? Math.round((currentQ / TOTAL_QUESTIONS) * 100) : 0;
  const currentQuestion = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    if (currentQ < TOTAL_QUESTIONS - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      // 마지막 문항 — 결과 계산
      const result = calculateMbtiResult(newAnswers);
      setTestResult(result);
      setMbti(result.type as MbtiType);
      setMode("result");
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleNext = () => {
    if (!mbti) return;
    storeMbti(mbti);
    // 강도 정보도 localStorage에 저장
    if (testResult) {
      try { localStorage.setItem("artsoul-mbti-strengths", JSON.stringify(testResult)); } catch {}
    }
    if (userId) updateUserMbti(userId, mbti).catch(() => {});
    navigate(`/art-taste#${sajuHash}`);
  };

  // ── 인트로 화면 ──
  if (mode === "intro") {
    return (
      <PageContainer>
        <ProgressBar current={2} total={3} />
        <div className="flex flex-col items-center text-center py-6 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-xl font-display text-gold-gradient font-semibold mb-2">
            MBTI 성격 분석
          </h1>
          <p className="text-sm text-muted-foreground mb-1">
            성격 유형에 맞는 그림을 추천해드려요
          </p>
          <p className="text-xs text-muted-foreground/70 mb-8">
            정밀 테스트를 하면 각 차원의 강도를 측정해서<br/>
            더 정확한 작품 추천이 가능합니다
          </p>

          <button onClick={() => setMode("test")}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] glow-gold mb-3">
            🎯 정밀 테스트 시작 (48문항 · 약 5분)
            <span className="block text-[10px] text-primary-foreground/70 mt-0.5">추천 — 작품 매칭 정확도가 높아집니다</span>
          </button>

          <button onClick={() => setMode("direct")}
            className="w-full py-3 rounded-xl bg-surface border border-border text-sm text-muted-foreground hover:text-foreground transition-all">
            이미 MBTI를 알고 있어요 — 직접 선택
          </button>

          <button onClick={() => navigate(`/art-taste#${sajuHash}`)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors mt-4">
            건너뛰기 →
          </button>
        </div>
      </PageContainer>
    );
  }

  // ── 직접 선택 ──
  if (mode === "direct") {
    const artResult = mbti ? matchMbtiToArt(mbti) : null;
    return (
      <PageContainer>
        <ProgressBar current={2} total={3} />
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display text-gold-gradient font-semibold">MBTI 선택</h1>
          <button onClick={() => setMode("intro")} className="text-xs text-muted-foreground hover:text-primary">← 돌아가기</button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">성격 유형을 선택해주세요</p>

        <MbtiGrid selected={mbti} onSelect={(t) => setMbti(t)} />

        {artResult && (
          <div className="bg-card border border-primary/20 rounded-xl p-4 mt-4 animate-fade-in">
            <p className="text-xs text-primary font-medium mb-1">{artResult.mbtiLabel}의 아트 바이브</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{artResult.artVibe}</p>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-3 mt-4">
          <p className="text-[10px] text-muted-foreground text-center">
            💡 정밀 테스트를 하면 E/I, S/N, T/F, J/P 각 차원의 <span className="text-primary">강도</span>를 측정해서 더 정확한 작품을 추천받을 수 있어요
          </p>
        </div>

        <button disabled={!mbti} onClick={handleNext}
          className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm mt-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none">
          다음
        </button>
      </PageContainer>
    );
  }

  // ── 테스트 진행 중 ──
  if (mode === "test" && currentQuestion) {
    const currentAnswer = answers[currentQuestion.id];
    const dimLabel: Record<string, string> = { EI: "외향·내향", SN: "감각·직관", TF: "사고·감정", JP: "판단·인식" };

    return (
      <PageContainer>
        {/* 상단 프로그레스 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">{currentQ + 1} / {TOTAL_QUESTIONS}</span>
            <span className="text-[10px] text-muted-foreground/60">{dimLabel[currentQuestion.dimension]}</span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 질문 */}
        <div className="flex-1 flex flex-col justify-center py-4 animate-fade-in" key={currentQuestion.id}>
          <p className="text-lg font-medium text-foreground text-center leading-relaxed mb-10 px-2">
            {currentQuestion.text}
          </p>

          {/* 7점 척도 */}
          <div className="space-y-2.5">
            {LIKERT_LABELS.map((label, i) => {
              const value = i + 1;
              const isSelected = currentAnswer === value;
              const barWidth = [100, 85, 70, 50, 70, 85, 100][i];
              return (
                <button key={value} onClick={() => handleAnswer(value)}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface border border-border text-foreground/80 hover:border-primary/30"
                  }`}
                  style={{ maxWidth: `${barWidth}%`, margin: "0 auto" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 하단 네비 */}
        <div className="flex gap-3 mt-6">
          <button onClick={handlePrev} disabled={currentQ === 0}
            className="flex-1 py-3 rounded-lg border border-border text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors">
            ← 이전
          </button>
          {currentAnswer && currentQ < TOTAL_QUESTIONS - 1 && (
            <button onClick={() => setCurrentQ(currentQ + 1)}
              className="flex-1 py-3 rounded-lg border border-primary/30 text-sm text-primary hover:bg-primary/10 transition-colors">
              다음 →
            </button>
          )}
        </div>
      </PageContainer>
    );
  }

  // ── 결과 화면 ──
  if (mode === "result" && testResult) {
    const artResult = matchMbtiToArt(testResult.type);
    const dims: [string, string, number, number][] = [
      ["E 외향", "I 내향", testResult.scores.E, testResult.scores.I],
      ["S 감각", "N 직관", testResult.scores.S, testResult.scores.N],
      ["T 사고", "F 감정", testResult.scores.T, testResult.scores.F],
      ["J 판단", "P 인식", testResult.scores.J, testResult.scores.P],
    ];

    return (
      <PageContainer>
        <ProgressBar current={2} total={3} />

        <div className="text-center mb-6 animate-fade-in">
          <p className="text-xs text-muted-foreground mb-2">당신의 성격 유형은</p>
          <div className="w-24 h-24 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-bold text-primary">{testResult.type}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{artResult.personality}</p>
        </div>

        {/* 4차원 강도 바 */}
        <div className="space-y-3 mb-6">
          {dims.map(([left, right, lVal, rVal]) => (
            <div key={left} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-medium ${lVal >= rVal ? "text-primary" : "text-muted-foreground"}`}>{left}</span>
                <span className={`text-xs font-medium ${rVal > lVal ? "text-primary" : "text-muted-foreground"}`}>{right}</span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
                <div className={`rounded-l-full ${lVal >= rVal ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ width: `${lVal}%` }} />
                <div className={`rounded-r-full ${rVal > lVal ? "bg-primary" : "bg-muted-foreground/30"}`} style={{ width: `${rVal}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{lVal}%</span>
                <span className="text-[10px] text-muted-foreground">{rVal}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* 아트 바이브 */}
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-6 glow-mystical">
          <p className="text-xs text-primary font-medium mb-1">{testResult.type}의 아트 바이브</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{artResult.artVibe}</p>
        </div>

        <button onClick={handleNext}
          className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all active:scale-[0.98] glow-gold">
          이 유형으로 작품 추천 받기
        </button>

        <button onClick={() => { setMode("test"); setCurrentQ(0); setAnswers({}); setTestResult(null); }}
          className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors mt-2">
          다시 테스트하기
        </button>
      </PageContainer>
    );
  }

  return null;
};

export default MbtiPage;
