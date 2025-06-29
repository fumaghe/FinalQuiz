// src/components/StatsScreen.tsx
import React, { useState } from 'react';
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
} from 'recharts';

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */
interface StatsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */
const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
  const { state } = useQuiz();
  const { userStats, topics } = state;

  /* -------------------------------------------------------------- */
  /* STATE (tabs e periodo chart)                                   */
  /* -------------------------------------------------------------- */
  const [activeTab, setActiveTab] = useState<'general' | 'topics' | 'history'>(
    'general'
  );
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 50>(7);

  /* -------------------------------------------------------------- */
  /* UTILITIES                                                      */
  /* -------------------------------------------------------------- */
  /* 1. Dati per il grafico (ultimi N quiz, qualsiasi tipo) -------- */
  const getChartData = () =>
    userStats.quizHistory
      .slice(-chartPeriod)
      .map((quiz, i) => ({
        quiz: `Q${i + 1}`,
        accuracy: Math.round(quiz.score),
        date: quiz.timestamp,
        type: quiz.quizType,
      }));

  /* 2. Badge dinamici -------------------------------------------- */
  const getBadges = () => {
    const badges: { icon: string; title: string; description: string; color: string }[] = [];

    /* Serie di successi */
    if (userStats.currentStreak >= 5) {
      badges.push({
        icon: '🔥',
        title: 'Serie di Successi',
        description: `${userStats.currentStreak} quiz consecutivi`,
        color: 'from-orange-400 to-red-500',
      });
    }

    /* Badge “Speed Runner” – miglior tempo < 300 s */
    const bestTimed = userStats.quizHistory
      .filter((q) => q.quizType === 'timed' && q.timeTaken != null)
      .sort((a, b) => (a.timeTaken! - b.timeTaken!))[0];
    if (bestTimed && bestTimed.timeTaken! <= 300) {
      badges.push({
        icon: '⚡',
        title: 'Speed Runner',
        description: `Quiz a tempo in ${Math.floor(bestTimed.timeTaken! / 60)}m ${bestTimed.timeTaken! % 60}s`,
        color: 'from-purple-500 to-indigo-500',
      });
    }

    /* Per-topic */
    Object.entries(userStats.statsPerTopic).forEach(([topic, stats]) => {
      const acc = stats.done > 0 ? (stats.correct / stats.done) * 100 : 0;
      if (acc >= 80 && stats.done >= 5) {
        badges.push({
          icon: '⭐',
          title: 'Esperto',
          description: `${Math.round(acc)}% su ${topic}`,
          color: 'from-yellow-400 to-orange-400',
        });
      }
    });

    /* Milestone domande totali */
    if (userStats.totalQuestions >= 100) {
      badges.push({
        icon: '🎯',
        title: 'Centurione',
        description: `${userStats.totalQuestions} domande completate`,
        color: 'from-blue-400 to-indigo-500',
      });
    }

    return badges.slice(0, 3);
  };

  /* 3. Storico quiz (generale + timed, ultimi 10) ----------------- */
  const getRecentQuizHistory = () =>
    userStats.quizHistory
      .filter((q) => q.quizType === 'general' || q.quizType === 'timed')
      .slice(-10)
      .reverse()
      .map((q) => ({
        ...q,
        dateLabel: new Date(q.timestamp).toLocaleDateString('it-IT'),
      }));

  /* 4. Stats per topic ------------------------------------------- */
  const topicStats = Object.entries(userStats.statsPerTopic)
    .map(([name, stats]) => {
      const topic = topics.find((t) => t.name === name);
      const accuracy = stats.done > 0 ? (stats.correct / stats.done) * 100 : 0;
      return {
        topic: name,
        displayName: topic?.name || name,
        icon: topic?.icon || '📝',
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        totalAttempts: stats.done,
        accuracy,
      };
    })
    .filter((s) => s.totalAttempts > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  /* Derivati UI --------------------------------------------------- */
  const chartData        = getChartData();
  const badges           = getBadges();
  const recentQuizHistory = getRecentQuizHistory();

  const perfColor = (acc: number) =>
    acc >= 80 ? '#34C759' : acc >= 60 ? '#FF9F0A' : '#FF3B30';
  const perfLabel = (acc: number) =>
    acc >= 80 ? 'Eccellente' : acc >= 60 ? 'Buono' : 'Da migliorare';

  const handleQuizHistoryTap = (q: any) =>
    onNavigate('review', { quizHistory: q });

  /* Miglior tempo per card generale ------------------------------ */
  const bestTimed = userStats.quizHistory
    .filter((q) => q.quizType === 'timed' && q.timeTaken != null)
    .sort((a, b) => a.timeTaken! - b.timeTaken!)[0];

  /* -------------------------------------------------------------- */
  /* RENDER                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-apple-light overflow-x-hidden">
      {/* ---------------------------------------------------------- */}
      {/* HEADER                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="bg-apple-card shadow-apple-card px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
          </button>
          <h1 className="flex-1 min-w-0 text-lg sm:text-xl font-semibold">
            Statistiche
          </h1>
        </div>

        {/* TABS */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-1 bg-apple-light rounded-apple p-1">
            {(['general', 'topics', 'history'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  flex-shrink-0 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm
                  font-medium transition-all whitespace-nowrap
                  ${
                    activeTab === key
                      ? 'bg-apple-card text-apple-blue shadow-apple-card'
                      : 'text-apple-secondary hover:text-apple-text'
                  }
                `}
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

        {/* BADGES */}
        {badges.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {badges.map((b, i) => (
                <div
                  key={i}
                  className={`
                    bg-gradient-to-r ${b.color} p-3 rounded-lg text-white shadow-sm
                    transform hover:scale-105 transition-transform duration-200
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{b.title}</p>
                      <p className="text-xs opacity-90 truncate">{b.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------- */}
      {/* MAIN CONTENT                                              */}
      {/* ---------------------------------------------------------- */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 max-w-screen-lg mx-auto">
        {/* ======================================================== */}
        {/* TAB GENERALE                                             */}
        {/* ======================================================== */}
        {activeTab === 'general' && (
          <>
            {/* CARDS IN ALTO */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="apple-card p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-blue/10 rounded-apple flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">
                  {userStats.totalQuizzes}
                </p>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Quiz completati
                </p>
              </div>

              <div className="apple-card p-4 sm:p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-green/10 rounded-apple flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-apple-green" />
                </div>
                <p className="text-xl sm:text-2xl font-bold">
                  {Math.round(userStats.overallAccuracy)}%
                </p>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Precisione media
                </p>
              </div>

              {/* Card Miglior Tempo (solo se esiste) */}
              {bestTimed && (
                <div className="apple-card p-4 sm:p-6 text-center col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-apple flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                  </div>
                  <p className="text-xl sm:text-2xl font-bold">
                    {Math.floor(bestTimed.timeTaken! / 60)}m {bestTimed.timeTaken! % 60}s
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
                      className="appearance-none bg-apple-light border border-apple-border rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm pr-6 sm:pr-8"
                    >
                      <option value={7}>Ultimi 7</option>
                      <option value={30}>Ultimi 30</option>
                      <option value={50}>Ultimi 50</option>
                    </select>
                    <ChevronDown className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-apple-secondary pointer-events-none" />
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
                      <Bar dataKey="accuracy" fill="#007AFF" radius={[2, 2, 0, 0]} />
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
                {userStats.correctAnswers} risposte corrette su {userStats.totalQuestions}
              </p>
            </div>

            {/* STREAK */}
            <div className="apple-card p-4 sm:p-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-yellow/10 rounded-apple flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 text-apple-yellow" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium">Serie di successi</h3>
                  <p className="text-xs sm:text-sm text-apple-secondary">
                    Streak attuale: {userStats.currentStreak} | Record: {userStats.bestStreak}
                  </p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-apple-yellow flex-shrink-0">
                  {userStats.currentStreak}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* TAB TOPICS                                               */}
        {/* ======================================================== */}
        {activeTab === 'topics' && (
          <>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Performance per argomento
            </h3>

            {topicStats.length > 0 ? (
              topicStats.map((stat, idx) => (
                <div key={stat.topic} className="apple-card p-3 sm:p-4">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-apple-blue/10 rounded-apple flex items-center justify-center flex-shrink-0">
                      <span className="text-sm sm:text-base">{stat.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm sm:text-base font-medium truncate">
                          {stat.displayName}
                        </h4>
                        <span className="text-xs text-apple-secondary">#{idx + 1}</span>
                      </div>

                      <div className="w-full bg-apple-light rounded-full h-1.5 sm:h-2 mb-2">
                        <div
                          className="h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(stat.accuracy, 100)}%`,
                            backgroundColor: perfColor(stat.accuracy),
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-apple-secondary">
                          {stat.correctAnswers}/{stat.totalAttempts} corrette ({stat.totalQuestions} totali)
                        </span>
                        <span
                          className="text-xs font-medium"
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
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-apple-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-apple-secondary" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  Nessuna statistica disponibile
                </h3>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Completa alcuni quiz per vedere le statistiche per argomento
                </p>
              </div>
            )}
          </>
        )}

        {/* ======================================================== */}
        {/* TAB HISTORY                                              */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Storico Quiz recenti
            </h3>

            {recentQuizHistory.length > 0 ? (
              recentQuizHistory.map((quiz, idx) => (
                <button
                  key={quiz.id}
                  onClick={() => handleQuizHistoryTap(quiz)}
                  className="w-full apple-card p-3 sm:p-4 text-left hover:bg-apple-light/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-apple-blue/10 rounded-apple flex items-center justify-center flex-shrink-0">
                        {quiz.quizType === 'timed' ? (
                          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        ) : (
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-apple-blue" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm sm:text-base font-medium">
                            {quiz.quizType === 'timed'
                              ? 'Timed Quiz'
                              : `Quiz #${recentQuizHistory.length - idx}`}
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
                                {Math.floor(quiz.timeTaken / 60)}m {quiz.timeTaken % 60}s
                              </span>
                            </>
                          )}
                          <span className="flex items-center space-x-1">
                            <span>
                              {quiz.correctAnswers}/{quiz.totalQuestions} corrette
                            </span>
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
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-apple-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-apple-secondary" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">
                  Nessun quiz completato
                </h3>
                <p className="text-xs sm:text-sm text-apple-secondary">
                  Completa alcuni quiz per vedere lo storico
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
