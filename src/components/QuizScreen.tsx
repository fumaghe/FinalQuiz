// src/components/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuiz, norm } from '../contexts/QuizContext';
import {
  Question,
  QuizSession,
  AnsweredQuestion,
  QuizHistory,
  UserStats,
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
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

/** Opzioni per i quiz “inverse” */
function buildReverseOptions(
  base: Question,
  pool: Question[],
): { options: string[]; correctIndex: number } {
  const distractors = pool
    .filter(q => q.id !== base.id && q.correct !== undefined)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(q => q.question);

  const all = [...distractors, base.question].sort(() => Math.random() - 0.5);
  return { options: all, correctIndex: all.indexOf(base.question) };
}

/**
 * Aggiorna answered / correct / incorrect / statsPerTopic tenendo conto
 * SOLO dell’esito più recente per ciascuna domanda.
 */
function accumulateTopicStats(
  answeredArr: AnsweredQuestion[],
  userStats:   UserStats,
  allQuestions: Question[],
) {
  const updatedAnswered  = { ...userStats.answeredQuestions };
  const updatedCorrect   = { ...userStats.correctQuestions };
  const updatedIncorrect = { ...userStats.incorrectQuestions };
  const updatedStatsTop  = { ...userStats.statsPerTopic };

  answeredArr.forEach(a => {
    const canon = norm(a.topic);

    // 👀 LOG 1 — situazione pre-update
    console.log('[BEFORE]', canon, {
      done:              updatedStatsTop[canon]?.done,
      correct:           updatedStatsTop[canon]?.correct,
      correctAnswers:    (updatedStatsTop[canon] as any)?.correctAnswers,
      wasCorrect:        !!updatedCorrect[a.questionId],
      userAnswerCorrect: a.isCorrect,
    });

    /* init topic counter se non c’è */
    if (!updatedStatsTop[canon]) {
      const tot = allQuestions.filter(q => norm(q.topic) === canon).length;
      updatedStatsTop[canon] = { done: 0, correct: 0, total: tot } as any;
      (updatedStatsTop[canon] as any).correctAnswers = 0;   // <— inizio coerente
    }

    const wasCorrect = !!updatedCorrect[a.questionId];

    /* done cresce solo la prima volta che vediamo la domanda */
    if (!updatedAnswered[a.questionId]) {
      updatedStatsTop[canon].done += 1;
    }
    updatedAnswered[a.questionId] = true;

    /* -------- transizioni di stato -------- */
    if (a.isCorrect) {
      if (!wasCorrect) {
        updatedStatsTop[canon].correct += 1;
      }
      (updatedStatsTop[canon] as any).correctAnswers = updatedStatsTop[canon].correct;

      updatedCorrect[a.questionId] = true;
      delete updatedIncorrect[a.questionId];
    } else {
      if (wasCorrect) {
        updatedStatsTop[canon].correct -= 1;
      }
      (updatedStatsTop[canon] as any).correctAnswers = updatedStatsTop[canon].correct;

      updatedIncorrect[a.questionId] = true;
      delete updatedCorrect[a.questionId];
    }
    console.log('[AFTER]', canon, {
      done:              updatedStatsTop[canon].done,
      correct:           updatedStatsTop[canon].correct,
      correctAnswers:    (updatedStatsTop[canon] as any).correctAnswers,
    });
  });

  return { updatedAnswered, updatedCorrect, updatedIncorrect, updatedStatsTop };
}

/* ------------------------------------------------------------------ */
/* CONFIG MODALITÀ TEMPO                                              */
/* ------------------------------------------------------------------ */
const TOTAL_TIME = 600;
const PENALTY    = 10;
const BONUS_3    = 10;
const FURY_COUNT = 3;

/* ------------------------------------------------------------------ */
/* PROPS & COMPONENT                                                  */
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
  /* CONTEXT & STATE                                                    */
  /* ------------------------------------------------------------------ */
  const { state, dispatch, getQuestionsForCourse } = useQuiz();
  const { currentSession, topics, userStats } = state;

  // **FILTRO QUESTIONS per CORSO**
  const allQuestions = getQuestionsForCourse();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback]   = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<
    ShuffledQuestion[]
  >([]);

  const isTimed   = quizType === 'timed';
  const isStreak  = quizType === 'streak';
  const isReverse = quizType === 'reverse';

  const [timeLeft,      setTimeLeft]      = useState<number>(TOTAL_TIME);
  const [streak,        setStreak]        = useState<number>(0);
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
      setTimeLeft(t => {
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
      '_blank',
    );
  };

  /* ------------------------------------------------------------------ */
  /* Salvataggio stato parziale quiz topic                              */
  /* ------------------------------------------------------------------ */
  const savePartialTopic = () => {
    if (!currentSession) return;

    const answeredArr: AnsweredQuestion[] = [];
    currentSession.answers.forEach((ans, idx) => {
      if (ans === null || ans === -1) return;
      const q = currentSession.questions[idx];
      answeredArr.push({
        questionId:      q.id,
        question:        q.question,
        options:         q.options,
        userAnswer:      ans,
        correctAnswer:   q.correct,
        isCorrect:       ans === q.correct,
        timestamp:       new Date(),
        topic:           q.topic,
        explanation:     q.explanation,
      });
    });
    if (answeredArr.length === 0) return;

    const {
      updatedAnswered,
      updatedCorrect,
      updatedIncorrect,
      updatedStatsTop,
    } = accumulateTopicStats(answeredArr, userStats, allQuestions);

    const correctDelta = answeredArr.filter(a => a.isCorrect).reduce((d,a)=>{
      const wasCorrect = !!userStats.correctQuestions[a.questionId];
      return wasCorrect ? d : d + 1;
    },0) - answeredArr.filter(a => !a.isCorrect).reduce((d,a)=>{
      const wasCorrect = !!userStats.correctQuestions[a.questionId];
      return wasCorrect ? d + 1 : d;
    },0);

    const quizHistoryEntry: QuizHistory = {
      id:           `${currentSession.id}_partial`,
      quizType:     'topic',
      topicName:    title || topicName,
      timestamp:    new Date(),
      score:        (answeredArr.filter(a=>a.isCorrect).length /
                    answeredArr.length) * 100,
      totalQuestions: answeredArr.length,
      correctAnswers: answeredArr.filter(a=>a.isCorrect).length,
      answeredQuestions: answeredArr,
    };

    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...userStats,
        totalQuestions: userStats.totalQuestions + answeredArr.length,
        correctAnswers: userStats.correctAnswers + correctDelta,
        overallAccuracy:
          ((userStats.correctAnswers + correctDelta) /
            (userStats.totalQuestions + answeredArr.length)) * 100,
        lastUpdated: new Date(),
        quizHistory: [...userStats.quizHistory, quizHistoryEntry],
        answeredQuestions: updatedAnswered,
        correctQuestions:  updatedCorrect,
        incorrectQuestions:updatedIncorrect,
        statsPerTopic:     updatedStatsTop,
      },
    });
  };

  /* ------------------------------------------------------------------ */
  /* finishQuiz (usa la stessa logica)                                  */
  /* ------------------------------------------------------------------ */
  const finishQuiz = () => {
    clearInterval(timerRef.current!);
    if (!currentSession) return;

    /* Costruiamo array risposte dell’intero quiz */
    const answeredArr: AnsweredQuestion[] = [];
    let correctCount = 0;
    currentSession.answers.forEach((ans, idx) => {
      if (ans === null || ans === -1) return;
      const q = currentSession.questions[idx];
      const ok = ans === q.correct;
      if (ok) correctCount++;
      answeredArr.push({
        questionId:    q.id,
        question:      q.question,
        options:       q.options,
        userAnswer:    ans,
        correctAnswer: q.correct,
        isCorrect:     ok,
        timestamp:     new Date(),
        topic:         q.topic,
        explanation:   q.explanation,
      });
    });

    const {
      updatedAnswered,
      updatedCorrect,
      updatedIncorrect,
      updatedStatsTop,
    } = accumulateTopicStats(answeredArr, userStats, allQuestions);

    /* Delta per overallAccuracy / correctAnswers */
    const correctDelta = answeredArr.reduce((delta, a) => {
      const wasCorrect = !!userStats.correctQuestions[a.questionId];
      return a.isCorrect
        ? wasCorrect ? delta : delta + 1            // diventa giusta
        : wasCorrect ? delta - 1 : delta;           // diventa sbagliata
    }, 0);

    const historyEntry: QuizHistory = {
      id: currentSession.id,
      quizType,
      topicName: title || topicName,
      timestamp: new Date(),
      score: correctCount / currentSession.questions.length * 100,
      totalQuestions: currentSession.questions.length,
      correctAnswers: correctCount,
      answeredQuestions: answeredArr,
      timeTaken: isTimed ? TOTAL_TIME - timeLeft : undefined,
      timeLeft: isTimed ? timeLeft : undefined,
      streakCount: isStreak ? correctCount : undefined,
    };

    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...userStats,
        totalQuizzes:   userStats.totalQuizzes + 1,
        totalQuestions: userStats.totalQuestions + currentSession.questions.length,
        correctAnswers: userStats.correctAnswers + correctDelta,
        overallAccuracy:
          ((userStats.correctAnswers + correctDelta) /
            (userStats.totalQuestions + currentSession.questions.length)) * 100,
        lastUpdated: new Date(),
        quizHistory: [...userStats.quizHistory, historyEntry],
        bestSuddenDeath: isStreak
          ? Math.max(userStats.bestSuddenDeath || 0, correctCount)
          : userStats.bestSuddenDeath,
        answeredQuestions: updatedAnswered,
        correctQuestions:  updatedCorrect,
        incorrectQuestions:updatedIncorrect,
        statsPerTopic:     updatedStatsTop,
      },
    });
    dispatch({ type: 'END_QUIZ' });

    onNavigate('results', {
      score: historyEntry.score,
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
      quizQuestions = [...allQuestions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 30);
    }

    /* === Streak Quiz (1 domanda iniziale) ========================= */
    else if (isStreak) {
      quizQuestions = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 1);
    }

    /* === Quiz Inversi ============================================ */
    else if (isReverse) {
      const base = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 30);
      quizQuestions = base.map((q) => {
        const { options, correctIndex } = buildReverseOptions(q, allQuestions);
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
        sql: 3,
        statistica: 3,
        tableau: 2,
        databricks: 2,
        datalake2: 1,
        git: 1,
        nosql: 3,
        powerbi: 3,
        python: 4,
        r: 2,
        ml: 3,
        deeplearning: 3,
      };
      const unanswered = allQuestions.filter(
        (q) => !userStats.correctQuestions[q.id]
      );
      const chosen: Question[] = [];
      const used = new Set<string>();

      Object.entries(quotaPerTopic).forEach(([topic, qty]) => {
        const canon = norm(topic); 
        const pool = unanswered.filter(
          (q) => norm(q.topic) === canon && !used.has(q.id)
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

      quizQuestions = [...chosen]               // copia
        .sort(() => Math.random() - 0.5)        // shuffle
        .slice(0, 30);                          // mantieni le prime 30
    } else if (quizType === 'topic' && topicId) {
      /* ❶ tutte le domande del topic scelto                           */
      const canonId = norm(topicId);
      const topicQs = allQuestions.filter(
        (q) => norm(q.topic) === canonId
      );

      /* ❷ scartiamo SOLO quelle già risposte correttamente             */
      const pool = topicQs.filter((q) => !userStats.correctQuestions[q.id]);

      /* ❸ shuffle + take all (pool può essere < 30)                    */
      quizQuestions = [...pool].sort(() => Math.random() - 0.5);
    } else if (quizType === 'custom' && questionIds) {
      quizQuestions = allQuestions.filter((q) => questionIds.includes(q.id));
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
        ({ topic }) => (poolByTopic[topic] = allQuestions.filter((q) => q.topic === topic))
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
          ...allQuestions.filter((q) => !usedIds.has(q.id)).slice(0, 30 - picked.length)
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
      const pool = allQuestions.filter((q) => !usedIds.has(q.id));
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
    const pool = allQuestions.filter(
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
  /* ⏳  Loading                                                        */
  /* ------------------------------------------------------------------ */
  if (!currentSession || shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-its-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-its-red border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-body text-its-secondary">Caricamento quiz...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* 🎨  Render                                                         */
  /* ------------------------------------------------------------------ */
  const currentQ = currentSession.questions[currentSession.currentIndex];
  const shuffledQ = shuffledQuestions[currentSession.currentIndex];
  const topicInfo = topics.find(t => t.id === norm(currentQ.topic));
  const isCorrect =
    showFeedback &&
    shuffledQ.optionMapping[selectedAnswer!] === currentQ.correct;

  return (
    <div className="min-h-screen bg-its-light flex flex-col overflow-x-hidden">
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
          <span className="text-xs sm:text-sm text-its-secondary font-medium truncate">
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
