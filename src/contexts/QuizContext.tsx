import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from 'react';

import {
  Question,
  QuizSession,
  UserStats,
  UserSettings,
  Topic,
} from '../types/quiz';
import { loadQuestionsFromFiles } from '../utils/questionLoader';

/* ------------------------------------------------------------------ */
/* STATE & ACTIONS                                                    */
/* ------------------------------------------------------------------ */

export interface QuizState {
  /* Dati core ------------------------------------------------------ */
  questions:        Question[];
  topics:           Topic[];
  currentSession:   QuizSession | null;
  userStats:        UserStats;
  settings:         UserSettings;
  loading:          boolean;

  /* Navigazione interna -------------------------------------------- */
  currentScreen:    string;   // es. 'dashboard', 'quiz', ...
  screenParams?:    any;      // parametri opzionali per la schermata
}

export type QuizAction =
  | { type: 'SET_LOADING';       payload: boolean }
  | { type: 'LOAD_QUESTIONS';    payload: Question[] }
  | { type: 'LOAD_TOPICS';       payload: Topic[] }
  | { type: 'START_QUIZ';        payload: QuizSession }
  | { type: 'ANSWER_QUESTION';   payload: { index: number; answer: number } }
  | { type: 'END_QUIZ' }
  | { type: 'UPDATE_STATS';      payload: UserStats }
  | { type: 'UPDATE_SETTINGS';   payload: UserSettings }
  | { type: 'TOGGLE_FAVORITE';   payload: string }
  | { type: 'SET_CURRENT_SCREEN';payload: { screen: string; params?: any } };

/* ------------------------------------------------------------------ */
/* INITIAL STATE                                                      */
/* ------------------------------------------------------------------ */

const initialState: QuizState = {
  questions:  [],
  topics:     [],
  currentSession: null,
  userStats: {
    totalQuizzes:      0,
    totalQuestions:    0,
    correctAnswers:    0,
    overallAccuracy:   0,
    currentStreak:     0,
    bestStreak:        0,
    topicStats:        [],
    lastUpdated:       new Date(),
    answeredQuestions: {},
    correctQuestions:  {},
    incorrectQuestions:{},
    quizHistory:       [],
    statsPerTopic:     {},
  },
  settings: {
    fontSize:      'medium',
    darkMode:      false,
    reminders:     false,
    reminderTime:  '18:00',
  },
  loading: true,

  /* Navigazione ---------------------------------------------------- */
  currentScreen: 'splash',
  screenParams:  null,
};

/* ------------------------------------------------------------------ */
/* REDUCER                                                            */
/* ------------------------------------------------------------------ */

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    /* -------------------------------------------------------------- */
    /* BOOT & DOMANDE                                                 */
    /* -------------------------------------------------------------- */
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'LOAD_QUESTIONS':
      return { ...state, questions: action.payload };

    case 'LOAD_TOPICS':
      return { ...state, topics: action.payload };

    /* -------------------------------------------------------------- */
    /* SESSIONE QUIZ                                                 */
    /* -------------------------------------------------------------- */
    case 'START_QUIZ':
      return { ...state, currentSession: action.payload };

    case 'ANSWER_QUESTION': {
      if (!state.currentSession) return state;
      const answers = [...state.currentSession.answers];
      answers[action.payload.index] = action.payload.answer;
      return {
        ...state,
        currentSession: { ...state.currentSession, answers },
      };
    }

    case 'END_QUIZ':
      return { ...state, currentSession: null };

    /* -------------------------------------------------------------- */
    /* STATISTICHE & SETTINGS                                        */
    /* -------------------------------------------------------------- */
    case 'UPDATE_STATS':
      return { ...state, userStats: action.payload };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };

    /* -------------------------------------------------------------- */
    /* TOPICS FAVORITI                                               */
    /* -------------------------------------------------------------- */
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.payload ? { ...t, isFavorite: !t.isFavorite } : t
        ),
      };

    /* -------------------------------------------------------------- */
    /* NAVIGAZIONE                                                   */
    /* -------------------------------------------------------------- */
    case 'SET_CURRENT_SCREEN':
      return {
        ...state,
        currentScreen: action.payload.screen,
        screenParams:  action.payload.params ?? null,
      };

    /* -------------------------------------------------------------- */
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* CONTEXT + HOOK                                                     */
/* ------------------------------------------------------------------ */

const QuizContext = createContext<{
  state:               QuizState;
  dispatch:            React.Dispatch<QuizAction>;
  resetAllQuestions:   () => void;
  getFilteredQuestions:(type: 'all' | 'unanswered' | 'incorrect') => Question[];
} | null>(null);

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within a QuizProvider');
  return ctx;
};

/* ------------------------------------------------------------------ */
/* PROVIDER                                                           */
/* ------------------------------------------------------------------ */

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  /* -------------------------------------------------------------- */
  /* UTILS                                                          */
  /* -------------------------------------------------------------- */
  const resetAllQuestions = () => {
    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...state.userStats,
        answeredQuestions: {},
        correctQuestions:  {},
        incorrectQuestions:{},
        statsPerTopic:     {},
        lastUpdated:       new Date(),
      },
    });
  };

  const getFilteredQuestions = (
    type: 'all' | 'unanswered' | 'incorrect'
  ) => {
    switch (type) {
      case 'unanswered':
        return state.questions.filter(
          (q) => !state.userStats.answeredQuestions[q.id]
        );
      case 'incorrect':
        return state.questions.filter(
          (q) => state.userStats.incorrectQuestions[q.id]
        );
      default:
        return state.questions;
    }
  };

  /* -------------------------------------------------------------- */
  /* LOAD                       (localStorage + files)              */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    const loadStoredData = () => {
      try {
        /* Stats --------------------------------------------------- */
        const stats = localStorage.getItem('quizmaster_stats');
        if (stats) {
          const parsed = JSON.parse(stats);
          dispatch({ type: 'UPDATE_STATS', payload: parsed });
        }

        /* Settings ------------------------------------------------ */
        const settings = localStorage.getItem('quizmaster_settings');
        if (settings) {
          dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(settings) });
        }

        /* Topics -------------------------------------------------- */
        const topics = localStorage.getItem('quizmaster_topics');
        if (topics) {
          dispatch({ type: 'LOAD_TOPICS', payload: JSON.parse(topics) });
        }
      } catch (err) {
        console.error('Error loading stored data', err);
      }
    };

    const loadQuestions = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const questions = await loadQuestionsFromFiles();
        dispatch({ type: 'LOAD_QUESTIONS', payload: questions });

        /* Genera topics al primo avvio --------------------------- */
        if (state.topics.length === 0) {
          const topics = generateTopicsFromQuestions(questions);
          dispatch({ type: 'LOAD_TOPICS', payload: topics });
          localStorage.setItem('quizmaster_topics', JSON.stringify(topics));
        }
      } catch (err) {
        console.error('Error loading questions', err);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadStoredData();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------------------------------------------- */
  /* PERSISTENZA AUTOMATICA                                         */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (state.userStats.totalQuizzes > 0)
      localStorage.setItem('quizmaster_stats', JSON.stringify(state.userStats));
  }, [state.userStats]);

  useEffect(() => {
    localStorage.setItem('quizmaster_settings', JSON.stringify(state.settings));
  }, [state.settings]);

  useEffect(() => {
    if (state.topics.length > 0)
      localStorage.setItem('quizmaster_topics', JSON.stringify(state.topics));
  }, [state.topics]);

  /* -------------------------------------------------------------- */
  /* RENDER                                                         */
  /* -------------------------------------------------------------- */
  return (
    <QuizContext.Provider
      value={{ state, dispatch, resetAllQuestions, getFilteredQuestions }}
    >
      {children}
    </QuizContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                            */
/* ------------------------------------------------------------------ */

function generateTopicsFromQuestions(questions: Question[]): Topic[] {
  /* Costruisci una mappa Topic -> domande */
  const map = new Map<string, { count: number; questions: Question[] }>();
  questions.forEach((q) => {
    if (!map.has(q.topic)) map.set(q.topic, { count: 0, questions: [] });
    const t = map.get(q.topic)!;
    t.count += 1;
    t.questions.push(q);
  });

  const icons: Record<string, string> = {
    SQL:          '🗄️',
    Statistica:   '📊',
    Tableau:      '📈',
    Databricks:   '⚡',
    DataLake2:    '🏞️',
    Git:          '🔧',
    NoSQL:        '🍃',
    PowerBI:      '📊',
    Python:       '🐍',
    R:            '📊',
    ML:           '🤖',
    DeepLearning: '🧠',
  };

  return Array.from(map.entries()).map(([name, data]) => ({
    id:             name.toLowerCase(),
    name,
    icon:           icons[name] || '📝',
    description:    `${data.count} domande disponibili`,
    totalQuestions: data.count,
    completed:      0,
    isFavorite:     false,
  }));
}
