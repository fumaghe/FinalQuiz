export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
}

/* ===== NUOVI TIPI QUIZ ========================================== */
export type QuizKind =
  | 'general'
  | 'topic'
  | 'custom'    // ← aggiungi qui
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
  timeTaken?: number;    // timed
  streakCount?: number;  // streak
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
  score: number;              // per streak ==> % corrette (utile per grafico)
  totalQuestions: number;
  correctAnswers: number;     // per streak = streakCount
  answeredQuestions: AnsweredQuestion[];
  timeTaken?: number;         // timed
  streakCount?: number;       // streak
}

export interface TopicStats {
  /* … invariato … */
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  lastAttempt?: Date;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'master';
}

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

  /* ------ NUOVO RECORD STREAK QUIZ ------------------------------ */
  bestSuddenDeath?: number;
}

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
