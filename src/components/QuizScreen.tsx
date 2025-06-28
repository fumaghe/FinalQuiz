import React, { useState, useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { ArrowLeft, SkipForward, Eye, EyeOff, Globe } from 'lucide-react';
import { Question, QuizSession, AnsweredQuestion, QuizHistory } from '../types/quiz';

interface QuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizType: 'general' | 'topic' | 'custom';
  topicId?: string;
  topicName?: string;
  questionIds?: string[];
  title?: string;
}

interface ShuffledQuestion extends Question {
  shuffledOptions: string[];
  optionMapping: number[];
}

const QuizScreen: React.FC<QuizScreenProps> = ({ 
  onNavigate, 
  quizType, 
  topicId, 
  topicName, 
  questionIds,
  title 
}) => {
  const { state, dispatch } = useQuiz();
  const { questions, currentSession, topics } = state;
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

  // Shuffle options for a question
  const shuffleQuestionOptions = (question: Question): ShuffledQuestion => {
    const optionIndices = [0, 1, 2, 3];
    const shuffledIndices = [...optionIndices].sort(() => Math.random() - 0.5);
    
    return {
      ...question,
      shuffledOptions: shuffledIndices.map(i => question.options[i]),
      optionMapping: shuffledIndices
    };
  };

  useEffect(() => {
    if (!currentSession) {
      startNewQuiz();
    }
  }, []);

  useEffect(() => {
    if (currentSession && shuffledQuestions.length === 0) {
      const shuffled = currentSession.questions.map(shuffleQuestionOptions);
      setShuffledQuestions(shuffled);
    }
  }, [currentSession]);

  useEffect(() => {
    if (currentSession) {
      const currentAnswer = currentSession.answers[currentSession.currentIndex];
      if (currentAnswer !== null && currentAnswer !== -1) {
        setSelectedAnswer(currentAnswer);
        setShowFeedback(true);
        setIsAnswered(true);
      } else {
        setSelectedAnswer(null);
        setShowFeedback(false);
        setIsAnswered(false);
      }
    }
  }, [currentSession?.currentIndex]);

  const handleGoogleSearch = () => {
    if (!currentSession) return;
    const currentQuestion = currentSession.questions[currentSession.currentIndex];
    const searchQuery = currentQuestion.question.replace(/\s+/g, '+').replace(/[^\w+]/g, '');
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(googleUrl, '_blank');
  };

  const handleBackButton = () => {
    if (!currentSession) return;
    
    // Save current session state and mark as completed (even if incomplete)
    if (quizType === 'topic') {
      // Calculate current progress
      const answeredCount = currentSession.answers.filter(a => a !== null && a !== -1).length;
      let correctCount = 0;
      
      // Count correct answers
      currentSession.answers.forEach((answer, index) => {
        if (answer !== null && answer !== -1) {
          const question = currentSession.questions[index];
          if (answer === question.correct) {
            correctCount++;
          }
        }
      });

      // Update user stats for partially completed quiz
      const updatedAnsweredQuestions = { ...state.userStats.answeredQuestions };
      const updatedCorrectQuestions = { ...state.userStats.correctQuestions };
      const updatedIncorrectQuestions = { ...state.userStats.incorrectQuestions };
      const updatedStatsPerTopic = { ...state.userStats.statsPerTopic };

      currentSession.answers.forEach((answer, index) => {
        if (answer !== null && answer !== -1) {
          const question = currentSession.questions[index];
          const isCorrect = answer === question.correct;
          
          updatedAnsweredQuestions[question.id] = true;
          
          if (isCorrect) {
            updatedCorrectQuestions[question.id] = true;
            delete updatedIncorrectQuestions[question.id];
          } else {
            updatedIncorrectQuestions[question.id] = true;
          }

          // Update topic stats
          const topic = question.topic;
          if (!updatedStatsPerTopic[topic]) {
            const topicQuestions = questions.filter(q => q.topic === topic);
            updatedStatsPerTopic[topic] = { 
              done: 0, 
              correct: 0, 
              total: topicQuestions.length 
            };
          }
          
          if (!state.userStats.answeredQuestions[question.id]) {
            updatedStatsPerTopic[topic].done++;
          }
          
          if (isCorrect && !state.userStats.correctQuestions[question.id]) {
            updatedStatsPerTopic[topic].correct++;
          }
        }
      });

      // Create quiz history entry for partial completion
      if (answeredCount > 0) {
        const score = (correctCount / answeredCount) * 100;
        
        const answeredQuestions: AnsweredQuestion[] = [];
        currentSession.answers.forEach((answer, index) => {
          if (answer !== null && answer !== -1) {
            const question = currentSession.questions[index];
            answeredQuestions.push({
              questionId: question.id,
              question: question.question,
              options: question.options,
              userAnswer: answer,
              correctAnswer: question.correct,
              isCorrect: answer === question.correct,
              timestamp: new Date(),
              topic: question.topic,
              explanation: question.explanation
            });
          }
        });

        const quizHistoryEntry: QuizHistory = {
          id: currentSession.id + '_partial',
          quizType: 'topic',
          topicName: title || topicName,
          timestamp: new Date(),
          score,
          totalQuestions: answeredCount,
          correctAnswers: correctCount,
          answeredQuestions
        };

        const updatedStats = {
          ...state.userStats,
          totalQuestions: state.userStats.totalQuestions + answeredCount,
          correctAnswers: state.userStats.correctAnswers + correctCount,
          overallAccuracy: ((state.userStats.correctAnswers + correctCount) / (state.userStats.totalQuestions + answeredCount)) * 100,
          lastUpdated: new Date(),
          quizHistory: [...state.userStats.quizHistory, quizHistoryEntry],
          answeredQuestions: updatedAnsweredQuestions,
          correctQuestions: updatedCorrectQuestions,
          incorrectQuestions: updatedIncorrectQuestions,
          statsPerTopic: updatedStatsPerTopic
        };

        dispatch({ type: 'UPDATE_STATS', payload: updatedStats });
      }
    }
    
    // Clear current session to prevent blocking future quizzes
    dispatch({ type: 'END_QUIZ' });
    
    // Navigate back to appropriate screen
    if (quizType === 'topic') {
      onNavigate('topics');
    } else {
      onNavigate('dashboard');
    }
  };

  const startNewQuiz = ()=> {
    let quizQuestions: Question[] = [];
    
    if (quizType === 'general') {
      // Solo domande non ancora risposte correttamente - increased to 30
      const unansweredQuestions = questions.filter(q => !state.userStats.correctQuestions[q.id]);
      quizQuestions = [...unansweredQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
    } else if (quizType === 'topic' && topicId) {
      const topicQuestions = questions.filter(q => q.topic.toLowerCase() === topicId.toLowerCase());
      const unansweredTopicQuestions = topicQuestions.filter(q => !state.userStats.correctQuestions[q.id]);
      quizQuestions = unansweredTopicQuestions;
    } else if (quizType === 'custom' && questionIds) {
      quizQuestions = questions.filter(q => questionIds.includes(q.id));
    }

    if (quizQuestions.length === 0) {
      onNavigate('dashboard');
      return;
    }

    const newSession: QuizSession = {
      id: Date.now().toString(),
      questions: quizQuestions,
      currentIndex: 0,
      answers: new Array(quizQuestions.length).fill(null),
      startTime: new Date()
    };

    dispatch({ type: 'START_QUIZ', payload: newSession });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || !currentSession) return;
    setSelectedAnswer(answerIndex);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null || !currentSession || isAnswered) return;

    // Map the shuffled answer back to original index
    const shuffledQuestion = shuffledQuestions[currentSession.currentIndex];
    const originalAnswerIndex = shuffledQuestion ? shuffledQuestion.optionMapping[selectedAnswer] : selectedAnswer;

    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { 
        index: currentSession.currentIndex, 
        answer: originalAnswerIndex
      } 
    });

    setShowFeedback(true);
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (!currentSession) return;

    if (currentSession.currentIndex < currentSession.questions.length - 1) {
      const nextIndex = currentSession.currentIndex + 1;
      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          currentIndex: nextIndex
        }
      });
      setShowExplanation(true);
    } else {
      finishQuiz();
    }
  };

  const handleSkipQuestion = () => {
    if (!currentSession) return;
    
    if (quizType !== 'topic') return;
    
    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { 
        index: currentSession.currentIndex, 
        answer: -1
      } 
    });

    handleNextQuestion();
  };

  const finishQuiz = () => {
    if (!currentSession) return;

    const answeredQuestions: AnsweredQuestion[] = [];
    let correctCount = 0;

    // Aggiorna le statistiche per ogni domanda risposta
    const updatedAnsweredQuestions = { ...state.userStats.answeredQuestions };
    const updatedCorrectQuestions = { ...state.userStats.correctQuestions };
    const updatedIncorrectQuestions = { ...state.userStats.incorrectQuestions };
    const updatedStatsPerTopic = { ...state.userStats.statsPerTopic };

    currentSession.answers.forEach((answer, index) => {
      const question = currentSession.questions[index];
      const isCorrect = answer === question.correct;
      
      if (answer !== null && answer !== -1) {
        updatedAnsweredQuestions[question.id] = true;
        
        if (isCorrect) {
          correctCount++;
          updatedCorrectQuestions[question.id] = true;
          // Rimuovi dalle domande sbagliate se era presente
          delete updatedIncorrectQuestions[question.id];
        } else {
          updatedIncorrectQuestions[question.id] = true;
        }

        // Aggiorna statistiche per topic
        const topic = question.topic;
        if (!updatedStatsPerTopic[topic]) {
          const topicQuestions = questions.filter(q => q.topic === topic);
          updatedStatsPerTopic[topic] = { 
            done: 0, 
            correct: 0, 
            total: topicQuestions.length 
          };
        }
        
        // Solo se è la prima volta che rispondiamo a questa domanda
        if (!state.userStats.answeredQuestions[question.id]) {
          updatedStatsPerTopic[topic].done++;
        }
        
        // Aggiorna il conteggio delle risposte corrette per questo topic
        if (isCorrect && !state.userStats.correctQuestions[question.id]) {
          updatedStatsPerTopic[topic].correct++;
        } else if (!isCorrect && state.userStats.correctQuestions[question.id]) {
          // Se precedentemente era corretta e ora è sbagliata
          updatedStatsPerTopic[topic].correct = Math.max(0, updatedStatsPerTopic[topic].correct - 1);
        }

        answeredQuestions.push({
          questionId: question.id,
          question: question.question,
          options: question.options,
          userAnswer: answer,
          correctAnswer: question.correct,
          isCorrect,
          timestamp: new Date(),
          topic: question.topic,
          explanation: question.explanation
        });
      }
    });

    const score = (correctCount / currentSession.questions.length) * 100;

    const quizHistoryEntry: QuizHistory = {
      id: currentSession.id,
      quizType: quizType === 'custom' ? 'general' : quizType,
      topicName: title || topicName,
      timestamp: new Date(),
      score,
      totalQuestions: currentSession.questions.length,
      correctAnswers: correctCount,
      answeredQuestions
    };

    const updatedStats = {
      ...state.userStats,
      totalQuizzes: state.userStats.totalQuizzes + 1,
      totalQuestions: state.userStats.totalQuestions + currentSession.questions.length,
      correctAnswers: state.userStats.correctAnswers + correctCount,
      overallAccuracy: ((state.userStats.correctAnswers + correctCount) / (state.userStats.totalQuestions + currentSession.questions.length)) * 100,
      currentStreak: score >= 70 ? state.userStats.currentStreak + 1 : 0,
      bestStreak: Math.max(state.userStats.bestStreak, score >= 70 ? state.userStats.currentStreak + 1 : 0),
      lastUpdated: new Date(),
      quizHistory: [...state.userStats.quizHistory, quizHistoryEntry],
      answeredQuestions: updatedAnsweredQuestions,
      correctQuestions: updatedCorrectQuestions,
      incorrectQuestions: updatedIncorrectQuestions,
      statsPerTopic: updatedStatsPerTopic
    };

    dispatch({ type: 'UPDATE_STATS', payload: updatedStats });
    dispatch({ type: 'END_QUIZ' });

    onNavigate('results', { 
      score, 
      correctAnswers: correctCount, 
      totalQuestions: currentSession.questions.length,
      quizType,
      topicName,
      quizHistory: quizHistoryEntry
    });
  };

  if (!currentSession || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-apple-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-body text-apple-secondary">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = currentSession.questions[currentSession.currentIndex];
  const shuffledQuestion = shuffledQuestions[currentSession.currentIndex];
  const progress = ((currentSession.currentIndex + 1) / currentSession.questions.length) * 100;
  
  // Map the selected answer to check correctness using shuffled options
  const isCorrect = selectedAnswer !== null && shuffledQuestion 
    ? shuffledQuestion.optionMapping[selectedAnswer] === currentQuestion.correct
    : false;
  
  const topicInfo = topics.find(t => t.name === currentQuestion.topic);

  return (
    <div className="min-h-screen bg-apple-light flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="bg-apple-card shadow-apple-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          {/* Back button - only for topic quizzes */}
          {quizType === 'topic' ? (
            <button 
              onClick={handleBackButton}
              className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
            </button>
          ) : (
            <div className="w-6 sm:w-10"></div>
          )}
          
          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="text-sm sm:text-base font-medium truncate">
              {title || (quizType === 'general' ? 'Quiz Generale' : topicName)}
            </h1>
            <p className="text-xs text-apple-secondary">
              Domanda {currentSession.currentIndex + 1} di {currentSession.questions.length}
            </p>
          </div>
          <div className="w-6 sm:w-10"></div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-apple-light rounded-full h-1">
          <div 
            className="bg-apple-blue h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question Content */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Topic Label */}
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <span className="text-base sm:text-lg">{topicInfo?.icon || '📝'}</span>
          <span className="text-xs sm:text-sm text-apple-secondary font-medium truncate">
            {currentQuestion.topic}
          </span>
        </div>

        {/* Question Card */}
        <div className="apple-card p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg font-medium leading-relaxed flex-1">
              {currentQuestion.question}
            </h2>
            <button
              onClick={handleGoogleSearch}
              className="flex-shrink-0 p-2 rounded-full hover:bg-apple-light transition-colors text-apple-secondary hover:text-apple-blue"
              title="Cerca su Google"
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-2 sm:space-y-3">
          {shuffledQuestion.shuffledOptions.map((option, index) => {
            let buttonStyle = "w-full p-3 sm:p-4 rounded-apple border text-left transition-all apple-button ";
            
            if (showFeedback) {
              const originalCorrectIndex = shuffledQuestion.optionMapping.indexOf(currentQuestion.correct);
              if (index === originalCorrectIndex) {
                buttonStyle += "bg-apple-green text-white border-apple-green ";
              } else if (index === selectedAnswer && index !== originalCorrectIndex) {
                buttonStyle += "bg-apple-red text-white border-apple-red ";
              } else {
                buttonStyle += "bg-apple-light border-apple-border text-apple-secondary ";
              }
            } else if (selectedAnswer === index) {
              buttonStyle += "bg-apple-blue/10 border-apple-blue text-apple-blue ";
            } else {
              buttonStyle += "bg-apple-card border-apple-border text-apple-text hover:bg-apple-light ";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
                className={buttonStyle}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showFeedback && currentQuestion.explanation && (
          <div className="apple-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm sm:text-base font-medium text-apple-text">
                {isCorrect ? '✅ Corretto!' : '❌ Risposta errata'}
              </h3>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center space-x-1 text-apple-blue text-xs sm:text-sm"
              >
                {showExplanation ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span>{showExplanation ? 'Nascondi' : 'Mostra'}</span>
              </button>
            </div>
            {showExplanation && (
              <p className="text-sm text-apple-secondary leading-relaxed">
                {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-apple-card border-t border-apple-border px-4 sm:px-6 py-3 sm:py-4 sticky bottom-0">
        <div className="flex justify-between items-center">
          {/* Skip button - only for topic quizzes */}
          {quizType === 'topic' ? (
            <button
              onClick={handleSkipQuestion}
              disabled={isAnswered}
              className="flex items-center space-x-1 sm:space-x-2 text-apple-blue font-medium apple-button disabled:opacity-50 text-sm sm:text-base"
            >
              <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Salta</span>
            </button>
          ) : (
            <div></div>
          )}

          {!isAnswered ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              className="px-4 sm:px-6 py-2 sm:py-3 apple-button-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Conferma
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-4 sm:px-6 py-2 sm:py-3 apple-button-primary text-sm sm:text-base"
            >
              {currentSession.currentIndex < currentSession.questions.length - 1 ? 'Prossima' : 'Termina'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizScreen;
