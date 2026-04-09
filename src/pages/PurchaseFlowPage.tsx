import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { ChevronLeft, Check, MapPin, CreditCard, Package } from "lucide-react";

const STEPS = ["배송지 입력", "결제", "완료"];

const SAVED_ADDRESSES = [
  { id: "1", label: "집", name: "홍길동", phone: "010-1234-5678", address: "서울시 강남구 역삼동 123-45, 아트빌라 301호", isDefault: true },
  { id: "2", label: "회사", name: "홍길동", phone: "010-1234-5678", address: "서울시 서초구 서초대로 234, 5층", isDefault: false },
];

const PurchaseFlowPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const artworkTitle = searchParams.get("title") || "청산유수";
  const price = Number(searchParams.get("price") || 1800000);

  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(SAVED_ADDRESSES[0].id);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address: "", detail: "" });
  const [useNewAddress, setUseNewAddress] = useState(false);

  const canProceed = useNewAddress
    ? newAddress.name && newAddress.phone && newAddress.address
    : selectedAddress;

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">구매하기</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary/20 border-2 border-primary text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 px-5 pb-32 overflow-y-auto">
          {/* Step 1: Address */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> 배송지 선택
              </p>

              {SAVED_ADDRESSES.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => { setSelectedAddress(addr.id); setUseNewAddress(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    !useNewAddress && selectedAddress === addr.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">기본</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{addr.name} · {addr.phone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{addr.address}</p>
                </button>
              ))}

              <button
                onClick={() => setUseNewAddress(true)}
                className={`w-full p-4 rounded-xl border border-dashed text-sm transition-all ${
                  useNewAddress ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground"
                }`}
              >
                + 새 배송지 입력
              </button>

              {useNewAddress && (
                <div className="space-y-3 bg-card border border-border rounded-xl p-4">
                  <input
                    placeholder="받는 분"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                  <input
                    placeholder="연락처"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                  <input
                    placeholder="주소"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                  <input
                    placeholder="상세 주소"
                    value={newAddress.detail}
                    onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> 결제 정보
              </p>

              {/* Order Summary */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground">주문 상품</p>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-lg bg-surface border border-border flex items-center justify-center text-2xl">🏔️</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{artworkTitle}</p>
                    <p className="text-xs text-muted-foreground">수묵담채 · 60×90 cm</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span className="text-foreground">₩{price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="text-foreground">무료</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
                    <span className="text-foreground">총 결제 금액</span>
                    <span className="text-primary">₩{price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Toss Payments Widget Placeholder */}
              <div className="bg-card border border-border rounded-xl p-5 text-center space-y-2">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-xs text-muted-foreground">토스페이먼츠 결제 위젯</p>
                <p className="text-[10px] text-muted-foreground/60">카드 / 계좌이체 / 간편결제</p>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">주문이 완료되었습니다</h2>
                <p className="text-xs text-muted-foreground mt-1">주문번호 #ART-20250406-001</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 w-full max-w-xs space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">상품</span>
                  <span className="text-foreground">{artworkTitle}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">결제 금액</span>
                  <span className="text-primary font-semibold">₩{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">배송 예정</span>
                  <span className="text-foreground">3~5일 이내</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-xs text-primary underline underline-offset-2">
                <Package className="w-3.5 h-3.5" /> 배송 추적
              </button>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        {step < 2 ? (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
            <button
              onClick={handleNext}
              disabled={step === 0 && !canProceed}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {step === 0 ? "결제하기" : "₩" + price.toLocaleString() + " 결제하기"}
            </button>
          </div>
        ) : (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]"
            >
              홈으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseFlowPage;
