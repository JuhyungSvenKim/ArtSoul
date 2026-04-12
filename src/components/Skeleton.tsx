/** 로딩 스켈레톤 컴포넌트 */

export function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted/30 rounded-lg ${className}`} />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted/30 rounded h-3" style={{ width: i === lines - 1 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-pulse">
      <div className="bg-muted/30 rounded-lg h-32 w-full" />
      <div className="bg-muted/30 rounded h-4 w-3/4" />
      <div className="bg-muted/30 rounded h-3 w-1/2" />
    </div>
  );
}

export function SkeletonArtGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] bg-muted/30 rounded-xl mb-2" />
          <div className="bg-muted/30 rounded h-3 w-3/4 mb-1" />
          <div className="bg-muted/30 rounded h-2.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSajuPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-muted/30 rounded-xl h-24" />
      <div className="bg-muted/30 rounded-xl h-16" />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-1">
            <div className="bg-muted/30 rounded-lg h-20" />
            <div className="bg-muted/30 rounded-lg h-20" />
          </div>
        ))}
      </div>
      <div className="bg-muted/30 rounded-xl h-32" />
    </div>
  );
}
