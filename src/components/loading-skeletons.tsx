export function ChatSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="flex justify-end">
        <div className="w-3/4 h-16 bg-gray-200 rounded-2xl rounded-tr-sm" />
      </div>
      <div className="flex justify-start">
        <div className="w-2/3 h-20 bg-gray-200 rounded-2xl rounded-tl-sm" />
      </div>
      <div className="flex justify-start">
        <div className="w-1/2 h-12 bg-gray-200 rounded-2xl rounded-tl-sm" />
      </div>
    </div>
  );
}

export function WordChoicesSkeleton() {
  return (
    <div className="border-t bg-gray-50 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
