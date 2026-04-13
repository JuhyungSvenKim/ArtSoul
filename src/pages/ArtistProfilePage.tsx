import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, UserPlus, UserCheck, MessageCircle } from "lucide-react";
import CaseCodeArt from "@/components/CaseCodeArt";
import type { OhaengElement, EnergyLevel, StyleCode } from "@/lib/case-code/types";

// 화가별 데이터 (ExplorePage의 SAMPLE_ARTISTS와 연동)
const ARTISTS_DB: Record<string, {
  name: string; avatar: string; bio: string; style: string; ohaeng: string; mbti: string;
  followers: number; exhibitions: number;
  artworks: { id: string; title: string; element: OhaengElement; energy: EnergyLevel; style: StyleCode; price: number }[];
}> = {
  a1: { name: "김수연", avatar: "🎨", bio: "자연의 숨결을 캔버스에 담는 작가. 산과 숲, 꽃과 바람의 미세한 떨림을 수채화와 유화로 표현합니다.", style: "자연주의 · 수채화", ohaeng: "목", mbti: "INFP", followers: 234, exhibitions: 5,
    artworks: [
      { id: "a1-1", title: "봄날의 숲", element: "W", energy: 2, style: "S1", price: 1200000 },
      { id: "a1-2", title: "대나무 바람", element: "W", energy: 3, style: "S2", price: 980000 },
      { id: "a1-3", title: "초록빛 정원", element: "W", energy: 1, style: "S3", price: 850000 },
      { id: "a1-4", title: "비 온 뒤 신록", element: "W", energy: 4, style: "S1", price: 1500000 },
    ]},
  a2: { name: "이도윤", avatar: "🔥", bio: "빛과 열정의 추상을 그리는 작가. 강렬한 색감과 대담한 붓터치로 감정의 폭발을 캔버스에 옮깁니다.", style: "표현주의 · 추상화", ohaeng: "화", mbti: "ENFJ", followers: 187, exhibitions: 3,
    artworks: [
      { id: "a2-1", title: "붉은 노을", element: "F", energy: 3, style: "S4", price: 1800000 },
      { id: "a2-2", title: "열정의 추상", element: "F", energy: 5, style: "S5", price: 2200000 },
      { id: "a2-3", title: "석양의 바다", element: "F", energy: 4, style: "S1", price: 1600000 },
    ]},
  a3: { name: "오현석", avatar: "🏺", bio: "전통과 현대의 경계를 허무는 작가. 한국 민화의 유머와 해학을 현대적 시선으로 재해석합니다.", style: "민화 · 현대미술", ohaeng: "토", mbti: "ISTJ", followers: 312, exhibitions: 7,
    artworks: [
      { id: "a3-1", title: "황토빛 언덕", element: "E", energy: 2, style: "S2", price: 950000 },
      { id: "a3-2", title: "전통 민화", element: "E", energy: 3, style: "S2", price: 1100000 },
      { id: "a3-3", title: "도자기 정물", element: "E", energy: 1, style: "S1", price: 780000 },
      { id: "a3-4", title: "가을 들판", element: "E", energy: 4, style: "S3", price: 1300000 },
    ]},
  a4: { name: "최하늘", avatar: "🪷", bio: "미니멀의 극치, 여백의 미를 추구하는 작가. 최소한의 선과 색으로 최대한의 감동을 전합니다.", style: "미니멀리즘 · 설치", ohaeng: "금", mbti: "INTJ", followers: 156, exhibitions: 4,
    artworks: [
      { id: "a4-1", title: "은빛 달밤", element: "M", energy: 1, style: "S3", price: 2500000 },
      { id: "a4-2", title: "미니멀 공간", element: "M", energy: 2, style: "S3", price: 1900000 },
      { id: "a4-3", title: "겨울 나무", element: "M", energy: 1, style: "S5", price: 3200000 },
    ]},
  a5: { name: "한지민", avatar: "🌊", bio: "물처럼 유연하고 깊은 감성의 작가. 수묵담채의 전통 기법에 몽환적 현대 감성을 더합니다.", style: "수묵담채 · 몽환", ohaeng: "수", mbti: "INFJ", followers: 278, exhibitions: 6,
    artworks: [
      { id: "a5-1", title: "바다의 노래", element: "A", energy: 4, style: "S2", price: 1400000 },
      { id: "a5-2", title: "비 오는 거리", element: "A", energy: 3, style: "S3", price: 1100000 },
      { id: "a5-3", title: "겨울 설경", element: "A", energy: 1, style: "S1", price: 1700000 },
      { id: "a5-4", title: "몽환의 호수", element: "A", energy: 2, style: "S5", price: 2800000 },
    ]},
  a6: { name: "박서연", avatar: "🌿", bio: "색채의 마법사. 자연의 아름다움을 인상주의적 시선으로 재해석하며, 빛의 변화를 섬세하게 포착합니다.", style: "인상주의 · 풍경화", ohaeng: "목", mbti: "ISFP", followers: 445, exhibitions: 9,
    artworks: [
      { id: "a6-1", title: "라벤더 들판", element: "W", energy: 2, style: "S1", price: 1350000 },
      { id: "a6-2", title: "아침 안개", element: "W", energy: 1, style: "S3", price: 1050000 },
      { id: "a6-3", title: "숲속 오솔길", element: "W", energy: 3, style: "S1", price: 1600000 },
    ]},
  a7: { name: "김태리", avatar: "💥", bio: "대담한 컨템포러리의 선두주자. 팝아트와 그래픽의 경계를 넘나들며 시대의 아이콘을 창조합니다.", style: "팝아트 · 그래픽", ohaeng: "화", mbti: "ENTP", followers: 523, exhibitions: 4,
    artworks: [
      { id: "a7-1", title: "네온 서울", element: "F", energy: 5, style: "S4", price: 2100000 },
      { id: "a7-2", title: "팝 드림", element: "F", energy: 4, style: "S4", price: 1800000 },
      { id: "a7-3", title: "도시의 맥박", element: "F", energy: 3, style: "S5", price: 2600000 },
    ]},
  a8: { name: "정은채", avatar: "☕", bio: "따뜻한 감성으로 일상을 그리는 작가. 소소한 행복의 순간을 부드러운 색감으로 담아냅니다.", style: "정물화 · 일러스트", ohaeng: "토", mbti: "ESFJ", followers: 198, exhibitions: 3,
    artworks: [
      { id: "a8-1", title: "오후의 카페", element: "E", energy: 2, style: "S3", price: 680000 },
      { id: "a8-2", title: "창가의 화분", element: "E", energy: 1, style: "S1", price: 750000 },
    ]},
  a9: { name: "이현석", avatar: "🖋️", bio: "동양의 선과 서양의 구도를 융합하는 작가. 수묵의 깊이와 건축의 구조미를 결합합니다.", style: "수묵 · 건축사진", ohaeng: "금", mbti: "ISTP", followers: 167, exhibitions: 5,
    artworks: [
      { id: "a9-1", title: "수묵 산수", element: "M", energy: 2, style: "S2", price: 1250000 },
      { id: "a9-2", title: "빛의 건축", element: "M", energy: 3, style: "S3", price: 1450000 },
    ]},
  a10: { name: "유재석", avatar: "🎎", bio: "한국 전통미를 현대적으로 재해석하는 작가. 도자기와 민화의 아름다움을 캔버스로 옮깁니다.", style: "민화 · 도자기", ohaeng: "토", mbti: "ESFP", followers: 289, exhibitions: 6,
    artworks: [
      { id: "a10-1", title: "달항아리", element: "E", energy: 1, style: "S2", price: 1800000 },
      { id: "a10-2", title: "십장생도", element: "E", energy: 3, style: "S2", price: 1350000 },
      { id: "a10-3", title: "모란 병풍", element: "E", energy: 5, style: "S5", price: 3500000 },
    ]},
};

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  const artist = ARTISTS_DB[id || ""] || ARTISTS_DB.a1;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">작가 프로필</h1>
        </div>

        <div className="px-5 space-y-5">
          {/* Artist Header */}
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-4xl mb-3">
              {artist.avatar}
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground">{artist.name}</h2>
            <p className="text-xs text-primary mt-1">{artist.ohaeng} · {artist.mbti}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{artist.style}</p>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{artist.artworks.length}</p>
                <p className="text-[10px] text-muted-foreground">작품</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{artist.followers.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">팔로워</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{artist.exhibitions}</p>
                <p className="text-[10px] text-muted-foreground">전시</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4 w-full max-w-xs">
              <button onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                  isFollowing ? "bg-surface border border-border text-muted-foreground" : "bg-primary text-primary-foreground"
                }`}>
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "팔로잉" : "팔로우"}
              </button>
              <button className="py-2.5 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> 문의
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground mb-2">소개</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{artist.bio}</p>
          </div>

          {/* Artworks Grid — AI 이미지 */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">작품 ({artist.artworks.length})</p>
            <div className="grid grid-cols-2 gap-3">
              {artist.artworks.map((art) => (
                <button key={art.id} onClick={() => navigate(`/artwork/${art.id}`)} className="text-left group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border group-hover:border-primary/30 transition-colors">
                    <CaseCodeArt element={art.element} energy={art.energy} style={art.style} />
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1.5 truncate">{art.title}</p>
                  <p className="text-[10px] text-primary">₩{art.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistProfilePage;
