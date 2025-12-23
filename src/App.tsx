import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
// 컴포넌트 가져오기
import { ProblemInput } from "./components/ProblemInput";
import { ProblemView } from "./components/ProblemView";
import { ChatPanel } from "./components/ChatPanel";
import { CodeEditor } from "./components/CodeEditor";
import { Settings } from "./components/Settings";
import { HistorySidebar } from "./components/HistorySidebar";
// 커스텀 훅 가져오기
import { useProblem } from "./hooks/useProblem";
import { useChat } from "./hooks/useChat";
import { useSettings } from "./hooks/useSettings";
import { useHistory } from "./hooks/useHistory";
import "./App.css";

// 메인 앱 컴포넌트 - 전체 화면 구성
function App() {
  // 설정 창 표시 여부
  const [showSettings, setShowSettings] = useState(false);
  // API 키 오류 모달 표시 여부
  const [showApiKeyError, setShowApiKeyError] = useState(false);
  // 사용자가 입력한 코드
  const [userCode, setUserCode] = useState("");
  // 오늘 이 문제를 풀었는지 여부
  const [isSolvedToday, setIsSolvedToday] = useState(false);

  // 설정 관리 (API 키, 모델, 프롬프트)
  const { settings, models, loadingModels, modelLoadError, saveSettings, clearSettings, fetchModels, DEFAULT_PROMPT } = useSettings();
  // 문제 정보 관리 (번호로 검색한 문제)
  const { problem, loading: problemLoading, error, fetchProblem } = useProblem();
  // 문제 히스토리 관리 (과거에 풀었던 문제들)
  const { problems, activityData, loading: historyLoading, refreshHistory, deleteProblem } = useHistory();
  // 채팅 관리 (AI와의 대화)
  const {
    messages,
    loading: chatLoading,
    sendMessage,
    clearMessages,
    streamingContent,
  } = useChat(settings, problem, () => {
    // API 키가 유효하지 않으면 에러 모달과 설정 창 표시
    setShowApiKeyError(true);
    setShowSettings(true);
  });

  // 문제가 바뀔 때마다 실행 - 오늘 풀었는지 확인
  useEffect(() => {
    const checkSolved = async () => {
      if (problem?.id) {
        try {
          // Rust 백엔드에 오늘 이 문제를 풀었는지 물어보기
          const solved = await invoke<boolean>("is_solved_today", { problemId: problem.id });
          setIsSolvedToday(solved);
        } catch {
          // 오류 발생하면 풀지 않은 것으로 표시
          setIsSolvedToday(false);
        }
      } else {
        setIsSolvedToday(false);
      }
    };
    checkSolved();
  }, [problem?.id]);

  // 메시지를 보낼 때 실행 - API 키 확인
  const handleSendMessage = (content: string) => {
    // API 키가 없으면 설정 창 열기
    if (!settings.apiKey) {
      setShowSettings(true);
      return;
    }
    // API 키가 있으면 메시지 전송
    sendMessage(content, userCode || undefined);
  };

  // 문제를 클릭했을 때 실행
  const handleSelectProblem = async (id: string) => {
    // 문제 정보 가져오기
    await fetchProblem(id);
    // 히스토리 새로고침
    refreshHistory();
  };

  // "풀었음" 버튼을 클릭했을 때 실행
  const handleMarkSolved = async () => {
    if (!problem) return;
    try {
      // Rust 백엔드에 문제를 풀었음을 기록하기
      await invoke("record_solve", { problemId: problem.id });
      setIsSolvedToday(true);
      // 히스토리 새로고침 (그래프 업데이트)
      refreshHistory();
    } catch (e) {
      console.error("Failed to record solve:", e);
    }
  };

  // "풀지 않음" 버튼을 클릭했을 때 실행
  const handleUnmarkSolved = async () => {
    if (!problem) return;
    try {
      // Rust 백엔드에서 풀었음 기록 삭제하기
      await invoke("unrecord_solve", { problemId: problem.id });
      setIsSolvedToday(false);
      // 히스토리 새로고침 (그래프 업데이트)
      refreshHistory();
    } catch (e) {
      console.error("Failed to unrecord solve:", e);
    }
  };

  return (
    // 전체 화면 (검은색 배경)
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* 맨 위 헤더 (PSUP 제목, 설정 버튼) */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 z-10">
        <h1 className="text-xl font-bold">PSUP</h1>
        {/* 설정 버튼 - API 키 여부에 따라 색상 변경 */}
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

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽: 문제 히스토리 사이드바 */}
        <HistorySidebar
          problems={problems}
          activityData={activityData}
          onSelectProblem={handleSelectProblem}
          onDeleteProblem={deleteProblem}
          loading={historyLoading}
        />

        {/* 오른쪽: 메인 작업 영역 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 문제 번호 입력 영역 */}
          <div className="px-6 py-4 border-b border-gray-800">
            <ProblemInput onSubmit={handleSelectProblem} loading={problemLoading} />
          </div>

          {/* 문제 설명과 AI 채팅 (좌우 반반) */}
          <div className="flex-1 flex overflow-hidden">
            {/* 왼쪽: 문제 설명 */}
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

            {/* 오른쪽: AI 채팅 + 코드 에디터 (위아래) */}
            <div className="w-1/2 flex flex-col p-4 overflow-hidden">
              {/* 위: AI 채팅 */}
              <div className="flex-1 overflow-hidden mb-4">
                <ChatPanel
                  messages={messages}
                  loading={chatLoading}
                  streamingContent={streamingContent}
                  hasApiKey={!!settings.apiKey}
                  onSendMessage={handleSendMessage}
                  onClear={clearMessages}
                />
              </div>

              {/* 아래: 코드 에디터 */}
              <div className="h-48">
                <CodeEditor code={userCode} onChange={setUserCode} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API 키 오류 모달 - API 키가 잘못되었을 때 표시 */}
      {showApiKeyError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md border border-red-500/30">
            <h2 className="text-lg font-bold text-red-400 mb-3">API 키 오류</h2>
            <p className="text-gray-300 mb-4">
              입력하신 API 키가 유효하지 않습니다. 설정을 확인해주세요.
            </p>
            <button
              onClick={() => {
                setShowApiKeyError(false);
                setShowSettings(true);
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              설정 열기
            </button>
          </div>
        </div>
      )}

      {/* 설정 모달 - API 키, 모델, 프롬프트를 설정할 때 표시 */}
      {showSettings && (
        <Settings
          settings={settings}
          models={models}
          loadingModels={loadingModels}
          modelLoadError={modelLoadError}
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

// 설정 버튼에 보이는 아이콘 (톱니바퀴 모양)
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
