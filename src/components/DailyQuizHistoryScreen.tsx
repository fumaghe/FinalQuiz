import React from 'react';
import { ArrowLeft, CheckCircle, XCircle, Calendar, TrendingUp, Award } from 'lucide-react';
import { useDailyQuiz } from '../contexts/DailyQuizContext';

interface DailyQuizHistoryScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const DailyQuizHistoryScreen: React.FC<DailyQuizHistoryScreenProps> = ({ onNavigate }) => {
  const { state, getStreakCount } = useDailyQuiz();
  const streakCount = getStreakCount();
  
  // Calculate stats
  const totalQuizzes = state.history.length;
  const passedQuizzes = state.history.filter(h => h.passed).length;
  const passRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;
  const averageScore = totalQuizzes > 0 
    ? Math.round(state.history.reduce((sum, h) => sum + h.score, 0) / totalQuizzes * 10) / 10
    : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (date.toDateString() === today) return 'Oggi';
    if (date.toDateString() === yesterday) return 'Ieri';
    
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortedHistory = [...state.history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
      {/* Header */}
      <header className="bg-its-card shadow-its-card px-4 md:px-6 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-its hover:bg-red-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-its-red" />
          </button>
          <img
            src="/ITSAR.png"
            alt="Logo ITS Angelo Rizzoli"
            className="w-12 h-9 md:w-16 md:h-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-h3 md:text-h2 font-bold text-its-text truncate">
              Storico Quiz del Giorno
            </h1>
            <p className="text-small md:text-body text-its-secondary truncate">
              La tua cronologia di apprendimento quotidiano
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="its-card p-4 md:p-6 text-center">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-its-red mx-auto mb-2 md:mb-3" />
            <div className="text-h3 md:text-h2 font-bold text-its-text">{totalQuizzes}</div>
            <div className="text-xs md:text-small text-its-secondary">Quiz completati</div>
          </div>
          
          <div className="its-card p-4 md:p-6 text-center">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-2 md:mb-3" />
            <div className="text-h3 md:text-h2 font-bold text-its-text">{passRate}%</div>
            <div className="text-xs md:text-small text-its-secondary">Tasso di successo</div>
          </div>
          
          <div className="its-card p-4 md:p-6 text-center">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500 mx-auto mb-2 md:mb-3" />
            <div className="text-h3 md:text-h2 font-bold text-its-text">{averageScore}/5</div>
            <div className="text-xs md:text-small text-its-secondary">Punteggio medio</div>
          </div>
          
          <div className="its-card p-4 md:p-6 text-center">
            <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-500 mx-auto mb-2 md:mb-3" />
            <div className="text-h3 md:text-h2 font-bold text-its-text">{streakCount}</div>
            <div className="text-xs md:text-small text-its-secondary">
              {streakCount === 1 ? 'Giorno di streak' : 'Giorni di streak'}
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="its-card p-4 md:p-6">
          <h2 className="text-h3 md:text-h2 font-semibold text-its-text mb-4 md:mb-6">Cronologia</h2>
          
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <Calendar className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-h3 font-semibold text-its-text mb-2">Nessun quiz completato</h3>
              <p className="text-small md:text-body text-its-secondary mb-4 md:mb-6 px-4">
                Inizia il tuo primo quiz del giorno per vedere qui la cronologia!
              </p>
              <button
                onClick={() => onNavigate('dashboard')}
                className="its-button-primary text-small md:text-base"
              >
                Vai alla Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {sortedHistory.map((result, index) => (
                <div
                  key={result.date}
                  className="flex items-center space-x-3 md:space-x-4 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-white rounded-its border border-gray-200"
                >
                  {/* Date line */}
                  <div className="flex-shrink-0 relative">
                    <div className={`
                      w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center
                      ${result.passed ? 'bg-green-100' : 'bg-red-100'}
                    `}>
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                      )}
                    </div>
                    
                    {/* Timeline line */}
                    {index < sortedHistory.length - 1 && (
                      <div className="absolute top-10 md:top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-6 md:h-8 bg-gray-200" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 space-y-1 md:space-y-0">
                      <h3 className="text-body md:text-h3 font-semibold text-its-text truncate">
                        {formatDate(result.date)}
                      </h3>
                      <div className="flex items-center justify-between md:text-right">
                        <div className="md:mr-4">
                          <div className="text-body md:text-h3 font-bold text-its-text">
                            {result.score}/{result.totalQuestions}
                          </div>
                          <div className="text-xs md:text-small text-its-secondary">
                            {Math.round((result.score / result.totalQuestions) * 100)}%
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-16 md:w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              result.passed ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(result.score / result.totalQuestions) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                      <div className="flex items-center space-x-2">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${result.passed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                          }
                        `}>
                          {result.passed ? 'Superato' : 'Non superato'}
                        </span>
                        <span className="text-xs md:text-small text-its-secondary">
                          {new Date(result.completedAt).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="its-button-primary text-small md:text-base"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuizHistoryScreen;