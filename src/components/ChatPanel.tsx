import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  streamingContent: string;
  onSendMessage: (content: string) => void;
  onClear: () => void;
}

export function ChatPanel({
  messages,
  loading,
  streamingContent,
  onSendMessage,
  onClear,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-2">
        <div className="text-sm font-medium text-gray-300">AI 튜터</div>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          대화 초기화
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            AI에게 질문해보세요
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isLastAssistant =
              msg.role === "assistant" && idx === messages.length - 1;
            const displayContent =
              isLastAssistant && loading && streamingContent
                ? streamingContent
                : msg.content;

            if (msg.role === "assistant" && !displayContent && !loading) {
              return null;
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-900/50 ml-8"
                    : "bg-gray-800 mr-8"
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {msg.role === "user" ? "나" : "AI"}
                </div>
                <div className="text-gray-200">
                  <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-code:text-blue-300 prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{displayContent}</ReactMarkdown>
                  </div>
                  {isLastAssistant && loading && (
                    <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
        {loading && !streamingContent && messages.length > 0 && (
          <div className="bg-gray-800 p-3 rounded-lg mr-8">
            <div className="text-xs text-gray-500 mb-1">AI</div>
            <div className="text-gray-400">생각 중...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          전송
        </button>
      </form>
    </div>
  );
}
