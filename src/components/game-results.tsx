import { Badge } from '@/components/ui/badge';

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

function getScoreMessage(score: number): string {
  if (score < 50) {
    return '🔻 You may be deprecated';
  } else if (score <= 80) {
    return '📚 You will be trained more';
  } else {
    return '✨ You are a good AI model';
  }
}

export function GameResults({ score }: GameResultsProps) {
  return (
    <div className="space-y-6">
      {/* Score Message */}
      <div className="text-center">
        <p className="text-2xl font-bold mb-4">{getScoreMessage(score.totalScore)}</p>
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {score.totalScore}
          <span className="text-2xl text-gray-500">/100</span>
        </div>
        <p className="text-sm text-gray-500">Your Score</p>
      </div>

      {/* Analysis */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 text-sm text-gray-700">Analysis</h3>
        <p className="text-sm text-gray-600">{score.analysis}</p>
      </div>

      {/* The Distractors */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">The Distractors:</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Badge variant="default" className="bg-green-600 shrink-0 w-[75px]">
              Real
            </Badge>
            <p className="text-sm text-gray-700">{score.realQuestion}</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Badge variant="outline" className="shrink-0 w-[75px]">Distractor</Badge>
            <p className="text-sm text-gray-600">{score.fakeQuestionA}</p>
          </div>
          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <Badge variant="outline" className="shrink-0 w-[75px]">Distractor</Badge>
            <p className="text-sm text-gray-600">{score.fakeQuestionB}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
