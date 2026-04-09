import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Search, User } from "lucide-react";

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

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-6 py-1.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabBar;
