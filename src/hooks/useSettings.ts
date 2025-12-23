import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const STORAGE_KEYS = {
  apiKey: "gemini_api_key",
  model: "gemini_model",
  customPrompt: "gemini_custom_prompt",
};

const DEFAULT_PROMPT = `당신은 알고리즘 문제 해결을 돕는 튜터입니다.

역할:
- 힌트 제공: 직접적인 답 대신 학생이 스스로 풀 수 있도록 유도
- 코드 리뷰: 제출된 코드 분석, 시간/공간 복잡도, 개선점 제안
- 테스트케이스: 엣지 케이스, 코너 케이스, 반례 생성

학생의 질문에 따라 적절한 도움을 제공하세요.`;

export const FALLBACK_MODELS = [
  { id: "gemini-3-pro-preview", name: "Gemini 3 Pro" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
];

export interface Settings {
  apiKey: string;
  model: string;
  customPrompt: string;
}

export interface AvailableModel {
  id: string;
  name: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    apiKey: "",
    model: "gemini-2.5-flash",
    customPrompt: DEFAULT_PROMPT,
  });
  const [models, setModels] = useState<AvailableModel[]>(FALLBACK_MODELS);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setSettings({
      apiKey: localStorage.getItem(STORAGE_KEYS.apiKey) ?? "",
      model: localStorage.getItem(STORAGE_KEYS.model) ?? "gemini-2.5-flash",
      customPrompt: localStorage.getItem(STORAGE_KEYS.customPrompt) ?? DEFAULT_PROMPT,
    });
  }, []);

  const fetchModels = async (apiKey: string) => {
    if (!apiKey) {
      setModels(FALLBACK_MODELS);
      return;
    }

    setLoadingModels(true);
    try {
      const response = await invoke<Array<{ name: string; display_name: string }>>(
        "get_available_models",
        { apiKey }
      );
      const mappedModels = response.map((m) => ({
        id: m.name,
        name: m.display_name,
      }));
      setModels(mappedModels);
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setModels(FALLBACK_MODELS);
    } finally {
      setLoadingModels(false);
    }
  };

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.apiKey, newSettings.apiKey);
    localStorage.setItem(STORAGE_KEYS.model, newSettings.model);
    localStorage.setItem(STORAGE_KEYS.customPrompt, newSettings.customPrompt);
  };

  const clearSettings = () => {
    const cleared = { apiKey: "", model: "gemini-2.5-flash", customPrompt: DEFAULT_PROMPT };
    setSettings(cleared);
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  return { settings, models, loadingModels, saveSettings, clearSettings, fetchModels, DEFAULT_PROMPT };
}
