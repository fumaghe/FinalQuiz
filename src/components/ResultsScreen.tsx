// src/components/ResultsScreen.tsx
import React, { useMemo } from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  Share,
  Eye,
  Clock,
} from 'lucide-react';
import { QuizHistory, QuizKind } from '../types/quiz';

interface ResultsScreenProps {
  onNavigate: (screen: string, params?: any) => void;

  /** valori base */
  score: number;               // % corrette
  correctAnswers: number;
  totalQuestions: number;

  /** props opzionali per le modalità avanzate */
  quizType: QuizKind;          // 'general' | … | 'timed' | 'streak' | 'reverse'
  timeTaken?: number;          // solo timed, in secondi
  streakCount?: number;        // solo streak, numero di risposte corrette consecutive
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
  quizHistory,
  timeTaken,
  streakCount,
}) => {
  /* ---------------------------------------------------------- */
  /* CALCOLO COPPE GUADAGNATE/ PERSI                            */
  /* ---------------------------------------------------------- */
  const QUIZ_TYPE_MULT: Record<string, number> = {
    general: 1.3,
    topic:   1.1,
    forYou:  1.5,
    timed:   1.7,
    streak:  1.3,
    reverse: 1.15,
  };

  const cupDelta = useMemo(() => {
    if (!quizHistory) return 0;

    let pts = 0;
    // 1) risposte: +10 / −5
    quizHistory.answeredQuestions?.forEach(ans => {
      pts += ans.isCorrect ? 10 : -5;
    });
    // 2) bonus timed
    if (quizType === 'timed' && quizHistory.timeLeft != null) {
      pts += Math.floor(quizHistory.timeLeft / 10);
    }
    // 3) bonus streak
    if (quizType === 'streak' && quizHistory.streakCount != null) {
      pts += Math.floor(quizHistory.streakCount / 5);
    }
    // 4) applica moltiplicatore
    const mult = QUIZ_TYPE_MULT[quizType] ?? 1.0;
    return Math.round(pts * mult);
  }, [quizHistory, quizType]);

  /* ---------------------------------------------------------- */
  /* PERFORMANCE LOOK-AND-FEEL                                  */
  /* ---------------------------------------------------------- */
  const perf = (() => {
    if (quizType === 'streak') {
      return {
        emoji: '🔥',
        title: 'Game Over',
        message: `Hai totalizzato ${streakCount} risposte corrette di fila!`,
        color: '#FF9F0A',
        bgColor: 'bg-yellow-50',
      };
    }
    if (score >= 90)
      return {
        emoji: '🏆',
        title: 'Eccellente!',
        message: 'Risultato straordinario!',
        color: '#34C759',
        bgColor: 'bg-green-50',
      };
    if (score >= 75)
      return {
        emoji: '🎉',
        title: 'Ottimo lavoro!',
        message: 'Risultato molto buono!',
        color: '#007AFF',
        bgColor: 'bg-blue-50',
      };
    if (score >= 60)
      return {
        emoji: '👍',
        title: 'Buon risultato!',
        message: 'Puoi fare ancora meglio!',
        color: '#FF9F0A',
        bgColor: 'bg-yellow-50',
      };
    return {
      emoji: '💪',
      title: 'Continua così!',
      message: 'Ogni errore è una lezione!',
      color: '#FF3B30',
      bgColor: 'bg-red-50',
    };
  })();

  /* ---------------------------------------------------------- */
  /* HANDLERS                                                   */
  /* ---------------------------------------------------------- */
  const handleRetryQuiz = () => onNavigate('quiz', { quizType });
  const handleReviewAnswers = () => {
    if (quizHistory) onNavigate('review', { quizHistory });
  };

  /* ---------------------------------------------------------- */
  /* RENDER                                                     */
  /* ---------------------------------------------------------- */
  const accuracy   = Math.round(score);
  const errorCount = totalQuestions - correctAnswers;
  const timedLabel =
    quizType === 'timed' && timeTaken != null
      ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`
      : undefined;

  return (
    <div className="min-h-screen bg-apple-light flex flex-col">
      {/* ========== HEADER CARD ========== */}
      <div className="flex-1 flex flex-col items-center justify-center px-apple-2x py-12">
        {/* ICONA / MEDAGLIA */}
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${perf.bgColor}`}
          style={{ backgroundColor: `${perf.color}20` }}
        >
          <span className="text-5xl">{perf.emoji}</span>
        </div>
        {/* TITOLO & MSG */}
        <h1 className="text-h1 font-bold text-apple-text mb-2 text-center">
          {perf.title}
        </h1>
        <p className="text-body text-apple-secondary mb-8 text-center">
          {perf.message}
        </p>

        {/* —— CARD PRINCIPALE —— */}
        <div className="apple-card p-8 w-full max-w-sm mb-6">
          <div className="text-center">
            {/* METRICA PRINCIPALE */}
            <div className="mb-6">
              {quizType === 'streak' ? (
                <>
                  <p
                    className="text-6xl font-bold mb-2"
                    style={{ color: perf.color }}
                  >
                    {streakCount}
                  </p>
                  <p className="text-body text-apple-secondary">
                    risposte corrette consecutive
                  </p>
                </>
              ) : (
                <>
                  <p
                    className="text-6xl font-bold mb-2"
                    style={{ color: perf.color }}
                  >
                    {accuracy}%
                  </p>
                  <p className="text-body text-apple-secondary">
                    {correctAnswers} su {totalQuestions} corrette
                  </p>
                </>
              )}
            </div>

            {/* INFO AGGIUNTIVE */}
            <div className="pt-6 border-t border-apple-border space-y-2">
              {quizType === 'timed' && timedLabel && (
                <p className="flex items-center justify-center text-caption">
                  <Clock className="w-4 h-4 mr-1" />
                  Tempo impiegato:&nbsp;
                  <span className="font-medium">{timedLabel}</span>
                </p>
              )}
              <p className="text-caption text-apple-secondary">Quiz completato</p>
              <p className="text-body font-medium">
                {quizType === 'general'
                  ? 'Quiz Generale'
                  : quizType === 'timed'
                  ? 'Sfida a Tempo'
                  : quizType === 'streak'
                  ? 'Streak Quiz'
                  : quizType === 'reverse'
                  ? 'Quiz Inverso'
                  : topicName}
              </p>
            </div>
          </div>
        </div>

        {/* COPPE OTTENUTE / PERSE */}
        <div className="apple-card p-4 w-full max-w-sm mb-8 flex items-center justify-center space-x-2">
          <Trophy className={`w-6 h-6 ${cupDelta >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-body font-medium">
            {cupDelta >= 0 ? `+${cupDelta}` : cupDelta} coppe
          </span>
        </div>

        {/* ERROR SUMMARY (solo per quiz tradizionali e inverse) */}
        {quizType !== 'streak' && errorCount > 0 && (
          <div className="apple-card p-4 w-full max-w-sm mb-8">
            <div className="text-center">
              <p className="text-caption text-apple-secondary mb-2">
                {errorCount}{' '}
                {errorCount === 1 ? 'errore da' : 'errori da'} rivedere
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
      </div>

      {/* ========== AZIONI ========== */}
      <div className="px-apple-2x py-6 space-y-4">
        <button
          onClick={handleRetryQuiz}
          className="w-full apple-button-primary flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Riprova</span>
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

        {/* Condivisione */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'QuizMaster - I miei risultati',
                text:
                  quizType === 'streak'
                    ? `Ho ottenuto una streak di ${streakCount} risposte corrette su QuizMaster! 💥`
                    : `Ho completato un quiz con il ${accuracy}% di accuratezza! 🎯`,
                url: window.location.href,
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
