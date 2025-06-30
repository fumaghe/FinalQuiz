// src/components/StatsScreen.tsx
import React, { useState, useMemo } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import {
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  Clock,
  Calendar,
  ChevronDown,
  Zap,
  Activity,
  Circle,
} from 'lucide-react';

import ProgressRing from './ProgressRing';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from './ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */
interface StatsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

/* ------------------------------------------------------------------ */
/* COSTANTI COLORE PER TIPO QUIZ                                      */
/* ------------------------------------------------------------------ */
const COLOR_MAP: Record<string, string> = {
  general: '#007AFF',
  topic: '#007AFF',
  forYou: '#007AFF',
  timed: '#FF3B30',
  streak: '#FF9F0A',
  reverse: '#8E44AD',
};

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */
const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
  const { state } = useQuiz();
  const { userStats, topics } = state;

  /* -------------------------------------------------------------- */
  /* STATE                                                          */
  /* -------------------------------------------------------------- */
  const [activeTab, setActiveTab] =
    useState<'general' | 'topics' | 'history'>('general');
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 50>(7);

  /* -------------------------------------------------------------- */
  /* CHART DATA (ultimi N quiz)                                     */
  /* -------------------------------------------------------------- */
  const chartData = useMemo(
    () =>
      userStats.quizHistory.slice(-chartPeriod).map((quiz, i) => ({
        quiz: `Q${i + 1}`,
        accuracy: Math.round(quiz.score),
        type: quiz.quizType,
      })),
    [chartPeriod, userStats.quizHistory],
  );

  /* -------------------------------------------------------------- */
  /* TOPIC STAT (tutte le modalità, tranne reverse)                 */
  /* -------------------------------------------------------------- */
  const topicStats = useMemo(() => {
    /**  ultimo tentativo valido per ogni domanda  */
    const lastAttemptByQ = new Map<
      string,
      { topic: string; isCorrect: boolean }
    >();

    /* attraversiamo lo storico in ordine cronologico
      (gli overwrite garantiscono che rimanga l'ULTIMO esito)        */
    userStats.quizHistory.forEach((hist) => {
      (hist.answeredQuestions ?? []).forEach((a) => {
        lastAttemptByQ.set(a.questionId, { topic: a.topic, isCorrect: a.isCorrect });
      });
    });

    /**  aggregazione per topic  */
    const agg: Record<string, { done: number; correct: number }> = {};
    lastAttemptByQ.forEach(({ topic, isCorrect }) => {
      if (!agg[topic]) agg[topic] = { done: 0, correct: 0 };
      agg[topic].done += 1;
      if (isCorrect) agg[topic].correct += 1;
    });

    /**  mapping finale ordinato per accuratezza  */
    return Object.entries(agg)
      .map(([topicName, data]) => {
        const topic = topics.find((t) => t.name === topicName);
        const accuracy = (data.correct / data.done) * 100;
        return {
          topic: topicName,
          displayName: topic?.name || topicName,
          icon: topic?.icon || '📝',
          totalAttempts: data.done,      // domande UNICHE viste
          correctAnswers: data.correct,  // di cui corrette
          accuracy,
        };
      })
      .sort((a, b) => b.accuracy - a.accuracy);
  }, [topics, userStats.quizHistory]);
  /* -------------------------------------------------------------- */
  /* RECENT QUIZ HISTORY (15)                                       */
  /* -------------------------------------------------------------- */
  const recentHistory = useMemo(
    () =>
      userStats.quizHistory
        .slice(-15)
        .reverse()
        .map((q) => ({
          ...q,
          dateLabel: new Date(q.timestamp).toLocaleDateString('it-IT'),
        })),
    [userStats.quizHistory],
  );

  /* -------------------------------------------------------------- */
  /* UTILITIES                                                      */
  /* -------------------------------------------------------------- */
  const perfColor = (v: number) =>
    v >= 80 ? '#34C759' : v >= 60 ? '#FF9F0A' : '#FF3B30';
  const perfLabel = (v: number) =>
    v >= 80 ? 'Eccellente' : v >= 60 ? 'Buono' : 'Da migliorare';

  const bestTimed = userStats.quizHistory
    .filter((q) => q.quizType === 'timed' && q.timeTaken != null)
    .sort((a, b) => a.timeTaken! - b.timeTaken!)[0];

  /* -------------------------------------------------------------- */
  /* RENDER                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-apple-light overflow-x-hidden">
      {/* ---------------------- HEADER --------------------------- */}
      <header className="bg-apple-card shadow-apple-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
          </button>
          <h1 className="flex-1 text-lg sm:text-xl font-semibold">Statistiche</h1>
        </div>

        {/* TABS */}
        <div className="flex justify-center mb-2">
          <div className="flex space-x-1 bg-apple-light rounded-apple p-1">
            {(['general', 'topics', 'history'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-apple-card text-apple-blue shadow-apple-card'
                    : 'text-apple-secondary hover:text-apple-text'
                }`}
              >
                {key === 'general'
                  ? 'Generale'
                  : key === 'topics'
                  ? 'Per Argomento'
                  : 'Storico'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ---------------------- MAIN ----------------------------- */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 pb-20 space-y-6 max-w-screen-lg mx-auto">

        {/* ================= TAB: GENERALE ====================== */}
        {activeTab === 'general' && (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="apple-card p-4 sm:p-6 text-center">
                <div className="w-10 h-10 bg-apple-blue/10 rounded-apple flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-apple-blue" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">
                  {userStats.totalQuizzes}
                </p>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Quiz completati
                </p>
              </div>

              <div className="apple-card p-4 sm:p-6 text-center">
                <div className="w-10 h-10 bg-apple-green/10 rounded-apple flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-apple-green" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">
                  {Math.round(userStats.overallAccuracy)}%
                </p>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Precisione media
                </p>
              </div>

              {/* best timed */}
              {bestTimed && (
                <div className="apple-card p-4 sm:p-6 text-center col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 bg-red-100 rounded-apple flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {Math.floor(bestTimed.timeTaken! / 60)}m{' '}
                    {bestTimed.timeTaken! % 60}s
                  </p>
                  <p className="text-xs sm:text-sm text-apple-secondary">
                    Miglior tempo
                  </p>
                </div>
              )}
            </div>

            {/* CHART */}
            {chartData.length > 0 && (
              <div className="apple-card p-4 sm:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-medium">
                    Andamento Totale
                  </h3>
                  <div className="relative">
                    <select
                      value={chartPeriod}
                      onChange={(e) =>
                        setChartPeriod(Number(e.target.value) as 7 | 30 | 50)
                      }
                      className="appearance-none bg-apple-light border border-apple-border rounded-lg px-2 py-1 text-xs sm:text-sm pr-6"
                    >
                      <option value={7}>Ultimi 7</option>
                      <option value={30}>Ultimi 30</option>
                      <option value={50}>Ultimi 50</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-apple-secondary pointer-events-none" />
                  </div>
                </div>

                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" aspect={2}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="quiz" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />

                      <Bar dataKey="accuracy" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLOR_MAP[entry.type]}
                          />
                        ))}
                      </Bar>

                      <Legend
                        align="right"
                        verticalAlign="top"
                        iconSize={10}
                        formatter={(val: string) => (
                          <span className="text-xs sm:text-sm text-apple-secondary">
                            {val}
                          </span>
                        )}
                        payload={[
                          {
                            value: 'Normale',
                            type: 'square',
                            id: 'gen',
                            color: COLOR_MAP.general,
                          },
                          {
                            value: 'Timed',
                            type: 'square',
                            id: 'tim',
                            color: COLOR_MAP.timed,
                          },
                          {
                            value: 'Streak',
                            type: 'square',
                            id: 'str',
                            color: COLOR_MAP.streak,
                          },
                          {
                            value: 'Reverse',
                            type: 'square',
                            id: 'rev',
                            color: COLOR_MAP.reverse,
                          },
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            )}

            {/* PERFORMANCE RING */}
            <div className="apple-card p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-medium mb-4">
                Performance Generale
              </h3>
              <div className="flex justify-center mb-4">
                <ProgressRing
                  progress={userStats.overallAccuracy}
                  size={100}
                  strokeWidth={6}
                  color={perfColor(userStats.overallAccuracy)}
                >
                  <div>
                    <p className="text-lg sm:text-xl font-bold">
                      {Math.round(userStats.overallAccuracy)}%
                    </p>
                    <p className="text-xs text-apple-secondary">
                      {perfLabel(userStats.overallAccuracy)}
                    </p>
                  </div>
                </ProgressRing>
              </div>
              <p className="text-sm text-apple-secondary">
                {userStats.correctAnswers} risposte corrette su{' '}
                {userStats.totalQuestions}
              </p>
            </div>

            {/* STREAK */}
            <div className="apple-card p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-apple-yellow/10 rounded-apple flex items-center justify-center">
                  <Award className="w-5 h-5 text-apple-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium">
                    Serie di successi
                  </h3>
                  <p className="text-xs sm:text-sm text-apple-secondary">
                    Streak attuale: {userStats.currentStreak} | Record:{' '}
                    {userStats.bestStreak}
                  </p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-apple-yellow flex-shrink-0">
                  {userStats.currentStreak}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ================= TAB: TOPICS =========================== */}
        {activeTab === 'topics' && (
          <>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Performance per argomento
            </h3>

            {topicStats.length > 0 ? (
              topicStats.map((stat, idx) => (
                <div key={stat.topic} className="apple-card p-3 sm:p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-apple-blue/10 rounded-apple flex items-center justify-center">
                      <span>{stat.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm sm:text-base font-medium truncate">
                          {stat.displayName}
                        </h4>
                        <span className="text-xs text-apple-secondary">
                          #{idx + 1}
                        </span>
                      </div>

                      <div className="w-full bg-apple-light rounded-full h-1.5 mb-1">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(stat.accuracy, 100)}%`,
                            backgroundColor: perfColor(stat.accuracy),
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-apple-secondary">
                        <span>
                          {stat.correctAnswers}/{stat.totalAttempts} corrette
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: perfColor(stat.accuracy) }}
                        >
                          {Math.round(stat.accuracy)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Award className="w-8 h-8 text-apple-secondary mx-auto mb-2" />
                <p className="text-sm text-apple-secondary">
                  Nessuna statistica disponibile
                </p>
              </div>
            )}
          </>
        )}

        {/* ================= TAB: HISTORY ========================== */}
        {activeTab === 'history' && (
          <>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Storico quiz recenti
            </h3>

            {recentHistory.length > 0 ? (
              recentHistory.map((quiz, idx) => (
                <button
                  key={quiz.id}
                  onClick={() => onNavigate('review', { quizHistory: quiz })}
                  className="w-full apple-card p-3 sm:p-4 text-left hover:bg-apple-light/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-apple-blue/10 rounded-apple flex items-center justify-center">
                        {quiz.quizType === 'timed' ? (
                          <Clock className="w-4 h-4 text-red-600" />
                        ) : quiz.quizType === 'streak' ? (
                          <Activity className="w-4 h-4 text-amber-500" />
                        ) : quiz.quizType === 'reverse' ? (
                          <Circle className="w-4 h-4 text-purple-600 fill-purple-600" />
                        ) : (
                          <Calendar className="w-4 h-4 text-apple-blue" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm sm:text-base font-medium truncate">
                            {quiz.quizType === 'timed'
                              ? 'Timed Quiz'
                              : quiz.quizType === 'streak'
                              ? 'Streak Quiz'
                              : quiz.quizType === 'reverse'
                              ? 'Quiz Inverso'
                              : `Quiz #${recentHistory.length - idx}`}
                          </span>
                          <span className="text-xs text-apple-secondary">
                            {quiz.dateLabel}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-apple-secondary">
                          {quiz.quizType === 'timed' && quiz.timeTaken != null && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>
                                {Math.floor(quiz.timeTaken / 60)}m{' '}
                                {quiz.timeTaken % 60}s
                              </span>
                            </>
                          )}
                          {quiz.quizType === 'streak' && (
                            <>
                              <Zap className="w-3 h-3" />
                              <span>{quiz.streakCount} risp. di fila</span>
                            </>
                          )}
                          <span>
                            {quiz.correctAnswers}/{quiz.totalQuestions} corrette
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-base sm:text-lg font-bold flex-shrink-0"
                      style={{ color: perfColor(quiz.score) }}
                    >
                      {Math.round(quiz.score)}%
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-8 h-8 text-apple-secondary mx-auto mb-2" />
                <p className="text-sm text-apple-secondary">
                  Nessun quiz completato
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StatsScreen;
