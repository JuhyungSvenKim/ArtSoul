import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, MapPin, CreditCard, CalendarClock, RotateCcw } from "lucide-react";
import { addRental } from "@/lib/orders";

const STEPS = ["렌탈 옵션", "배송지 입력", "결제", "완료"];

const CYCLES = [
  { id: "3m", label: "3개월", price: 45000, desc: "분기마다 새로운 작품으로 교체" },
  { id: "6m", label: "6개월", price: 35000, desc: "반기마다 교체 · 월 ₩10,000 할인" },
];

const RentalFlowPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artworkTitle = searchParams.get("title") || "청산유수";

  const [step, setStep] = useState(0);
  const [selectedCycle, setSelectedCycle] = useState("3m");
  const [address, setAddress] = useState({ name: "", phone: "", address: "", detail: "" });

  const cycle = CYCLES.find((c) => c.id === selectedCycle)!;

  const [nextDate, setNextDate] = useState("");

  const handleNext = () => {
    if (step === 2) {
      // 결제 완료 → 렌탈 저장
      const months = selectedCycle === "3m" ? 3 : 6;
      const start = new Date();
      const next = new Date(start);
      next.setMonth(next.getMonth() + months);
      setNextDate(next.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }));

      addRental({
        artworkId: "rental-direct",
        title: artworkTitle,
        artist: "",
        cycle: selectedCycle,
        monthlyPrice: cycle.price,
        startDate: start.toISOString(),
        nextExchangeDate: next.toISOString(),
        status: "active",
      });
    }
    if (step < 3) setStep(step + 1);
  };

  const canProceedStep1 = address.name && address.phone && address.address;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">렌탈하기</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1.5 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 border-2 border-primary text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 px-5 pb-32 overflow-y-auto">
          {/* Step 0: Rental Options */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-primary" /> 교체 주기 선택
              </p>
              {CYCLES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCycle(c.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedCycle === c.id ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">{c.label}</span>
                    <span className="text-sm font-semibold text-primary">월 ₩{c.price.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </button>
              ))}
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-14 h-18 rounded-lg bg-surface border border-border flex items-center justify-center text-2xl">🏔️</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{artworkTitle}</p>
                  <p className="text-xs text-muted-foreground">첫 작품으로 배송됩니다</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> 배송지 입력
              </p>
              <div className="space-y-3 bg-card border border-border rounded-xl p-4">
                <input placeholder="받는 분" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="연락처" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="주소" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="상세 주소" value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> 구독 결제
              </p>
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground">구독 요약</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">작품</span>
                  <span className="text-foreground">{artworkTitle}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">교체 주기</span>
                  <span className="text-foreground">{cycle.label}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">월 결제 금액</span>
                  <span className="text-primary">₩{cycle.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">토스페이먼츠 결제 위젯</p>
                <p className="text-[10px] text-muted-foreground/60">카드 / 계좌이체 / 간편결제</p>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">렌탈 신청 완료!</h2>
                <p className="text-xs text-muted-foreground mt-1">구독이 시작되었습니다</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 w-full max-w-xs space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">첫 작품</span>
                  <span className="text-foreground">{artworkTitle}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">월 결제</span>
                  <span className="text-primary font-semibold">₩{cycle.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">다음 교체일</span>
                  <span className="text-foreground flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" />
                    {nextDate}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !canProceedStep1}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {step === 2 ? `월 ₩${cycle.price.toLocaleString()} 결제하기` : "다음"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]"
            >
              홈으로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalFlowPage;
