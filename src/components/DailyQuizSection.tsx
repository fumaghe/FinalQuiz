import React from 'react';
import { ChevronRight, Flame } from 'lucide-react';
import DailyQuizCard from './DailyQuizCard';
import { useDailyQuiz } from '../contexts/DailyQuizContext';

interface DailyQuizSectionProps {
  onNavigate: (screen: string, params?: any) => void;
}

const DailyQuizSection: React.FC<DailyQuizSectionProps> = ({ onNavigate }) => {
  const { getStreakCount } = useDailyQuiz();
  const streakCount = getStreakCount();

  // Generate 7 days: past 2, today, future 4
  const getDailyQuizDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = -2; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
      
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        isFuture: i > 0,
        isPast: i < 0,
        isToday: i === 0,
      });
    }
    
    return dates;
  };

  const dates = getDailyQuizDates();

  const handleStartQuiz = (date: string) => {
    onNavigate('daily-quiz', { date });
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-h2 font-semibold text-its-text">Quiz del Giorno</h3>
          {streakCount > 0 && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-1 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-small font-semibold text-orange-600">
                {streakCount} {streakCount === 1 ? 'giorno' : 'giorni'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => onNavigate('daily-quiz-history')}
          className="flex items-center space-x-1 text-its-red hover:text-its-red-dark font-medium text-small transition-colors"
        >
          <span>Storico</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Timeline cards */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {dates.map((dateInfo) => (
          <DailyQuizCard
            key={dateInfo.date}
            date={dateInfo.date}
            dayName={dateInfo.dayName}
            dayNumber={dateInfo.dayNumber}
            onStartQuiz={handleStartQuiz}
            isFuture={dateInfo.isFuture}
          />
        ))}
      </div>

      {/* Info text */}
      <p className="text-small text-its-secondary mt-3 text-center">
        Ogni giorno 5 domande sulle materie del tuo corso • I giorni futuri si sbloccano automaticamente
      </p>
    </section>
  );
};

export default DailyQuizSection;