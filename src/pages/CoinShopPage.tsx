import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import { useOnboardingStore } from "@/stores/onboarding";
import { getCoinBalance } from "@/services/coins";

interface CoinPackage {
  id: number;
  name: string;
  coins: number;
  price: number;
  bonus_coins: number;
  description: string;
}

const CoinShopPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userId } = useOnboardingStore();
  const [coins, setCoins] = useState<number | null>(null);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 패키지 (정적 데이터)
  useEffect(() => {
    setPackages([
      { id: 1, name: "스타터", coins: 10, price: 1900, bonus_coins: 0, description: "가볍게 시작" },
      { id: 2, name: "베이직", coins: 30, price: 4900, bonus_coins: 3, description: "인기 패키지" },
      { id: 3, name: "스탠다드", coins: 60, price: 8900, bonus_coins: 10, description: "가성비 최고" },
      { id: 4, name: "프리미엄", coins: 120, price: 15900, bonus_coins: 30, description: "헤비유저 추천" },
      { id: 5, name: "VIP", coins: 300, price: 33900, bonus_coins: 100, description: "최대 혜택" },
    ]);
  }, []);

  // 잔액 로드
  useEffect(() => {
    if (userId) getCoinBalance(userId).then(setCoins).catch(() => {});
  }, [userId]);

  // 결제 성공 콜백 처리
  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (paymentKey && orderId && amount && userId) {
      confirmPayment(paymentKey, orderId, Number(amount));
    }
  }, [searchParams, userId]);

  const confirmPayment = async (paymentKey: string, orderId: string, amount: number) => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", paymentKey, orderId, amount, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.coins);
        setMessage({ type: "success", text: data.message });
        // URL에서 결제 파라미터 제거
        navigate("/coin-shop", { replace: true });
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "결제 확인 중 오류 발생" });
    }
  };

  // 토스페이먼츠 결제 시작
  const handlePurchase = useCallback(async (pkg: CoinPackage) => {
    if (!userId) {
      setMessage({ type: "error", text: "로그인이 필요합니다" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. 주문 생성
      const prepareRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prepare", userId, packageId: pkg.id }),
      });
      const prepareData = await prepareRes.json();

      if (!prepareData.success) {
        setMessage({ type: "error", text: prepareData.error });
        return;
      }

      // 2. 토스페이먼츠 SDK 로드 및 결제 요청
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

      const loadTossSDK = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).TossPayments) {
            resolve((window as any).TossPayments);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://js.tosspayments.com/v1/payment";
          script.onload = () => resolve((window as any).TossPayments);
          script.onerror = () => reject(new Error("토스 SDK 로드 실패"));
          document.head.appendChild(script);
        });
      };

      const TossPayments = await loadTossSDK();
      const tossPayments = TossPayments(clientKey);

      await tossPayments.requestPayment("카드", {
        amount: prepareData.amount,
        orderId: prepareData.orderId,
        orderName: prepareData.orderName,
        successUrl: `${window.location.origin}/coin-shop`,
        failUrl: `${window.location.origin}/coin-shop?error=payment_failed`,
      });
    } catch (e: any) {
      if (e?.code !== "USER_CANCEL") {
        setMessage({ type: "error", text: e?.message || "결제 요청 실패" });
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return (
    <PageContainer>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          ← 뒤로
        </button>
        <h1 className="text-lg font-display text-gold-gradient font-semibold">코인 충전</h1>
        <div className="w-10" />
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30"
          : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {message.text}
        </div>
      )}

      {/* 현재 잔액 */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 text-center glow-mystical">
        <p className="text-xs text-muted-foreground mb-1">보유 코인</p>
        <p className="text-3xl font-bold text-gold-gradient">{coins ?? "—"} 🪙</p>
      </div>

      {/* 코인 사용처 */}
      <div className="bg-surface border border-border rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-foreground mb-2">코인 사용처</p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>오늘의 운세</span><span className="text-primary">1 코인</span></div>
          <div className="flex justify-between"><span>금주의 운세</span><span className="text-primary">3 코인</span></div>
          <div className="flex justify-between"><span>AI 사주 해석</span><span className="text-primary">5 코인</span></div>
          <div className="flex justify-between"><span>월간 운세</span><span className="text-primary">5 코인</span></div>
          <div className="flex justify-between"><span>올해 운세</span><span className="text-primary">10 코인</span></div>
        </div>
      </div>

      {/* 패키지 목록 */}
      <p className="text-sm font-medium text-foreground mb-3">충전 패키지</p>
      <div className="space-y-2 mb-6">
        {packages.map((pkg) => {
          const isBestValue = pkg.id === 3;
          return (
            <button key={pkg.id} onClick={() => handlePurchase(pkg)} disabled={loading}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all active:scale-[0.98] disabled:opacity-50 ${
                isBestValue ? "bg-primary/10 border-primary/30 glow-gold" : "bg-surface border-border hover:border-primary/20"
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">🪙</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {pkg.name} · {pkg.coins}코인
                    {pkg.bonus_coins > 0 && <span className="text-primary ml-1">+{pkg.bonus_coins}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{pkg.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isBestValue && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">추천</span>
                )}
                <span className="text-sm font-semibold text-foreground">₩{pkg.price.toLocaleString()}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 안내 */}
      <div className="text-[10px] text-muted-foreground/60 space-y-1 mb-8">
        <p>· 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.</p>
        <p>· 구매한 코인은 환불되지 않습니다.</p>
        <p>· 결제 관련 문의: support@artdna.kr</p>
      </div>
    </PageContainer>
  );
};

export default CoinShopPage;
