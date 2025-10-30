'use client';

interface FakeInputProps {
  currentText: string;
  choices: string[];
  onSelectWord: (word: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  currentWordCount?: number;
}

export function FakeInput({ currentText, choices, onSelectWord, onSubmit, disabled, currentWordCount = 0 }: FakeInputProps) {
  const maxWords = parseInt(process.env.NEXT_PUBLIC_MAX_PATH_LENGTH || '12');
  const remainingWords = maxWords - currentWordCount;
  
  return (
    <div className="border-t bg-white sticky bottom-0">
      {/* Word choices - shown above input */}
      {choices.length > 0 && !disabled && (
        <div className="border-b bg-gray-50 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Choose the next word (up to {remainingWords} more word{remainingWords !== 1 ? 's' : ''}):
            </p>
            <div className="grid grid-cols-3 gap-2">
              {choices.map((word, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onSelectWord(word)}
                  disabled={disabled}
                  className="px-3 py-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fake input box */}
      <div className="px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-h-[44px] max-h-[200px] bg-gray-100 rounded-3xl px-4 py-2.5 overflow-y-auto">
              <p className="text-[15px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                {currentText || (
                  <span className="text-gray-400">Building your response...</span>
                )}
                {currentText && <span className="inline-block w-0.5 h-5 ml-0.5 bg-blue-600 animate-pulse" />}
              </p>
            </div>
            <button
              type="button"
              onClick={onSubmit}
              disabled={disabled || !currentText}
              className={
                disabled || !currentText
                  ? 'shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 cursor-not-allowed'
                  : 'shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white cursor-pointer transition-colors'
              }
              aria-label="Submit response"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Select words above to build your response • Click submit when ready
          </p>
        </div>
      </div>
    </div>
  );
}
