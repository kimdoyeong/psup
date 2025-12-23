import { useState } from "react";

interface ProblemInputProps {
  onSubmit: (problemId: string) => void;
  loading: boolean;
}

export function ProblemInput({ onSubmit, loading }: ProblemInputProps) {
  const [problemId, setProblemId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problemId.trim()) {
      onSubmit(problemId.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={problemId}
        onChange={(e) => setProblemId(e.target.value)}
        placeholder="문제 번호 (예: 1000)"
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !problemId.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "불러오는 중..." : "불러오기"}
      </button>
    </form>
  );
}
