'use client';

interface UserReactionProps {
  reaction: 'appreciation' | 'dislike' | 'confused';
}

export function UserReaction({ reaction }: UserReactionProps) {
  const reactions = {
    appreciation: {
      emoji: '👍',
      texts: ['Thanks!', 'Great!', 'Perfect!', 'Got it!', 'Awesome!'],
    },
    dislike: {
      emoji: '👎',
      texts: ['Hmm...', 'Not quite...', 'Really?', 'Ugh...', 'Nah...'],
    },
    confused: {
      emoji: '🤔',
      texts: ['Wait what?', 'Huh?', 'Confused...', 'What??', 'Umm...'],
    },
  };

  const selected = reactions[reaction];
  const text = selected.texts[Math.floor(Math.random() * selected.texts.length)];

  return (
    <div className="flex justify-end mb-4 animate-in slide-in-from-right duration-300">
      <div className="bg-gray-200 text-gray-700 rounded-2xl rounded-tr-sm px-4 py-2 text-sm">
        <span className="mr-1.5">{selected.emoji}</span>
        {text}
      </div>
    </div>
  );
}
