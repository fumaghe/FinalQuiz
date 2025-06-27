
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Question, QuizSession, UserStats, UserSettings, Topic } from '../types/quiz';
import { loadQuestionsFromFiles } from '../utils/questionLoader';

interface QuizState {
  questions: Question[];
  topics: Topic[];
  currentSession: QuizSession | null;
  userStats: UserStats;
  settings: UserSettings;
  loading: boolean;
}

type QuizAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_QUESTIONS'; payload: Question[] }
  | { type: 'LOAD_TOPICS'; payload: Topic[] }
  | { type: 'START_QUIZ'; payload: QuizSession }
  | { type: 'ANSWER_QUESTION'; payload: { index: number; answer: number } }
  | { type: 'END_QUIZ' }
  | { type: 'UPDATE_STATS'; payload: UserStats }
  | { type: 'UPDATE_SETTINGS'; payload: UserSettings }
  | { type: 'TOGGLE_FAVORITE'; payload: string };

const initialState: QuizState = {
  questions: [],
  topics: [],
  currentSession: null,
  userStats: {
    totalQuizzes: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    overallAccuracy: 0,
    currentStreak: 0,
    bestStreak: 0,
    topicStats: [],
    lastUpdated: new Date(),
    answeredQuestions: {},
    correctQuestions: {},
    incorrectQuestions: {},
    quizHistory: [],
    statsPerTopic: {}
  },
  settings: {
    fontSize: 'medium',
    darkMode: false,
    reminders: false,
    reminderTime: '18:00'
  },
  loading: true
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'LOAD_QUESTIONS':
      return { ...state, questions: action.payload };
    
    case 'LOAD_TOPICS':
      return { ...state, topics: action.payload };
    
    case 'START_QUIZ':
      return { ...state, currentSession: action.payload };
    
    case 'ANSWER_QUESTION':
      if (!state.currentSession) return state;
      const newAnswers = [...state.currentSession.answers];
      newAnswers[action.payload.index] = action.payload.answer;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          answers: newAnswers
        }
      };
    
    case 'END_QUIZ':
      return { ...state, currentSession: null };
    
    case 'UPDATE_STATS':
      return { ...state, userStats: action.payload };
    
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        topics: state.topics.map(topic =>
          topic.id === action.payload
            ? { ...topic, isFavorite: !topic.isFavorite }
            : topic
        )
      };
    
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  resetAllQuestions: () => void;
  getFilteredQuestions: (type: 'all' | 'unanswered' | 'incorrect') => Question[];
} | null>(null);

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const resetAllQuestions = () => {
    const resetStats = {
      ...state.userStats,
      answeredQuestions: {},
      correctQuestions: {},
      incorrectQuestions: {},
      statsPerTopic: {},
      lastUpdated: new Date()
    };
    dispatch({ type: 'UPDATE_STATS', payload: resetStats });
  };

  const getFilteredQuestions = (type: 'all' | 'unanswered' | 'incorrect') => {
    switch (type) {
      case 'unanswered':
        return state.questions.filter(q => !state.userStats.correctQuestions[q.id]);
      case 'incorrect':
        return state.questions.filter(q => state.userStats.incorrectQuestions[q.id]);
      default:
        return state.questions;
    }
  };

  useEffect(() => {
    const loadStoredData = () => {
      try {
        const storedStats = localStorage.getItem('quizmaster_stats');
        if (storedStats) {
          const parsedStats = JSON.parse(storedStats);
          const updatedStats = {
            ...parsedStats,
            answeredQuestions: parsedStats.answeredQuestions || {},
            correctQuestions: parsedStats.correctQuestions || {},
            incorrectQuestions: parsedStats.incorrectQuestions || {},
            quizHistory: parsedStats.quizHistory || [],
            statsPerTopic: parsedStats.statsPerTopic || {}
          };
          dispatch({ type: 'UPDATE_STATS', payload: updatedStats });
        }

        const storedSettings = localStorage.getItem('quizmaster_settings');
        if (storedSettings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(storedSettings) });
        }

        const storedTopics = localStorage.getItem('quizmaster_topics');
        if (storedTopics) {
          dispatch({ type: 'LOAD_TOPICS', payload: JSON.parse(storedTopics) });
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    const loadQuestions = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const questions = await loadQuestionsFromFiles();
        dispatch({ type: 'LOAD_QUESTIONS', payload: questions });
        
        if (state.topics.length === 0) {
          const topics = generateTopicsFromQuestions(questions);
          dispatch({ type: 'LOAD_TOPICS', payload: topics });
          localStorage.setItem('quizmaster_topics', JSON.stringify(topics));
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadStoredData();
    loadQuestions();
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (state.userStats.totalQuizzes > 0) {
      localStorage.setItem('quizmaster_stats', JSON.stringify(state.userStats));
    }
  }, [state.userStats]);

  useEffect(() => {
    localStorage.setItem('quizmaster_settings', JSON.stringify(state.settings));
  }, [state.settings]);

  useEffect(() => {
    if (state.topics.length > 0) {
      localStorage.setItem('quizmaster_topics', JSON.stringify(state.topics));
    }
  }, [state.topics]);

  return (
    <QuizContext.Provider value={{ state, dispatch, resetAllQuestions, getFilteredQuestions }}>
      {children}
    </QuizContext.Provider>
  );
};

function generateTopicsFromQuestions(questions: Question[]): Topic[] {
  const topicMap = new Map<string, { count: number; questions: Question[] }>();
  
  questions.forEach(question => {
    if (!topicMap.has(question.topic)) {
      topicMap.set(question.topic, { count: 0, questions: [] });
    }
    const topic = topicMap.get(question.topic)!;
    topic.count++;
    topic.questions.push(question);
  });

  const topicIcons: Record<string, string> = {
    'SQL': '🗄️',
    'Statistica': '📊',
    'Tableau': '📈',
    'Databricks': '⚡',
    'DataLake2': '🏞️',
    'Git': '🔧',
    'NoSQL': '🍃',
    'PowerBI': '📊',
    'Python': '🐍',
    'R': '📊',
    'ML': '🤖',
    'DeepLearning': '🧠'
  };

  return Array.from(topicMap.entries()).map(([name, data]) => ({
    id: name.toLowerCase(),
    name,
    icon: topicIcons[name] || '📝',
    description: `${data.count} domande disponibili`,
    totalQuestions: data.count,
    completed: 0,
    isFavorite: false
  }));
}
