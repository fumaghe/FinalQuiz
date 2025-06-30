// src/components/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import {
  Question,
  QuizSession,
  AnsweredQuestion,
  QuizHistory,
} from '../types/quiz';
import {
  shuffleQuestionOptions,
  ShuffledQuestion,
} from '../utils/shuffleQuestionOptions';
import { QuestionHeader } from './QuestionHeader';
import { QuestionContent } from './QuestionContent';
import { AnswerOptions } from './AnswerOptions';
import { Explanation } from './Explanation';
import { QuizFooter } from './QuizFooter';
import { TimerDisplay } from './TimerDisplay';

/* ------------------------------------------------------------------ */
/* HELPERS (per Quiz Inversi)                                         */
/* ------------------------------------------------------------------ */
function buildReverseOptions(
  base: Question,
  pool: Question[]
): { options: string[]; correctIndex: number } {
  const distractors = pool
    .filter((q) => q.id !== base.id && q.correct !== undefined)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((q) => q.question);

  const all = [...distractors, base.question].sort(() => Math.random() - 0.5);
  return { options: all, correctIndex: all.indexOf(base.question) };
}

/* ------------------------------------------------------------------ */
/* CONFIG MODALITÀ TEMPO                                              */
/* ------------------------------------------------------------------ */
const TOTAL_TIME = 360;
const PENALTY = 10;
const BONUS_3 = 10;
const FURY_COUNT = 3;

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */
interface QuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizType:
    | 'general'
    | 'topic'
    | 'custom'
    | 'forYou'
    | 'timed'
    | 'streak'
    | 'reverse';
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
  title,
}) => {
  /* ------------------------------------------------------------------ */
  /* ⏺  Context e stato                                                 */
  /* ------------------------------------------------------------------ */
  const { state, dispatch } = useQuiz();
  const { questions, currentSession, topics, userStats } = state;

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<
    ShuffledQuestion[]
  >([]);

  const isTimed = quizType === 'timed';
  const isStreak = quizType === 'streak';
  const isReverse = quizType === 'reverse';

  const [timeLeft, setTimeLeft] = useState<number>(TOTAL_TIME);
  const [streak, setStreak] = useState<number>(0);
  const [furyRemaining, setFuryRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();

  /* ------------------------------------------------------------------ */
  /* 📦  Lifecycle                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!currentSession) startNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isTimed || !currentSession) return;
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [currentSession, isTimed]);

  useEffect(() => {
    if (currentSession && shuffledQuestions.length === 0) {
      setShuffledQuestions(currentSession.questions.map(shuffleQuestionOptions));
    }
  }, [currentSession, shuffledQuestions.length]);

  useEffect(() => {
    if (!currentSession) return;
    const ans = currentSession.answers[currentSession.currentIndex];
    if (ans !== null && ans !== -1 && shuffledQuestions.length > 0) {
      const sh = shuffledQuestions[currentSession.currentIndex];
      setSelectedAnswer(sh.optionMapping.indexOf(ans));
      setShowFeedback(true);
    } else {
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentSession, shuffledQuestions]);

  /* ------------------------------------------------------------------ */
  /* 🔗  Ricerca Google                                                 */
  /* ------------------------------------------------------------------ */
  const handleGoogleSearch = () => {
    if (!currentSession) return;
    const q = currentSession.questions[currentSession.currentIndex].question;
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(q)}`,
      '_blank'
    );
  };

  /* ------------------------------------------------------------------ */
  /* Salvataggio stato parziale quiz topic                              */
  /* ------------------------------------------------------------------ */
  const savePartialTopic = () => {
    if (!currentSession) return;

    const answeredCount = currentSession.answers.filter(
      (a) => a !== null && a !== -1
    ).length;
    if (answeredCount === 0) return;

    let correctCount = 0;
    const updatedAnswered = { ...userStats.answeredQuestions };
    const updatedCorrect = { ...userStats.correctQuestions };
    const updatedIncorrect = { ...userStats.incorrectQuestions };
    const updatedStatsTop = { ...userStats.statsPerTopic };
    const answeredArr: AnsweredQuestion[] = [];

    currentSession.answers.forEach((ans, idx) => {
      if (ans === null || ans === -1) return;
      const q = currentSession.questions[idx];
      const ok = ans === q.correct;
      answeredArr.push({
        questionId: q.id,
        question: q.question,
        options: q.options,
        userAnswer: ans,
        correctAnswer: q.correct,
        isCorrect: ok,
        timestamp: new Date(),
        topic: q.topic,
        explanation: q.explanation,
      });

      updatedAnswered[q.id] = true;
      if (ok) {
        correctCount++;
        updatedCorrect[q.id] = true;
        delete updatedIncorrect[q.id];
      } else {
        updatedIncorrect[q.id] = true;
      }

      if (!updatedStatsTop[q.topic]) {
        const tQs = questions.filter((qq) => qq.topic === q.topic);
        updatedStatsTop[q.topic] = {
          done: 0,
          correct: 0,
          total: tQs.length,
        };
      }
      if (!userStats.answeredQuestions[q.id]) updatedStatsTop[q.topic].done++;
      if (ok && !userStats.correctQuestions[q.id])
        updatedStatsTop[q.topic].correct++;
    });

    const quizHistoryEntry: QuizHistory = {
      id: `${currentSession.id}_partial`,
      quizType: 'topic',
      topicName: title || topicName,
      timestamp: new Date(),
      score: (correctCount / answeredCount) * 100,
      totalQuestions: answeredCount,
      correctAnswers: correctCount,
      answeredQuestions: answeredArr,
    };

    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...userStats,
        totalQuestions: userStats.totalQuestions + answeredCount,
        correctAnswers: userStats.correctAnswers + correctCount,
        overallAccuracy:
          ((userStats.correctAnswers + correctCount) /
            (userStats.totalQuestions + answeredCount)) *
          100,
        lastUpdated: new Date(),
        quizHistory: [...userStats.quizHistory, quizHistoryEntry],
        answeredQuestions: updatedAnswered,
        correctQuestions: updatedCorrect,
        incorrectQuestions: updatedIncorrect,
        statsPerTopic: updatedStatsTop,
      },
    });
  };

  /* ------------------------------------------------------------------ */
  /* ↩️  Back                                                           */
  /* ------------------------------------------------------------------ */
  const handleBack = () => {
    if (quizType === 'topic') savePartialTopic();
    clearInterval(timerRef.current!);
    dispatch({ type: 'END_QUIZ' });
    onNavigate(quizType === 'topic' ? 'topics' : 'dashboard');
  };

  /* ------------------------------------------------------------------ */
  /* 🚀  startNewQuiz                                                   */
  /* ------------------------------------------------------------------ */
  const startNewQuiz = () => {
    let quizQuestions: Question[] = [];

    /* === Sfida a Tempo ============================================ */
    if (isTimed) {
      quizQuestions = [...questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);
    }

    /* === Streak Quiz (1 domanda iniziale) ========================= */
    else if (isStreak) {
      quizQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 1);
    }

    /* === Quiz Inversi ============================================ */
    else if (isReverse) {
      const base = [...questions].sort(() => Math.random() - 0.5).slice(0, 30);
      quizQuestions = base.map((q) => {
        const { options, correctIndex } = buildReverseOptions(q, questions);
        return {
          ...q,
          question: q.options[q.correct], // Mostro la risposta
          options,
          correct: correctIndex,
        };
      });
    }

    /* === Altri tipi (generale, topic, custom, forYou) =============== */
    else if (quizType === 'general') {
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
        DeepLearning: 3,
      };
      const unanswered = questions.filter(
        (q) => !userStats.correctQuestions[q.id]
      );
      const chosen: Question[] = [];
      const used = new Set<string>();

      Object.entries(quotaPerTopic).forEach(([topic, qty]) => {
        const pool = unanswered.filter(
          (q) => q.topic === topic && !used.has(q.id)
        );
        const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, qty);
        pick.forEach((q) => used.add(q.id));
        chosen.push(...pick);
      });

      if (chosen.length < 30) {
        const filler = unanswered
          .filter((q) => !used.has(q.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 30 - chosen.length);
        chosen.push(...filler);
      }

      quizQuestions = chosen.slice(0, 30);
    } else if (quizType === 'topic' && topicId) {
      /* ❶ tutte le domande del topic scelto                           */
      const topicQs = questions.filter(
        (q) => q.topic.toLowerCase() === topicId.toLowerCase(),
      );

      /* ❷ scartiamo SOLO quelle già risposte correttamente             */
      const pool = topicQs.filter((q) => !userStats.correctQuestions[q.id]);

      /* ❸ shuffle + take all (pool può essere < 30)                    */
      quizQuestions = [...pool].sort(() => Math.random() - 0.5);
    } else if (quizType === 'custom' && questionIds) {
      quizQuestions = questions.filter((q) => questionIds.includes(q.id));
    } else if (quizType === 'forYou') {
      const weights = Object.entries(userStats.statsPerTopic)
        .map(([topic, s]) => {
          const precision = s.done > 0 ? (s.correct / s.done) * 100 : 0;
          const w = precision < 70 ? 5 : precision < 90 ? 3 : 0;
          return { topic, w };
        })
        .filter((w) => w.w > 0);
      const buckets: string[] = [];
      weights.forEach(({ topic, w }) => {
        for (let i = 0; i < w; i++) buckets.push(topic);
      });
      const poolByTopic: Record<string, Question[]> = {};
      weights.forEach(
        ({ topic }) => (poolByTopic[topic] = questions.filter((q) => q.topic === topic))
      );

      const picked: Question[] = [];
      const usedIds = new Set<string>();
      while (picked.length < 30 && buckets.length) {
        const t = buckets[Math.floor(Math.random() * buckets.length)];
        const cand = poolByTopic[t].filter((q) => !usedIds.has(q.id));
        if (!cand.length) {
          buckets.splice(buckets.indexOf(t), 1);
          continue;
        }
        const q = cand[Math.floor(Math.random() * cand.length)];
        usedIds.add(q.id);
        picked.push(q);
      }
      if (picked.length < 30) {
        picked.push(
          ...questions.filter((q) => !usedIds.has(q.id)).slice(0, 30 - picked.length)
        );
      }
      quizQuestions = picked;
    }

    /* Nessuna domanda → torna a dashboard */
    if (quizQuestions.length === 0) {
      onNavigate('dashboard');
      return;
    }

    const newSession: QuizSession = {
      id: Date.now().toString(),
      quizType,
      questions: quizQuestions,
      currentIndex: 0,
      answers: new Array(quizQuestions.length).fill(null),
      startTime: new Date(),
    };
    dispatch({ type: 'START_QUIZ', payload: newSession });

    /* reset timer/streak se timed */
    if (isTimed) {
      clearInterval(timerRef.current!);
      setTimeLeft(TOTAL_TIME);
      setStreak(0);
      setFuryRemaining(0);
    }
  };

  /* ------------------------------------------------------------------ */
  /* ✅  Gestione risposte                                              */
  /* ------------------------------------------------------------------ */
  const handleSelect = (idx: number) => {
    if (showFeedback || !currentSession) return;
    setSelectedAnswer(idx);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null || !currentSession || showFeedback) return;

    const sh = shuffledQuestions[currentSession.currentIndex];
    const original = sh.optionMapping[selectedAnswer];
    const isCorrect =
      original === currentSession.questions[currentSession.currentIndex].correct;

    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { index: currentSession.currentIndex, answer: original },
    });

    /* ----- Modalità timed: penalità / bonus ------------------ */
    if (isTimed) {
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        if (newStreak === 3)
          setTimeLeft((t) => Math.min(TOTAL_TIME, t + BONUS_3));
        if (newStreak === 5) setFuryRemaining(FURY_COUNT);
      } else {
        setStreak(0);
        if (furyRemaining === 0)
          setTimeLeft((t) => Math.max(0, t - PENALTY));
      }
      if (furyRemaining > 0) setFuryRemaining((f) => f - 1);
    }

    /* ----- Modalità streak: termina se errore -------------- */
    if (isStreak && !isCorrect) {
      setShowFeedback(true);
      setTimeout(() => finishQuiz(), 800);
      return;
    }

    setShowFeedback(true);
  };

  /* ------------------------------------------------------------------ */
  /* NEXT / SKIP                                                        */
  /* ------------------------------------------------------------------ */
  const handleNext = () => {
    if (!currentSession) return;

    /* === Streak: se corretto, aggiungi una nuova domanda random === */
    if (isStreak) {
      const wasCorrect =
        currentSession.answers[currentSession.currentIndex] ===
        currentSession.questions[currentSession.currentIndex].correct;
      if (!wasCorrect) return; // non dovrebbe accadere (gestito sopra)

      const usedIds = new Set(currentSession.questions.map((q) => q.id));
      const pool = questions.filter((q) => !usedIds.has(q.id));
      if (pool.length === 0) {
        finishQuiz();
        return;
      }
      const newQ = pool[Math.floor(Math.random() * pool.length)];

      const newQs = [...currentSession.questions, newQ];
      const newAns = [...currentSession.answers, null];
      const newSh = [...shuffledQuestions, shuffleQuestionOptions(newQ)];
      setShuffledQuestions(newSh);

      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          questions: newQs,
          answers: newAns,
          currentIndex: currentSession.currentIndex + 1,
        },
      });
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowExplanation(true);
      return;
    }

    /* === Altri quiz === */
    const nextIdx = currentSession.currentIndex + 1;
    if (nextIdx < currentSession.questions.length) {
      dispatch({
        type: 'START_QUIZ',
        payload: { ...currentSession, currentIndex: nextIdx },
      });
      setShowExplanation(true);
    } else {
      finishQuiz();
    }
  };

  const handleSkip = () => {
    if (!currentSession || quizType !== 'topic') return;
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { index: currentSession.currentIndex, answer: -1 },
    });
    handleNext();
  };

  /* ------------------------------------------------------------------ */
  /* ♻️  Sostituzione domanda (identico alla tua versione)              */
  /* ------------------------------------------------------------------ */
  const handleReplaceQuestion = () => {
    if (!currentSession || showFeedback) return;

    const currentQ = currentSession.questions[currentSession.currentIndex];
    const usedIds = new Set(currentSession.questions.map((q) => q.id));
    const pool = questions.filter(
      (q) =>
        q.topic === currentQ.topic &&
        !userStats.correctQuestions[q.id] &&
        !usedIds.has(q.id)
    );

    if (pool.length) {
      const newQ = pool[Math.floor(Math.random() * pool.length)];
      const newQs = [...currentSession.questions];
      const newAns = [...currentSession.answers];
      const newSh = [...shuffledQuestions];

      newQs[currentSession.currentIndex] = newQ;
      newAns[currentSession.currentIndex] = null;
      newSh[currentSession.currentIndex] = shuffleQuestionOptions(newQ);

      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowExplanation(true);
      setShuffledQuestions(newSh);

      dispatch({
        type: 'START_QUIZ',
        payload: { ...currentSession, questions: newQs, answers: newAns },
      });
      return;
    }

    if (quizType === 'topic') {
      const newQs = currentSession.questions.filter(
        (_, i) => i !== currentSession.currentIndex
      );
      const newAns = currentSession.answers.filter(
        (_, i) => i !== currentSession.currentIndex
      );
      const newSh = shuffledQuestions.filter(
        (_, i) => i !== currentSession.currentIndex
      );

      if (!newQs.length) {
        finishQuiz();
        return;
      }

      const newIdx = Math.min(
        currentSession.currentIndex,
        newQs.length - 1
      );
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowExplanation(true);
      setShuffledQuestions(newSh);

      dispatch({
        type: 'START_QUIZ',
        payload: {
          ...currentSession,
          questions: newQs,
          answers: newAns,
          currentIndex: newIdx,
        },
      });
    } else {
      window.alert('Nessuna altra domanda disponibile per questo argomento.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🏁  finishQuiz                                                     */
  /* ------------------------------------------------------------------ */
  const finishQuiz = () => {
    clearInterval(timerRef.current!); // stop timer
    if (!currentSession) return;

    /* ---- raccolta risultati (come tua versione) ------------------- */
    const answered: AnsweredQuestion[] = [];
    let correctCount = 0;
    currentSession.answers.forEach((ans, idx) => {
      const q = currentSession.questions[idx];
      const ok = ans === q.correct;
      if (ans !== null && ans !== -1) {
        if (ok) correctCount++;
        answered.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer: ans,
          correctAnswer: q.correct,
          isCorrect: ok,
          timestamp: new Date(),
          topic: q.topic,
          explanation: q.explanation,
        });
      }
    });
    const score =
      (correctCount / currentSession.questions.length) * 100;

    const historyEntry: QuizHistory = {
      id: currentSession.id,
      quizType,
      topicName: title || topicName,
      timestamp: new Date(),
      score,
      totalQuestions: currentSession.questions.length,
      correctAnswers: correctCount,
      answeredQuestions: answered,
      timeTaken: isTimed ? TOTAL_TIME - timeLeft : undefined,
      streakCount: isStreak ? correctCount : undefined,
    };

    /* ---- aggiorna stats utente (semplificato) --------------------- */
    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...userStats,
        totalQuizzes: userStats.totalQuizzes + 1,
        totalQuestions:
          userStats.totalQuestions + currentSession.questions.length,
        correctAnswers: userStats.correctAnswers + correctCount,
        overallAccuracy:
          ((userStats.correctAnswers + correctCount) /
            (userStats.totalQuestions + currentSession.questions.length)) *
          100,
        lastUpdated: new Date(),
        quizHistory: [...userStats.quizHistory, historyEntry],
        bestSuddenDeath: isStreak
          ? Math.max(userStats.bestSuddenDeath || 0, correctCount)
          : userStats.bestSuddenDeath,
      },
    });
    dispatch({ type: 'END_QUIZ' });

    onNavigate('results', {
      score,
      correctAnswers: correctCount,
      totalQuestions: currentSession.questions.length,
      quizType,
      topicName,
      quizHistory: historyEntry,
      timeLeft,
      streakCount: isStreak ? correctCount : undefined,
    });
  };

  /* ------------------------------------------------------------------ */
  /* ⏳  Loading                                                        */
  /* ------------------------------------------------------------------ */
  if (!currentSession || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-apple-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-body text-apple-secondary">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* 🎨  Render                                                         */
  /* ------------------------------------------------------------------ */
  const currentQ = currentSession.questions[currentSession.currentIndex];
  const shuffledQ = shuffledQuestions[currentSession.currentIndex];
  const topicInfo = topics.find((t) => t.name === currentQ.topic);
  const isCorrect =
    showFeedback &&
    shuffledQ.optionMapping[selectedAnswer!] === currentQ.correct;

  return (
    <div className="min-h-screen bg-apple-light flex flex-col overflow-x-hidden">
      {/* Timer solo se timed */}
      {isTimed && (
        <TimerDisplay timeLeft={timeLeft} furyRemaining={furyRemaining} />
      )}

      <QuestionHeader
        quizType={quizType}
        title={title}
        topicName={topicName}
        currentIndex={currentSession.currentIndex}
        total={currentSession.questions.length}
        onBack={quizType === 'topic' ? handleBack : undefined}
      />

      <div className="flex-1">
        {/* Topic label */}
        <div className="flex items-center space-x-2 mb-3 sm:mb-4 px-4 sm:px-6">
          <span className="text-base sm:text-lg">
            {topicInfo?.icon || '📝'}
          </span>
          <span className="text-xs sm:text-sm text-apple-secondary font-medium truncate">
            {currentQ.topic}
          </span>
        </div>

        {/* Domanda */}
        <QuestionContent
          question={shuffledQ}
          onGoogleSearch={handleGoogleSearch}
          onReplace={handleReplaceQuestion}
          showReplace={!showFeedback}
        />

        {/* Opzioni */}
        <AnswerOptions
          shuffledQuestion={shuffledQ}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelect={handleSelect}
        />

        {/* Spiegazione */}
        {showFeedback && currentQ.explanation && (
          <Explanation
            isCorrect={isCorrect}
            explanation={currentQ.explanation}
            show={showExplanation}
            onToggle={() => setShowExplanation(!showExplanation)}
          />
        )}
      </div>

      {/* Footer */}
      <QuizFooter
        quizType={quizType}
        isAnswered={showFeedback}
        onSkip={handleSkip}
        onConfirm={handleConfirm}
        onNext={handleNext}
        canSkip={!showFeedback}
        hasNext={
          isStreak
            ? true /* streak continua finché rispondi bene */
            : currentSession.currentIndex <
              currentSession.questions.length - 1
        }
      />
    </div>
  );
};

export default QuizScreen;
