// src/components/QuizScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import {
  Question,
  QuizSession,
  AnsweredQuestion,
  QuizHistory
} from '../types/quiz';
import {
  shuffleQuestionOptions,
  ShuffledQuestion
} from '../utils/shuffleQuestionOptions';
import { QuestionHeader } from './QuestionHeader';
import { QuestionContent } from './QuestionContent';
import { AnswerOptions } from './AnswerOptions';
import { Explanation } from './Explanation';
import { QuizFooter } from './QuizFooter';
import { TimerDisplay } from './TimerDisplay';

/* ------------------------------------------------------------------ */
/* CONFIG MODALITÀ TEMPO                                              */
/* ------------------------------------------------------------------ */
const TOTAL_TIME = 360;   // 10 minuti
const PENALTY    = 10;    // -10 s per errore
const BONUS_3    = 10;    // +10 s a 3 risposte corrette
const FURY_COUNT = 3;     // domande “no-penalty” in Modalità Furia

interface QuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizType: 'general' | 'topic' | 'custom' | 'forYou' | 'timed';
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
  /* ------------------------------------------------------------------ */
  /* ⏺  Context e stato                                                 */
  /* ------------------------------------------------------------------ */
  const { state, dispatch } = useQuiz();
  const { questions, currentSession, topics, userStats } = state;

  const [selectedAnswer, setSelectedAnswer]   = useState<number | null>(null);
  const [showFeedback,   setShowFeedback]     = useState(false);
  const [showExplanation,setShowExplanation]  = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

  /* ===== Stato aggiuntivo per la modalità tempo ===== */
  const isTimed = quizType === 'timed';
  const [timeLeft, setTimeLeft]       = useState<number>(TOTAL_TIME);
  const [streak,   setStreak]         = useState<number>(0);
  const [furyRemaining, setFuryRemaining] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout>();

  /* ------------------------------------------------------------------ */
  /* 📦  Lifecycle                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!currentSession) startNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* avvia/interrompe il timer in modalità timed */
  useEffect(() => {
    if (!isTimed || !currentSession) return;
    clearInterval(timerRef.current!);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          finishQuiz();        // tempo scaduto
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
      const displayIdx = sh.optionMapping.indexOf(ans);
      setSelectedAnswer(displayIdx);
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
    window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
  };

  /* ------------------------------------------------------------------ */
  /* ↩️  Gestione Back (solo topic)                                     */
  /* ------------------------------------------------------------------ */
  const handleBack = () => {
    if (!currentSession) return;

    if (quizType === 'topic') {
      const answeredCount = currentSession.answers.filter(a => a !== null && a !== -1).length;
      let correctCount = 0;
      currentSession.answers.forEach((ans, idx) => {
        if (ans !== null && ans !== -1 && ans === currentSession.questions[idx].correct) {
          correctCount++;
        }
      });

      const updatedAnsweredQuestions = { ...userStats.answeredQuestions };
      const updatedCorrectQuestions  = { ...userStats.correctQuestions };
      const updatedIncorrectQuestions= { ...userStats.incorrectQuestions };
      const updatedStatsPerTopic     = { ...userStats.statsPerTopic };

      currentSession.answers.forEach((ans, idx) => {
        if (ans === null || ans === -1) return;
        const q = currentSession.questions[idx];
        const isCorrect = ans === q.correct;

        updatedAnsweredQuestions[q.id] = true;
        if (isCorrect) {
          updatedCorrectQuestions[q.id] = true;
          delete updatedIncorrectQuestions[q.id];
        } else {
          updatedIncorrectQuestions[q.id] = true;
        }

        if (!updatedStatsPerTopic[q.topic]) {
          const topicQs = questions.filter(tq => tq.topic === q.topic);
          updatedStatsPerTopic[q.topic] = { done: 0, correct: 0, total: topicQs.length };
        }
        if (!userStats.answeredQuestions[q.id]) {
          updatedStatsPerTopic[q.topic].done++;
        }
        if (isCorrect && !userStats.correctQuestions[q.id]) {
          updatedStatsPerTopic[q.topic].correct++;
        }
      });

      if (answeredCount > 0) {
        const score = (correctCount / answeredCount) * 100;
        const answered: AnsweredQuestion[] = [];
        currentSession.answers.forEach((ans, idx) => {
          if (ans === null || ans === -1) return;
          const q = currentSession.questions[idx];
          answered.push({
            questionId: q.id,
            question: q.question,
            options: q.options,
            userAnswer: ans,
            correctAnswer: q.correct,
            isCorrect: ans === q.correct,
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
          answeredQuestions: answered
        };
        const updatedStats = {
          ...userStats,
          totalQuestions: userStats.totalQuestions + answeredCount,
          correctAnswers: userStats.correctAnswers + correctCount,
          overallAccuracy:
            ((userStats.correctAnswers + correctCount) /
              (userStats.totalQuestions + answeredCount)) *
            100,
          lastUpdated: new Date(),
          quizHistory: [...userStats.quizHistory, quizHistoryEntry],
          answeredQuestions: updatedAnsweredQuestions,
          correctQuestions:  updatedCorrectQuestions,
          incorrectQuestions:updatedIncorrectQuestions,
          statsPerTopic:     updatedStatsPerTopic
        };
        dispatch({ type: 'UPDATE_STATS', payload: updatedStats });
      }
    }

    clearInterval(timerRef.current!);
    dispatch({ type: 'END_QUIZ' });
    onNavigate(quizType === 'topic' ? 'topics' : 'dashboard');
  };

  /* ------------------------------------------------------------------ */
  /* 🚀  startNewQuiz                                                   */
  /* ------------------------------------------------------------------ */
  const startNewQuiz = () => {
    let quizQuestions: Question[] = [];

    /* === Sfida a Tempo: 30 domande random da tutto il pool ========== */
    if (isTimed) {
      quizQuestions = [...questions].sort(() => Math.random() - 0.5).slice(0, 30);
    }

    /* === Quiz Generale (quota per topic) ============================ */
    else if (quizType === 'general') {
      const quotaPerTopic: Record<string, number> = {
        SQL: 3, Statistica: 3, Tableau: 2, Databricks: 2,
        DataLake2: 1, Git: 1, NoSQL: 3, PowerBI: 3,
        Python: 4, R: 2, ML: 3, DeepLearning: 3
      };
      const unanswered = questions.filter(q => !userStats.correctQuestions[q.id]);
      const chosen: Question[] = [];
      const used = new Set<string>();

      Object.entries(quotaPerTopic).forEach(([topic, qty]) => {
        const pool = unanswered.filter(q => q.topic === topic && !used.has(q.id));
        const pick = [...pool].sort(() => Math.random() - 0.5).slice(0, qty);
        pick.forEach(q => used.add(q.id));
        chosen.push(...pick);
      });

      if (chosen.length < 30) {
        const filler = unanswered
          .filter(q => !used.has(q.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 30 - chosen.length);
        chosen.push(...filler);
      }

      quizQuestions = chosen.slice(0, 30);
    }

    /* === Quiz per Argomento ======================================== */
    else if (quizType === 'topic' && topicId) {
      const topicQs = questions.filter(q => q.topic.toLowerCase() === topicId.toLowerCase());
      quizQuestions = topicQs.filter(q => !userStats.correctQuestions[q.id]);
    }

    /* === Quiz Custom =============================================== */
    else if (quizType === 'custom' && questionIds) {
      quizQuestions = questions.filter(q => questionIds.includes(q.id));
    }

    /* === Quiz per Te =============================================== */
    else if (quizType === 'forYou') {
      const weights = Object.entries(userStats.statsPerTopic)
        .map(([topic, s]) => {
          const precision = s.done > 0 ? (s.correct / s.done) * 100 : 0;
          let weight = 1;
          if (precision < 70) weight = 5;
          else if (precision < 90) weight = 3;
          else weight = 0;
          return { topic, weight };
        })
        .filter(w => w.weight > 0);

      const poolByTopic: Record<string, Question[]> = {};
      weights.forEach(w => { poolByTopic[w.topic] = questions.filter(q => q.topic === w.topic); });

      const buckets: string[] = [];
      weights.forEach(w => { for (let i = 0; i < w.weight; i++) buckets.push(w.topic); });

      const picked: Question[] = [];
      const usedIds = new Set<string>();
      while (picked.length < 30 && buckets.length) {
        const t = buckets[Math.floor(Math.random() * buckets.length)];
        const cand = poolByTopic[t].filter(q => !usedIds.has(q.id));
        if (!cand.length) { buckets.splice(buckets.indexOf(t), 1); continue; }
        const q = cand[Math.floor(Math.random() * cand.length)];
        usedIds.add(q.id); picked.push(q);
      }
      if (picked.length < 30) {
        const filler = questions.filter(q => !usedIds.has(q.id)).slice(0, 30 - picked.length);
        picked.push(...filler);
      }
      quizQuestions = picked;
    }

    /* se zero domande → dashboard */
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
    const original  = sh.optionMapping[selectedAnswer];
    const isCorrect = original === currentSession.questions[currentSession.currentIndex].correct;

    dispatch({ type: 'ANSWER_QUESTION', payload: { index: currentSession.currentIndex, answer: original } });

    /* --- penalità / bonus tempo ------------------------------------ */
    if (isTimed) {
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        if (newStreak === 3) setTimeLeft(t => Math.min(TOTAL_TIME, t + BONUS_3));
        if (newStreak === 5) setFuryRemaining(FURY_COUNT);
      } else {
        setStreak(0);
        if (furyRemaining === 0) setTimeLeft(t => Math.max(0, t - PENALTY));
      }
      if (furyRemaining > 0) setFuryRemaining(f => f - 1);
    }

    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!currentSession) return;
    const nextIdx = currentSession.currentIndex + 1;
    if (nextIdx < currentSession.questions.length) {
      dispatch({ type: 'START_QUIZ', payload: { ...currentSession, currentIndex: nextIdx } });
      setShowExplanation(true);
    } else {
      finishQuiz();
    }
  };

  const handleSkip = () => {
    if (!currentSession || quizType !== 'topic') return;
    dispatch({ type: 'ANSWER_QUESTION', payload: { index: currentSession.currentIndex, answer: -1 } });
    handleNext();
  };

  /* ------------------------------------------------------------------ */
  /* ♻️  Sostituzione domanda                                           */
  /* ------------------------------------------------------------------ */
  const handleReplaceQuestion = () => {
    if (!currentSession || showFeedback) return;

    const currentQ = currentSession.questions[currentSession.currentIndex];
    const usedIds  = new Set(currentSession.questions.map(q => q.id));
    const pool = questions.filter(
      q => q.topic === currentQ.topic &&
           !userStats.correctQuestions[q.id] &&
           !usedIds.has(q.id)
    );

    if (pool.length) {
      const newQ = pool[Math.floor(Math.random() * pool.length)];
      const newQs = [...currentSession.questions];
      const newAns= [...currentSession.answers];
      const newSh = [...shuffledQuestions];

      newQs[currentSession.currentIndex]  = newQ;
      newAns[currentSession.currentIndex] = null;
      newSh[currentSession.currentIndex]  = shuffleQuestionOptions(newQ);

      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowExplanation(true);
      setShuffledQuestions(newSh);

      dispatch({ type: 'START_QUIZ', payload: { ...currentSession, questions: newQs, answers: newAns } });
      return;
    }

    if (quizType === 'topic') {
      const newQs = currentSession.questions.filter((_, i) => i !== currentSession.currentIndex);
      const newAns= currentSession.answers.filter((_, i) => i !== currentSession.currentIndex);
      const newSh = shuffledQuestions.filter((_, i) => i !== currentSession.currentIndex);

      if (!newQs.length) { finishQuiz(); return; }

      const newIdx = Math.min(currentSession.currentIndex, newQs.length - 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowExplanation(true);
      setShuffledQuestions(newSh);

      dispatch({ type: 'START_QUIZ', payload: { ...currentSession, questions: newQs, answers: newAns, currentIndex: newIdx } });
    } else {
      window.alert('Nessuna altra domanda disponibile per questo argomento.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🏁  finishQuiz                                                     */
  /* ------------------------------------------------------------------ */
  const finishQuiz = () => {
    clearInterval(timerRef.current!);   // stop timer se attivo
    if (!currentSession) return;

    /* ---------- LOGICA ORIGINALE (completa) ------------------------- */
    const answered: AnsweredQuestion[] = [];
    let correctCount = 0;
    const updatedAnswered = { ...userStats.answeredQuestions };
    const updatedCorrect  = { ...userStats.correctQuestions };
    const updatedIncorrect= { ...userStats.incorrectQuestions };
    const updatedStatsTop = { ...userStats.statsPerTopic };

    currentSession.answers.forEach((ans, idx) => {
      const q = currentSession.questions[idx];
      const isCorrect = ans === q.correct;
      if (ans !== null && ans !== -1) {
        updatedAnswered[q.id] = true;
        if (isCorrect) {
          correctCount++; updatedCorrect[q.id] = true; delete updatedIncorrect[q.id];
        } else {
          updatedIncorrect[q.id] = true;
        }

        if (!updatedStatsTop[q.topic]) {
          const tQs = questions.filter(tq => tq.topic === q.topic);
          updatedStatsTop[q.topic] = { done: 0, correct: 0, total: tQs.length };
        }
        if (!userStats.answeredQuestions[q.id]) updatedStatsTop[q.topic].done++;
        if (isCorrect && !userStats.correctQuestions[q.id]) {
          updatedStatsTop[q.topic].correct++;
        } else if (!isCorrect && userStats.correctQuestions[q.id]) {
          updatedStatsTop[q.topic].correct = Math.max(0, updatedStatsTop[q.topic].correct - 1);
        }

        answered.push({
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer: ans,
          correctAnswer: q.correct,
          isCorrect,
          timestamp: new Date(),
          topic: q.topic,
          explanation: q.explanation
        });
      }
    });

    const score = (correctCount / currentSession.questions.length) * 100;
    const historyEntry: QuizHistory = {
      id: currentSession.id,
      quizType: quizType === 'custom' ? 'general' : quizType,
      topicName: title || topicName,
      timestamp: new Date(),
      score,
      totalQuestions: currentSession.questions.length,
      correctAnswers: correctCount,
      answeredQuestions: answered
    };

    const updatedStats = {
      ...userStats,
      totalQuizzes:   userStats.totalQuizzes + 1,
      totalQuestions: userStats.totalQuestions + currentSession.questions.length,
      correctAnswers: userStats.correctAnswers + correctCount,
      overallAccuracy: ((userStats.correctAnswers + correctCount) /
        (userStats.totalQuestions + currentSession.questions.length)) * 100,
      currentStreak:  score >= 70 ? userStats.currentStreak + 1 : 0,
      bestStreak:     score >= 70 ? Math.max(userStats.bestStreak, userStats.currentStreak + 1) : userStats.bestStreak,
      lastUpdated:    new Date(),
      quizHistory:    [...userStats.quizHistory, historyEntry],
      answeredQuestions: updatedAnswered,
      correctQuestions:  updatedCorrect,
      incorrectQuestions:updatedIncorrect,
      statsPerTopic:     updatedStatsTop
    };

    dispatch({ type: 'UPDATE_STATS', payload: updatedStats });
    dispatch({ type: 'END_QUIZ' });

    onNavigate('results', {
      score,
      correctAnswers: correctCount,
      totalQuestions: currentSession.questions.length,
      quizType,
      topicName,
      quizHistory: historyEntry,
      timeLeft          // utile per mostrare “tempo rimasto”
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
  const currentQ  = currentSession.questions[currentSession.currentIndex];
  const shuffledQ = shuffledQuestions[currentSession.currentIndex];
  const topicInfo = topics.find(t => t.name === currentQ.topic);
  const isCorrect =
    showFeedback && shuffledQ.optionMapping[selectedAnswer!] === currentQ.correct;

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
          <span className="text-base sm:text-lg">{topicInfo?.icon || '📝'}</span>
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
        hasNext={currentSession.currentIndex < currentSession.questions.length - 1}
      />
    </div>
  );
};

export default QuizScreen;
