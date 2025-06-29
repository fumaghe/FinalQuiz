// src/types/quiz.ts
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
  timeTaken?: number;   // timed
  streakCount?: number; // streak
}

/* ---------- Storico quiz ---------------------------------------- */
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
export type BadgeLevel  = 'bronze' | 'silver' | 'gold' | 'amethyst';

export type BadgeCategory =
  | 'topic_progress'
  | 'topic_precision'
  | 'global'
  | 'combo'
  | 'speed'
  | 'quiz_type';

export interface Badge {
  id: string;
  baseId: string;
  emoji: string;
  name: string;
  description: string;
  rarity: BadgeRarity;
  level: BadgeLevel;
  /** ➜ nuovo campo */
  category: BadgeCategory;
}

/* ── catalogo completo (50+ badge) in un file separato ──────────── */
export { ALL_BADGES } from '../data/badges';

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

/* ---------- UserStats ------------------------------------------- */
export interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  overallAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  lastUpdated: Date;

  answeredQuestions:  Record<string, boolean>;
  correctQuestions:   Record<string, boolean>;
  incorrectQuestions: Record<string, boolean>;

  quizHistory: QuizHistory[];
  statsPerTopic: Record<string, { done: number; correct: number; total: number }>;
  topicStats: TopicStats[];

  bestSuddenDeath?: number;     // record streak-quiz

  unlockedBadges: string[];     // ids completi
}

/* ---------- Settings & Topic ------------------------------------- */
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
