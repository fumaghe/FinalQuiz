
import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Filter } from 'lucide-react';
import { QuizHistory, AnsweredQuestion } from '../types/quiz';

interface ReviewScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizHistory?: QuizHistory;
  params?: any;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onNavigate, quizHistory: propQuizHistory, params }) => {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  // Ottieni i dati del quiz history dai parametri o dalle props
  const quizHistory = propQuizHistory || params?.quizHistory;
  
  console.log('ReviewScreen - quizHistory:', quizHistory);
  console.log('ReviewScreen - params:', params);

  // Verifica che i dati del quiz history esistano e siano validi
  if (!quizHistory) {
    console.error('No quiz history data provided');
    return (
      <div className="min-h-screen bg-its-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-its-text mb-2">Errore</h2>
          <p className="text-sm text-its-secondary mb-4">Nessun dato del quiz trovato</p>
          <button
            onClick={() => onNavigate('stats')}
            className="px-4 py-2 bg-its-red text-white rounded-its"
          >
            Torna alle Statistiche
          </button>
        </div>
      </div>
    );
  }

  // Verifica che answeredQuestions esista e sia un array
  const answeredQuestions = quizHistory.answeredQuestions || [];
  console.log('ReviewScreen - answeredQuestions:', answeredQuestions);
  
  const questionsToShow = showOnlyErrors 
    ? answeredQuestions.filter(q => !q.isCorrect)
    : answeredQuestions;

  const getAnswerLetter = (index: number) => String.fromCharCode(65 + index);

  const handleRetryErrors = () => {
    const errorQuestionIds = answeredQuestions
      .filter(q => !q.isCorrect)
      .map(q => q.questionId);
    
    onNavigate('quiz', { 
      type: 'custom', 
      questionIds: errorQuestionIds,
      title: 'Ripasso Errori'
    });
  };

  const handleBackNavigation = () => {
    // Torna sempre alle statistiche quando si esce dalla review
    onNavigate('stats');
  };

  return (
    <div className="min-h-screen bg-its-light">
      {/* Header */}
      <header className="bg-its-card shadow-its-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4">
          <button 
            onClick={handleBackNavigation}
            className="p-2 -ml-2 rounded-full hover:bg-its-light transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-its-red" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold">Rivedi Risposte</h1>
            <p className="text-xs sm:text-sm text-its-secondary">
              {quizHistory.topicName || 'Quiz Generale'} • {quizHistory.correctAnswers || 0}/{quizHistory.totalQuestions || 0} corrette
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`
              flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-its transition-all text-xs sm:text-sm
              ${showOnlyErrors 
                ? 'bg-its-red-dark text-white' 
                : 'bg-its-light text-its-secondary hover:text-its-text'
              }
            `}
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>
              {showOnlyErrors ? 'Solo errori' : 'Tutte'}
            </span>
          </button>

          {questionsToShow.filter(q => !q.isCorrect).length > 0 && (
            <button
              onClick={handleRetryErrors}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-its-red text-white rounded-its text-xs sm:text-sm"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Riprova Errori</span>
            </button>
          )}
        </div>
      </header>

      {/* Questions Review */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-3 sm:space-y-4 pb-20">
        {answeredQuestions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-its-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">⚠️</span>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-its-text mb-2">
              Nessuna domanda trovata
            </h3>
            <p className="text-xs sm:text-sm text-its-secondary">
              Questo quiz non contiene domande salvate
            </p>
          </div>
        ) : questionsToShow.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-its-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">🎉</span>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-its-text mb-2">
              Nessun errore!
            </h3>
            <p className="text-xs sm:text-sm text-its-secondary">
              Hai risposto correttamente a tutte le domande!
            </p>
          </div>
        ) : (
          questionsToShow.map((question, index) => (
            <div key={`${question.questionId}-${index}`} className="its-card p-3 sm:p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0
                  ${question.isCorrect ? 'bg-its-green' : 'bg-its-red-dark'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-xs text-its-secondary">{question.topic}</span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${question.isCorrect 
                        ? 'bg-its-green/10 text-its-green' 
                        : 'bg-its-red-dark/10 text-its-red-dark'
                      }
                    `}>
                      {question.isCorrect ? 'Corretta' : 'Errata'}
                    </span>
                  </div>
                  
                  {/* Question Text */}
                  <div className="mb-3">
                    <p className="text-sm sm:text-base text-its-text font-medium leading-relaxed">
                      {question.question}
                    </p>
                  </div>

                  {/* Answer Options */}
                  <div className="space-y-2 mb-3">
                    {question.options && question.options.map((option, optIndex) => {
                      const isUserAnswer = optIndex === question.userAnswer;
                      const isCorrectAnswer = optIndex === question.correctAnswer;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`
                            p-2 sm:p-3 rounded-lg border text-xs sm:text-sm
                            ${isCorrectAnswer 
                              ? 'bg-its-green/10 border-its-green text-its-green' 
                              : isUserAnswer && !question.isCorrect
                                ? 'bg-its-red-dark/10 border-its-red-dark text-its-red-dark'
                                : 'bg-its-light border-its-border text-its-text'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">
                              {String.fromCharCode(65 + optIndex)})
                            </span>
                            <span>{option}</span>
                            {isCorrectAnswer && (
                              <span className="ml-auto text-its-green">✓</span>
                            )}
                            {isUserAnswer && !question.isCorrect && (
                              <span className="ml-auto text-its-red-dark">✗</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="mt-3 p-2 sm:p-3 bg-its-red/5 rounded-lg border-l-4 border-its-red">
                      <p className="text-xs sm:text-sm text-its-text">
                        <span className="font-medium text-its-red">Spiegazione:</span> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewScreen;
