// Mimic typical user requests to an LLM
export const USER_REQUEST_TYPES = [
  'Write a short email to',
  'Explain how to',
  'Give me ideas for',
  'Help me brainstorm',
  'Create a simple',
  'Summarize the main points about',
  'Write a function that',
  'Suggest ways to improve',
];

export function getRandomRequestType(): string {
  return USER_REQUEST_TYPES[Math.floor(Math.random() * USER_REQUEST_TYPES.length)];
}

export function generateDistinctPrompts(): [string, string, string] {
  const contexts = [
    'Casual logic / concept',
    'Ask explaination for an abbriviation',
    'Everyday facts',
    'General common knowledge'
  ];

  const shuffled = [...contexts].sort(() => Math.random() - 0.5);
  const requestTypes = [...USER_REQUEST_TYPES].sort(() => Math.random() - 0.5);

  return [
    `${requestTypes[0]} ${shuffled[0]}`,
    `${requestTypes[1]} ${shuffled[1]}`,
    `${requestTypes[2]} ${shuffled[2]}`,
  ];
}
