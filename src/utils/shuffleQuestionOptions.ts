import { Question } from '../types/quiz';

// ✅ Esportiamo il tipo
export interface ShuffledQuestion extends Question {
  shuffledOptions: string[];
  optionMapping: number[];
  reverseCorrectIndex?: number;    // per reverse
  originalQuestion?: Question;     // per sostituzione
}

export const shuffleQuestionOptions = (question: Question): ShuffledQuestion => {
  const optionIndices = [0, 1, 2, 3];
  const shuffledIndices = [...optionIndices].sort(() => Math.random() - 0.5);

  return {
    ...question,
    shuffledOptions: shuffledIndices.map(i => question.options[i]),
    optionMapping: shuffledIndices
  };
};
