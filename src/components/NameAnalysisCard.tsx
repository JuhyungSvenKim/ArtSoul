/**
 * 성명학 분석 결과 카드 컴포넌트
 */
import { useState } from "react";
import type { FullNameAnalysis } from "@/lib/name-analysis";

const OH_STYLE: Record<string, { bg: string; text: string }> = {
  목: { bg: "bg-green-500/20", text: "text-green-400" },
  화: { bg: "bg-red-500/20", text: "text-red-400" },
  토: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
  금: { bg: "bg-gray-400/20", text: "text-gray-300" },
  수: { bg: "bg-blue-500/20", text: "text-blue-400" },
};

const GRADE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  S: { bg: "bg-primary/20", text: "text-primary", label: "최상" },
  A: { bg: "bg-green-500/20", text: "text-green-400", label: "우수" },
  B: { bg: "bg-blue-500/20", text: "text-blue-400", label: "양호" },
  C: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "보통" },
  D: { bg: "bg-red-500/20", text: "text-red-400", label: "주의" },
};

const RATING_STYLE: Record<string, string> = {
  대길: "text-primary",
  길: "text-green-400",
  반길반흉: "text-yellow-400",
  흉: "text-red-400",
  대흉: "text-red-500",
};

export default function NameAnalysisCard({ data, lackingOhaeng = [], dominantOhaeng = [], dayOhaeng = "" }: {
  data: FullNameAnalysis; lackingOhaeng?: string[]; dominantOhaeng?: string[]; dayOhaeng?: string;
}) {
  const [openSection, setOpenSection] = useState<string | null>("balance");
  const grade = GRADE_STYLE[data.overallGrade] || GRADE_STYLE.C;

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  // 이름 오행이 부족한 오행을 채워주는지 분석
  const nameOhaengs = [...data.soundOhaeng.flow, ...(data.jawonOhaeng?.flow || [])];
  const nameOhaengCount: Record<string, number> = {};
  for (const oh of nameOhaengs) nameOhaengCount[oh] = (nameOhaengCount[oh] || 0) + 1;

  const supplements = lackingOhaeng.filter(oh => nameOhaengCount[oh]);
  const conflicts = dominantOhaeng.filter(oh => nameOhaengCount[oh] && nameOhaengCount[oh] >= 2);

  let balanceVerdict = "";
  if (supplements.length > 0 && conflicts.length === 0) {
    balanceVerdict = `이름에 ${supplements.join('·')} 오행이 있어서 사주에서 부족한 기운을 채워줍니다. 이름과 사주의 궁합이 좋은 편이에요.`;
  } else if (supplements.length > 0 && conflicts.length > 0) {
    balanceVerdict = `${supplements.join('·')} 오행을 보충해주지만, 이미 넘치는 ${conflicts.join('·')} 오행도 이름에 있어서 약간의 편중이 있습니다.`;
  } else if (conflicts.length > 0) {
    balanceVerdict = `이미 강한 ${conflicts.join('·')} 오행이 이름에도 많아서, 부족한 기운을 채우기엔 아쉬운 구조입니다. 생활 속에서 부족한 오행을 보완하세요.`;
  } else if (lackingOhaeng.length > 0) {
    balanceVerdict = `부족한 ${lackingOhaeng.join('·')} 오행이 이름에 직접 들어있지 않습니다. 색상, 방향, 계절 등으로 보완하면 좋습니다.`;
  } else {
    balanceVerdict = "사주의 오행 밸런스가 양호하여, 이름이 기운을 크게 흐트리지 않습니다.";
  }

  return (
    <div className="space-y-4">
      {/* 핵심 — 부족한 오행을 이름이 채워주는가 */}
      <div className="bg-card border border-primary/20 rounded-xl p-4 glow-mystical">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-bold text-foreground">{data.nameKorean}</p>
            {data.nameHanja && <p className="text-sm text-muted-foreground">{data.nameHanja}</p>}
          </div>
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full ${grade.bg} flex items-center justify-center`}>
              <span className={`text-2xl font-bold ${grade.text}`}>{data.overallGrade}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{data.overallScore}점 · {grade.label}</p>
          </div>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{balanceVerdict}</p>
        {lackingOhaeng.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {lackingOhaeng.map(oh => {
              const s = OH_STYLE[oh];
              const has = nameOhaengCount[oh];
              return (
                <span key={oh} className={`text-xs px-2.5 py-1 rounded-full border ${has ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                  {oh} {has ? "보충됨" : "미보충"}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 오행 밸런스 보충 해석 */}
      {(lackingOhaeng.length > 0 || dominantOhaeng.length > 0) && (
        <SectionToggle title="이름 × 사주 오행 보충 분석" hint="부족한 오행을 이름이 얼마나 채워주는지" isOpen={openSection === "balance"} onToggle={() => toggle("balance")}>
          <div className="space-y-3">
            {dayOhaeng && (
              <p className="text-xs text-muted-foreground">
                일간 <span className={`font-semibold ${OH_STYLE[dayOhaeng]?.text || "text-foreground"}`}>{dayOhaeng}</span> 기준,
                용신 <span className={`font-semibold ${OH_STYLE[data.yongsinMatch?.yongsinElement || ""]?.text || "text-primary"}`}>{data.yongsinMatch?.yongsinElement || "?"}</span> 오행이 필요한 사주
              </p>
            )}
            <div className="grid grid-cols-5 gap-1.5">
              {(["목", "화", "토", "금", "수"] as const).map(oh => {
                const s = OH_STYLE[oh];
                const count = nameOhaengCount[oh] || 0;
                const isLacking = lackingOhaeng.includes(oh);
                const isDominant = dominantOhaeng.includes(oh);
                return (
                  <div key={oh} className={`rounded-lg p-2 text-center border ${isLacking ? "border-red-500/30" : isDominant ? "border-yellow-500/30" : "border-border"} ${s.bg}`}>
                    <p className={`text-sm font-bold ${s.text}`}>{oh}</p>
                    <p className="text-[10px] text-muted-foreground">이름 {count}개</p>
                    {isLacking && <p className="text-[9px] text-red-400 mt-0.5">부족</p>}
                    {isDominant && <p className="text-[9px] text-yellow-400 mt-0.5">과다</p>}
                  </div>
                );
              })}
            </div>
            {data.yongsinMatch && (
              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs text-foreground/80 leading-relaxed">{data.yongsinMatch.description}</p>
                <p className="text-xs text-primary leading-relaxed mt-1">{data.yongsinMatch.recommendation}</p>
              </div>
            )}
          </div>
        </SectionToggle>
      )}

      {/* 음향오행 */}
      <SectionToggle title="음향오행 (초성)" hint="이름 소리의 오행 흐름" isOpen={openSection === "sound"} onToggle={() => toggle("sound")}>
        <div className="space-y-3">
          <div className="flex gap-2 justify-center">
            {data.soundOhaeng.chars.map((c, i) => {
              const s = OH_STYLE[c.ohaeng];
              return (
                <div key={i} className="text-center">
                  <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <span className={`text-lg font-bold ${s.text}`}>{c.char}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{c.choseong} · {c.ohaeng}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-1">
            {data.soundOhaeng.flow.map((oh, i) => {
              const s = OH_STYLE[oh];
              return (
                <span key={i} className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${s.text}`}>{oh}</span>
                  {i < data.soundOhaeng.flow.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                </span>
              );
            })}
            <span className="text-xs text-muted-foreground ml-2">({data.soundOhaeng.score}점)</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{data.soundOhaeng.flowAnalysis}</p>
        </div>
      </SectionToggle>

      {/* 수리 81수리 */}
      {data.spiResult && (
        <SectionToggle title="수리 분석 (81수리)" hint="획수로 보는 이름의 운" isOpen={openSection === "suri"} onToggle={() => toggle("suri")}>
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-1.5">
              {[data.spiResult.cheongyeok, data.spiResult.ingyeok, data.spiResult.jigyeok, data.spiResult.chonggyeok, data.spiResult.oegyeok].map((g) => {
                const rs = RATING_STYLE[g.rating] || "text-foreground";
                const os = OH_STYLE[g.ohaeng];
                return (
                  <div key={g.name} className="bg-surface border border-border rounded-lg p-2 text-center">
                    <p className="text-[9px] text-muted-foreground mb-1">{g.name.split('(')[0]}</p>
                    <p className={`text-lg font-bold ${rs}`}>{g.value}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${os.bg} ${os.text}`}>{g.ohaeng}</span>
                    <p className={`text-[10px] mt-1 ${rs}`}>{g.rating}</p>
                  </div>
                );
              })}
            </div>
            {/* 핵심 격 해설 */}
            {[data.spiResult.ingyeok, data.spiResult.jigyeok, data.spiResult.chonggyeok].map((g) => (
              <div key={g.name} className="bg-surface rounded-lg p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{g.name}</span>
                  <span className={`text-[10px] ${RATING_STYLE[g.rating]}`}>{g.rating}</span>
                </div>
                <p className="text-xs text-foreground/70">{g.meaning}</p>
              </div>
            ))}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">종합: <span className="text-foreground font-medium">{data.spiResult.overallRating}</span> ({data.spiResult.overallScore}점)</p>
            </div>
          </div>
        </SectionToggle>
      )}

      {/* 자원오행 */}
      {data.jawonOhaeng && data.jawonOhaeng.chars.length > 0 && (
        <SectionToggle title="자원오행 (획수)" hint="한자 획수로 보는 오행" isOpen={openSection === "jawon"} onToggle={() => toggle("jawon")}>
          <div className="space-y-3">
            <div className="flex gap-3 justify-center">
              {data.jawonOhaeng.chars.map((c, i) => {
                const s = OH_STYLE[c.ohaeng];
                return (
                  <div key={i} className="text-center">
                    <div className={`w-14 h-14 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${s.text}`}>{c.char}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{c.strokes}획 · {c.ohaeng}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.jawonOhaeng.flowAnalysis}</p>
            <p className="text-xs text-muted-foreground text-center">점수: {data.jawonOhaeng.score}점</p>
          </div>
        </SectionToggle>
      )}

      {/* 사주용신 매칭 */}
      {data.yongsinMatch && (
        <SectionToggle title="사주 용신 매칭" hint="이름과 사주의 궁합" isOpen={openSection === "yongsin"} onToggle={() => toggle("yongsin")}>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">이름 오행</p>
                <div className="flex gap-1">
                  {[...new Set(data.yongsinMatch.nameElements)].map((oh, i) => {
                    const s = OH_STYLE[oh];
                    return <span key={i} className={`text-xs px-2 py-1 rounded-full ${s.bg} ${s.text}`}>{oh}</span>;
                  })}
                </div>
              </div>
              <span className="text-lg text-muted-foreground">×</span>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground mb-1">용신</p>
                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${OH_STYLE[data.yongsinMatch.yongsinElement]?.bg} ${OH_STYLE[data.yongsinMatch.yongsinElement]?.text}`}>
                  {data.yongsinMatch.yongsinElement}
                </span>
              </div>
            </div>
            <div className="text-center">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                data.yongsinMatch.matchType === '동일' || data.yongsinMatch.matchType === '상생' ? 'bg-green-500/20 text-green-400' :
                data.yongsinMatch.matchType === '상극' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {data.yongsinMatch.matchType} ({data.yongsinMatch.compatibility}점)
              </span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.yongsinMatch.description}</p>
            <p className="text-xs text-primary leading-relaxed">{data.yongsinMatch.recommendation}</p>
          </div>
        </SectionToggle>
      )}
    </div>
  );
}

function SectionToggle({ title, hint, isOpen, onToggle, children }: {
  title: string; hint: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between text-left">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {!isOpen && <p className="text-[10px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={`text-xs text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
