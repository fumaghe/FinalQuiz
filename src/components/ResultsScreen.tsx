
import React from 'react';
import { Trophy, RotateCcw, Home, Share, Eye } from 'lucide-react';
import { QuizHistory } from '../types/quiz';

interface ResultsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  quizType: 'general' | 'topic';
  topicName?: string;
  quizHistory?: QuizHistory;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({
  onNavigate,
  score,
  correctAnswers,
  totalQuestions,
  quizType,
  topicName,
  quizHistory
}) => {
  const getPerformanceData = () => {
    if (score >= 90) {
      return {
        emoji: '🏆',
        title: 'Eccellente!',
        message: 'Risultato straordinario!',
        color: '#34C759',
        bgColor: 'bg-green-50'
      };
    } else if (score >= 75) {
      return {
        emoji: '🎉',
        title: 'Ottimo lavoro!',
        message: 'Risultato molto buono!',
        color: '#007AFF',
        bgColor: 'bg-blue-50'
      };
    } else if (score >= 60) {
      return {
        emoji: '👍',
        title: 'Buon risultato!',
        message: 'Puoi fare ancora meglio!',
        color: '#FF9F0A',
        bgColor: 'bg-yellow-50'
      };
    } else {
      return {
        emoji: '💪',
        title: 'Continua così!',
        message: 'Ogni errore è una lezione!',
        color: '#FF3B30',
        bgColor: 'bg-red-50'
      };
    }
  };

  const performance = getPerformanceData();
  const accuracy = Math.round(score);
  const errorCount = totalQuestions - correctAnswers;

  const handleRetryQuiz = () => {
    if (quizType === 'general') {
      onNavigate('quiz', { type: 'general' });
    } else {
      onNavigate('quiz', { type: 'topic', topicId: topicName?.toLowerCase(), topicName });
    }
  };

  const handleReviewAnswers = () => {
    if (quizHistory) {
      onNavigate('review', { quizHistory });
    }
  };

  return (
    <div className="min-h-screen bg-apple-light flex flex-col">
      {/* Results Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-apple-2x py-12">
        {/* Performance Icon */}
        <div 
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${performance.bgColor}`}
          style={{ backgroundColor: `${performance.color}20` }}
        >
          <span className="text-5xl">{performance.emoji}</span>
        </div>

        {/* Title and Message */}
        <h1 className="text-h1 font-bold text-apple-text mb-2 text-center">
          {performance.title}
        </h1>
        <p className="text-body text-apple-secondary mb-8 text-center">
          {performance.message}
        </p>

        {/* Score Card */}
        <div className="apple-card p-8 w-full max-w-sm mb-8">
          <div className="text-center">
            <div className="mb-6">
              <p 
                className="text-6xl font-bold mb-2"
                style={{ color: performance.color }}
              >
                {accuracy}%
              </p>
              <p className="text-body text-apple-secondary">
                {correctAnswers} su {totalQuestions} corrette
              </p>
            </div>

            {/* Quiz Info */}
            <div className="pt-6 border-t border-apple-border">
              <p className="text-caption text-apple-secondary mb-1">
                Quiz completato
              </p>
              <p className="text-body font-medium">
                {quizType === 'general' ? 'Quiz Generale' : topicName}
              </p>
            </div>
          </div>
        </div>

        {/* Error Summary */}
        {errorCount > 0 && (
          <div className="apple-card p-4 w-full max-w-sm mb-8">
            <div className="text-center">
              <p className="text-caption text-apple-secondary mb-2">
                {errorCount} {errorCount === 1 ? 'errore da' : 'errori da'} rivedere
              </p>
              <button
                onClick={handleReviewAnswers}
                className="text-apple-blue text-caption font-medium"
                disabled={!quizHistory}
              >
                Rivedi nel dettaglio →
              </button>
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        <div className="apple-card p-4 w-full max-w-sm mb-8">
          <div className="text-center">
            {score >= 75 ? (
              <p className="text-caption text-apple-secondary">
                🌟 Continua così! La costanza è la chiave del successo.
              </p>
            ) : (
              <p className="text-caption text-apple-secondary">
                📚 Non scoraggiarti! Riprova per migliorare il tuo punteggio.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-apple-2x py-6 space-y-4">
        <button
          onClick={handleRetryQuiz}
          className="w-full apple-button-primary flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Riprova Quiz</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleReviewAnswers}
            disabled={!quizHistory}
            className="apple-button-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Eye className="w-5 h-5" />
            <span>Rivedi</span>
          </button>

          <button
            onClick={() => onNavigate('stats')}
            className="apple-button-secondary flex items-center justify-center space-x-2"
          >
            <Trophy className="w-5 h-5" />
            <span>Statistiche</span>
          </button>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full flex items-center justify-center space-x-2 py-3 text-apple-blue font-medium"
        >
          <Home className="w-5 h-5" />
          <span>Torna alla Home</span>
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'QuizMaster - I miei risultati',
                text: `Ho appena completato un quiz su QuizMaster con un punteggio del ${accuracy}%! 🎯`,
                url: window.location.href
              });
            }
          }}
          className="w-full flex items-center justify-center space-x-2 py-3 text-apple-secondary"
        >
          <Share className="w-5 h-5" />
          <span>Condividi Risultato</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
