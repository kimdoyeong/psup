import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Problem } from "../types";

export function useProblem() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = async (problemId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<Problem>("fetch_problem", {
        problemId,
      });
      setProblem(result);
    } catch (e) {
      setError(e as string);
      setProblem(null);
    } finally {
      setLoading(false);
    }
  };

  return { problem, loading, error, fetchProblem };
}
