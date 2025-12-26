import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
// 타입 정의
import type { ChatMessage, Problem } from "../types";
// 타입 정의
import type { Settings } from "./useSettings";

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

// 함수/상수
export function useChat(settings: Settings, problem: Problem | null, onApiKeyError?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const sessionIdRef = useRef<string>("");
  const currentProblemIdRef = useRef<string | null>(null);

  // 상태 관리 함수
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

  // 상태 관리 함수
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

  // 상태 관리 함수
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

  // 상태 관리 함수
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

  // 상태 관리 함수
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
     if (!settings.apiKey || !problem) return;
 
     const displayContent = userCode
       ? `${content}\n\n\`\`\`\n${userCode}\n\`\`\``
       : content;
     const userMessage: ChatMessage = { role: "user", content: displayContent };
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
              content: `${buildContext()}\\n\\n${m.content}`,
            };
          }
          return m;
        });
 
       const fullResponse = await invoke<string>("chat_with_ai_stream", {
         apiKey: settings.apiKey,
         model: settings.model,
         messages: contextedMessages,
         systemPrompt: settings.customPrompt,
         sessionId,
       });
 
       const finalMessages = newMessages.concat([
         { role: "assistant", content: fullResponse },
       ]);
       setMessages(finalMessages);
       await saveChat(problem.id, finalMessages);
     } catch (e) {
       const errorStr = String(e);
       const isApiKeyInvalid = errorStr.includes("API_KEY_INVALID") || errorStr.includes("API key not valid");
       
       if (isApiKeyInvalid) {
         setMessages(newMessages);
         onApiKeyError?.();
       } else {
         const errorMessages = newMessages.concat([
           { role: "assistant", content: `오류: ${e}` },
         ]);
         setMessages(errorMessages);
       }
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
