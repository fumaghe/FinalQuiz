import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface ExplanationProps {
  isCorrect: boolean;
  explanation: string;
  show: boolean;
  onToggle: () => void;
}

export const Explanation: React.FC<ExplanationProps> = ({
  isCorrect,
  explanation,
  show,
  onToggle
}) => (
  <div className="apple-card p-3 sm:p-4 mx-4 sm:mx-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm sm:text-base font-medium text-apple-text">
        {isCorrect ? '✅ Corretto!' : '❌ Risposta errata'}
      </h3>
      <button
        onClick={onToggle}
        className="flex items-center space-x-1 text-apple-blue text-xs sm:text-sm"
      >
        {show ? (
          <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
        ) : (
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
        )}
        <span>{show ? 'Nascondi' : 'Mostra'}</span>
      </button>
    </div>
    {show && (
      <p className="text-sm text-apple-secondary leading-relaxed">
        {explanation}
      </p>
    )}
  </div>
);
