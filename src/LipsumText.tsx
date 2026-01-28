import React from 'react';

interface LipsumTextProps {
  w: number; // number of words
  p: number; // number of paragraphs
}

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
  'est', 'laborum'
];

export const LipsumText: React.FC<LipsumTextProps> = ({ w: n, p }) => {
  // Generate words by cycling through the lorem words array
  const generateWords = (count: number): string[] => {
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
    }
    return words;
  };

  // Distribute words across paragraphs
  const wordsPerParagraph = Math.floor(n / p);
  const extraWords = n % p;
  const allWords = generateWords(n);

  const paragraphs: string[][] = [];
  let wordIndex = 0;

  for (let i = 0; i < p; i++) {
    const wordsInThisParagraph = wordsPerParagraph + (i < extraWords ? 1 : 0);
    paragraphs.push(allWords.slice(wordIndex, wordIndex + wordsInThisParagraph));
    wordIndex += wordsInThisParagraph;
  }

  // Capitalize first word of each paragraph and add period at the end
  const formatParagraph = (words: string[]): string => {
    if (words.length === 0) return '';
    const capitalized = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    return capitalized + ' ' + words.slice(1).join(' ') + '.';
  };

  return (
    <>
      {paragraphs.map((words, index) => (
        <p key={index}>{formatParagraph(words)}</p>
      ))}
    </>
  );
};

