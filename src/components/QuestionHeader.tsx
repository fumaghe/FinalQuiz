import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface QuestionHeaderProps {
  quizType: 'general' | 'topic' | 'custom' | 'forYou' | 'timed';
  title?: string;
  topicName?: string;
  currentIndex: number;
  total: number;
  onBack?: () => void;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  quizType,
  title,
  topicName,
  currentIndex,
  total,
  onBack
}) => {
  const headerTitle = title
    || (quizType === 'general' ? 'Quiz Generale' : topicName);

  return (
    <header className="bg-apple-card shadow-apple-card px-4 sm:px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between mb-4">
        {quizType === 'topic' && onBack ? (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
          </button>
        ) : (
          <div className="w-6 sm:w-10" />
        )}
        <div className="text-center flex-1 min-w-0 px-2">
          <h1 className="text-sm sm:text-base font-medium truncate">
            {headerTitle}
          </h1>
          <p className="text-xs text-apple-secondary">
            Domanda {currentIndex + 1} di {total}
          </p>
        </div>
        <div className="w-6 sm:w-10" />
      </div>
      <div className="w-full bg-apple-light rounded-full h-1">
        <div
          className="bg-apple-blue h-1 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>
    </header>
  );
};
