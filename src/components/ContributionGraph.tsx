import { ActivityCalendar } from "react-activity-calendar";
import type { ActivityData } from "../types";

interface ContributionGraphProps {
  data: ActivityData[];
}

export function ContributionGraph({ data }: ContributionGraphProps) {
  const theme = {
    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
    light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  };

  // react-activity-calendar requires at least one data point
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
          문제 풀이 기록
        </h3>
        <div className="text-xs text-gray-600 text-center py-4">
          아직 기록이 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
        문제 풀이 기록
      </h3>
      <div className="flex justify-center w-full overflow-hidden">
        <ActivityCalendar
          data={data}
          theme={theme}
          colorScheme="dark"
          blockSize={10}
          blockMargin={4}
          fontSize={12}
          showWeekdayLabels={false}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
