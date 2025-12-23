import { useState, useEffect } from "react";
import type { Settings, AvailableModel } from "../hooks/useSettings";

interface SettingsProps {
  settings: Settings;
  models: AvailableModel[];
  loadingModels: boolean;
  defaultPrompt: string;
  onFetchModels: (apiKey: string) => void;
  onSave: (settings: Settings) => void;
  onClear: () => void;
  onClose: () => void;
}

export function Settings({
  settings,
  models,
  loadingModels,
  defaultPrompt,
  onFetchModels,
  onSave,
  onClear,
  onClose,
}: SettingsProps) {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [customPrompt, setCustomPrompt] = useState(settings.customPrompt);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setModel(settings.model);
    setCustomPrompt(settings.customPrompt);
  }, [settings]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    if (newKey && newKey !== settings.apiKey) {
      onFetchModels(newKey);
    }
  };

  const handleSave = () => {
    onSave({ apiKey, model, customPrompt });
    onClose();
  };

  const handleResetPrompt = () => {
    setCustomPrompt(defaultPrompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">설정</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="API 키를 입력하세요"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            API 키는 로컬 저장소에 저장됩니다
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            모델 선택 {loadingModels && <span className="text-blue-400 text-xs">(업데이트 중...)</span>}
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loadingModels}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.id})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400">
              시스템 프롬프트
            </label>
            <button
              onClick={handleResetPrompt}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              기본값으로 복원
            </button>
          </div>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end">
          {settings.apiKey && (
            <button
              onClick={() => {
                onClear();
                setApiKey("");
                setModel("gemini-2.5-flash");
                setCustomPrompt(defaultPrompt);
              }}
              className="px-4 py-2 text-red-400 hover:text-red-300"
            >
              초기화
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-300"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loadingModels}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
