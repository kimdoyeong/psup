import type { Problem } from "../types";

interface ProblemViewProps {
  problem: Problem | null;
  loading: boolean;
  error: string | null;
  isSolvedToday?: boolean;
  onMarkSolved?: () => void;
  onUnmarkSolved?: () => void;
}

export function ProblemView({ problem, loading, error, isSolvedToday, onMarkSolved, onUnmarkSolved }: ProblemViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        {error}
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        문제 번호를 입력하고 불러오기를 눌러주세요
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            {problem.id}번: {problem.title}
          </h2>
          <div className="flex gap-4 text-sm text-gray-400">
            <span>시간 제한: {problem.time_limit}</span>
            <span>메모리 제한: {problem.memory_limit}</span>
          </div>
        </div>
        {(onMarkSolved || onUnmarkSolved) && (
          <button
            onClick={isSolvedToday ? onUnmarkSolved : onMarkSolved}
            className={`px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              isSolvedToday 
                ? "bg-gray-600 hover:bg-gray-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSolvedToday ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                취소
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                풀었어요
              </>
            )}
          </button>
        )}
      </div>

      <Section title="문제">{problem.description}</Section>
      <Section title="입력">{problem.input_description}</Section>
      <Section title="출력">{problem.output_description}</Section>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">예제</h3>
        <div className="space-y-4">
          {problem.samples.map((sample, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-4">
              <SampleBox title={`입력 ${idx + 1}`} content={sample.input} />
              <SampleBox title={`출력 ${idx + 1}`} content={sample.output} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function SampleBox({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <pre className="bg-gray-800 p-3 rounded-lg text-gray-200 text-sm font-mono overflow-x-auto">
        {content}
      </pre>
    </div>
  );
}
