import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
// 타입 정의
import type { ProblemRecord, ActivityData } from "../types";

// 함수/상수
export function useHistory() {
  const [problems, setProblems] = useState<ProblemRecord[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);

  // 상태 관리 함수
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedProblems, fetchedActivity] = await Promise.all([
        invoke<ProblemRecord[]>("get_all_problems"),
        invoke<ActivityData[]>("get_activity_data", { days: 365 }),
      ]);
      setProblems(fetchedProblems);
      setActivityData(fetchedActivity);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setProblems([]);
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 상태 관리 함수
  const deleteProblem = useCallback(async (problemId: string) => {
    try {
      await invoke("delete_problem", { problemId });
      setProblems((prev) => prev.filter((p) => p.problem_id !== problemId));
    } catch (error) {
      console.error("Failed to delete problem:", error);
    }
  }, []);

  // 상태 관리 함수
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { problems, activityData, loading, refreshHistory: fetchHistory, deleteProblem };
}
