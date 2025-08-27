import React from 'react';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useDailyQuiz } from '../contexts/DailyQuizContext';

interface DailyQuizCardProps {
  date: string;
  dayName: string;
  dayNumber: number;
  onStartQuiz: (date: string) => void;
  isFuture?: boolean;
}

const DailyQuizCard: React.FC<DailyQuizCardProps> = ({ 
  date, 
  dayName, 
  dayNumber, 
  onStartQuiz,
  isFuture = false
}) => {
  const { getDailyQuizStatus, state } = useDailyQuiz();
  const status = getDailyQuizStatus(date);
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  
  // Get result if completed
  const result = state.history.find(h => h.date === date);

  const getStatusIcon = () => {
    if (isFuture) {
      return <Clock className="w-8 h-8 text-gray-400" />;
    }
    
    switch (status) {
      case 'completed':
        return result?.passed ? (
          <CheckCircle className="w-8 h-8 text-green-500" />
        ) : (
          <XCircle className="w-8 h-8 text-red-500" />
        );
      case 'available':
        return <Calendar className="w-8 h-8 text-its-red" />;
      case 'not-started':
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isFuture) {
      return 'Prossimamente';
    }
    
    switch (status) {
      case 'completed':
        return result ? `${result.score}/${result.totalQuestions}` : 'Completato';
      case 'available':
        return 'Disponibile';
      case 'not-started':
        return 'Prossimamente';
    }
  };

  const canClick = status === 'available' && !isFuture;

  return (
    <button
      onClick={() => canClick && onStartQuiz(date)}
      disabled={!canClick}
      className={`
        flex-shrink-0 w-32 p-4 rounded-its border-2 transition-all duration-200
        ${isToday ? 'border-its-red bg-gradient-to-br from-red-50 to-red-100' : 'border-gray-200 bg-white'}
        ${canClick ? 'hover:border-its-red hover:shadow-md cursor-pointer its-button' : 'cursor-not-allowed'}
        ${isFuture ? 'opacity-40' : ''}
        ${status === 'completed' && result?.passed ? 'bg-green-50' : ''}
        ${status === 'completed' && !result?.passed ? 'bg-red-50' : ''}
      `}
    >
      <div className="text-center space-y-2">
        {/* Day name */}
        <div className="text-small font-medium text-its-secondary">
          {dayName}
        </div>
        
        {/* Day number */}
        <div className={`text-h2 font-bold ${isToday ? 'text-its-red' : 'text-its-text'}`}>
          {dayNumber}
        </div>
        
        {/* Status icon */}
        <div className="flex justify-center">
          {getStatusIcon()}
        </div>
        
        {/* Status text */}
        <div className="text-small font-medium text-its-secondary">
          {getStatusText()}
        </div>
      </div>
    </button>
  );
};

export default DailyQuizCard;