import React, { useState, useEffect } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { ArrowLeft, SkipForward, Eye, EyeOff, Globe, RefreshCw } from 'lucide-react';
import {
  Question,
  QuizSession,
  AnsweredQuestion,
  QuizHistory
} from '../types/quiz';

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
  /* ------------------------------------------------------------------ */
  /* ⏺  Context e stato                                                 */
  /* ------------------------------------------------------------------ */
  const { state, dispatch } = useQuiz();
  const { questions, currentSession, topics } = state;

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

  /* ------------------------------------------------------------------ */
  /* 🔀  Shuffle opzioni di una singola domanda                         */
  /* ------------------------------------------------------------------ */
  const shuffleQuestionOptions = (question: Question): ShuffledQuestion => {
    const optionIndices = [0, 1, 2, 3];
    const shuffledIndices = [...optionIndices].sort(() => Math.random() - 0.5);

    return {
      ...question,
      shuffledOptions: shuffledIndices.map(i => question.options[i]),
      optionMapping: shuffledIndices
    };
  };

  /* ------------------------------------------------------------------ */
  /* 📦  Lifecycle                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!currentSession) startNewQuiz();
  }, []);

  useEffect(() => {
    if (currentSession && shuffledQuestions.length === 0) {
      setShuffledQuestions(currentSession.questions.map(shuffleQuestionOptions));
    }
  }, [currentSession]);

  useEffect(() => {
    if (!currentSession) return;
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
  }, [currentSession?.currentIndex]);

  /* ------------------------------------------------------------------ */
  /* 🔗  Ricerca Google                                                 */
  /* ------------------------------------------------------------------ */
  const handleGoogleSearch = () => {
    if (!currentSession) return;
    const currentQuestion = currentSession.questions[currentSession.currentIndex];
    const searchQuery = encodeURIComponent(currentQuestion.question);
    const googleUrl = `https://www.google.com/search?q=${searchQuery}`;
    window.open(googleUrl, '_blank');
  };

  /* ------------------------------------------------------------------ */
  /* ↩️  Back (per quiz “topic”)                                        */
  /* ------------------------------------------------------------------ */
  const handleBackButton = () => {
    if (!currentSession) return;

    /** Salvataggio stato parziale solo per quiz “topic” */
    if (quizType === 'topic') {
      const answeredCount = currentSession.answers.filter(
        a => a !== null && a !== -1
      ).length;
      let correctCount = 0;

      currentSession.answers.forEach((answer, index) => {
        if (answer !== null && answer !== -1) {
          if (answer === currentSession.questions[index].correct) correctCount++;
        }
      });

      const updatedAnsweredQuestions = { ...state.userStats.answeredQuestions };
      const updatedCorrectQuestions = { ...state.userStats.correctQuestions };
      const updatedIncorrectQuestions = { ...state.userStats.incorrectQuestions };
      const updatedStatsPerTopic = { ...state.userStats.statsPerTopic };

      currentSession.answers.forEach((answer, index) => {
        if (answer === null || answer === -1) return;
        const q = currentSession.questions[index];
        const isCorrect = answer === q.correct;

        updatedAnsweredQuestions[q.id] = true;

        if (isCorrect) {
          updatedCorrectQuestions[q.id] = true;
          delete updatedIncorrectQuestions[q.id];
        } else {
          updatedIncorrectQuestions[q.id] = true;
        }

        const topic = q.topic;
        if (!updatedStatsPerTopic[topic]) {
          const topicQs = questions.filter(qq => qq.topic === topic);
          updatedStatsPerTopic[topic] = {
            done: 0,
            correct: 0,
            total: topicQs.length
          };
        }

        if (!state.userStats.answeredQuestions[q.id]) {
          updatedStatsPerTopic[topic].done++;
        }

        if (isCorrect && !state.userStats.correctQuestions[q.id]) {
          updatedStatsPerTopic[topic].correct++;
        }
      });

      if (answeredCount > 0) {
        const score = (correctCount / answeredCount) * 100;

        const answeredQuestions: AnsweredQuestion[] = [];
        currentSession.answers.forEach((answer, index) => {
          if (answer === null || answer === -1) return;
          const q = currentSession.questions[index];
          answeredQuestions.push({
            questionId: q.id,
            question: q.question,
            options: q.options,
            userAnswer: answer,
            correctAnswer: q.correct,
            isCorrect: answer === q.correct,
            timestamp: new Date(),
            topic: q.topic,
            explanation: q.explanation
          });
        });

        const quizHistoryEntry: QuizHistory = {
          id: `${currentSession.id}_partial`,
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
          overallAccuracy:
            ((state.userStats.correctAnswers + correctCount) /
              (state.userStats.totalQuestions + answeredCount)) *
            100,
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

    dispatch({ type: 'END_QUIZ' });
    onNavigate(quizType === 'topic' ? 'topics' : 'dashboard');
  };

  /* ------------------------------------------------------------------ */
  /* 🚀  startNewQuiz                                                   */
  /* ------------------------------------------------------------------ */
  const startNewQuiz = () => {
    let quizQuestions: Question[] = [];

    /* === QUIZ GENERALE → MODIFICA 1 (quote fisse) =================== */
    if (quizType === 'general') {
      const quotaPerTopic: Record<string, number> = {
        SQL: 3,
        Statistica: 3,
        Tableau: 2,
        Databricks: 2,
        DataLake2: 1,
        Git: 1,
        NoSQL: 3,
        PowerBI: 3,
        Python: 4,
        R: 2,
        ML: 3,
        DeepLearning: 3
      };

      const unanswered = questions.filter(
        q => !state.userStats.correctQuestions[q.id]
      );
      const chosen: Question[] = [];
      const usedIds = new Set<string>();

      Object.entries(quotaPerTopic).forEach(([topic, qty]) => {
        const pool = unanswered.filter(
          q => q.topic === topic && !usedIds.has(q.id)
        );
        const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, qty);
        picked.forEach(q => usedIds.add(q.id));
        chosen.push(...picked);
      });

      if (chosen.length < 30) {
        const filler = unanswered
          .filter(q => !usedIds.has(q.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 30 - chosen.length);
        chosen.push(...filler);
      }

      quizQuestions = [...chosen]
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);
    }

    /* === QUIZ PER ARGOMENTO ======================================== */
    else if (quizType === 'topic' && topicId) {
      const topicQs = questions.filter(
        q => q.topic.toLowerCase() === topicId.toLowerCase()
      );
      quizQuestions = topicQs.filter(q => !state.userStats.correctQuestions[q.id]);
    }

    /* === QUIZ CUSTOM =============================================== */
    else if (quizType === 'custom' && questionIds) {
      quizQuestions = questions.filter(q => questionIds.includes(q.id));
    }

    /* Nessuna domanda → torna a dashboard */
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

  /* ------------------------------------------------------------------ */
  /* ✅  Gestione risposte                                              */
  /* ------------------------------------------------------------------ */
  const handleAnswerSelect = (answerIndex: number) => {
    if (isAnswered || !currentSession) return;
    setSelectedAnswer(answerIndex);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null || !currentSession || isAnswered) return;

    const shuffledQuestion = shuffledQuestions[currentSession.currentIndex];
    const originalAnswerIndex =
      shuffledQuestion.optionMapping[selectedAnswer];

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
      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          currentIndex: currentSession.currentIndex + 1
        }
      });
      setShowExplanation(true);
    } else {
      finishQuiz();
    }
  };

  const handleSkipQuestion = () => {
    if (!currentSession || quizType !== 'topic') return;

    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { index: currentSession.currentIndex, answer: -1 }
    });

    handleNextQuestion();
  };

  const finishQuiz = () => {
    if (!currentSession) return;

    const answeredQuestions: AnsweredQuestion[] = [];
    let correctCount = 0;

    const updatedAnsweredQuestions = {
      ...state.userStats.answeredQuestions
    };
    const updatedCorrectQuestions = {
      ...state.userStats.correctQuestions
    };
    const updatedIncorrectQuestions = {
      ...state.userStats.incorrectQuestions
    };
    const updatedStatsPerTopic = { ...state.userStats.statsPerTopic };

    currentSession.answers.forEach((answer, index) => {
      const q = currentSession.questions[index];
      const isCorrect = answer === q.correct;

      if (answer !== null && answer !== -1) {
        updatedAnsweredQuestions[q.id] = true;

        if (isCorrect) {
          correctCount++;
          updatedCorrectQuestions[q.id] = true;
          delete updatedIncorrectQuestions[q.id];
        } else {
          updatedIncorrectQuestions[q.id] = true;
        }

        const topic = q.topic;
        if (!updatedStatsPerTopic[topic]) {
          const topicQs = questions.filter(qq => qq.topic === topic);
          updatedStatsPerTopic[topic] = {
            done: 0,
            correct: 0,
            total: topicQs.length
          };
        }

        if (!state.userStats.answeredQuestions[q.id]) {
          updatedStatsPerTopic[topic].done++;
        }

        if (isCorrect && !state.userStats.correctQuestions[q.id]) {
          updatedStatsPerTopic[topic].correct++;
        } else if (
          !isCorrect &&
          state.userStats.correctQuestions[q.id]
        ) {
          updatedStatsPerTopic[topic].correct = Math.max(
            0,
            updatedStatsPerTopic[topic].correct - 1
          );
        }

        answeredQuestions.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer: answer,
          correctAnswer: q.correct,
          isCorrect,
          timestamp: new Date(),
          topic: q.topic,
          explanation: q.explanation
        });
      }
    });

    const score =
      (correctCount / currentSession.questions.length) * 100;

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
      totalQuestions:
        state.userStats.totalQuestions + currentSession.questions.length,
      correctAnswers:
        state.userStats.correctAnswers + correctCount,
      overallAccuracy:
        ((state.userStats.correctAnswers + correctCount) /
          (state.userStats.totalQuestions +
            currentSession.questions.length)) *
        100,
      currentStreak:
        score >= 70 ? state.userStats.currentStreak + 1 : 0,
      bestStreak: Math.max(
        state.userStats.bestStreak,
        score >= 70 ? state.userStats.currentStreak + 1 : 0
      ),
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

  /* ------------------------------------------------------------------ */
  /* ♻️  handleReplaceQuestion  →  MODIFICA 2 (+ estensione topic)      */
  /* ------------------------------------------------------------------ */
  const handleReplaceQuestion = () => {
    if (!currentSession || isAnswered) return;

    const currentQ = currentSession.questions[currentSession.currentIndex];
    const usedIds = new Set(currentSession.questions.map(q => q.id));

    // Pool di domande alternative per lo stesso argomento
    const pool = questions.filter(
      q =>
        q.topic === currentQ.topic &&
        !state.userStats.correctQuestions[q.id] &&
        !usedIds.has(q.id)
    );

    /* ---------- Caso 1: alternativa disponibile ---------- */
    if (pool.length > 0) {
      const newQ =
        pool[Math.floor(Math.random() * pool.length)];

      const newQuestions = [...currentSession.questions];
      const newAnswers = [...currentSession.answers];
      const newShuffled = [...shuffledQuestions];

      newQuestions[currentSession.currentIndex] = newQ;
      newAnswers[currentSession.currentIndex] = null;
      newShuffled[currentSession.currentIndex] =
        shuffleQuestionOptions(newQ);

      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsAnswered(false);
      setShowExplanation(true);
      setShuffledQuestions(newShuffled);

      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          questions: newQuestions,
          answers: newAnswers
        }
      });
      return;
    }

    /* ---------- Caso 2: nessuna alternativa ---------- */
    if (quizType === 'topic') {
      // Rimuove la domanda corrente
      const newQuestions = currentSession.questions.filter(
        (_, i) => i !== currentSession.currentIndex
      );
      const newAnswers = currentSession.answers.filter(
        (_, i) => i !== currentSession.currentIndex
      );
      const newShuffled = shuffledQuestions.filter(
        (_, i) => i !== currentSession.currentIndex
      );

      // Se non restano domande, chiude il quiz
      if (newQuestions.length === 0) {
        finishQuiz();
        return;
      }

      const newIndex = Math.min(
        currentSession.currentIndex,
        newQuestions.length - 1
      );

      setSelectedAnswer(null);
      setShowFeedback(false);
      setIsAnswered(false);
      setShowExplanation(true);
      setShuffledQuestions(newShuffled);

      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          questions: newQuestions,
          answers: newAnswers,
          currentIndex: newIndex
        }
      });
    } else {
      // Quiz generale o custom: avvisa l’utente (caso raro)
      window.alert(
        'Nessuna altra domanda disponibile per questo argomento.'
      );
    }
  };

  /* ------------------------------------------------------------------ */
  /* ⏳  Loading                                                        */
  /* ------------------------------------------------------------------ */
  if (!currentSession || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-apple-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-body text-apple-secondary">
            Caricamento quiz...
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* 🎨  Render                                                         */
  /* ------------------------------------------------------------------ */
  const currentQuestion = currentSession.questions[currentSession.currentIndex];
  const shuffledQuestion = shuffledQuestions[currentSession.currentIndex];
  const progress =
    ((currentSession.currentIndex + 1) /
      currentSession.questions.length) *
    100;
  const isCorrect =
    selectedAnswer !== null && shuffledQuestion
      ? shuffledQuestion.optionMapping[selectedAnswer] ===
        currentQuestion.correct
      : false;
  const topicInfo = topics.find(t => t.name === currentQuestion.topic);

  return (
    <div className="min-h-screen bg-apple-light flex flex-col overflow-x-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* ---------------------------------------------------------------- */}
      <header className="bg-apple-card shadow-apple-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          {quizType === 'topic' ? (
            <button
              onClick={handleBackButton}
              className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
            </button>
          ) : (
            <div className="w-6 sm:w-10" />
          )}

          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="text-sm sm:text-base font-medium truncate">
              {title ||
                (quizType === 'general'
                  ? 'Quiz Generale'
                  : topicName)}
            </h1>
            <p className="text-xs text-apple-secondary">
              Domanda {currentSession.currentIndex + 1} di{' '}
              {currentSession.questions.length}
            </p>
          </div>
          <div className="w-6 sm:w-10" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-apple-light rounded-full h-1">
          <div
            className="bg-apple-blue h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Contenuto domanda                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Topic label */}
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <span className="text-base sm:text-lg">
            {topicInfo?.icon || '📝'}
          </span>
          <span className="text-xs sm:text-sm text-apple-secondary font-medium truncate">
            {currentQuestion.topic}
          </span>
        </div>

        {/* Card domanda */}
        <div className="apple-card p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <h2 className="text-base sm:text-lg font-medium leading-relaxed flex-1">
              {currentQuestion.question}
            </h2>

            {/* Pulsanti azione */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleGoogleSearch}
                className="flex-shrink-0 p-2 rounded-full hover:bg-apple-light transition-colors text-apple-secondary hover:text-apple-blue"
                title="Cerca su Google"
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {!isAnswered && (
                <button
                  onClick={handleReplaceQuestion}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-apple-light transition-colors text-apple-secondary hover:text-apple-blue"
                  title="Sostituisci domanda"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Opzioni risposta */}
        <div className="space-y-2 sm:space-y-3">
          {shuffledQuestion.shuffledOptions.map((opt, idx) => {
            let btnStyle =
              'w-full p-3 sm:p-4 rounded-apple border text-left transition-all apple-button ';

            if (showFeedback) {
              const corrIdx =
                shuffledQuestion.optionMapping.indexOf(
                  currentQuestion.correct
                );
              if (idx === corrIdx) {
                btnStyle +=
                  'bg-apple-green text-white border-apple-green ';
              } else if (
                idx === selectedAnswer &&
                idx !== corrIdx
              ) {
                btnStyle +=
                  'bg-apple-red text-white border-apple-red ';
              } else {
                btnStyle +=
                  'bg-apple-light border-apple-border text-apple-secondary ';
              }
            } else if (selectedAnswer === idx) {
              btnStyle +=
                'bg-apple-blue/10 border-apple-blue text-apple-blue ';
            } else {
              btnStyle +=
                'bg-apple-card border-apple-border text-apple-text hover:bg-apple-light ';
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={isAnswered}
                className={btnStyle}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Spiegazione */}
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
                {showExplanation ? (
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span>
                  {showExplanation ? 'Nascondi' : 'Mostra'}
                </span>
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

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="mt-6 mb-32 flex justify-center gap-4">
        {quizType === 'topic' && (
          <button
            onClick={handleSkipQuestion}
            disabled={isAnswered}
            className="flex items-center space-x-1 sm:space-x-2 text-apple-blue font-medium apple-button disabled:opacity-50 text-sm sm:text-base"
          >
            <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Salta</span>
          </button>
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
            {currentSession.currentIndex <
            currentSession.questions.length - 1
              ? 'Prossima'
              : 'Termina'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
