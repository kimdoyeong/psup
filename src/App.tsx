import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProblemInput } from "./components/ProblemInput";
import { ProblemView } from "./components/ProblemView";
import { ChatPanel } from "./components/ChatPanel";
import { CodeEditor } from "./components/CodeEditor";
import { Settings } from "./components/Settings";
import { HistorySidebar } from "./components/HistorySidebar";
import { useProblem } from "./hooks/useProblem";
import { useChat } from "./hooks/useChat";
import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import "./App.css";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [userCode, setUserCode] = useState("");
  const [isSolvedToday, setIsSolvedToday] = useState(false);

  const { settings, models, loadingModels, saveSettings, clearSettings, fetchModels, DEFAULT_PROMPT } = useSettings();
  const { problem, loading: problemLoading, error, fetchProblem } = useProblem();
  const { problems, activityData, loading: historyLoading, refreshHistory, deleteProblem } = useHistory();
  const {
    messages,
    loading: chatLoading,
    sendMessage,
    clearMessages,
    streamingContent,
  } = useChat(settings, problem);

  useEffect(() => {
    const checkSolved = async () => {
      if (problem?.id) {
        try {
          const solved = await invoke<boolean>("is_solved_today", { problemId: problem.id });
          setIsSolvedToday(solved);
        } catch {
          setIsSolvedToday(false);
        }
      } else {
        setIsSolvedToday(false);
      }
    };
    checkSolved();
  }, [problem?.id]);

  const handleSendMessage = (content: string) => {
    sendMessage(content, userCode || undefined);
  };

  const handleSelectProblem = async (id: string) => {
    await fetchProblem(id);
    refreshHistory();
  };

  const handleMarkSolved = async () => {
    if (!problem) return;
    try {
      await invoke("record_solve", { problemId: problem.id });
      setIsSolvedToday(true);
      refreshHistory();
    } catch (e) {
      console.error("Failed to record solve:", e);
    }
  };

  const handleUnmarkSolved = async () => {
    if (!problem) return;
    try {
      await invoke("unrecord_solve", { problemId: problem.id });
      setIsSolvedToday(false);
      refreshHistory();
    } catch (e) {
      console.error("Failed to unrecord solve:", e);
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 z-10">
        <h1 className="text-xl font-bold">PSUP</h1>
        <button
          onClick={() => setShowSettings(true)}
          className={`p-2 rounded-lg transition-colors ${
            settings.apiKey ? "text-green-400 hover:bg-gray-800" : "text-yellow-400 hover:bg-gray-800"
          }`}
          title={settings.apiKey ? "API 키 설정됨" : "API 키 필요"}
        >
          <SettingsIcon />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <HistorySidebar
          problems={problems}
          activityData={activityData}
          onSelectProblem={handleSelectProblem}
          onDeleteProblem={deleteProblem}
          loading={historyLoading}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-6 py-4 border-b border-gray-800">
            <ProblemInput onSubmit={handleSelectProblem} loading={problemLoading} />
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-1/2 border-r border-gray-800 overflow-hidden">
              <ProblemView 
                problem={problem} 
                loading={problemLoading} 
                error={error} 
                isSolvedToday={isSolvedToday}
                onMarkSolved={handleMarkSolved}
                onUnmarkSolved={handleUnmarkSolved}
              />
            </div>

            <div className="w-1/2 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-hidden mb-4">
                <ChatPanel
                  messages={messages}
                  loading={chatLoading}
                  streamingContent={streamingContent}
                  onSendMessage={handleSendMessage}
                  onClear={clearMessages}
                />
              </div>

              <div className="h-48">
                <CodeEditor code={userCode} onChange={setUserCode} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <Settings
          settings={settings}
          models={models}
          loadingModels={loadingModels}
          defaultPrompt={DEFAULT_PROMPT}
          onFetchModels={fetchModels}
          onSave={saveSettings}
          onClear={clearSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default App;
