import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Sparkles } from "lucide-react";
import { callGemini } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

// 유저 컨텍스트 (사주+취향+코인)
function getUserContext(): string {
  const parts: string[] = [];
  try {
    const saju = localStorage.getItem("artsoul-saju-input");
    if (saju) {
      const d = JSON.parse(saju);
      parts.push(`사주: ${d.birthDate} ${d.birthTime || "시간미상"} ${d.gender === "male" ? "남" : "여"}`);
    }
  } catch {}
  try {
    const tags = localStorage.getItem("artsoul-taste-tags");
    if (tags) parts.push(`취향: ${JSON.parse(tags).slice(0, 5).join(", ")}`);
  } catch {}
  try {
    const user = localStorage.getItem("artsoul-user");
    if (user) { const u = JSON.parse(user); parts.push(`이름: ${u.name || "고객"}`); }
  } catch {}
  return parts.join("\n") || "유저 정보 없음";
}

// DB에서 작품 데이터 가져오기 (상담에 참고용)
async function getArtworkContext(): Promise<string> {
  try {
    const { data } = await supabase.from("artworks")
      .select("title, artist_name, price, rental_price, genre, primary_ohaeng, description")
      .eq("status", "available").limit(20);
    if (data && data.length > 0) {
      return "현재 판매 가능 작품:\n" + data.map(a =>
        `- ${a.title} (${a.artist_name}, ${a.genre}, ${a.primary_ohaeng || ""}행, ₩${(a.price || 0).toLocaleString()}${a.rental_price ? `, 렌탈 월₩${a.rental_price.toLocaleString()}` : ""})`
      ).join("\n");
    }
  } catch {}
  return "현재 판매 작품: 탐색 페이지에서 125+점 확인 가능";
}

// 대화 세션 저장
async function saveSession(messages: Message[]) {
  const userId = getCurrentUserId();
  if (!userId || messages.length < 2) return;

  // 대화 요약 생성
  let summary = "";
  try {
    const convo = messages.map(m => `${m.role === "user" ? "고객" : "상담사"}: ${m.content}`).join("\n");
    summary = await callGemini(`[요약 모드] 아래 작품 구매 상담 대화를 2~3줄로 요약해줘. 고객이 원하는 것, 추천한 내용, 결론. 마크다운 금지.\n\n${convo}`);
  } catch {
    summary = `${messages.length}턴 대화. 마지막: ${messages[messages.length - 1].content.slice(0, 50)}...`;
  }

  await supabase.from("chat_sessions").upsert({
    user_id: userId,
    messages: messages,
    summary,
    message_count: messages.length,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

const SajuChatPage = () => {
  const navigate = useNavigate();
  const userContext = getUserContext();
  const [artworkContext, setArtworkContext] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "ai", content: "안녕! 어떤 그림을 찾고 있어? 거실에 걸 그림, 선물용, 사주에 맞는 그림, 인테리어 스타일... 편하게 말해줘. 내가 딱 맞는 작품 찾아줄게." },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 작품 데이터 로드
  useEffect(() => {
    getArtworkContext().then(setArtworkContext);
  }, []);

  // 페이지 떠날 때 대화 저장
  useEffect(() => {
    return () => { saveSession(messages).catch(() => {}); };
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    try {
      const history = updated.slice(-8)
        .map(m => `${m.role === "user" ? "고객" : "상담사"}: ${m.content}`)
        .join("\n");

      const prompt = `[작품 구매 상담 — 아트 컨설턴트 모드]

고객 정보:
${userContext}

우리 플랫폼 작품 데이터:
${artworkContext}

대화:
${history}

너는 ART.D.N.A.의 아트 컨설턴트야. 규칙:
- 3~5문장. 짧고 친근하게. 마크다운/이모지 금지
- 위 작품 데이터를 참고해서 실제 판매 중인 작품을 추천해
- 고객 사주 정보가 있으면 오행에 맞는 작품 추천 (자연스럽게)
- 가격대, 렌탈 vs 구매, 설치 공간 등 실질적 상담
- 구매로 연결하되 강요는 금지. 탐색 페이지 안내 가능
- "작가가 쓴 설명"이 있으면 인용해줘`;

      const text = await callGemini(prompt);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: text }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "앗, 답변 생성 중 오류가 생겼어. 다시 물어봐 줄래?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 pt-20 lg:px-12 min-h-screen">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-border shrink-0">
          <button onClick={() => { saveSession(messages).catch(() => {}); navigate(-1); }}
            className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-display font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> 작품 상담
            </h1>
            <p className="text-[10px] text-muted-foreground">나에게 맞는 작품을 찾아드려요</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs mr-2 shrink-0 mt-1">AI</div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border text-foreground rounded-bl-md"
              }`}>{msg.content}</div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0">AI</div>
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

        <div className="shrink-0 border-t border-border px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] bg-card/90 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="어떤 그림을 찾고 계세요?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            <button onClick={handleSend} disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SajuChatPage;
