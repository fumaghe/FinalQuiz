import React from 'react';
import { ShuffledQuestion } from '../utils/shuffleQuestionOptions';

interface AnswerOptionsProps {
  shuffledQuestion: ShuffledQuestion;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onSelect: (idx: number) => void;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  shuffledQuestion,
  selectedAnswer,
  showFeedback,
  onSelect
}) => {
  const correctIdx = shuffledQuestion.optionMapping.indexOf(
    // @ts-ignore
    shuffledQuestion.correct
  );

  return (
    <div className="space-y-2 sm:space-y-3 px-4 sm:px-6">
      {shuffledQuestion.shuffledOptions.map((opt, idx) => {
        let btnStyle =
          'w-full p-3 sm:p-4 rounded-its border text-left transition-all its-button ';

        if (showFeedback) {
          if (idx === correctIdx) {
            btnStyle += 'bg-its-green text-white border-its-green ';
          } else if (idx === selectedAnswer) {
            btnStyle += 'bg-its-red-dark text-white border-its-red-dark ';
          } else {
            btnStyle += 'bg-its-light border-its-border text-its-secondary ';
          }
        } else if (selectedAnswer === idx) {
          btnStyle += 'bg-its-red/10 border-its-red text-its-red ';
        } else {
          btnStyle += 'bg-its-card border-its-border text-its-text hover:bg-its-light ';
        }

        return (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            disabled={showFeedback}
            className={btnStyle}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
              </div>
              <span className="text-sm sm:text-base">{opt}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
