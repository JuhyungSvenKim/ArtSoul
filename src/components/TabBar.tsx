import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Search, User, ShoppingBag } from "lucide-react";
import { getCart } from "@/lib/cart";

interface TabBarProps {
  activeTab?: "home" | "explore" | "my";
}

const tabs = [
  { key: "home" as const, label: "추천·사주", icon: Sparkles, path: "/home" },
  { key: "explore" as const, label: "탐색", icon: Search, path: "/explore" },
  { key: "my" as const, label: "MY", icon: User, path: "/my" },
];

const TabBar = ({ activeTab }: TabBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = activeTab || tabs.find((t) => location.pathname.startsWith(t.path))?.key;
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCart().length);
    // 페이지 이동 시 카운트 갱신
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-b border-border z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 lg:px-12 h-14">
        <button onClick={() => navigate("/home")} className="text-lg font-display text-gold-gradient font-semibold tracking-tight">
          ART.D.N.A.
        </button>
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.key;
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => navigate(tab.path)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
          {/* 장바구니 */}
          <button onClick={() => navigate("/cart")} className="relative ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TabBar;
