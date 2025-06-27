import React, { useState, useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { ArrowLeft, SkipForward, Eye, EyeOff } from 'lucide-react';
import { Question, QuizSession, AnsweredQuestion, QuizHistory } from '../types/quiz';

interface QuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizType: 'general' | 'topic' | 'custom';
  topicId?: string;
  topicName?: string;
  questionIds?: string[];
  title?: string;
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

  useEffect(() => {
    if (!currentSession) {
      startNewQuiz();
    }
  }, []);

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

  const startNewQuiz = () => {
    let quizQuestions: Question[] = [];
    
    if (quizType === 'general') {
      // Solo domande non ancora risposte correttamente
      const unansweredQuestions = questions.filter(q => !state.userStats.correctQuestions[q.id]);
      quizQuestions = [...unansweredQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
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

    // Record the answer - fix the comparison bug by ensuring both are numbers
    dispatch({ 
      type: 'ANSWER_QUESTION', 
      payload: { 
        index: currentSession.currentIndex, 
        answer: selectedAnswer 
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
          userAnswer: answer,
          correctAnswer: question.correct,
          isCorrect,
          timestamp: new Date(),
          topic: question.topic
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

  if (!currentSession) {
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
  const progress = ((currentSession.currentIndex + 1) / currentSession.questions.length) * 100;
  const isCorrect = selectedAnswer === currentQuestion.correct;
  const topicInfo = topics.find(t => t.name === currentQuestion.topic);

  return (
    <div className="min-h-screen bg-apple-light flex flex-col">
      {/* Header */}
      <header className="bg-apple-card shadow-apple-card px-apple-2x py-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-apple-blue" />
          </button>
          <div className="text-center">
            <h1 className="text-h3 font-medium">
              {title || (quizType === 'general' ? 'Quiz Generale' : topicName)}
            </h1>
            <p className="text-caption text-apple-secondary">
              Domanda {currentSession.currentIndex + 1} di {currentSession.questions.length}
            </p>
          </div>
          <div className="w-10"></div>
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
      <div className="flex-1 px-apple-2x py-6 space-y-6">
        {/* Topic Label */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-lg">{topicInfo?.icon || '📝'}</span>
          <span className="text-caption text-apple-secondary font-medium">
            {currentQuestion.topic}
          </span>
        </div>

        {/* Question Card */}
        <div className="apple-card p-6">
          <h2 className="text-h2 font-medium leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            let buttonStyle = "w-full p-4 rounded-apple border text-left transition-all apple-button ";
            
            if (showFeedback) {
              if (index === currentQuestion.correct) {
                buttonStyle += "bg-apple-green text-white border-apple-green ";
              } else if (index === selectedAnswer && index !== currentQuestion.correct) {
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
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                    <span className="text-caption font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="text-body">{option}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showFeedback && currentQuestion.explanation && (
          <div className="apple-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-h3 font-medium text-apple-text">
                {isCorrect ? '✅ Corretto!' : '❌ Risposta errata'}
              </h3>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center space-x-1 text-apple-blue text-caption"
              >
                {showExplanation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showExplanation ? 'Nascondi' : 'Mostra'}</span>
              </button>
            </div>
            {showExplanation && (
              <p className="text-body text-apple-secondary leading-relaxed">
                {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-apple-card border-t border-apple-border px-apple-2x py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkipQuestion}
            disabled={isAnswered}
            className="flex items-center space-x-2 text-apple-blue font-medium apple-button disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            <span className="text-caption">Salta</span>
          </button>

          {!isAnswered ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              className="px-6 py-3 apple-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Conferma
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 apple-button-primary"
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
