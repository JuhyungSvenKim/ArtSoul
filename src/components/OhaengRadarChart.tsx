export interface OhaengScores {
  wood: number;  // 목
  fire: number;  // 화
  earth: number; // 토
  metal: number; // 금
  water: number; // 수
}

interface OhaengRadarChartProps {
  scores: OhaengScores;
}

const OhaengRadarChart = ({ scores }: OhaengRadarChartProps) => {
  const labels = [
    { key: "wood" as const, label: "木", color: "#4CAF50" },
    { key: "fire" as const, label: "火", color: "#FF5722" },
    { key: "earth" as const, label: "土", color: "#FFC107" },
    { key: "metal" as const, label: "金", color: "#9E9E9E" },
    { key: "water" as const, label: "水", color: "#2196F3" },
  ];

  const cx = 100, cy = 100, r = 70;
  const angleStep = (2 * Math.PI) / 5;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const dist = (value / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const dataPoints = labels.map((l, i) => getPoint(i, scores[l.key]));
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {/* Grid circles */}
        {[25, 50, 75, 100].map(pct => {
          const pts = labels.map((_, i) => getPoint(i, pct));
          return (
            <polygon
              key={pct}
              points={pts.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="hsl(240, 15%, 22%)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Axes */}
        {labels.map((_, i) => {
          const p = getPoint(i, 100);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(240, 15%, 22%)" strokeWidth="0.5" />;
        })}

        {/* Data polygon */}
        <polygon
          points={polygon}
          fill="hsl(40, 45%, 58%)"
          fillOpacity="0.2"
          stroke="hsl(40, 45%, 58%)"
          strokeWidth="1.5"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={labels[i].color} />
        ))}

        {/* Labels */}
        {labels.map((l, i) => {
          const p = getPoint(i, 120);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill={l.color} fontSize="14" fontWeight="600">
              {l.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default OhaengRadarChart;
