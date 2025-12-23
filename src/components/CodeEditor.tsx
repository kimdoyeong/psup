interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-sm text-gray-400 mb-2">코드 (리뷰용)</div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="리뷰받을 코드를 붙여넣으세요..."
        className="flex-1 w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
        spellCheck={false}
      />
    </div>
  );
}
