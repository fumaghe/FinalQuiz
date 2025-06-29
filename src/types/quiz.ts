/* ================================================================== */
/*  TYPES  —  QUIZ, BADGE, USERSTATS                                  */
/* ================================================================== */

export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
}

/* ---------- Tipi di quiz ----------------------------------------- */
export type QuizKind =
  | 'general'
  | 'topic'
  | 'custom'
  | 'forYou'
  | 'timed'
  | 'streak'
  | 'reverse';

export interface QuizSession {
  id: string;
  quizType: QuizKind;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  timeTaken?: number;   // solo timed
  streakCount?: number; // solo streak
}

export interface AnsweredQuestion {
  questionId: string;
  question: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timestamp: Date;
  topic: string;
  explanation: string;
}

export interface QuizHistory {
  id: string;
  quizType: QuizKind;
  topicName?: string;
  timestamp: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;     // per streak = streakCount
  answeredQuestions: AnsweredQuestion[];
  timeTaken?: number;         // timed
  streakCount?: number;       // streak
}

/* ---------- BADGE ------------------------------------------------- */
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
}

/* Catalogo statico (puoi spostarlo in JSON) ------------------------ */
export const ALL_BADGES: Badge[] = [
  { id:'first_try',  emoji:'🎯', name:'Prima Botta',     description:'Risposta corretta al primo tentativo',              rarity:'common' },
  { id:'cerebro',    emoji:'🧠', name:'Cerebro',         description:'Precisione ≥ 90 % su 100 domande',                  rarity:'epic'   },
  { id:'constant',   emoji:'🐢', name:'Costante',        description:'7 giorni consecutivi con almeno un quiz',          rarity:'rare'   },
  { id:'on_fire',    emoji:'🔥', name:'On Fire',         description:'5 quiz di fila con > 70 % di precisione',          rarity:'rare'   },
  { id:'speed_run',  emoji:'⚡', name:'Speed Runner',    description:'Quiz a tempo finito in < 5 minuti',                 rarity:'rare'   },
  { id:'reverse_pro',emoji:'🧪', name:'Reverse Sensei',  description:'Quiz inverso completato al 100 %',                  rarity:'epic'   },
  { id:'easter',     emoji:'👻', name:'Easter Mind',     description:'Hai scoperto un badge nascosto!',                  rarity:'legendary' },
  { id:'streak_10',  emoji:'🏅', name:'Streak × 10',     description:'10 risposte corrette di fila (Streak Quiz)',        rarity:'common' },
  { id:'streak_20',  emoji:'🥈', name:'Streak × 20',     description:'20 risposte corrette di fila (Streak Quiz)',        rarity:'rare'   },
  { id:'streak_30',  emoji:'🥇', name:'Streak × 30',     description:'30 risposte corrette di fila (Streak Quiz)',        rarity:'epic'   },
];

/* ---------- Topic stats ------------------------------------------ */
export interface TopicStats {
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  lastAttempt?: Date;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'master';
}

/* ---------- UserStats (aggiunto unlockedBadges) ------------------- */
export interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  overallAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  topicStats: TopicStats[];
  lastUpdated: Date;

  answeredQuestions: { [id: string]: boolean };
  correctQuestions:  { [id: string]: boolean };
  incorrectQuestions:{ [id: string]: boolean };

  quizHistory: QuizHistory[];
  statsPerTopic: { [topic: string]: { done: number; correct: number; total: number } };

  bestSuddenDeath?: number;     // record streak-quiz
  unlockedBadges: string[];     // id dei badge sbloccati
}

/* ---------- Settings & Topic rimangono invariati ----------------- */
export interface UserSettings {
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  reminders: boolean;
  reminderTime: string;
}

export interface Topic {
  id: string;
  name: string;
  icon: string;
  description: string;
  totalQuestions: number;
  completed: number;
  isFavorite: boolean;
}
