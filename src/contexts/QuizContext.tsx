/* eslint-disable @typescript-eslint/consistent-type-assertions */
// ------------------------------------------------------------------
//  REACT & TYPES
// ------------------------------------------------------------------
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  Question,
  QuizSession,
  UserStats,
  UserSettings,
  Topic,
  BadgeLevel,
} from '../types/quiz';
import { loadQuestionsFromFiles } from '../utils/questionLoader';

/* ------------------------------------------------------------------ */
/*  ALIAS                                                              */
/* ------------------------------------------------------------------ */
const TOPIC_ALIAS: Record<string, string> = {
  viz: 'tableau',
  bi: 'powerbi',
  stats: 'statistica',
  spark: 'databricks',
  lake: 'datalake2',
  dl: 'deeplearning',
};
const norm = (id: string) => TOPIC_ALIAS[id] ?? id.toLowerCase();

const BADGE_ALIAS: Record<string, string> = {
  databricks: 'spark',
  tableau: 'viz',
  statistica: 'stats',
  powerbi: 'bi',
  datalake2: 'lake',
  deeplearning: 'dl',
};
const badgeId = (canon: string) => BADGE_ALIAS[canon] ?? canon;

/* ------------------------------------------------------------------ */
/*  THRESHOLDS                                                         */
/* ------------------------------------------------------------------ */
export const TOPIC_THRESHOLDS: Record<string, [number, number, number, number]> = {
  sql: [25, 50, 75, 100],
  statistica: [50, 100, 150, 192],
  tableau: [25, 50, 75, 100],
  databricks: [20, 45, 70, 91],
  datalake2: [10, 25, 40, 50],
  git: [10, 25, 40, 50],
  nosql: [25, 50, 75, 100],
  powerbi: [25, 50, 75, 100],
  python: [25, 50, 75, 99],
  r: [25, 50, 75, 100],
  ml: [25, 50, 75, 100],
  deeplearning: [25, 50, 75, 100],
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const LEVELS_ASC: BadgeLevel[] = ['bronze', 'silver', 'gold', 'amethyst'];
const idxOf = (lvl: BadgeLevel | null) => (lvl ? LEVELS_ASC.indexOf(lvl) : -1);
const highestTier = (val: number, thr: number[]) =>
  thr.reduce<BadgeLevel | null>((acc, t, i) => (val >= t ? LEVELS_ASC[i] : acc), null);

const sec = (d: string | number | Date) => new Date(d).getTime() / 1000;
const dur = (s: any) =>
  s.durationSec ?? (s.startTime && s.endTime ? sec(s.endTime) - sec(s.startTime) : Infinity);
const corr = (s: any) => s.correctCount ?? 0;

/* ------------------------------------------------------------------ */
/*  BADGE CONFIG (global/combo/speed)                                  */
/* ------------------------------------------------------------------ */
const GLOBAL_COUNTERS = [
  { id: 'quiz_rookie', thresholds: [10, 25, 50, 100], src: (s: UserStats) => s.totalQuizzes },
  { id: 'quiz_hero', thresholds: [200, 300, 500, 750], src: (s: UserStats) => s.totalQuizzes },
  { id: 'quiz_legend', thresholds: [1000, 1500, 2000, 2500], src: (s: UserStats) => s.totalQuizzes },
  { id: 'on_fire', thresholds: [10, 20, 35, 50], src: (s: UserStats) => s.bestStreak },
  { id: 'blazing', thresholds: [25, 40, 60, 80], src: (s: UserStats) => s.bestStreak },
  { id: 'inferno', thresholds: [50, 75, 100, 150], src: (s: UserStats) => s.bestStreak },
];

const ACC_BADGES = [
  { id: 'sharp_eye', thresholds: [100, 200, 400, 600], acc: 70 },
  { id: 'sniper', thresholds: [250, 400, 600, 800], acc: 85 },
  { id: 'cerebro', thresholds: [500, 700, 900, 1200], acc: 90 },
];

const SPEED_BADGES = [
  { id: 'speed_run', thresholds: [300, 240, 180, 120] },
  { id: 'warp', thresholds: [420, 360, 300, 240] },
  { id: 'speed_demon', thresholds: [120, 90, 60, 45] },
];

const MARATHON = [200, 300, 400, 500];
const FLASH_Q = [30, 50, 75, 100];
const FLASH_T = [600, 900, 1200, 1500];

const COMBO_3 = [50, 100, 150, 200];
const COMBOS: Record<string, string[]> = {
  full_stack: ['sql', 'git', 'python'],
  analytics_trio: ['statistica', 'tableau', 'powerbi'],
  cloud_wrangler: ['databricks', 'datalake2', 'nosql'],
  ai_visionary: ['python', 'ml', 'deeplearning'],
};

const LANGUAGE_DUELIST = { baseId: 'language_duelist', pair: ['python', 'r'] };
const POLYGLOT_MIN = [5, 6, 7, 8];
const OMNI_THRESH = [50, 75, 100, 150];
const OMNI_CNT = [8, 9, 10, 12];
const ALL_ROUNDER = [1, 2, 3, 5];

/* ------------------------------------------------------------------ */
/*  BADGE ENGINE                                                       */
/* ------------------------------------------------------------------ */
function computeAllBadges(stats: UserStats): string[] {
  const unlocked: string[] = [];

  /* Topic counters */
  const topicCounters: Record<string, { done: number; correct: number }> = {};
  Object.entries(stats.statsPerTopic ?? {}).forEach(([raw, v]: any) => {
    const t = norm(raw);
    topicCounters[t] = {
      done: v.done ?? v.total ?? 0,
      correct: v.correct ?? v.correctAnswers ?? 0,
    };
  });

  /* Progress & precision */
  const topicLevel: Record<string, BadgeLevel | null> = {};
  Object.entries(topicCounters).forEach(([t, v]) => {
    const thr = TOPIC_THRESHOLDS[t] ?? [25, 50, 75, 100];
    const prog = highestTier(v.correct, thr);
    if (prog) {
      unlocked.push(`tp_${badgeId(t)}_${prog}`);
      topicLevel[t] = prog;
    } else topicLevel[t] = null;

    const pct = v.done ? (v.correct / v.done) * 100 : 0;
    LEVELS_ASC.forEach((lvl, i) => {
      if (v.done >= 1 && pct >= 70 + 10 * i) unlocked.push(`pp_${badgeId(t)}_${lvl}`);
    });
  });

  /* Global counters */
  GLOBAL_COUNTERS.forEach(cfg => {
    const lvl = highestTier(cfg.src(stats), cfg.thresholds);
    if (lvl) unlocked.push(`${cfg.id}_${lvl}`);
  });

  ACC_BADGES.forEach(cfg => {
    for (let i = 3; i >= 0; i--) {
      if (stats.totalQuestions >= cfg.thresholds[i] && stats.overallAccuracy >= cfg.acc + i * 2.5) {
        unlocked.push(`${cfg.id}_${LEVELS_ASC[i]}`);
        break;
      }
    }
  });

  /* Speed / session */
  const fastest = Math.min(...(stats.quizHistory ?? []).map(dur), Infinity);
  SPEED_BADGES.forEach(sb => {
    const ref = sb.thresholds.at(-1)!;
    const lvl = highestTier(ref - fastest, sb.thresholds.map(t => ref - t));
    if (lvl) unlocked.push(`${sb.id}_${lvl}`);
  });

  const bestInSession = Math.max(...(stats.quizHistory ?? []).map(corr), 0);
  const marLvl = highestTier(bestInSession, MARATHON);
  if (marLvl) unlocked.push(`marathon_${marLvl}`);

  (stats.quizHistory ?? []).forEach(s => {
    for (let i = 3; i >= 0; i--)
      if (corr(s) >= FLASH_Q[i] && dur(s) <= FLASH_T[i]) {
        unlocked.push(`flash_${LEVELS_ASC[i]}`);
        break;
      }
  });

  /* Combo */
  Object.entries(COMBOS).forEach(([id, list]) => {
    const sum = list.reduce((tot, t) => tot + (topicCounters[t]?.correct ?? 0), 0);
    const lvl = highestTier(sum, COMBO_3);
    if (lvl) unlocked.push(`${id}_${lvl}`);
  });

  /* Language Duelist */
  const [a, b] = LANGUAGE_DUELIST.pair;
  if (topicLevel[a] && topicLevel[a] === topicLevel[b])
    unlocked.push(`${LANGUAGE_DUELIST.baseId}_${topicLevel[a]}`);

  /* Polyglot & omniscient */
  LEVELS_ASC.forEach((lv, i) => {
    const cnt = Object.values(topicLevel).filter(x => x && idxOf(x) >= i).length;
    if (cnt >= POLYGLOT_MIN[i]) unlocked.push(`polyglot_${lv}`);

    const omniCnt = Object.values(topicCounters).filter(c => c.correct >= OMNI_THRESH[i]).length;
    if (omniCnt >= OMNI_CNT[i]) unlocked.push(`omniscient_${lv}`);
  });

  /* All-rounder */
  const quizPerTopic: Record<string, number> = {};
  (stats.quizHistory ?? []).forEach((qs: any) =>
    new Set((qs as any).topics ?? []).forEach((raw: string) => {
      const t = norm(raw);
      quizPerTopic[t] = (quizPerTopic[t] ?? 0) + 1;
    }),
  );
  const minQuiz = Math.min(...Object.keys(TOPIC_THRESHOLDS).map(t => quizPerTopic[t] ?? 0));
  const arLvl = highestTier(minQuiz, ALL_ROUNDER);
  if (arLvl) unlocked.push(`all_rounder_${arLvl}`);

  /* Easter egg */
  if ((stats as any).foundEasterEgg) unlocked.push('easter_ghost');

  return [...new Set(unlocked)];
}

/* ------------------------------------------------------------------ */
/*  STATE / REDUCER / CONTEXT                                         */
/* ------------------------------------------------------------------ */
export interface QuizState {
  questions: Question[];
  topics: Topic[];
  currentSession: QuizSession | null;
  userStats: UserStats;
  settings: UserSettings;
  loading: boolean;
  currentScreen: string;
  screenParams?: any;
}

export type QuizAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_QUESTIONS'; payload: Question[] }
  | { type: 'LOAD_TOPICS'; payload: Topic[] }
  | { type: 'START_QUIZ'; payload: QuizSession }
  | { type: 'ANSWER_QUESTION'; payload: { index: number; answer: number } }
  | { type: 'END_QUIZ' }
  | { type: 'UPDATE_STATS'; payload: UserStats }
  | { type: 'UPDATE_SETTINGS'; payload: UserSettings }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'SET_CURRENT_SCREEN'; payload: { screen: string; params?: any } };

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
    lastUpdated: new Date(),
    answeredQuestions: {},
    correctQuestions: {},
    incorrectQuestions: {},
    quizHistory: [],
    statsPerTopic: {},
    topicStats: [],
    unlockedBadges: [],
  },
  settings: {
    fontSize: 'medium',
    darkMode: false,
    reminders: false,
    reminderTime: '18:00',
  },
  loading: true,
  currentScreen: 'splash',
  screenParams: null,
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
    case 'ANSWER_QUESTION': {
      if (!state.currentSession) return state;
      const answers = [...state.currentSession.answers];
      answers[action.payload.index] = action.payload.answer;
      return { ...state, currentSession: { ...state.currentSession, answers } };
    }
    case 'END_QUIZ':
      return { ...state, currentSession: null };
    case 'UPDATE_STATS':
      return {
        ...state,
        userStats: {
          ...action.payload,
          unlockedBadges: computeAllBadges(action.payload),
        },
      };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };
    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        topics: state.topics.map(t =>
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
// CONTEXT & PROVIDER
/* ------------------------------------------------------------------ */
const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  resetAllQuestions: () => void;
  getFilteredQuestions: (t: 'all' | 'unanswered' | 'incorrect') => Question[];
} | null>(null);

export const useQuiz = () => {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within a QuizProvider');
  return ctx;
};

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  const resetAllQuestions = () =>
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

  const getFilteredQuestions = (t: 'all' | 'unanswered' | 'incorrect') =>
    t === 'unanswered'
      ? state.questions.filter(q => !state.userStats.answeredQuestions[q.id])
      : t === 'incorrect'
      ? state.questions.filter(q => state.userStats.incorrectQuestions[q.id])
      : state.questions;

  /* bootstrap: storage + question load */
  useEffect(() => {
    try {
      const rawStats = localStorage.getItem('quizmaster_stats');
      if (rawStats) dispatch({ type: 'UPDATE_STATS', payload: JSON.parse(rawStats) });
      const rawSet = localStorage.getItem('quizmaster_settings');
      if (rawSet) dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(rawSet) });
      const rawTop = localStorage.getItem('quizmaster_topics');
      if (rawTop) dispatch({ type: 'LOAD_TOPICS', payload: JSON.parse(rawTop) });
    } catch (e) {
      console.error(e);
    }

    (async () => {
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* persistence */
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

  /* ---------- NEW: auto-refresh badge list on every stats change ---- */
  useEffect(() => {
    const fresh = computeAllBadges(state.userStats);
    const current = state.userStats.unlockedBadges;
    const same =
      fresh.length === current.length && fresh.every((b, i) => b === current[i]);

    if (!same) {
      dispatch({
        type: 'UPDATE_STATS',
        payload: { ...state.userStats, unlockedBadges: fresh },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userStats]);

  /* periodic refresh (e.g. parallel tabs) */
  useEffect(() => {
    const int = setInterval(() => {
      const raw = localStorage.getItem('quizmaster_stats');
      if (raw) dispatch({ type: 'UPDATE_STATS', payload: JSON.parse(raw) });
    }, 60_000);
    return () => clearInterval(int);
  }, [dispatch]);

  return (
    <QuizContext.Provider value={{ state, dispatch, resetAllQuestions, getFilteredQuestions }}>
      {children}
    </QuizContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  GENERATORE TOPIC                                                  */
/* ------------------------------------------------------------------ */
function generateTopicsFromQuestions(qs: Question[]): Topic[] {
  const map = new Map<string, number>();
  qs.forEach(q => {
    const canon = norm(q.topic);
    map.set(canon, (map.get(canon) ?? 0) + 1);
  });

  const icons: Record<string, string> = {
    sql: '🗄️',
    statistica: '📊',
    tableau: '📈',
    databricks: '⚡',
    datalake2: '🏞️',
    git: '🔧',
    nosql: '🍃',
    powerbi: '📊',
    python: '🐍',
    r: '📊',
    ml: '🤖',
    deeplearning: '🧠',
  };

  return Array.from(map.entries()).map(([id, count]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    icon: icons[id] ?? '📝',
    description: `${count} domande disponibili`,
    totalQuestions: count,
    completed: 0,
    isFavorite: false,
  }));
}
