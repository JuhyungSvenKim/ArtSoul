export interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : isCompleted
                    ? "bg-indigo-200 text-indigo-700"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step}
            </div>
            {step < total && (
              <div
                className={`h-0.5 w-6 ${
                  isCompleted ? "bg-indigo-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
