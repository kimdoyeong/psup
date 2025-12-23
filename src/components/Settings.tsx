import { useState } from "react";

interface SettingsProps {
  apiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function Settings({ apiKey, onSave, onClear, onClose }: SettingsProps) {
  const [input, setInput] = useState(apiKey);

  const handleSave = () => {
    onSave(input);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">설정</h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Google Gemini API Key
          </label>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="API 키를 입력하세요"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            API 키는 로컬 저장소에 저장됩니다
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          {apiKey && (
            <button
              onClick={() => {
                onClear();
                setInput("");
              }}
              className="px-4 py-2 text-red-400 hover:text-red-300"
            >
              삭제
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
