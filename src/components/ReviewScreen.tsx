
import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, Filter } from 'lucide-react';
import { QuizHistory, AnsweredQuestion } from '../types/quiz';

interface ReviewScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizHistory: QuizHistory;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ onNavigate, quizHistory }) => {
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const questionsToShow = showOnlyErrors 
    ? quizHistory.answeredQuestions.filter(q => !q.isCorrect)
    : quizHistory.answeredQuestions;

  const getAnswerLetter = (index: number) => String.fromCharCode(65 + index);

  const handleRetryErrors = () => {
    const errorQuestionIds = quizHistory.answeredQuestions
      .filter(q => !q.isCorrect)
      .map(q => q.questionId);
    
    onNavigate('quiz', { 
      type: 'custom', 
      questionIds: errorQuestionIds,
      title: 'Ripasso Errori'
    });
  };

  return (
    <div className="min-h-screen bg-apple-light">
      {/* Header */}
      <header className="bg-apple-card shadow-apple-card px-apple-2x py-4">
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={() => onNavigate('results', { 
              score: quizHistory.score,
              correctAnswers: quizHistory.correctAnswers,
              totalQuestions: quizHistory.totalQuestions,
              quizType: quizHistory.quizType,
              topicName: quizHistory.topicName
            })}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-apple-blue" />
          </button>
          <div>
            <h1 className="text-h2 font-semibold">Rivedi Risposte</h1>
            <p className="text-caption text-apple-secondary">
              {quizHistory.topicName || 'Quiz Generale'} • {quizHistory.correctAnswers}/{quizHistory.totalQuestions} corrette
            </p>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowOnlyErrors(!showOnlyErrors)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-apple transition-all
              ${showOnlyErrors 
                ? 'bg-apple-red text-white' 
                : 'bg-apple-light text-apple-secondary hover:text-apple-text'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            <span className="text-caption">
              {showOnlyErrors ? 'Solo errori' : 'Tutte'}
            </span>
          </button>

          {questionsToShow.filter(q => !q.isCorrect).length > 0 && (
            <button
              onClick={handleRetryErrors}
              className="flex items-center space-x-2 px-4 py-2 bg-apple-blue text-white rounded-apple"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-caption">Riprova Errori</span>
            </button>
          )}
        </div>
      </header>

      {/* Questions Review */}
      <div className="px-apple-2x py-6 space-y-4">
        {questionsToShow.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-apple-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h3 className="text-h3 font-medium text-apple-text mb-2">
              Nessun errore!
            </h3>
            <p className="text-caption text-apple-secondary">
              Hai risposto correttamente a tutte le domande!
            </p>
          </div>
        ) : (
          questionsToShow.map((question, index) => (
            <div key={question.questionId} className="apple-card p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-caption font-bold
                  ${question.isCorrect ? 'bg-apple-green' : 'bg-apple-red'}
                `}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-small text-apple-secondary">{question.topic}</span>
                    <span className={`
                      px-2 py-1 rounded-full text-small font-medium
                      ${question.isCorrect 
                        ? 'bg-apple-green/10 text-apple-green' 
                        : 'bg-apple-red/10 text-apple-red'
                      }
                    `}>
                      {question.isCorrect ? 'Corretta' : 'Errata'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-11 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-caption">
                  <div>
                    <span className="text-apple-secondary">Tua risposta:</span>
                    <div className={`
                      mt-1 p-2 rounded-lg 
                      ${question.isCorrect 
                        ? 'bg-apple-green/10 text-apple-green' 
                        : 'bg-apple-red/10 text-apple-red'
                      }
                    `}>
                      {getAnswerLetter(question.userAnswer)}
                    </div>
                  </div>
                  <div>
                    <span className="text-apple-secondary">Risposta corretta:</span>
                    <div className="mt-1 p-2 bg-apple-green/10 text-apple-green rounded-lg">
                      {getAnswerLetter(question.correctAnswer)}
                    </div>
                  </div>
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
