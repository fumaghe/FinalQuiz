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
  QuizHistory,
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

/** normalizza qualsiasi id/label di topic in uno slug canonico */
export const norm = (raw: string) =>
  (TOPIC_ALIAS[raw.trim().toLowerCase()] ?? raw.trim().toLowerCase());

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
const corr = (s: any) => (s.correctCount ?? s.correctAnswers ?? 0);

/* ------------------------------------------------------------------ */
/*  BADGE CONFIG (global/combo/speed)                                  */
/* ------------------------------------------------------------------ */
const GLOBAL_COUNTERS = [
  { id: 'quiz_rookie', thresholds: [5, 15, 30, 35], src: (s: UserStats) => s.totalQuizzes },
  { id: 'quiz_hero',   thresholds: [40, 50, 70, 85], src: (s: UserStats) => s.totalQuizzes },
  { id: 'quiz_legend', thresholds: [90, 120, 150, 200], src: (s: UserStats) => s.totalQuizzes },
  {
    id: 'on_fire',
    thresholds: [5, 10, 15, 20],
    src: (s: UserStats) =>
      Math.max(...(s.quizHistory ?? []).map(q => q.streakCount ?? 0), 0),
  },
  {
    id: 'blazing',
    thresholds: [30, 35, 40, 45],
    src: (s: UserStats) =>
      Math.max(...(s.quizHistory ?? []).map(q => q.streakCount ?? 0), 0),
  },
  {
    id: 'inferno',
    thresholds: [50, 60, 70, 75],
    src: (s: UserStats) =>
      Math.max(...(s.quizHistory ?? []).map(q => q.streakCount ?? 0), 0),
  },
];


const SPEED_BADGES = [
  { id: 'speed_run', thresholds: [300, 240, 180, 120] },
  { id: 'warp', thresholds: [420, 360, 300, 240] },
  { id: 'speed_demon', thresholds: [120, 90, 60, 45] },
];

const MARATHON = [200, 300, 400, 500];


const COMBO_3 = [50, 100, 150, 200];
const COMBOS: Record<string, string[]> = {
  full_stack: ['sql', 'git', 'python'],
  analytics_trio: ['statistica', 'tableau', 'powerbi'],
  cloud_wrangler: ['databricks', 'datalake2', 'nosql'],
  ai_visionary: ['python', 'ml', 'deeplearning'],
};

const LANGUAGE_DUELIST = { baseId: 'language_duelist', pair: ['python', 'r'] };
const POLYGLOT_MIN = [5, 6, 7, 8];
const OMNI_THRESH = [50, 50, 50, 50];
const OMNI_CNT = [8, 9, 10, 12];
const ALL_ROUNDER = [5, 10, 20, 40];

/* ------------------------------------------------------------------ */
/*  BADGE ENGINE                                                       */
/* ------------------------------------------------------------------ */
function computeAllBadges(stats: UserStats): string[] {
  (stats as any).unlockedBadges = [];

  /* ---------- 1 · Estrarre ultima risposta per domanda ---------- */
  const lastByQ = new Map<string, { topic: string; isCorrect: boolean }>();
  (stats.quizHistory ?? []).forEach(hist => {
    (hist.answeredQuestions ?? []).forEach(a => {
      lastByQ.set(a.questionId, {
        topic: norm(a.topic),
        isCorrect: a.isCorrect,
      });
    });
  });

  /* ---------- 2 · Aggregare contatori per topic ------------------ */
  const topicCounters: Record<string, { done: number; correct: number }> = {};
  lastByQ.forEach(({ topic, isCorrect }) => {
    if (!topicCounters[topic]) topicCounters[topic] = { done: 0, correct: 0 };
    topicCounters[topic].done += 1;
    if (isCorrect) topicCounters[topic].correct += 1;
  });

  const unlocked: string[] = [];
  const topicLevel: Record<string, BadgeLevel | null> = {};

  /* ---------- 3 · Topic progress & precision -------------------- */
  Object.entries(topicCounters).forEach(([t, v]) => {
    // 3.1 · Progressione quantitativa
    const thr = TOPIC_THRESHOLDS[t] ?? [25, 50, 75, 100];
    const tier = highestTier(v.correct, thr);
    if (tier) {
      unlocked.push(`tp_${badgeId(t)}_${tier}`);
      topicLevel[t] = tier;
    } else {
      topicLevel[t] = null;
    }

    // 3.2 · Precisione percentuale: bronze 60, silver 75, gold 85, amethyst 100
    const PRECISION_THRESHOLDS = [60, 75, 85, 100];
    const pct = v.done ? (v.correct / v.done) * 100 : 0;
    PRECISION_THRESHOLDS.forEach((minPct, i) => {
      if (v.done >= 1 && pct >= minPct) {
        unlocked.push(`pp_${badgeId(t)}_${LEVELS_ASC[i]}`);
      }
    });
  });

  /* ---------- 4 · Global counters & accuracy -------------------- */
  GLOBAL_COUNTERS.forEach(cfg => {
    const lvl = highestTier(cfg.src(stats), cfg.thresholds);
    if (lvl) unlocked.push(`${cfg.id}_${lvl}`);
  });

  const quiz80Count = (stats.quizHistory ?? [])
    .filter(q => q.score >= 80)
    .length;

  const ACC_QUIZ_THRESH: Record<string, number[]> = {
    sharp_eye: [5,  15,  30,  35],
    sniper:    [40, 50,  70,  85],
    cerebro:   [90, 120, 150, 200],
  };

  Object.entries(ACC_QUIZ_THRESH).forEach(([id, thresholds]) => {
    const lvl = highestTier(quiz80Count, thresholds);
    if (lvl) unlocked.push(`${id}_${lvl}`);
  });

  /* ---------- 5 · Speed / session -------------------------------- */
  // filtriamo solo i quiz timed con timeTaken e timeLeft
  const timedEntriesAll = (stats.quizHistory ?? [])
    .filter(
      (q): q is QuizHistory & { timeTaken: number; timeLeft: number } =>
        q.quizType === 'timed' && q.timeTaken != null && q.timeLeft != null
    );

  // imponiamo il minimo di risposte corrette
  const MIN_CORRECT = 18;
  const timedEntries = timedEntriesAll.filter(s => corr(s) >= MIN_CORRECT);

  if (timedEntries.length > 0) {
    const fastest = Math.min(...timedEntries.map(q => q.timeTaken));
    const maxLeft = Math.max(...timedEntries.map(q => q.timeLeft));

    // 5.1 · Speed Runner (timeTaken, soglie ampie: 7→4 min)
    const SPEED_RUN_THRESH = [420, 360, 300, 240]; // in sec
    const refSR = SPEED_RUN_THRESH[SPEED_RUN_THRESH.length - 1];
    const lvlSR = highestTier(
      refSR - fastest,
      SPEED_RUN_THRESH.map(t => refSR - t)
    );
    if (lvlSR) unlocked.push(`speed_run_${lvlSR}`);

    // 5.2 · Warp Drive (timeTaken, soglie ristrette: 5→2 min)
    const WARP_THRESH = [300, 240, 180, 120]; // in sec
    const refW = WARP_THRESH[WARP_THRESH.length - 1];
    const lvlW = highestTier(
      refW - fastest,
      WARP_THRESH.map(t => refW - t)
    );
    if (lvlW) unlocked.push(`warp_${lvlW}`);

    // 5.3 · Speed Demon (timeLeft, soglie ristrette: 2→45 s)
    const SD_THRESH = [120, 90, 60, 45]; // in sec
    const refSD = SD_THRESH[SD_THRESH.length - 1];
    const lvlSD = highestTier(
      maxLeft - refSD,
      SD_THRESH.map(t => maxLeft - t)
    );
    if (lvlSD) unlocked.push(`speed_demon_${lvlSD}`);

    // 5.4 · Flash Learner (timeLeft, soglie ampie: 2→8 min)
    const FLASH_T = [120, 150, 300, 480]; // in sec
    timedEntries.forEach(s => {
      for (let i = 3; i >= 0; i--) {
        if (s.timeLeft >= FLASH_T[i]) {
          unlocked.push(`flash_${LEVELS_ASC[i]}`);
          break;
        }
      }
    });
  }

  /* ---------- 6 · Quiz-Type Badges ------------------------------- */
  const TYPE_BADGES: Array<{
    id: string;
    quizType: 'general' | 'topic' | 'forYou' | 'timed' | 'streak' | 'reverse';
    thresholds: number[];
  }> = [
    { id: 'general_run',  quizType: 'general', thresholds: [5, 15, 30, 60] },
    { id: 'topic_tunnel', quizType: 'topic',   thresholds: [3, 10, 25, 50] },
    { id: 'for_you',      quizType: 'forYou',  thresholds: [5, 10, 25, 40] },
    { id: 'time_crusher', quizType: 'timed',   thresholds: [5, 10, 25, 40] },
    { id: 'streak_surv',  quizType: 'streak',  thresholds: [5, 10, 20, 40] },
    { id: 'reverse_mast', quizType: 'reverse', thresholds: [5, 10, 20, 40] },
  ];

  TYPE_BADGES.forEach(({ id, quizType, thresholds }) => {
    const count = (stats.quizHistory ?? []).filter(q => q.quizType === quizType).length;
    const lvl = highestTier(count, thresholds);
    if (lvl) unlocked.push(`${id}_${lvl}`);
  });

  /* ---------- 6 · Combo / polyglot / omni ecc. ------------------- */
  Object.entries(COMBOS).forEach(([id, list]) => {
    const sum = list.reduce((tot, t) => tot + (topicCounters[t]?.correct ?? 0), 0);
    const lvl = highestTier(sum, COMBO_3);
    if (lvl) unlocked.push(`${id}_${lvl}`);
  });

  const [la, lb] = LANGUAGE_DUELIST.pair;
  if (topicLevel[la] && topicLevel[la] === topicLevel[lb]) {
    unlocked.push(`${LANGUAGE_DUELIST.baseId}_${topicLevel[la]}`);
  }

  LEVELS_ASC.forEach((lv, i) => {
    const cnt = Object.values(topicLevel).filter(x => x && idxOf(x) >= i).length;
    if (cnt >= POLYGLOT_MIN[i]) unlocked.push(`polyglot_${lv}`);

    const omniCnt = Object.values(topicCounters).filter(
      c => c.correct >= OMNI_THRESH[i]
    ).length;
    if (omniCnt >= OMNI_CNT[i]) unlocked.push(`omniscient_${lv}`);
  });

  const attemptedTopics = Object.keys(topicCounters).filter(
    t => (topicCounters[t]?.done ?? 0) > 0
  );
  if (attemptedTopics.length > 0) {
    const minCorrectAll = Math.min(
      ...attemptedTopics.map(t => topicCounters[t].correct)
    );
    const arLvl = highestTier(minCorrectAll, ALL_ROUNDER);
    if (arLvl) unlocked.push(`all_rounder_${arLvl}`);
}

  /* ---------- 7 · Easter Egg ------------------------------------ */
  if ((stats as any).foundEasterEgg) unlocked.push('easter_ghost');

  /* ---------- 8 · Dedup & return ------------------------------- */
  return [...new Set(unlocked)];
}

/** Mappa livello badge → punti */
const BADGE_POINTS: Record<BadgeLevel, number> = {
  bronze:   5,
  silver:  10,
  gold:    15,
  amethyst:25,
};

const QUIZ_TYPE_MULT: Record<string, number> = {
  general: 1.3,
  topic:   1.1,
  forYou:  1.5,
  timed:   1.7,
  streak:  1.3,
  reverse: 1.15,
};

function computeCupPoints(stats: UserStats): number {
  let sum = 0;

  // 1) punti “base” per ogni quiz
  stats.quizHistory?.forEach(q => {
    let basePts = 0;

    // risposte corrette / errate
    q.answeredQuestions?.forEach(ans => {
      basePts += ans.isCorrect ? 10 : -5;
    });

    // bonus modalità "timed"
    if (q.quizType === 'timed' && q.timeLeft != null) {
      basePts += Math.floor(q.timeLeft / 10);
    }
    // bonus modalità "streak"
    if (q.quizType === 'streak' && q.streakCount != null) {
      basePts += Math.floor(q.streakCount / 5);
    }

    // applica moltiplicatore
    const mult = QUIZ_TYPE_MULT[q.quizType] ?? 1.0;
    sum += Math.round(basePts * mult);
  });

  // 2) punti da badge (identico a prima)
  stats.unlockedBadges?.forEach(bid => {
    const lvl = bid.split('_').pop() as BadgeLevel;
    sum += BADGE_POINTS[lvl] || 0;
  });

  return sum;
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
  | { type: 'SET_CURRENT_SCREEN'; payload: { screen: string; params?: any } }
  | { type: 'FOUND_EASTER_EGG' }; 

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
    cupPoints: 0,
    foundEasterEgg: false,
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
      return {
        ...state,
        currentSession: { ...state.currentSession, answers },
      };
    }

    case 'END_QUIZ':
      return { ...state, currentSession: null };

    case 'UPDATE_STATS': {
      // 1) calcolo badge sbloccati
      const statsWithBadges: UserStats = {
        ...action.payload,
        unlockedBadges: computeAllBadges(action.payload),
      };
      // 2) calcolo Cup Points
      const cupPts = computeCupPoints(statsWithBadges);

      return {
        ...state,
        userStats: {
          ...statsWithBadges,
          cupPoints: cupPts,
        },
      };
    }
    case 'FOUND_EASTER_EGG': {
      // 1) aggiorno la flag
      const updatedStats: UserStats = {
        ...state.userStats,
        foundEasterEgg: true,
      };
      // 2) ricalcolo subito badge e cupPoints
      const unlocked = computeAllBadges(updatedStats);
      const cupPts = computeCupPoints({ ...updatedStats, unlockedBadges: unlocked });

      return {
        ...state,
        userStats: {
          ...updatedStats,
          unlockedBadges: unlocked,
          cupPoints: cupPts,
        },
      };
    };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: action.payload };

    case 'TOGGLE_FAVORITE':
      return {
        ...state,
        topics: state.topics.map(t =>
          t.id === action.payload ? { ...t, isFavorite: !t.isFavorite } : t
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
        answeredQuestions: {}, // ← questo resetta la disponibilità delle domande
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
      /* ---------- STATS ---------- */
      const rawStats = localStorage.getItem('quizmaster_stats');
      if (rawStats) {
        const stats = JSON.parse(rawStats);

        /* ⚙️ MIGRA correct / correctAnswers -------------------- */
        Object.values(stats.statsPerTopic ?? {}).forEach((t: any) => {
          if (t.correct === undefined && t.correctAnswers !== undefined) {
            t.correct = t.correctAnswers;
          }
          if (t.correctAnswers === undefined && t.correct !== undefined) {
            t.correctAnswers = t.correct;
          }
        });
        /* ------------------------------------------------------- */

        // 👀 LOG 1 — conteggio per topic PRIMA del dispatch
        console.log('[BOOT] statsPerTopic from storage:', stats.statsPerTopic);

        dispatch({ type: 'UPDATE_STATS', payload: stats });
      }

      /* ---------- SETTINGS ---------- */
      const rawSet = localStorage.getItem('quizmaster_settings');
      if (rawSet) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(rawSet) });
      }

      /* ---------- TOPICS ---------- */
      const rawTop = localStorage.getItem('quizmaster_topics');
      if (rawTop) {
        dispatch({ type: 'LOAD_TOPICS', payload: JSON.parse(rawTop) });
      }
    } catch (e) {
      console.error(e);
    }

    /* carica file domande */
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
