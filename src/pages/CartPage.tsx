import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/PageContainer";
import TabBar from "@/components/TabBar";
import { Trash2, ShoppingBag } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import { getCart, removeFromCart, clearCart, getCartTotal, type CartItem } from "@/lib/cart";
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";

const CartPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(getCart);

  const handleRemove = (artworkId: string, type: string) => {
    setItems(removeFromCart(artworkId, type));
  };

  const handleClear = () => {
    if (!confirm("장바구니를 비우시겠습니까?")) return;
    clearCart();
    setItems([]);
  };

  const { purchaseTotal, rentalTotal, count } = getCartTotal(items);
  const purchaseItems = items.filter(i => i.type === "purchase");
  const rentalItems = items.filter(i => i.type === "rental");

  return (
    <PageContainer className="pt-20 pb-32">
      <TabBar />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-display text-gold-gradient font-semibold">장바구니</h1>
        {items.length > 0 && (
          <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-red-400 transition-colors">
            전체 비우기
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">장바구니가 비어있습니다</p>
          <button onClick={() => navigate("/explore")}
            className="mt-4 text-sm text-primary hover:underline">작품 둘러보기 →</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 구매 아이템 */}
          {purchaseItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">구매 ({purchaseItems.length})</p>
              <div className="space-y-3">
                {purchaseItems.map(item => (
                  <CartItemCard key={`buy-${item.artworkId}`} item={item} onRemove={handleRemove} navigate={navigate} />
                ))}
              </div>
            </div>
          )}

          {/* 렌탈 아이템 */}
          {rentalItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">렌탈 ({rentalItems.length})</p>
              <div className="space-y-3">
                {rentalItems.map(item => (
                  <CartItemCard key={`rent-${item.artworkId}`} item={item} onRemove={handleRemove} navigate={navigate} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 하단 결제 바 */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">총 {count}건</span>
              <div className="text-right">
                {purchaseTotal > 0 && <p className="text-sm text-foreground">구매 <span className="font-semibold">₩{purchaseTotal.toLocaleString()}</span></p>}
                {rentalTotal > 0 && <p className="text-xs text-primary">렌탈 월 <span className="font-semibold">₩{rentalTotal.toLocaleString()}</span></p>}
              </div>
            </div>
            <button onClick={() => navigate(`/purchase?from=cart&total=${purchaseTotal + rentalTotal}`)}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-transform active:scale-[0.98]">
              결제하기
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

function CartItemCard({ item, onRemove, navigate }: { item: CartItem; onRemove: (id: string, type: string) => void; navigate: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex gap-4">
      <div className="w-20 h-24 rounded-lg overflow-hidden border border-border shrink-0 cursor-pointer"
        onClick={() => navigate(`/artwork/${item.artworkId}`)}>
        <CaseCodeArt element={item.element as OhaengElement} energy={item.energy as EnergyLevel} style={item.style as StyleCode} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.artist}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            item.type === "purchase" ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-400"
          }`}>
            {item.type === "purchase" ? "구매" : "렌탈"}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {item.type === "purchase"
              ? `₩${item.purchasePrice.toLocaleString()}`
              : `월 ₩${item.rentalPrice.toLocaleString()}`}
          </span>
        </div>
      </div>
      <button onClick={() => onRemove(item.artworkId, item.type)}
        className="shrink-0 w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default CartPage;
