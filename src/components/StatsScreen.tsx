
import React, { useState } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { ArrowLeft, TrendingUp, Target, Award } from 'lucide-react';
import ProgressRing from './ProgressRing';

interface StatsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ onNavigate }) => {
  const { state } = useQuiz();
  const { userStats, topics } = state;
  const [activeTab, setActiveTab] = useState<'general' | 'topics'>('general');

  // Crea statistiche per argomento basate sui dati reali
  const topicStatsWithNames = Object.entries(userStats.statsPerTopic)
    .map(([topicName, stats]) => {
      const topic = topics.find(t => t.name === topicName);
      const accuracy = stats.done > 0 ? (stats.correct / stats.done) * 100 : 0;
      
      return {
        topic: topicName,
        displayName: topic?.name || topicName,
        icon: topic?.icon || '📝',
        totalQuestions: stats.total,
        correctAnswers: stats.correct,
        totalAttempts: stats.done,
        accuracy,
        averageTime: 0, // Non ancora implementato
        lastAttempt: new Date(), // Non ancora implementato
        masteryLevel: accuracy >= 80 ? 'advanced' : accuracy >= 60 ? 'intermediate' : 'beginner' as const
      };
    })
    .filter(stat => stat.totalAttempts > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const getPerformanceColor = (accuracy: number) => {
    if (accuracy >= 80) return '#34C759';
    if (accuracy >= 60) return '#FF9F0A';
    return '#FF3B30';
  };

  const getPerformanceLabel = (accuracy: number) => {
    if (accuracy >= 80) return 'Eccellente';
    if (accuracy >= 60) return 'Buono';
    return 'Da migliorare';
  };

  return (
    <div className="min-h-screen bg-apple-light">
      {/* Header */}
      <header className="bg-apple-card shadow-apple-card px-apple-2x py-4">
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-apple-blue" />
          </button>
          <h1 className="text-h2 font-semibold">Statistiche</h1>
        </div>

        {/* Tab Selector */}
        <div className="flex space-x-1 bg-apple-light rounded-apple p-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`
              flex-1 py-2 px-4 rounded-lg text-caption font-medium transition-all
              ${activeTab === 'general' 
                ? 'bg-apple-card text-apple-blue shadow-apple-card' 
                : 'text-apple-secondary hover:text-apple-text'
              }
            `}
          >
            Generale
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`
              flex-1 py-2 px-4 rounded-lg text-caption font-medium transition-all
              ${activeTab === 'topics' 
                ? 'bg-apple-card text-apple-blue shadow-apple-card' 
                : 'text-apple-secondary hover:text-apple-text'
              }
            `}
          >
            Per Argomento
          </button>
        </div>
      </header>

      <div className="px-apple-2x py-6 space-y-6 pb-20">
        {activeTab === 'general' ? (
          <>
            {/* Overall Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="apple-card p-6 text-center">
                <div className="w-12 h-12 bg-apple-blue/10 rounded-apple flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-apple-blue" />
                </div>
                <p className="text-h1 font-bold text-apple-text mb-1">
                  {userStats.totalQuizzes}
                </p>
                <p className="text-caption text-apple-secondary">Quiz completati</p>
              </div>

              <div className="apple-card p-6 text-center">
                <div className="w-12 h-12 bg-apple-green/10 rounded-apple flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-apple-green" />
                </div>
                <p className="text-h1 font-bold text-apple-text mb-1">
                  {Math.round(userStats.overallAccuracy)}%
                </p>
                <p className="text-caption text-apple-secondary">Precisione media</p>
              </div>
            </div>

            {/* Performance Ring */}
            <div className="apple-card p-6">
              <h3 className="text-h3 font-medium mb-4 text-center">Performance Generale</h3>
              <div className="flex justify-center mb-4">
                <ProgressRing 
                  progress={userStats.overallAccuracy} 
                  size={120} 
                  strokeWidth={8}
                  color={getPerformanceColor(userStats.overallAccuracy)}
                >
                  <div className="text-center">
                    <p className="text-h2 font-bold">
                      {Math.round(userStats.overallAccuracy)}%
                    </p>
                    <p className="text-small text-apple-secondary">
                      {getPerformanceLabel(userStats.overallAccuracy)}
                    </p>
                  </div>
                </ProgressRing>
              </div>
              <div className="text-center">
                <p className="text-body text-apple-secondary">
                  {userStats.correctAnswers} risposte corrette su {userStats.totalQuestions}
                </p>
              </div>
            </div>

            {/* Streak Info */}
            <div className="apple-card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-apple-yellow/10 rounded-apple flex items-center justify-center">
                  <Award className="w-6 h-6 text-apple-yellow" />
                </div>
                <div className="flex-1">
                  <h3 className="text-h3 font-medium">Serie di successi</h3>
                  <p className="text-caption text-apple-secondary">
                    Streak attuale: {userStats.currentStreak} | Record: {userStats.bestStreak}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-h2 font-bold text-apple-yellow">
                    {userStats.currentStreak}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Topics Performance */}
            <div className="space-y-3">
              <h3 className="text-h3 font-medium">Performance per argomento</h3>
              
              {topicStatsWithNames.length > 0 ? (
                topicStatsWithNames.map((stat, index) => (
                  <div key={stat.topic} className="apple-card p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-apple-blue/10 rounded-apple flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{stat.icon}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-body font-medium truncate">
                            {stat.displayName}
                          </h4>
                          <span className="text-caption font-medium text-apple-secondary">
                            #{index + 1}
                          </span>
                        </div>
                        
                        <div className="w-full bg-apple-light rounded-full h-2 mb-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(stat.accuracy, 100)}%`,
                              backgroundColor: getPerformanceColor(stat.accuracy)
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-small text-apple-secondary">
                            {stat.correctAnswers}/{stat.totalAttempts} corrette ({stat.totalQuestions} totali)
                          </span>
                          <span 
                            className="text-small font-medium"
                            style={{ color: getPerformanceColor(stat.accuracy) }}
                          >
                            {Math.round(stat.accuracy)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-apple-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-apple-secondary" />
                  </div>
                  <h3 className="text-h3 font-medium text-apple-text mb-2">
                    Nessuna statistica disponibile
                  </h3>
                  <p className="text-caption text-apple-secondary">
                    Completa alcuni quiz per vedere le tue statistiche per argomento
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatsScreen;
