'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WordChoiceButtonsProps {
  choices: string[];
  onSelect: (word: string) => void;
  disabled?: boolean;
}

export function WordChoiceButtons({
  choices,
  onSelect,
  disabled = false,
}: WordChoiceButtonsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {choices.map((word, index) => (
            <Button
              key={index}
              onClick={() => onSelect(word)}
              disabled={disabled}
              size="lg"
              variant={word === '[end]' ? 'destructive' : 'outline'}
              className={
                word === '[end]'
                  ? 'h-16 text-lg font-semibold'
                  : 'h-16 text-lg font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all'
              }
            >
              {word === '[end]' ? '🏁 End Response' : word}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
