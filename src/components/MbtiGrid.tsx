const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MbtiType = typeof MBTI_TYPES[number];

interface MbtiGridProps {
  selected: MbtiType | null;
  onSelect: (type: MbtiType) => void;
}

const MbtiGrid = ({ selected, onSelect }: MbtiGridProps) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      {MBTI_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            selected === type
              ? "bg-primary text-primary-foreground glow-gold"
              : "bg-surface border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
};

export default MbtiGrid;
