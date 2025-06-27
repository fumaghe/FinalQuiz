
import React, { useState } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { Search, ArrowLeft, Heart } from 'lucide-react';

interface TopicsListProps {
  onNavigate: (screen: string, params?: any) => void;
}

const TopicsList: React.FC<TopicsListProps> = ({ onNavigate }) => {
  const { state, dispatch } = useQuiz();
  const { topics, userStats } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'favorites'>('all');

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filter) {
      case 'incomplete':
        return matchesSearch && topic.completed < topic.totalQuestions;
      case 'favorites':
        return matchesSearch && topic.isFavorite;
      default:
        return matchesSearch;
    }
  });

  const getTopicStats = (topicName: string) => {
    const stats = userStats.statsPerTopic[topicName];
    if (stats) {
      return {
        correctAnswers: stats.correct || 0,
        totalAnswered: stats.done || 0,
        accuracy: stats.done > 0 ? Math.round((stats.correct / stats.done) * 100) : 0
      };
    }
    return {
      correctAnswers: 0,
      totalAnswered: 0,
      accuracy: 0
    };
  };

  const handleTopicSelect = (topic: any) => {
    onNavigate('quiz', { type: 'topic', topicId: topic.id, topicName: topic.name });
  };

  const toggleFavorite = (topicId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: topicId });
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
          <h1 className="text-h2 font-semibold">Argomenti</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-apple-secondary" />
          <input
            type="text"
            placeholder="Cerca argomenti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 apple-input"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-apple-light rounded-apple p-1">
          {[
            { key: 'all', label: 'Tutti' },
            { key: 'incomplete', label: 'Da completare' },
            { key: 'favorites', label: 'Preferiti' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`
                flex-1 py-2 px-4 rounded-lg text-caption font-medium transition-all
                ${filter === tab.key 
                  ? 'bg-apple-card text-apple-blue shadow-apple-card' 
                  : 'text-apple-secondary hover:text-apple-text'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Topics List */}
      <div className="px-apple-2x py-4 space-y-3 pb-20">
        {filteredTopics.map((topic) => {
          const stats = getTopicStats(topic.name);
          const progress = topic.totalQuestions > 0 
            ? (stats.correctAnswers / topic.totalQuestions) * 100 
            : 0;

          return (
            <div
              key={topic.id}
              className="apple-card p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {/* Topic Icon */}
                <div className="w-12 h-12 bg-apple-blue/10 rounded-apple flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{topic.icon}</span>
                </div>

                {/* Topic Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-h3 font-medium truncate">{topic.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(topic.id);
                      }}
                      className="p-1 rounded-full hover:bg-apple-light transition-colors"
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          topic.isFavorite ? 'text-apple-red fill-current' : 'text-apple-secondary'
                        }`} 
                      />
                    </button>
                  </div>
                  
                  <p className="text-caption text-apple-secondary mb-2">
                    {topic.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-apple-light rounded-full h-2 mb-2">
                    <div 
                      className="bg-apple-green h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-small text-apple-secondary">
                      {stats.correctAnswers}/{topic.totalQuestions} completate
                    </span>
                    {stats.accuracy > 0 && (
                      <span className="text-small font-medium text-apple-green">
                        {stats.accuracy}% precisione
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleTopicSelect(topic)}
                  className="px-6 py-2 bg-apple-blue text-white rounded-apple text-caption font-medium apple-button"
                >
                  Inizia
                </button>
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-apple-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-apple-secondary" />
            </div>
            <h3 className="text-h3 font-medium text-apple-text mb-2">
              Nessun argomento trovato
            </h3>
            <p className="text-caption text-apple-secondary">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicsList;
