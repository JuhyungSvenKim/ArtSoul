interface GenderSelectProps {
  value: "male" | "female" | null;
  onChange: (v: "male" | "female") => void;
}

const GenderSelect = ({ value, onChange }: GenderSelectProps) => {
  const options: { key: "male" | "female"; label: string; icon: string }[] = [
    { key: "male", label: "남성", icon: "♂" },
    { key: "female", label: "여성", icon: "♀" },
  ];

  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            value === opt.key
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-muted-foreground hover:border-primary/40"
          }`}
        >
          <span className="text-lg mr-1">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default GenderSelect;
