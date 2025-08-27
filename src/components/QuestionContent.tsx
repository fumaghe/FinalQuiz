import React from 'react';
import { Globe, RefreshCw } from 'lucide-react';
import { ShuffledQuestion } from '../utils/shuffleQuestionOptions';

interface QuestionContentProps {
  question: ShuffledQuestion;
  onGoogleSearch: () => void;
  onReplace?: () => void;
  showReplace: boolean;
}

export const QuestionContent: React.FC<QuestionContentProps> = ({
  question,
  onGoogleSearch,
  onReplace,
  showReplace
}) => {
  return (
    <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="its-card p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg font-medium leading-relaxed flex-1">
            {question.question}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onGoogleSearch}
              className="flex-shrink-0 p-2 rounded-full hover:bg-its-light transition-colors text-its-secondary hover:text-its-red"
              title="Cerca su Google"
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {showReplace && onReplace && (
              <button
                onClick={onReplace}
                className="flex-shrink-0 p-2 rounded-full hover:bg-its-light transition-colors text-its-secondary hover:text-its-red"
                title="Sostituisci domanda"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
