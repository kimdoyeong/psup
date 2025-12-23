import { useState, useEffect } from "react";
import type { ProblemRecord, ActivityData } from "../types";
import { ContributionGraph } from "./ContributionGraph";

const BREAKPOINT = 1024;

interface HistorySidebarProps {
  problems: ProblemRecord[];
  activityData: ActivityData[];
  onSelectProblem: (problemId: string) => void;
  onDeleteProblem: (problemId: string) => void;
  loading?: boolean;
}

export function HistorySidebar({
  problems,
  activityData,
  onSelectProblem,
  onDeleteProblem,
  loading = false,
}: HistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < BREAKPOINT) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDelete = (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation();
    onDeleteProblem(problemId);
  };

  return (
    <div
      className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 h-full ${
        isOpen ? "w-72" : "w-12"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {isOpen && <h2 className="text-sm font-bold text-gray-200">기록</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded hover:bg-gray-800 text-gray-400 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-700"
          aria-label={isOpen ? "사이드바 접기" : "사이드바 펼치기"}
        >
          {isOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {isOpen ? (
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="text-gray-500 text-xs text-center py-4 animate-pulse">
                로딩 중...
              </div>
            ) : problems.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-4">
                기록이 없습니다.
              </div>
            ) : (
              problems.map((problem) => (
                <div
                  key={problem.id}
                  className="relative group"
                >
                  <button
                    onClick={() => onSelectProblem(problem.problem_id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                        #{problem.problem_id}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(problem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 truncate group-hover:text-white font-medium">
                      {problem.title}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, problem.problem_id)}
                    className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 space-y-4">
          </div>
        )}
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <ContributionGraph data={activityData} />
        </div>
      )}
    </div>
  );
}
