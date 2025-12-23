import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ChatMessage, Problem } from "../types";

interface StreamChunk {
  text: string;
  done: boolean;
}

interface ChatRecord {
  id: number;
  problem_id: string;
  messages_json: string;
  created_at: string;
  updated_at: string;
}

const SYSTEM_PROMPT = `당신은 알고리즘 문제 해결을 돕는 튜터입니다.

역할:
- 힌트 제공: 직접적인 답 대신 학생이 스스로 풀 수 있도록 유도
- 코드 리뷰: 제출된 코드 분석, 시간/공간 복잡도, 개선점 제안
- 테스트케이스: 엣지 케이스, 코너 케이스, 반례 생성

학생의 질문에 따라 적절한 도움을 제공하세요.`;

export function useChat(apiKey: string, problem: Problem | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const sessionIdRef = useRef<string>("");
  const currentProblemIdRef = useRef<string | null>(null);

  const loadChat = useCallback(async (problemId: string) => {
    console.log("[useChat] loadChat called with problemId:", problemId);
    try {
      const chat = await invoke<ChatRecord | null>("get_chat_by_problem", {
        problemId,
      });
      console.log("[useChat] loaded chat:", chat);
      if (chat && chat.messages_json) {
        const parsed = JSON.parse(chat.messages_json) as ChatMessage[];
        console.log("[useChat] parsed messages:", parsed);
        setMessages(parsed);
      } else {
        console.log("[useChat] no chat found, clearing messages");
        setMessages([]);
      }
    } catch (e) {
      console.error("[useChat] Failed to load chat:", e);
      setMessages([]);
    }
  }, []);

  const saveChat = useCallback(async (problemId: string, msgs: ChatMessage[]) => {
    console.log("[useChat] saveChat called:", problemId, msgs);
    try {
      await invoke("save_chat", {
        problemId,
        messagesJson: JSON.stringify(msgs),
      });
      console.log("[useChat] chat saved successfully");
    } catch (e) {
      console.error("[useChat] Failed to save chat:", e);
    }
  }, []);

  useEffect(() => {
    console.log("[useChat] problem changed:", problem?.id, "current ref:", currentProblemIdRef.current);
    if (problem?.id !== currentProblemIdRef.current) {
      currentProblemIdRef.current = problem?.id ?? null;
      setStreamingContent("");
      
      if (problem?.id) {
        loadChat(problem.id);
      } else {
        setMessages([]);
      }
    }
  }, [problem?.id, loadChat]);

  const buildContext = useCallback(
    (userCode?: string) => {
      if (!problem) return "";
      let context = `[문제 정보]
제목: ${problem.title} (${problem.id}번)
제한: ${problem.time_limit}, ${problem.memory_limit}

[문제 설명]
${problem.description}

[입력]
${problem.input_description}

[출력]
${problem.output_description}

[예제]
${problem.samples.map((s, i) => `예제 ${i + 1}:\n입력:\n${s.input}\n출력:\n${s.output}`).join("\n\n")}`;

      if (userCode) {
        context += `\n\n[사용자 코드]\n${userCode}`;
      }
      return context;
    },
    [problem]
  );

  useEffect(() => {
    if (!sessionIdRef.current) return;

    const eventName = `chat-stream-${sessionIdRef.current}`;
    let unlistenFn: (() => void) | undefined;

    listen<StreamChunk>(eventName, (event) => {
      const { text, done } = event.payload;
      if (done) {
        setMessages((prev) => {
          const updated = prev.map((m, i) =>
            i === prev.length - 1 && m.role === "assistant" && m.content === ""
              ? { ...m, content: streamingContent + text }
              : m
          );
          if (problem?.id) {
            saveChat(problem.id, updated);
          }
          return updated;
        });
        setStreamingContent("");
        setLoading(false);
        sessionIdRef.current = "";
      } else {
        setStreamingContent((prev) => prev + text);
      }
    }).then((fn) => {
      unlistenFn = fn;
    });

    return () => {
      unlistenFn?.();
    };
  }, [sessionIdRef.current, streamingContent, problem?.id, saveChat]);

  const sendMessage = async (content: string, userCode?: string) => {
    if (!apiKey || !problem) return;

    const userMessage: ChatMessage = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setLoading(true);
    setStreamingContent("");

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;

    try {
      const contextedMessages = newMessages.map((m, i) => {
        if (i === 0) {
          return {
            ...m,
            content: `${buildContext(userCode)}\n\n${m.content}`,
          };
        }
        return m;
      });

      const fullResponse = await invoke<string>("chat_with_ai_stream", {
        apiKey,
        messages: contextedMessages,
        systemPrompt: SYSTEM_PROMPT,
        sessionId,
      });

      const finalMessages = newMessages.concat([
        { role: "assistant", content: fullResponse },
      ]);
      setMessages(finalMessages);
      await saveChat(problem.id, finalMessages);
    } catch (e) {
      const errorMessages = newMessages.concat([
        { role: "assistant", content: `오류: ${e}` },
      ]);
      setMessages(errorMessages);
    } finally {
      setLoading(false);
      sessionIdRef.current = "";
    }
  };

  const clearMessages = async () => {
    setMessages([]);
    setStreamingContent("");
    if (problem?.id) {
      await saveChat(problem.id, []);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    clearMessages,
    streamingContent,
  };
}
