export interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color }: BadgeProps) {
  const style = color
    ? { backgroundColor: color, color: "#fff" }
    : undefined;

  return (
    <span
      style={style}
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        color ? "" : "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}
