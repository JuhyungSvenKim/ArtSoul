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
    question: "에너지를 어디서 얻나요?",
    optionA: "사람들과 어울릴 때",
    optionB: "혼자만의 시간에",
    dimension: "EI",
  },
  {
    question: "정보를 어떻게 받아들이나요?",
    optionA: "구체적 사실 중심",
    optionB: "직관과 가능성 중심",
    dimension: "SN",
  },
  {
    question: "결정을 어떻게 내리나요?",
    optionA: "논리적으로 분석해서",
    optionB: "감정과 가치관으로",
    dimension: "TF",
  },
  {
    question: "생활 방식은?",
    optionA: "계획적이고 체계적",
    optionB: "유연하고 즉흥적",
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
