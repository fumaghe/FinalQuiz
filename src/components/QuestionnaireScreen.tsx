import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, CheckCircle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useQuestionnaire, QuestionnaireAnswer, QuestionnaireResult } from '../contexts/QuestionnaireContext';

interface QuestionnaireScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  topicId: string;
  type: 'teacher' | 'subject' | 'coherence';
}

const QuestionnaireScreen: React.FC<QuestionnaireScreenProps> = ({ 
  onNavigate, 
  topicId, 
  type 
}) => {
  const { getTopicsForCourse, state: quizState } = useQuiz();
  const { state, dispatch } = useQuestionnaire();
  
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [averageRating, setAverageRating] = useState(0);

  const topics = getTopicsForCourse();
  const topic = topics.find(t => t.id === topicId);
  const template = state.templates.find(t => t.type === type);
  
  const questionsPerPage = 5;
  const totalPages = template ? Math.ceil(template.questions.length / questionsPerPage) : 0;
  const currentQuestions = template?.questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  ) || [];

  const handleRatingChange = (questionId: string, rating: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: rating
    }));
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      // Complete questionnaire
      completeQuestionnaire();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const completeQuestionnaire = () => {
    if (!template) return;

    const questionnaireAnswers: QuestionnaireAnswer[] = template.questions.map(q => ({
      questionId: q.id,
      rating: answers[q.id] || 1
    }));

    const average = questionnaireAnswers.reduce((sum, answer) => sum + answer.rating, 0) / questionnaireAnswers.length;
    
    const result: QuestionnaireResult = {
      id: `${topicId}_${type}_${Date.now()}`,
      topicId,
      type,
      answers: questionnaireAnswers,
      averageRating: Math.round(average * 10) / 10,
      completedAt: new Date()
    };

    dispatch({ type: 'COMPLETE_QUESTIONNAIRE', payload: result });
    setAverageRating(result.averageRating);
    setShowResult(true);
  };

  const getCurrentPageAnswers = () => {
    return currentQuestions.filter(q => answers[q.id] !== undefined).length;
  };

  const canProceed = getCurrentPageAnswers() === currentQuestions.length;
  const isLastPage = currentPage === totalPages - 1;

  if (!topic || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-h2 text-its-text mb-4">Questionario non trovato</h2>
          <button
            onClick={() => onNavigate('dashboard')}
            className="its-button-primary"
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
        <header className="bg-its-card shadow-its-card px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-its hover:bg-red-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-its-red" />
            </button>
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-12 h-9 sm:w-16 sm:h-12"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-h2 font-bold text-its-text truncate">Questionario Completato</h1>
              <p className="text-sm sm:text-body text-its-secondary truncate">{template.title} - {topic.name}</p>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6">
          <div className="its-card max-w-lg w-full p-4 sm:p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            
            <h2 className="text-h1 font-bold text-its-text mb-4">
              Grazie per la valutazione!
            </h2>
            
            <p className="text-body text-its-secondary mb-6">
              Il tuo feedback è importante per migliorare la qualità della formazione.
            </p>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-its p-6 mb-6">
              <div className="text-h3 font-semibold text-its-text mb-2">
                Valutazione Media
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= averageRating 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-h2 font-bold text-its-text">
                {averageRating}/5
              </div>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full its-button-primary"
            >
              Torna alla Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
      <header className="bg-its-card shadow-its-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-its hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-its-red" />
            </button>
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-12 h-9 sm:w-16 sm:h-12 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-h2 font-bold text-its-text truncate">{template.title}</h1>
              <p className="text-sm sm:text-body text-its-secondary truncate">
                {topic.name} • {quizState.user?.courseName}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="text-base sm:text-h3 font-semibold text-its-text">
              {currentPage + 1}/{totalPages}
            </div>
            <div className="text-xs sm:text-small text-its-secondary">
              {getCurrentPageAnswers()}/{currentQuestions.length} risposte
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="its-card p-4 sm:p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-small text-its-secondary mb-2">
              <span>Progresso</span>
              <span>{Math.round(((currentPage + 1) / totalPages) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-its-red to-its-red-dark h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 text-center">
            <p className="text-body text-its-secondary">
              {template.description}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-8 mb-8">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <h3 className="text-h3 font-semibold text-its-text">
                  {currentPage * questionsPerPage + index + 1}. {question.question}
                </h3>
                
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 py-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRatingChange(question.id, rating)}
                      className={`
                        flex flex-col items-center space-y-1 sm:space-y-2 p-2 sm:p-4 rounded-its transition-all duration-200
                        ${answers[question.id] === rating
                          ? 'bg-its-red text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-its-red'
                        }
                        its-button
                      `}
                    >
                      <Star 
                        className={`w-6 h-6 sm:w-8 sm:h-8 ${
                          answers[question.id] === rating ? 'fill-current' : ''
                        }`} 
                      />
                      <span className="text-xs sm:text-small font-medium">{rating}</span>
                    </button>
                  ))}
                </div>

                {/* Rating labels */}
                <div className="flex justify-between text-xs text-its-secondary px-2 sm:px-4">
                  <span className="text-center">Per niente</span>
                  <span className="text-center">Poco</span>
                  <span className="text-center">Abbastanza</span>
                  <span className="text-center">Molto</span>
                  <span className="text-center">Completamente</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className="its-button-secondary disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              Precedente
            </button>
            
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="its-button-primary disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {isLastPage ? 'Completa Questionario' : 'Successiva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireScreen;