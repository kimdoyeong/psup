import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../types";

// ChatPanel에서 받을 정보들의 타입 정의
interface ChatPanelProps {
  // AI와의 대화 기록들
  messages: ChatMessage[];
  // AI가 응답 중인지 여부
  loading: boolean;
  // AI가 보내고 있는 텍스트 (스트리밍 중일 때)
  streamingContent: string;
  // API 키가 있는지 없는지
  hasApiKey: boolean;
  // 메시지를 보낼 때 실행할 함수
  onSendMessage: (content: string) => void;
  // 대화를 초기화할 때 실행할 함수
  onClear: () => void;
}

// AI 튜터와 대화하는 채팅 창 컴포넌트
export function ChatPanel({
  messages,
  loading,
  streamingContent,
  hasApiKey,
  onSendMessage,
  onClear,
}: ChatPanelProps) {
  // 사용자가 입력한 메시지 (아직 보내지 않은 상태)
  const [input, setInput] = useState("");
  // 맨 아래로 자동 스크롤하기 위한 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새로운 메시지가 나타나면 맨 아래로 자동으로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // "전송" 버튼을 클릭했을 때 실행
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 입력창에 텍스트가 있고, AI가 응답 중이 아니고, API 키가 있을 때만 전송
    if (input.trim() && !loading && hasApiKey) {
      onSendMessage(input.trim());
      // 입력창 비우기
      setInput("");
    }
  };

  return (
    // 전체 채팅 창
    <div className="flex flex-col h-full">
      {/* 위: AI 튜터 제목과 대화 초기화 버튼 */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
        <div className="text-sm font-medium text-gray-300">AI 튜터</div>
        {/* 대화 초기화 버튼 */}
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          대화 초기화
        </button>
      </div>

      {/* 가운데: 대화 기록 표시 영역 */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {/* API 키가 없으면 API 키 설정 메시지 표시 */}
        {!hasApiKey ? (
          <div className="text-center text-gray-400 mt-8">
            <p className="mb-2">🔑 API 키가 필요합니다</p>
            <p className="text-sm">상단의 설정 버튼에서 Google Gemini API 키를 입력해주세요.</p>
          </div>
        ) : messages.length === 0 ? (
          // API 키가 있지만 아직 대화가 없으면 안내 메시지
          <div className="text-center text-gray-500 mt-8">
            AI에게 질문해보세요
          </div>
        ) : (
          // 대화 기록이 있으면 모두 표시
          messages.map((msg, idx) => {
            // AI가 마지막으로 보낸 메시지인지 확인 (스트리밍 중인지 알기 위해)
            const isLastAssistant =
              msg.role === "assistant" && idx === messages.length - 1;
            // 스트리밍 중이면 실시간 텍스트 표시, 아니면 완성된 메시지 표시
            const displayContent =
              isLastAssistant && loading && streamingContent
                ? streamingContent
                : msg.content;

            // AI가 보낸 빈 메시지는 표시하지 않기
            if (msg.role === "assistant" && !displayContent && !loading) {
              return null;
            }

            return (
              <div
                key={idx}
                // 사용자 메시지는 파란색, AI 메시지는 회색
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-900/50 ml-8"
                    : "bg-gray-800 mr-8"
                }`}
              >
                {/* 사용자 또는 AI 표시 */}
                <div className="text-xs text-gray-500 mb-1">
                  {msg.role === "user" ? "나" : "AI"}
                </div>
                {/* 메시지 내용 표시 (마크다운 형식 지원) */}
                <div className="text-gray-200">
                  <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-code:text-blue-300 prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  </div>
                  {/* AI가 응답 중이면 깜빡이는 커서 표시 */}
                  {isLastAssistant && loading && (
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
        {/* AI가 응답 중인데 스트리밍이 시작되지 않았으면 "생각 중..." 표시 */}
        {loading && !streamingContent && messages.length > 0 && (
          <div className="bg-gray-800 p-3 rounded-lg mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <div className="text-gray-400">생각 중...</div>
          </div>
        )}
        {/* 자동 스크롤을 위한 참조점 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 아래: 메시지 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* 메시지 입력 창 */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hasApiKey ? "메시지를 입력하세요..." : "API 키를 먼저 설정해주세요..."}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          // API 키가 없거나 AI가 응답 중이면 입력 불가
          disabled={loading || !hasApiKey}
        />
        {/* 전송 버튼 */}
        <button
          type="submit"
          // API 키가 없거나, 입력창이 비어있거나, AI가 응답 중이면 버튼 비활성화
          disabled={loading || !input.trim() || !hasApiKey}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  );
}
