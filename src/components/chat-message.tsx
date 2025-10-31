'use client';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] bg-black text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-[15px] leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
        <p className="text-[15px] leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-1 h-4 ml-1 bg-gray-400 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
