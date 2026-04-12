import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Check, MapPin, CreditCard, Package } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { addOrder } from "@/lib/orders";
import { getCart, clearCart, type CartItem } from "@/lib/cart";
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";

const STEPS = ["배송지 입력", "결제", "완료"];

const PurchaseFlowPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const totalParam = Number(searchParams.get("total") || 0);

  // 장바구니에서 왔으면 장바구니 아이템, 아니면 URL 파라미터
  const cartItems = useMemo(() => from === "cart" ? getCart() : [], []);
  const purchaseItems = cartItems.filter(i => i.type === "purchase");
  const rentalItems = cartItems.filter(i => i.type === "rental");
  const purchaseTotal = purchaseItems.reduce((s, i) => s + i.purchasePrice, 0);
  const rentalTotal = rentalItems.reduce((s, i) => s + i.rentalPrice, 0);
  const totalPrice = from === "cart" ? purchaseTotal + rentalTotal : totalParam;

  const [step, setStep] = useState(0);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", address: "", detail: "" });
  const [orderId, setOrderId] = useState("");

  const canProceed = newAddress.name && newAddress.phone && newAddress.address;

  const handleNext = () => {
    if (step === 1) {
      // 결제 완료 → 주문 저장
      if (from === "cart" && cartItems.length > 0) {
        cartItems.forEach(item => {
          addOrder({
            artworkId: item.artworkId,
            title: item.title,
            artist: item.artist,
            type: item.type,
            amount: item.type === "purchase" ? item.purchasePrice : item.rentalPrice,
            status: item.type === "rental" ? "렌탈중" : "결제완료",
          });
        });
        clearCart();
      }
      setOrderId(`ART-${Date.now()}`);
    }
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
                <MapPin className="w-4 h-4 text-primary" /> 배송지 입력
              </p>
              <div className="space-y-3 bg-card border border-border rounded-xl p-4">
                <input placeholder="받는 분 *" value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="연락처 *" value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="주소 *" value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
                <input placeholder="상세 주소" value={newAddress.detail}
                  onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
              </div>
            </div>
          )}

          {/* Step 2: Payment — 실제 장바구니 아이템 표시 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> 결제 정보
              </p>

              {/* 주문 상품 목록 */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs text-muted-foreground">주문 상품 ({cartItems.length}건)</p>

                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 h-18 rounded-lg overflow-hidden border border-border shrink-0">
                      <CaseCodeArt element={item.element as OhaengElement} energy={item.energy as EnergyLevel} style={item.style as StyleCode} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.artist}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        item.type === "purchase" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-400"
                      }`}>{item.type === "purchase" ? "구매" : "렌탈"}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground shrink-0">
                      ₩{(item.type === "purchase" ? item.purchasePrice : item.rentalPrice).toLocaleString()}
                    </p>
                  </div>
                ))}

                {cartItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">주문 상품 없음</p>
                )}

                <div className="border-t border-border pt-3 space-y-1.5">
                  {purchaseTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">구매 금액</span>
                      <span className="text-foreground">₩{purchaseTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {rentalTotal > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">렌탈 월 금액</span>
                      <span className="text-foreground">₩{rentalTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="text-foreground">무료</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
                    <span className="text-foreground">총 결제 금액</span>
                    <span className="text-primary">₩{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 배송지 확인 */}
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">배송지</p>
                <p className="text-sm text-foreground">{newAddress.name} · {newAddress.phone}</p>
                <p className="text-xs text-muted-foreground">{newAddress.address} {newAddress.detail}</p>
              </div>

              {/* 결제 수단 */}
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
                <p className="text-xs text-muted-foreground mt-1">주문번호 #{orderId}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 w-full max-w-sm space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">상품</span>
                  <span className="text-foreground">{cartItems.length > 0 ? `${cartItems.length}건` : "1건"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">결제 금액</span>
                  <span className="text-primary font-semibold">₩{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">배송지</span>
                  <span className="text-foreground truncate ml-2">{newAddress.address}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">배송 예정</span>
                  <span className="text-foreground">3~5일 이내</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate("/my")} className="text-xs text-muted-foreground hover:text-primary">
                  주문 내역 보기
                </button>
                <button onClick={() => navigate("/home")} className="text-xs text-primary font-medium">
                  홈으로
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        {step < 2 && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
            <button
              onClick={handleNext}
              disabled={step === 0 && !canProceed}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {step === 0 ? "다음" : `₩${totalPrice.toLocaleString()} 결제하기`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseFlowPage;
