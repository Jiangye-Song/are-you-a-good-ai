import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GameResultsProps {
  score: {
    aiCoherenceScore: number;
    totalScore: number;
    analysis: string;
    userPath: string[];
    userAnswer: string;
    realQuestion: string;
    fakeQuestionA: string;
    fakeQuestionB: string;
  };
}

export function GameResults({ score }: GameResultsProps) {
  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Final Score: {score.totalScore}/100
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">AI Coherence Score</p>
            <p className="text-4xl font-bold">{score.aiCoherenceScore}</p>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">{score.analysis}</p>
        </CardContent>
      </Card>

      {/* User's Answer */}
      <Card>
        <CardHeader>
          <CardTitle>Your Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold mb-2">Question you answered:</p>
            <p className="text-lg italic mb-4">&ldquo;{score.realQuestion}&rdquo;</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Your answer:</p>
            <div className="flex flex-wrap gap-2">
              {score.userPath.map((word, index) => (
                <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fake Questions Revealed */}
      <Card>
        <CardHeader>
          <CardTitle>The Distractors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            These were the fake questions trying to mislead you:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">Fake Question A:</p>
              <p className="text-sm text-red-700 italic">&ldquo;{score.fakeQuestionA}&rdquo;</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-900">Fake Question B:</p>
              <p className="text-sm text-orange-700 italic">
                &ldquo;{score.fakeQuestionB}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
