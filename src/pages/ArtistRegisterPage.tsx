import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, User, FileText, Landmark, CheckCircle2 } from "lucide-react";

const ArtistRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: intro, 1: PASS인증, 2: 정보입력, 3: 완료
  const [passVerified, setPassVerified] = useState(false);
  const [form, setForm] = useState({ artistName: "", bio: "", bankName: "", accountNumber: "", accountHolder: "" });

  const canSubmit = form.artistName && form.bio && form.bankName && form.accountNumber && form.accountHolder;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="max-w-5xl mx-auto w-full flex flex-col px-6 py-8 pt-20 lg:px-12">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-display font-semibold text-foreground">작가 등록</h1>
        </div>

        <div className="flex-1 px-5 pb-32 overflow-y-auto">
          {/* Step 0: Intro */}
          {step === 0 && (
            <div className="flex flex-col items-center text-center py-10 space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-foreground">작가로 활동하기</h2>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
                  작가 등록을 하면 작품을 업로드하고<br />판매 및 렌탈 수익을 얻을 수 있습니다.
                </p>
              </div>
              <div className="w-full space-y-3 text-left">
                {[
                  { icon: ShieldCheck, label: "본인 인증", desc: "PASS 인증으로 본인 확인" },
                  { icon: FileText, label: "작가 정보 입력", desc: "활동명, 소개, 정산 계좌" },
                  { icon: CheckCircle2, label: "심사 후 승인", desc: "1~2일 내 심사 결과 안내" },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: PASS 인증 */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center py-10 space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">본인 인증</h2>
                <p className="text-xs text-muted-foreground mt-1">PASS 앱으로 본인 인증을 진행합니다</p>
              </div>
              {!passVerified ? (
                <button
                  onClick={() => setPassVerified(true)}
                  className="w-full max-w-xs py-3.5 rounded-xl bg-[#4B6BFB] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  PASS 인증하기
                </button>
              ) : (
                <div className="bg-card border border-primary/30 rounded-xl p-4 w-full max-w-xs flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">인증 완료</p>
                    <p className="text-[10px] text-muted-foreground">홍길동 · 1990.01.01</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Info Input */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> 작가 활동명
                </label>
                <input
                  value={form.artistName}
                  onChange={(e) => setForm({ ...form, artistName: e.target.value })}
                  placeholder="활동명을 입력하세요"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> 소개
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="작가 소개를 입력하세요 (최대 500자)"
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-1">{form.bio.length}/500</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-primary" /> 정산 계좌
                </p>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground focus:border-primary/50 focus:outline-none appearance-none"
                >
                  <option value="">은행 선택</option>
                  {["국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "카카오뱅크", "토스뱅크"].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <input
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="계좌번호"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
                <input
                  value={form.accountHolder}
                  onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                  placeholder="예금주"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center py-12 space-y-5">
              <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">신청이 완료되었습니다</h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  심사 결과는 1~2일 내로<br />알림으로 안내드리겠습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/90 backdrop-blur-xl border-t border-border px-5 py-3 pb-[env(safe-area-inset-bottom,12px)] z-50">
          {step === 0 && (
            <button onClick={() => setStep(1)} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]">
              시작하기
            </button>
          )}
          {step === 1 && (
            <button onClick={() => setStep(2)} disabled={!passVerified} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-transform active:scale-[0.98]">
              다음
            </button>
          )}
          {step === 2 && (
            <button onClick={() => setStep(3)} disabled={!canSubmit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-transform active:scale-[0.98]">
              신청하기
            </button>
          )}
          {step === 3 && (
            <button onClick={() => navigate("/my")} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-transform active:scale-[0.98]">
              마이페이지로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistRegisterPage;
