import { useState, useEffect } from "react";

const STORAGE_KEY = "gemini_api_key";

export function useApiKey() {
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(STORAGE_KEY, key);
  };

  const clearApiKey = () => {
    setApiKey("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return { apiKey, saveApiKey, clearApiKey };
}
