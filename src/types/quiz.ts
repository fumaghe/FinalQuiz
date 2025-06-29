export interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
}

export interface QuizSession {
  id: string;
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  startTime: Date;
  endTime?: Date;
  score?: number;
  timeTaken?: number;        // <— tempo impiegato in secondi (solo timed)
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
  quizType: 'general' | 'topic' | 'forYou' | 'timed';
  topicName?: string;
  timestamp: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answeredQuestions: AnsweredQuestion[];
  timeTaken?: number;        // <— tempo impiegato in secondi (solo timed)
}

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

export interface UserStats {
  totalQuizzes: number;
  totalQuestions: number;
  correctAnswers: number;
  overallAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  topicStats: TopicStats[];
  lastUpdated: Date;
  answeredQuestions: { [questionId: string]: boolean };
  correctQuestions: { [questionId: string]: boolean };
  incorrectQuestions: { [questionId: string]: boolean };
  quizHistory: QuizHistory[];
  statsPerTopic: { [topic: string]: { done: number; correct: number; total: number } };
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
