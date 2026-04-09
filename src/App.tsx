import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import BirthInfoPage from "./pages/BirthInfoPage";
import MbtiPage from "./pages/MbtiPage";
import ArtTastePage from "./pages/ArtTastePage";
import ArtDnaCardPage from "./pages/ArtDnaCardPage";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import SajuPage from "./pages/SajuPage";
import MyPage from "./pages/MyPage";
import CoinShopPage from "./pages/CoinShopPage";
import AdminPage from "./pages/AdminPage";
import ArtworkDetailPage from "./pages/ArtworkDetailPage";
import PurchaseFlowPage from "./pages/PurchaseFlowPage";
import RentalFlowPage from "./pages/RentalFlowPage";
import SajuChatPage from "./pages/SajuChatPage";
import ArtistProfilePage from "./pages/ArtistProfilePage";
import ArtistRegisterPage from "./pages/ArtistRegisterPage";
import ArtworkUploadPage from "./pages/ArtworkUploadPage";
import ArtistDashboardPage from "./pages/ArtistDashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/birth-info" element={<BirthInfoPage />} />
          <Route path="/mbti" element={<MbtiPage />} />
          <Route path="/art-taste" element={<ArtTastePage />} />
          <Route path="/art-dna" element={<ArtDnaCardPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/saju" element={<SajuPage />} />
          <Route path="/coin-shop" element={<CoinShopPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
          <Route path="/purchase" element={<PurchaseFlowPage />} />
          <Route path="/rental" element={<RentalFlowPage />} />
          <Route path="/saju-chat" element={<SajuChatPage />} />
          <Route path="/artist/:id" element={<ArtistProfilePage />} />
          <Route path="/artist-register" element={<ArtistRegisterPage />} />
          <Route path="/artwork-upload" element={<ArtworkUploadPage />} />
          <Route path="/artist-dashboard" element={<ArtistDashboardPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
