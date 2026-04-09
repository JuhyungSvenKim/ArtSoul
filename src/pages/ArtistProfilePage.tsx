import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, UserPlus, UserCheck, MessageCircle } from "lucide-react";

const MOCK_ARTIST = {
  name: "김민수",
  avatar: "🧑‍🎨",
  bio: "한국화를 기반으로 자연의 고요함과 에너지를 담아내는 작업을 하고 있습니다. 전통 수묵의 여백과 현대적 감성을 결합하여, 보는 이에게 내면의 평화를 전달하고자 합니다.",
  followers: 1247,
  works: 24,
  exhibitions: 8,
  ohaengStyle: "木 · 水",
};

const MOCK_ARTWORKS = [
  { id: "1", title: "청산유수", emoji: "🏔️", price: 1800000 },
  { id: "2", title: "묵란도", emoji: "🎋", price: 1200000 },
  { id: "3", title: "월하독작", emoji: "🌕", price: 2200000 },
  { id: "4", title: "송림청풍", emoji: "🌲", price: 950000 },
  { id: "5", title: "운해", emoji: "☁️", price: 1500000 },
  { id: "6", title: "설경", emoji: "❄️", price: 1700000 },
];

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(false);
  const artist = MOCK_ARTIST;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        {/* Header */}
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
            <p className="text-xs text-primary mt-1">{artist.ohaengStyle}</p>

            <div className="flex items-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{artist.works}</p>
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
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                  isFollowing
                    ? "bg-surface border border-border text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
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

          {/* Artworks Grid */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">작품 ({artist.works})</p>
            <div className="grid grid-cols-2 gap-3">
              {MOCK_ARTWORKS.map((art) => (
                <button
                  key={art.id}
                  onClick={() => navigate(`/artwork/${art.id}`)}
                  className="text-left group"
                >
                  <div className="aspect-[3/4] rounded-xl bg-surface border border-border flex items-center justify-center text-4xl group-hover:border-primary/30 transition-colors">
                    {art.emoji}
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
