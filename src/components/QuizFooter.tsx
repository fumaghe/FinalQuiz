import React from 'react';
import { SkipForward } from 'lucide-react';

interface QuizFooterProps {
  quizType: 'general' | 'topic' | 'custom' | 'forYou';
  isAnswered: boolean;
  onSkip?: () => void;
  onConfirm?: () => void;
  onNext?: () => void;
  canSkip: boolean;
  hasNext: boolean;
}

export const QuizFooter: React.FC<QuizFooterProps> = ({
  quizType,
  isAnswered,
  onSkip,
  onConfirm,
  onNext,
  canSkip,
  hasNext
}) => (
  <div className="mt-6 mb-32 flex justify-center gap-4">
    {quizType === 'topic' && canSkip && onSkip && (
      <button
        onClick={onSkip}
        disabled={isAnswered}
        className="flex items-center space-x-1 sm:space-x-2 text-apple-blue font-medium apple-button disabled:opacity-50 text-sm sm:text-base"
      >
        <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>Salta</span>
      </button>
    )}
    {!isAnswered ? (
      <button
        onClick={onConfirm}
        disabled={!onConfirm}
        className="px-4 sm:px-6 py-2 sm:py-3 apple-button-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        Conferma
      </button>
    ) : (
      <button
        onClick={onNext}
        className="px-4 sm:px-6 py-2 sm:py-3 apple-button-primary text-sm sm:text-base"
      >
        {hasNext ? 'Prossima' : 'Termina'}
      </button>
    )}
  </div>
);
