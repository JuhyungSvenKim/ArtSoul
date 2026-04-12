import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">😵</p>
            <h1 className="text-lg font-semibold text-foreground mb-2">앗, 문제가 생겼어요</h1>
            <p className="text-sm text-muted-foreground mb-4">{this.state.error || "페이지를 불러오는 중 오류가 발생했습니다"}</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
