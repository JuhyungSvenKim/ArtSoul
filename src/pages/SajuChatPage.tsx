import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE = `안녕하세요! 저는 사주 AI 전문가입니다 🔮

당신의 사주를 분석해드리겠습니다.

**일간: 甲木 (갑목)**
갑목은 큰 나무와 같은 에너지를 지니고 있습니다. 곧고 올바르며, 성장을 향한 강한 의지가 특징입니다.

**오행 균형 분석:**
- 木 (목): ████████░░ 80% — 매우 강함
- 火 (화): ██████░░░░ 60% — 양호
- 土 (토): ████░░░░░░ 40% — 보통
- 金 (금): ███░░░░░░░ 30% — 약함
- 水 (수): █████░░░░░ 50% — 양호

**종합 해석:**
목의 기운이 매우 강한 사주입니다. 창의력과 성장에 대한 욕구가 크며, 자연과 예술에서 큰 에너지를 얻을 수 있습니다. 금의 기운을 보충하면 더욱 균형 잡힌 삶을 살 수 있습니다.

궁금한 점이 있으시면 언제든 물어보세요! 😊`;

const SajuChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: INITIAL_MESSAGE, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remainingCount = 3;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: getAiResponse(userMsg.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="mobile-container flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-border shrink-0">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-display font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> 사주 AI 전문가
            </h1>
            <p className="text-[10px] text-muted-foreground">무료 질문 {remainingCount}회 남음</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm mr-2 shrink-0 mt-1">
                  🔮
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm shrink-0">🔮</div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] bg-card/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="사주에 대해 물어보세요..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getAiResponse(question: string): string {
  if (question.includes("연애") || question.includes("사랑") || question.includes("궁합")) {
    return "연애운을 살펴보겠습니다 💕\n\n갑목 일간의 당신은 올해 편재운이 강하게 들어옵니다. 새로운 만남의 기회가 많아지며, 특히 가을(金의 계절)에 좋은 인연을 만날 가능성이 높습니다.\n\n목과 금의 조화를 이루는 상대방이 좋은 궁합을 보여줄 수 있습니다.";
  }
  if (question.includes("재물") || question.includes("돈") || question.includes("재운")) {
    return "재물운을 분석해드리겠습니다 💰\n\n올해는 편재운이 활발하여 예상치 못한 수입원이 생길 수 있습니다. 다만 정재보다 편재가 강하므로, 안정적인 투자보다는 새로운 사업이나 부업에서 수익이 발생할 가능성이 높습니다.\n\n금전적 결정은 화(火)의 기운이 강한 여름에 하시는 것이 유리합니다.";
  }
  return "좋은 질문이네요! 🌟\n\n당신의 사주를 바탕으로 분석해보면, 갑목의 기운이 강한 만큼 지금 시기에는 자기 계발과 성장에 집중하시는 것이 좋겠습니다.\n\n특히 목(木)의 에너지를 살려 창의적인 활동이나 예술 관련 분야에서 좋은 결과를 기대할 수 있습니다.\n\n더 구체적인 주제가 있으시면 말씀해주세요!";
}

export default SajuChatPage;
