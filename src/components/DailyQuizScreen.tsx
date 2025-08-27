import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useDailyQuiz } from '../contexts/DailyQuizContext';
import { Question } from '../types/quiz';
import { shuffleQuestionOptions, ShuffledQuestion } from '../utils/shuffleQuestionOptions';

interface DailyQuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  date: string;
}

const DailyQuizScreen: React.FC<DailyQuizScreenProps> = ({ onNavigate, date }) => {
  const { state: quizState, getQuestionsForCourse, getTopicsForCourse } = useQuiz();
  const { state: dailyState, dispatch, generateDailyQuiz } = useDailyQuiz();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);

  // Initialize daily quiz
  useEffect(() => {
    if (!dailyState.currentQuiz || dailyState.currentQuiz.date !== date) {
      const allQuestions = getQuestionsForCourse();
      const courseTopics = getTopicsForCourse().map(t => t.id);
      const dailyQuestions = generateDailyQuiz(date, allQuestions, courseTopics);
      
      if (dailyQuestions.length > 0) {
        dispatch({
          type: 'START_DAILY_QUIZ',
          payload: { date, questions: dailyQuestions }
        });
        
        // Shuffle questions for display
        const shuffled = dailyQuestions.map(q => shuffleQuestionOptions(q));
        setShuffledQuestions(shuffled);
        setAnswers(new Array(dailyQuestions.length).fill(-1));
      }
    } else if (dailyState.currentQuiz) {
      // Resume existing quiz
      const shuffled = dailyState.currentQuiz.questions.map(q => shuffleQuestionOptions(q));
      setShuffledQuestions(shuffled);
      setAnswers([...dailyState.currentQuiz.answers]);
      setCurrentQuestionIndex(dailyState.currentQuiz.currentQuestionIndex);
    }
  }, [date, dailyState.currentQuiz, dispatch, generateDailyQuiz, getQuestionsForCourse, getTopicsForCourse]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= shuffledQuestions.length - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
    
    // Update context
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { questionIndex: currentQuestionIndex, answer: answerIndex }
    });
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    if (isLastQuestion) {
      // Calculate results
      let correctCount = 0;
      answers.forEach((answer, index) => {
        if (answer !== -1 && dailyState.currentQuiz) {
          const originalQuestion = dailyState.currentQuiz.questions[index];
          if (answer === originalQuestion.correct) {
            correctCount++;
          }
        }
      });
      
      // Add current answer to count
      if (selectedAnswer !== null && dailyState.currentQuiz) {
        const currentOriginalQuestion = dailyState.currentQuiz.questions[currentQuestionIndex];
        if (selectedAnswer === currentOriginalQuestion.correct) {
          correctCount++;
        }
      }

      const passed = correctCount >= 3; // 3 out of 5 to pass

      const result = {
        date,
        questions: dailyState.currentQuiz!.questions,
        answers: [...answers.slice(0, currentQuestionIndex), selectedAnswer, ...answers.slice(currentQuestionIndex + 1)],
        score: correctCount,
        totalQuestions: shuffledQuestions.length,
        passed,
        completedAt: new Date(),
      };

      dispatch({ type: 'COMPLETE_DAILY_QUIZ', payload: result });
      setShowResult(true);
    } else {
      // Go to next question
      setCurrentQuestionIndex(prev => prev + 1);
      const nextIndex = currentQuestionIndex + 1;
      setSelectedAnswer(answers[nextIndex] ?? null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestionIndex - 1] ?? null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (showResult) {
    const result = dailyState.history.find(h => h.date === date);
    if (!result) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
        <header className="bg-its-card shadow-its-card px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-its hover:bg-red-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-its-red" />
            </button>
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-16 h-12"
            />
            <div>
              <h1 className="text-h2 font-bold text-its-text">Quiz del Giorno</h1>
              <p className="text-body text-its-secondary">{formatDate(date)}</p>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
          <div className="its-card max-w-lg w-full p-8 text-center">
            <div className="mb-6">
              {result.passed ? (
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              )}
              
              <h2 className="text-h1 font-bold text-its-text mb-2">
                {result.passed ? 'Quiz Superato!' : 'Quiz Non Superato'}
              </h2>
              
              <p className="text-body text-its-secondary mb-6">
                {result.passed 
                  ? 'Ottimo lavoro! Continua così!' 
                  : 'Non ti scoraggiare, riprova domani!'
                }
              </p>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-its p-6 mb-6">
              <div className="text-h1 font-bold text-its-text mb-2">
                {result.score}/{result.totalQuestions}
              </div>
              <div className="text-body text-its-secondary">
                {Math.round((result.score / result.totalQuestions) * 100)}% di precisione
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onNavigate('daily-quiz-history')}
                className="w-full its-button-secondary"
              >
                Vedi Storico
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full its-button-primary"
              >
                Torna alla Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion || !dailyState.currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-h2 text-its-text mb-4">Caricamento quiz...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
      <header className="bg-its-card shadow-its-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-its hover:bg-red-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-its-red" />
            </button>
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-16 h-12"
            />
            <div>
              <h1 className="text-h2 font-bold text-its-text">Quiz del Giorno</h1>
              <p className="text-body text-its-secondary">{formatDate(date)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-h3 font-semibold text-its-text">
              {currentQuestionIndex + 1} / {shuffledQuestions.length}
            </div>
            <div className="text-small text-its-secondary">
              Argomento: {currentQuestion.topic}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="its-card p-8">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-small text-its-secondary mb-2">
              <span>Progresso</span>
              <span>{Math.round(((currentQuestionIndex + 1) / shuffledQuestions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-its-red to-its-red-dark h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-h2 font-semibold text-its-text mb-6 leading-relaxed">
              {currentQuestion.question}
            </h2>

            {/* Answer options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`
                    w-full p-4 text-left rounded-its border-2 transition-all duration-200 
                    ${selectedAnswer === index
                      ? 'border-its-red bg-red-50 text-its-text'
                      : 'border-gray-200 bg-white hover:border-its-red hover:bg-red-50'
                    }
                    its-button
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center text-small font-semibold
                      ${selectedAnswer === index 
                        ? 'border-its-red bg-its-red text-white' 
                        : 'border-gray-300 text-gray-500'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="its-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Precedente
            </button>
            
            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="its-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastQuestion ? 'Completa Quiz' : 'Successiva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyQuizScreen;