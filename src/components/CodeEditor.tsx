import { useState } from "react";
import Editor from "@monaco-editor/react";

const LANGUAGES = [
  { id: "python", name: "Python" },
  { id: "cpp", name: "C++" },
  { id: "c", name: "C" },
  { id: "java", name: "Java" },
  { id: "javascript", name: "JavaScript" },
  { id: "typescript", name: "TypeScript" },
  { id: "go", name: "Go" },
  { id: "rust", name: "Rust" },
  { id: "kotlin", name: "Kotlin" },
  { id: "swift", name: "Swift" },
];

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  const [language, setLanguage] = useState("python");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">코드 (리뷰용)</div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 rounded-lg overflow-hidden border border-gray-700">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
