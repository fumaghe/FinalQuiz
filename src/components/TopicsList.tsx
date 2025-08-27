import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Heart } from 'lucide-react';

import { useQuiz, norm } from '../contexts/QuizContext';   //  ← norm !

/* ------------------------------------------------------------------ */
/* TYPES                                                              */
/* ------------------------------------------------------------------ */
interface TopicsListProps {
  onNavigate: (screen: string, params?: any) => void;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */
const TopicsList: React.FC<TopicsListProps> = ({ onNavigate }) => {
  const { state, dispatch } = useQuiz();
  const { topics, userStats } = state;

  /* -------------------------------------------------------------- */
  /* STATE FILTRI & SEARCH                                          */
  /* -------------------------------------------------------------- */
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'favorites'>(
    'all',
  );

  /* -------------------------------------------------------------- */
  /* AGGREGAZIONE STAT UNIQUE (tutte le modalità tranne reverse)     */
  /* -------------------------------------------------------------- */
  const aggregatedStats = useMemo(() => {
    const lastAttempt = new Map<
      string,
      { topic: string; isCorrect: boolean }
    >();

    userStats.quizHistory
      .filter(q => q.quizType !== 'reverse')
      .forEach(quiz => {
        (quiz.answeredQuestions ?? []).forEach(a => {
          lastAttempt.set(a.questionId, {
            topic: norm(a.topic),               // 🎯 sempre canonico
            isCorrect: a.isCorrect,
          });
        });
      });

    const agg: Record<string, { done: number; correct: number }> = {};
    lastAttempt.forEach(({ topic, isCorrect }) => {
      if (!agg[topic]) agg[topic] = { done: 0, correct: 0 };
      agg[topic].done += 1;
      if (isCorrect) agg[topic].correct += 1;
    });

    return agg;
  }, [userStats.quizHistory]);

  /* -------------------------------------------------------------- */
  /* UTILS                                                          */
  /* -------------------------------------------------------------- */
  const getTopicStats = (topicId: string) => {
      const key = norm(topicId);               // 🎯 stessa regola
    const st = aggregatedStats[key];
    if (!st) return { correctAnswers: 0, totalAnswered: 0, accuracy: 0 };

    return {
      correctAnswers: st.correct,
      totalAnswered: st.done,
      accuracy: Math.round((st.correct / st.done) * 100),
    };
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    switch (filter) {
      case 'incomplete': {
        const stats = getTopicStats(topic.id);
        return matchesSearch && stats.correctAnswers < topic.totalQuestions;
      }
      case 'favorites':
        return matchesSearch && topic.isFavorite;
      default:
        return matchesSearch;
    }
  });

  const handleTopicSelect = (topic: any) => {
    onNavigate('quiz', {
      type: 'topic',
      topicId: topic.id,
      topicName: topic.name,
    });
  };

  const toggleFavorite = (topicId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: topicId });
  };

  /* -------------------------------------------------------------- */
  /* RENDER                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-its-light">
      {/* ---------- HEADER ---------- */}
      <header className="bg-its-card shadow-its-card px-its-2x py-4">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-its-light transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-its-red" />
          </button>
          <h1 className="text-h2 font-semibold">Argomenti</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-its-secondary" />
          <input
            type="text"
            placeholder="Cerca argomenti…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 its-input"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-its-light rounded-its p-1">
          {[
            { key: 'all', label: 'Tutti' },
            { key: 'incomplete', label: 'Da completare' },
            { key: 'favorites', label: 'Preferiti' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-caption font-medium transition-all ${
                filter === tab.key
                  ? 'bg-its-card text-its-red shadow-its-card'
                  : 'text-its-secondary hover:text-its-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ---------- LISTA ---------- */}
      <div className="px-its-2x py-4 space-y-3 pb-20">
        {filteredTopics.map(topic => {
          const stats = getTopicStats(topic.id);
          const progress =
            topic.totalQuestions > 0
              ? (stats.correctAnswers / topic.totalQuestions) * 100
              : 0;

          return (
            <div
              key={topic.id}
              className="its-card p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {/* Icona */}
                <div className="w-12 h-12 bg-its-red/10 rounded-its flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{topic.icon}</span>
                </div>

                {/* Dati */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-h3 font-medium truncate">{topic.name}</h3>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavorite(topic.id);
                      }}
                      className="p-1 rounded-full hover:bg-its-light transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          topic.isFavorite
                            ? 'text-its-red-dark fill-current'
                            : 'text-its-secondary'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-caption text-its-secondary mb-2">
                    {topic.description}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full bg-its-light rounded-full h-2 mb-2">
                    <div
                      className="bg-its-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-small text-its-secondary">
                      {stats.correctAnswers}/{topic.totalQuestions} completate
                    </span>
                    {stats.accuracy > 0 && (
                      <span className="text-small font-medium text-its-green">
                        {stats.accuracy}% precisione
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottone */}
                <button
                  onClick={() => handleTopicSelect(topic)}
                  className="px-6 py-2 bg-its-red text-white rounded-its text-caption font-medium its-button"
                >
                  Inizia
                </button>
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-its-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-its-secondary" />
            </div>
            <h3 className="text-h3 font-medium text-its-text mb-2">
              Nessun argomento trovato
            </h3>
            <p className="text-caption text-its-secondary">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicsList;
