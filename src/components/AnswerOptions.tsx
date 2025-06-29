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
          'w-full p-3 sm:p-4 rounded-apple border text-left transition-all apple-button ';

        if (showFeedback) {
          if (idx === correctIdx) {
            btnStyle += 'bg-apple-green text-white border-apple-green ';
          } else if (idx === selectedAnswer) {
            btnStyle += 'bg-apple-red text-white border-apple-red ';
          } else {
            btnStyle += 'bg-apple-light border-apple-border text-apple-secondary ';
          }
        } else if (selectedAnswer === idx) {
          btnStyle += 'bg-apple-blue/10 border-apple-blue text-apple-blue ';
        } else {
          btnStyle += 'bg-apple-card border-apple-border text-apple-text hover:bg-apple-light ';
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
