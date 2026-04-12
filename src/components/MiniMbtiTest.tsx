import { useState } from "react";
import type { MbtiType } from "./MbtiGrid";

interface Question {
  question: string;
  optionA: string;
  optionB: string;
  dimension: "EI" | "SN" | "TF" | "JP";
}

const QUESTIONS: Question[] = [
  {
    question: "주말에 갑자기 약속이 잡히면?",
    optionA: "좋지! 나가자",
    optionB: "음... 집이 좋은데",
    dimension: "EI",
  },
  {
    question: "새 프로젝트를 시작할 때",
    optionA: "일단 자료부터 모음",
    optionB: "큰 그림부터 그림",
    dimension: "SN",
  },
  {
    question: "친구가 고민 상담을 하면",
    optionA: "해결책을 찾아줌",
    optionB: "일단 공감해줌",
    dimension: "TF",
  },
  {
    question: "여행 계획은?",
    optionA: "숙소-맛집 다 예약",
    optionB: "가서 정함 뭐",
    dimension: "JP",
  },
];

interface MiniMbtiTestProps {
  visible: boolean;
  onComplete: (result: MbtiType) => void;
}

const MiniMbtiTest = ({ visible, onComplete }: MiniMbtiTestProps) => {
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});

  if (!visible) return null;

  const handleSelect = (dimension: string, choice: "A" | "B") => {
    const newAnswers = { ...answers, [dimension]: choice };
    setAnswers(newAnswers);

    if (Object.keys(newAnswers).length === 4) {
      const result = [
        newAnswers["EI"] === "A" ? "E" : "I",
        newAnswers["SN"] === "A" ? "S" : "N",
        newAnswers["TF"] === "A" ? "T" : "F",
        newAnswers["JP"] === "A" ? "J" : "P",
      ].join("") as MbtiType;
      setTimeout(() => onComplete(result), 300);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {QUESTIONS.map((q, i) => (
        <div key={q.dimension} className="bg-surface rounded-lg p-4 border border-border" style={{ animationDelay: `${i * 100}ms` }}>
          <p className="text-sm text-foreground font-medium mb-3">{q.question}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSelect(q.dimension, "A")}
              className={`flex-1 py-2.5 px-3 rounded-md text-xs transition-all ${
                answers[q.dimension] === "A"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-elevated border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {q.optionA}
            </button>
            <button
              type="button"
              onClick={() => handleSelect(q.dimension, "B")}
              className={`flex-1 py-2.5 px-3 rounded-md text-xs transition-all ${
                answers[q.dimension] === "B"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-elevated border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {q.optionB}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiniMbtiTest;
