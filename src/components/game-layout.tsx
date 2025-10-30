import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GameLayoutProps {
  question: string;
  userPath: string[];
  children: React.ReactNode;
}

export function GameLayout({ question, userPath, children }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Question Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">{question}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              💡 Select words to build your response. Choose 🏁 End Response when you think
              it&apos;s complete.
            </p>
          </CardContent>
        </Card>

        {/* User's Path */}
        {userPath.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {userPath.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Game Content */}
        {children}
      </div>
    </div>
  );
}
