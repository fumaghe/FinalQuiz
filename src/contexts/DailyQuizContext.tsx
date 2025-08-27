import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Question } from '../types/quiz';
import { norm } from './QuizContext';

export interface DailyQuizResult {
  date: string; // YYYY-MM-DD format
  questions: Question[];
  answers: number[];
  score: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: Date;
}

export interface DailyQuizState {
  currentQuiz: {
    date: string;
    questions: Question[];
    answers: number[];
    currentQuestionIndex: number;
  } | null;
  history: DailyQuizResult[];
  loading: boolean;
}

export type DailyQuizAction =
  | { type: 'START_DAILY_QUIZ'; payload: { date: string; questions: Question[] } }
  | { type: 'ANSWER_QUESTION'; payload: { questionIndex: number; answer: number } }
  | { type: 'COMPLETE_DAILY_QUIZ'; payload: DailyQuizResult }
  | { type: 'LOAD_HISTORY'; payload: DailyQuizResult[] }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: DailyQuizState = {
  currentQuiz: null,
  history: [],
  loading: false,
};

function dailyQuizReducer(state: DailyQuizState, action: DailyQuizAction): DailyQuizState {
  switch (action.type) {
    case 'START_DAILY_QUIZ':
      return {
        ...state,
        currentQuiz: {
          date: action.payload.date,
          questions: action.payload.questions,
          answers: new Array(action.payload.questions.length).fill(-1),
          currentQuestionIndex: 0,
        },
      };

    case 'ANSWER_QUESTION': {
      if (!state.currentQuiz) return state;
      const answers = [...state.currentQuiz.answers];
      answers[action.payload.questionIndex] = action.payload.answer;
      return {
        ...state,
        currentQuiz: {
          ...state.currentQuiz,
          answers,
          currentQuestionIndex: Math.min(
            action.payload.questionIndex + 1,
            state.currentQuiz.questions.length - 1
          ),
        },
      };
    }

    case 'COMPLETE_DAILY_QUIZ':
      return {
        ...state,
        currentQuiz: null,
        history: [action.payload, ...state.history],
      };

    case 'LOAD_HISTORY':
      return {
        ...state,
        history: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}

const DailyQuizContext = createContext<{
  state: DailyQuizState;
  dispatch: React.Dispatch<DailyQuizAction>;
  generateDailyQuiz: (date: string, allQuestions: Question[], courseTopics: string[]) => Question[];
  getDailyQuizStatus: (date: string) => 'not-started' | 'completed' | 'available';
  getStreakCount: () => number;
} | null>(null);

export const useDailyQuiz = () => {
  const context = useContext(DailyQuizContext);
  if (!context) {
    throw new Error('useDailyQuiz must be used within a DailyQuizProvider');
  }
  return context;
};

export const DailyQuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dailyQuizReducer, initialState);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('daily_quiz_history');
    if (saved) {
      try {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          completedAt: new Date(item.completedAt),
        }));
        dispatch({ type: 'LOAD_HISTORY', payload: history });
      } catch (error) {
        console.error('Error loading daily quiz history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (state.history.length > 0) {
      localStorage.setItem('daily_quiz_history', JSON.stringify(state.history));
    }
  }, [state.history]);

  const generateDailyQuiz = (date: string, allQuestions: Question[], courseTopics: string[]): Question[] => {
    // Filter questions by course topics
    const courseQuestions = allQuestions.filter(q => 
      courseTopics.some(topic => norm(q.topic) === norm(topic))
    );

    if (courseQuestions.length === 0) return [];

    // Use date as seed for consistent daily questions
    const seed = date.replace(/-/g, '');
    const seedNum = parseInt(seed) % 1000000;
    
    // Simple seeded random function
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Generate 5 random questions using the date seed
    const selectedQuestions: Question[] = [];
    const usedIndices = new Set<number>();
    let currentSeed = seedNum;

    while (selectedQuestions.length < 5 && selectedQuestions.length < courseQuestions.length) {
      const randomIndex = Math.floor(seededRandom(currentSeed) * courseQuestions.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedQuestions.push(courseQuestions[randomIndex]);
      }
      currentSeed++;
    }

    return selectedQuestions;
  };

  const getDailyQuizStatus = (date: string): 'not-started' | 'completed' | 'available' => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = new Date(date).toISOString().split('T')[0];
    
    // Can't do future quizzes
    if (targetDate > today) return 'not-started';
    
    // Check if already completed
    const completed = state.history.find(h => h.date === date);
    if (completed) return 'completed';
    
    return 'available';
  };

  const getStreakCount = (): number => {
    if (state.history.length === 0) return 0;
    
    const sortedHistory = [...state.history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    for (const result of sortedHistory) {
      const resultDate = new Date(result.date);
      const diffDays = Math.floor((currentDate.getTime() - resultDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        if (result.passed) {
          streak++;
          currentDate = resultDate;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <DailyQuizContext.Provider
      value={{
        state,
        dispatch,
        generateDailyQuiz,
        getDailyQuizStatus,
        getStreakCount,
      }}
    >
      {children}
    </DailyQuizContext.Provider>
  );
};

export default DailyQuizProvider;