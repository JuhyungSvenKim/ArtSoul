export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  color?: string;
  size?: "sm" | "md";
}

const sizeClasses: Record<NonNullable<ChipProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Chip({
  label,
  selected = false,
  onClick,
  color,
  size = "md",
}: ChipProps) {
  const baseStyle = color
    ? { backgroundColor: selected ? color : undefined, borderColor: color }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      style={baseStyle}
      className={`inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${sizeClasses[size]} ${
        selected
          ? color
            ? "text-white"
            : "border-indigo-600 bg-indigo-600 text-white"
          : color
            ? "bg-transparent"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
