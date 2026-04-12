import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { startOnlineSync } from "@/lib/encrypted-storage";
import ErrorBoundary from "@/components/ErrorBoundary";

// 온보딩 플로우
import LoginPage from "./pages/LoginPage";
import BirthInfoPage from "./pages/BirthInfoPage";
import MbtiPage from "./pages/MbtiPage";
import ArtTastePage from "./pages/ArtTastePage";
import SajuResultPage from "./pages/SajuResultPage";

// 메인 탭
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import MyPage from "./pages/MyPage";

// 서브 페이지
import SajuPage from "./pages/SajuPage";
import SajuChatPage from "./pages/SajuChatPage";
import CoinShopPage from "./pages/CoinShopPage";
import AdminPage from "./pages/AdminPage";
import ArtworkDetailPage from "./pages/ArtworkDetailPage";
import CartPage from "./pages/CartPage";
import PurchaseFlowPage from "./pages/PurchaseFlowPage";
import RentalFlowPage from "./pages/RentalFlowPage";
import ArtistProfilePage from "./pages/ArtistProfilePage";
import ArtistRegisterPage from "./pages/ArtistRegisterPage";
import ArtworkUploadPage from "./pages/ArtworkUploadPage";
import ArtistDashboardPage from "./pages/ArtistDashboardPage";
import TopPicksPage from "./pages/TopPicksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // 온라인 복구 시 오프라인 큐 자동 동기화
  useEffect(() => {
    const cleanup = startOnlineSync();
    return cleanup;
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* 온보딩: 로그인 → 사주입력 → MBTI → 취향테스트 → 결과 → 메인 */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/birth-info" element={<BirthInfoPage />} />
          <Route path="/mbti" element={<MbtiPage />} />
          <Route path="/art-taste" element={<ArtTastePage />} />
          <Route path="/result" element={<SajuResultPage />} />

          {/* 메인 3탭 */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/my" element={<MyPage />} />

          {/* 서브 */}
          <Route path="/saju" element={<SajuPage />} />
          <Route path="/saju-chat" element={<SajuChatPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/coin-shop" element={<CoinShopPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
          <Route path="/purchase" element={<PurchaseFlowPage />} />
          <Route path="/rental" element={<RentalFlowPage />} />
          <Route path="/artist/:id" element={<ArtistProfilePage />} />
          <Route path="/artist-register" element={<ArtistRegisterPage />} />
          <Route path="/artwork-upload" element={<ArtworkUploadPage />} />
          <Route path="/artist-dashboard" element={<ArtistDashboardPage />} />
          <Route path="/top-picks" element={<TopPicksPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
