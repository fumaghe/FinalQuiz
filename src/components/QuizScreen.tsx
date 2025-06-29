// src/components/QuizScreen.tsx
import React, { useState, useEffect } from 'react';
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

interface QuizScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  quizType: 'general' | 'topic' | 'custom' | 'forYou';
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

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);

  /* ------------------------------------------------------------------ */
  /* 📦  Lifecycle                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!currentSession) startNewQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentSession && shuffledQuestions.length === 0) {
      setShuffledQuestions(currentSession.questions.map(shuffleQuestionOptions));
    }
  }, [currentSession, shuffledQuestions.length]);

  useEffect(() => {
    if (!currentSession) return;
    const ans = currentSession.answers[currentSession.currentIndex];
    if (ans !== null && ans !== -1 && shuffledQuestions.length > 0) {
      // Traduco l'indice originale nell'indice della shuffledQuestions
      const shuffled = shuffledQuestions[currentSession.currentIndex];
      const displayIdx = shuffled.optionMapping.indexOf(ans);
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
    const url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.open(url, '_blank');
  };

  /* ------------------------------------------------------------------ */
  /* ↩️  Back (per quiz “topic”)                                        */
  /* ------------------------------------------------------------------ */
  const handleBack = () => {
    if (!currentSession) return;

    if (quizType === 'topic') {
      // salva stato parziale
      const answeredCount = currentSession.answers.filter(a => a !== null && a !== -1).length;
      let correctCount = 0;
      currentSession.answers.forEach((ans, idx) => {
        if (ans !== null && ans !== -1 && ans === currentSession.questions[idx].correct) {
          correctCount++;
        }
      });

      const updatedAnsweredQuestions = { ...userStats.answeredQuestions };
      const updatedCorrectQuestions = { ...userStats.correctQuestions };
      const updatedIncorrectQuestions = { ...userStats.incorrectQuestions };
      const updatedStatsPerTopic = { ...userStats.statsPerTopic };

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
        const answeredQuestions: AnsweredQuestion[] = [];
        currentSession.answers.forEach((ans, idx) => {
          if (ans === null || ans === -1) return;
          const q = currentSession.questions[idx];
          answeredQuestions.push({
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
          answeredQuestions
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

      const unanswered = questions.filter(q => !userStats.correctQuestions[q.id]);
      const chosen: Question[] = [];
      const usedIds = new Set<string>();

      Object.entries(quotaPerTopic).forEach(([topic, qty]) => {
        const pool = unanswered.filter(q => q.topic === topic && !usedIds.has(q.id));
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

      quizQuestions = [...chosen].sort(() => Math.random() - 0.5).slice(0, 30);
    }
    else if (quizType === 'topic' && topicId) {
      const topicQs = questions.filter(q => q.topic.toLowerCase() === topicId.toLowerCase());
      quizQuestions = topicQs.filter(q => !userStats.correctQuestions[q.id]);
    }
    else if (quizType === 'custom' && questionIds) {
      quizQuestions = questions.filter(q => questionIds.includes(q.id));
    }
    else if (quizType === 'forYou') {
      // Quiz per Te
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
      weights.forEach(({ topic }) => {
        poolByTopic[topic] = questions.filter(q => q.topic === topic);
      });

      const buckets: string[] = [];
      weights.forEach(({ topic, weight }) => {
        for (let i = 0; i < weight; i++) buckets.push(topic);
      });

      const picked: Question[] = [];
      const used = new Set<string>();
      while (picked.length < 30 && buckets.length > 0) {
        const topic = buckets[Math.floor(Math.random() * buckets.length)];
        const candidates = poolByTopic[topic].filter(q => !used.has(q.id));
        if (candidates.length === 0) {
          const idx = buckets.indexOf(topic);
          buckets.splice(idx, 1);
          continue;
        }
        const q = candidates[Math.floor(Math.random() * candidates.length)];
        used.add(q.id);
        picked.push(q);
      }

      if (picked.length < 30) {
        const filler = questions
          .filter(q => !used.has(q.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, 30 - picked.length);
        picked.push(...filler);
      }

      quizQuestions = picked;
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

  /* ------------------------------------------------------------------ */
  /* ✅  Gestione risposte                                              */
  /* ------------------------------------------------------------------ */
  const handleSelect = (idx: number) => {
    if (showFeedback || !currentSession) return;
    setSelectedAnswer(idx);
  };

  const handleConfirm = () => {
    if (selectedAnswer === null || !currentSession || showFeedback) return;
    const sq = shuffledQuestions[currentSession.currentIndex];
    const original = sq.optionMapping[selectedAnswer];
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: { index: currentSession.currentIndex, answer: original }
    });
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (!currentSession) return;
    const nextIdx = currentSession.currentIndex + 1;
    if (nextIdx < currentSession.questions.length) {
      dispatch({
        type: 'START_QUIZ',
        payload: { ...currentSession, currentIndex: nextIdx }
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
      payload: { index: currentSession.currentIndex, answer: -1 }
    });
    handleNext();
  };

  /* ------------------------------------------------------------------ */
  /* ♻️  handleReplaceQuestion                                         */
  /* ------------------------------------------------------------------ */
  const handleReplaceQuestion = () => {
    if (!currentSession || showFeedback) return;

    const currentQ = currentSession.questions[currentSession.currentIndex];
    const usedIds = new Set(currentSession.questions.map(q => q.id));

    const pool = questions.filter(
      q =>
        q.topic === currentQ.topic &&
        !userStats.correctQuestions[q.id] &&
        !usedIds.has(q.id)
    );

    if (pool.length > 0) {
      const newQ = pool[Math.floor(Math.random() * pool.length)];

      const newQuestions = [...currentSession.questions];
      const newAnswers = [...currentSession.answers];
      const newShuffled = [...shuffledQuestions];

      newQuestions[currentSession.currentIndex] = newQ;
      newAnswers[currentSession.currentIndex] = null;
      newShuffled[currentSession.currentIndex] = shuffleQuestionOptions(newQ);

      setSelectedAnswer(null);
      setShowFeedback(false);
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

    if (quizType === 'topic') {
      const newQuestions = currentSession.questions.filter((_, i) => i !== currentSession.currentIndex);
      const newAnswers = currentSession.answers.filter((_, i) => i !== currentSession.currentIndex);
      const newShuffled = shuffledQuestions.filter((_, i) => i !== currentSession.currentIndex);

      if (newQuestions.length === 0) {
        finishQuiz();
        return;
      }

      const newIndex = Math.min(currentSession.currentIndex, newQuestions.length - 1);

      setSelectedAnswer(null);
      setShowFeedback(false);
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
      window.alert('Nessuna altra domanda disponibile per questo argomento.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* 🏁  finishQuiz                                                     */
  /* ------------------------------------------------------------------ */
  const finishQuiz = () => {
    if (!currentSession) return;

    const answeredQuestions: AnsweredQuestion[] = [];
    let correctCount = 0;
    const updatedAnsweredQuestions = { ...userStats.answeredQuestions };
    const updatedCorrectQuestions = { ...userStats.correctQuestions };
    const updatedIncorrectQuestions = { ...userStats.incorrectQuestions };
    const updatedStatsPerTopic = { ...userStats.statsPerTopic };

    currentSession.answers.forEach((ans, idx) => {
      const q = currentSession.questions[idx];
      const isCorrect = ans === q.correct;
      if (ans !== null && ans !== -1) {
        updatedAnsweredQuestions[q.id] = true;
        if (isCorrect) {
          correctCount++;
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
        } else if (!isCorrect && userStats.correctQuestions[q.id]) {
          updatedStatsPerTopic[q.topic].correct = Math.max(
            0,
            updatedStatsPerTopic[q.topic].correct - 1
          );
        }
        answeredQuestions.push({
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
      ...userStats,
      totalQuizzes: userStats.totalQuizzes + 1,
      totalQuestions: userStats.totalQuestions + currentSession.questions.length,
      correctAnswers: userStats.correctAnswers + correctCount,
      overallAccuracy:
        ((userStats.correctAnswers + correctCount) /
          (userStats.totalQuestions + currentSession.questions.length)) *
        100,
      currentStreak: score >= 70 ? userStats.currentStreak + 1 : 0,
      bestStreak:
        score >= 70
          ? Math.max(userStats.bestStreak, userStats.currentStreak + 1)
          : userStats.bestStreak,
      lastUpdated: new Date(),
      quizHistory: [...userStats.quizHistory, quizHistoryEntry],
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
  /* ⏳  Loading                                                        */
  /* ------------------------------------------------------------------ */
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

  /* ------------------------------------------------------------------ */
  /* 🎨  Render                                                         */
  /* ------------------------------------------------------------------ */
  const currentQ = currentSession.questions[currentSession.currentIndex];
  const shuffledQ = shuffledQuestions[currentSession.currentIndex];
  const isCorrect =
    showFeedback && shuffledQ.optionMapping[selectedAnswer!] === currentQ.correct;
  const topicInfo = topics.find(t => t.name === currentQ.topic);

  return (
    <div className="min-h-screen bg-apple-light flex flex-col overflow-x-hidden">
      <QuestionHeader
        quizType={quizType}
        title={title}
        topicName={topicName}
        currentIndex={currentSession.currentIndex}
        total={currentSession.questions.length}
        onBack={quizType === 'topic' ? handleBack : undefined}
      />

      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4 px-4 sm:px-6">
          <span className="text-base sm:text-lg">{topicInfo?.icon || '📝'}</span>
          <span className="text-xs sm:text-sm text-apple-secondary font-medium truncate">
            {currentQ.topic}
          </span>
        </div>

        <QuestionContent
          question={shuffledQ}
          onGoogleSearch={handleGoogleSearch}
          onReplace={handleReplaceQuestion}
          showReplace={!showFeedback}
        />

        <AnswerOptions
          shuffledQuestion={shuffledQ}
          selectedAnswer={selectedAnswer}
          showFeedback={showFeedback}
          onSelect={handleSelect}
        />

        {showFeedback && currentQ.explanation && (
          <Explanation
            isCorrect={isCorrect}
            explanation={currentQ.explanation}
            show={showExplanation}
            onToggle={() => setShowExplanation(!showExplanation)}
          />
        )}
      </div>

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
