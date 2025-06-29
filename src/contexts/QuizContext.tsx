/* ================================================================== */
/*  QUIZ CONTEXT — state, reducer, provider                           */
/* ================================================================== */
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
  questions:        Question[];
  topics:           Topic[];
  currentSession:   QuizSession | null;
  userStats:        UserStats;
  settings:         UserSettings;
  loading:          boolean;
  currentScreen:    string;
  screenParams?:    any;
}

export type QuizAction =
  | { type: 'SET_LOADING';        payload: boolean }
  | { type: 'LOAD_QUESTIONS';     payload: Question[] }
  | { type: 'LOAD_TOPICS';        payload: Topic[] }
  | { type: 'START_QUIZ';         payload: QuizSession }
  | { type: 'ANSWER_QUESTION';    payload: { index: number; answer: number } }
  | { type: 'END_QUIZ' }
  | { type: 'UPDATE_STATS';       payload: UserStats }
  | { type: 'UPDATE_SETTINGS';    payload: UserSettings }
  | { type: 'TOGGLE_FAVORITE';    payload: string }
  | { type: 'SET_CURRENT_SCREEN'; payload: { screen: string; params?: any } };

/* ------------------------------------------------------------------ */
/* INITIAL STATE                                                      */
/* ------------------------------------------------------------------ */
const initialState: QuizState = {
  questions: [],
  topics:    [],
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
    unlockedBadges:    [],               // 🆕
  },
  settings: {
    fontSize:    'medium',
    darkMode:    false,
    reminders:   false,
    reminderTime:'18:00',
  },
  loading: true,
  currentScreen: 'splash',
  screenParams:  null,
};

/* ------------------------------------------------------------------ */
/* BADGE ENGINE                                                       */
/* ------------------------------------------------------------------ */
function checkNewBadges(stats: UserStats): string[] {
  const unlocked = stats.unlockedBadges ?? [];        //  ← fix
  const has = (id: string) => unlocked.includes(id);
  const list: string[] = [];

  /* esempi di regole */
  if (!has('first_try') && stats.correctAnswers >= 1) list.push('first_try');

  if (
    !has('cerebro') &&
    stats.totalQuestions >= 100 &&
    stats.overallAccuracy >= 90
  )
    list.push('cerebro');

  if (!has('constant') && stats.currentStreak >= 7) list.push('constant');

  if (!has('on_fire') && stats.bestStreak >= 5) list.push('on_fire');

  const bestTimed = stats.quizHistory
    .filter((q) => q.quizType === 'timed' && q.timeTaken != null)
    .sort((a, b) => a.timeTaken! - b.timeTaken!)[0];
  if (!has('speed_run') && bestTimed && bestTimed.timeTaken! < 300)
    list.push('speed_run');

  if (
    !has('reverse_pro') &&
    stats.quizHistory.some((q) => q.quizType === 'reverse' && q.score === 100)
  )
    list.push('reverse_pro');

  [10, 20, 30].forEach((n) => {
    const id = `streak_${n}`;
    if (
      !has(id) &&
      stats.quizHistory.some(
        (q) => q.quizType === 'streak' && (q.streakCount ?? 0) >= n,
      )
    )
      list.push(id);
  });

  return list;
}

/* ------------------------------------------------------------------ */
/* REDUCER                                                            */
/* ------------------------------------------------------------------ */
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

    case 'UPDATE_STATS': {
      const incoming = action.payload;
      const newBadgeIds = checkNewBadges(incoming);
      const merged = Array.from(
        new Set([...(incoming.unlockedBadges ?? []), ...newBadgeIds]), // fix
      );
      return {
        ...state,
        userStats: { ...incoming, unlockedBadges: merged },
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };

    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.payload ? { ...t, isFavorite: !t.isFavorite } : t,
        ),
      };

    case 'SET_CURRENT_SCREEN':
      return {
        ...state,
        currentScreen: action.payload.screen,
        screenParams: action.payload.params ?? null,
      };

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* CONTEXT + HOOK                                                     */
/* ------------------------------------------------------------------ */
const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  resetAllQuestions: () => void;
  getFilteredQuestions: (
    type: 'all' | 'unanswered' | 'incorrect',
  ) => Question[];
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

  /* reset domande ------------------------------------------------ */
  const resetAllQuestions = () => {
    dispatch({
      type: 'UPDATE_STATS',
      payload: {
        ...state.userStats,
        answeredQuestions: {},
        correctQuestions: {},
        incorrectQuestions: {},
        statsPerTopic: {},
        lastUpdated: new Date(),
      },
    });
  };

  /* helpers ------------------------------------------------------ */
  const getFilteredQuestions = (type: 'all' | 'unanswered' | 'incorrect') => {
    switch (type) {
      case 'unanswered':
        return state.questions.filter(
          (q) => !state.userStats.answeredQuestions[q.id],
        );
      case 'incorrect':
        return state.questions.filter(
          (q) => state.userStats.incorrectQuestions[q.id],
        );
      default:
        return state.questions;
    }
  };

  /* boot: storage + file ---------------------------------------- */
  useEffect(() => {
    const loadStored = () => {
      try {
        const stats = localStorage.getItem('quizmaster_stats');
        if (stats)
          dispatch({ type: 'UPDATE_STATS', payload: JSON.parse(stats) });

        const settings = localStorage.getItem('quizmaster_settings');
        if (settings)
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: JSON.parse(settings),
          });

        const storedTopics = localStorage.getItem('quizmaster_topics');
        if (storedTopics)
          dispatch({
            type: 'LOAD_TOPICS',
            payload: JSON.parse(storedTopics),
          });
      } catch (e) {
        console.error('loadStorage', e);
      }
    };

    const loadQuestions = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const qs = await loadQuestionsFromFiles();
        dispatch({ type: 'LOAD_QUESTIONS', payload: qs });

        if (state.topics.length === 0) {
          const ts = generateTopicsFromQuestions(qs);
          dispatch({ type: 'LOAD_TOPICS', payload: ts });
          localStorage.setItem('quizmaster_topics', JSON.stringify(ts));
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadStored();
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* persistence -------------------------------------------------- */
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

  /* render ------------------------------------------------------- */
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
  const map = new Map<string, { count: number }>();
  questions.forEach((q) => {
    if (!map.has(q.topic)) map.set(q.topic, { count: 0 });
    map.get(q.topic)!.count += 1;
  });

  const icons: Record<string, string> = {
    SQL: '🗄️',
    Statistica: '📊',
    Tableau: '📈',
    Databricks: '⚡',
    DataLake2: '🏞️',
    Git: '🔧',
    NoSQL: '🍃',
    PowerBI: '📊',
    Python: '🐍',
    R: '📊',
    ML: '🤖',
    DeepLearning: '🧠',
  };

  return Array.from(map.entries()).map(([name, data]) => ({
    id: name.toLowerCase(),
    name,
    icon: icons[name] || '📝',
    description: `${data.count} domande disponibili`,
    totalQuestions: data.count,
    completed: 0,
    isFavorite: false,
  }));
}
