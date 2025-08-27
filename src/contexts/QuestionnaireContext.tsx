import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface QuestionnaireAnswer {
  questionId: string;
  rating: number; // 1-5
}

export interface QuestionnaireResult {
  id: string;
  topicId: string;
  type: 'teacher' | 'subject' | 'coherence';
  answers: QuestionnaireAnswer[];
  averageRating: number;
  completedAt: Date;
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
}

export interface QuestionnaireTemplate {
  id: string;
  type: 'teacher' | 'subject' | 'coherence';
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireState {
  results: QuestionnaireResult[];
  templates: QuestionnaireTemplate[];
  loading: boolean;
}

export type QuestionnaireAction =
  | { type: 'LOAD_RESULTS'; payload: QuestionnaireResult[] }
  | { type: 'COMPLETE_QUESTIONNAIRE'; payload: QuestionnaireResult }
  | { type: 'SET_LOADING'; payload: boolean };

// Domande per i questionari
const TEACHER_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 't1', question: 'Il docente spiega in modo chiaro e comprensibile?' },
  { id: 't2', question: 'Il docente è disponibile per chiarimenti e domande?' },
  { id: 't3', question: 'Il docente usa esempi pratici ed efficaci?' },
  { id: 't4', question: 'Il docente gestisce bene i tempi delle lezioni?' },
  { id: 't5', question: 'Il docente incoraggia la partecipazione attiva?' },
  { id: 't6', question: 'Il docente è preparato sulla materia?' },
  { id: 't7', question: 'Il docente fornisce feedback utili sui compiti?' },
  { id: 't8', question: 'Il docente utilizza strumenti didattici appropriati?' },
  { id: 't9', question: 'Il docente mantiene un clima di rispetto in classe?' },
  { id: 't10', question: 'Complessivamente, come valuti questo docente?' }
];

const SUBJECT_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 's1', question: 'Gli argomenti trattati sono interessanti?' },
  { id: 's2', question: 'Il carico di lavoro è adeguato?' },
  { id: 's3', question: 'I materiali didattici sono utili e aggiornati?' },
  { id: 's4', question: 'Gli obiettivi di apprendimento sono chiari?' },
  { id: 's5', question: 'Le attività pratiche sono sufficienti?' },
  { id: 's6', question: 'La progressione degli argomenti è logica?' },
  { id: 's7', question: 'I metodi di valutazione sono equi?' },
  { id: 's8', question: 'Il contenuto è aggiornato con le tendenze del settore?' },
  { id: 's9', question: 'Le competenze acquisite sono spendibili nel lavoro?' },
  { id: 's10', question: 'Complessivamente, come valuti questa materia?' }
];

const COHERENCE_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 'c1', question: 'La materia è coerente con gli obiettivi del corso?' },
  { id: 'c2', question: 'Il livello di difficoltà è appropriato?' },
  { id: 'c3', question: 'La materia si integra bene con le altre del corso?' },
  { id: 'c4', question: 'I prerequisiti erano chiari e rispettati?' },
  { id: 'c5', question: 'Il tempo dedicato alla materia è sufficiente?' },
  { id: 'c6', question: 'La materia prepara alle sfide professionali?' },
  { id: 'c7', question: 'C\'è coerenza tra teoria e pratica?' },
  { id: 'c8', question: 'La materia è ben posizionata nel percorso formativo?' },
  { id: 'c9', question: 'Le competenze si collegano con quelle di altre materie?' },
  { id: 'c10', question: 'Quanto ritieni utile questa materia per il tuo percorso?' }
];

const QUESTIONNAIRE_TEMPLATES: QuestionnaireTemplate[] = [
  {
    id: 'teacher',
    type: 'teacher',
    title: 'Valutazione Docente',
    description: 'Valuta la qualità dell\'insegnamento e le competenze didattiche',
    questions: TEACHER_QUESTIONS
  },
  {
    id: 'subject',
    type: 'subject', 
    title: 'Valutazione Materia',
    description: 'Valuta i contenuti, la struttura e l\'utilità della materia',
    questions: SUBJECT_QUESTIONS
  },
  {
    id: 'coherence',
    type: 'coherence',
    title: 'Coerenza e Difficoltà',
    description: 'Valuta la coerenza con il corso e il livello di difficoltà',
    questions: COHERENCE_QUESTIONS
  }
];

const initialState: QuestionnaireState = {
  results: [],
  templates: QUESTIONNAIRE_TEMPLATES,
  loading: false,
};

function questionnaireReducer(state: QuestionnaireState, action: QuestionnaireAction): QuestionnaireState {
  switch (action.type) {
    case 'LOAD_RESULTS':
      return {
        ...state,
        results: action.payload,
      };

    case 'COMPLETE_QUESTIONNAIRE':
      return {
        ...state,
        results: [action.payload, ...state.results],
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

const QuestionnaireContext = createContext<{
  state: QuestionnaireState;
  dispatch: React.Dispatch<QuestionnaireAction>;
  isQuestionnaireCompleted: (topicId: string, type: 'teacher' | 'subject' | 'coherence') => boolean;
  getQuestionnaireResult: (topicId: string, type: 'teacher' | 'subject' | 'coherence') => QuestionnaireResult | null;
  getTopicCompletionStats: (topicId: string) => { completed: number; total: number };
} | null>(null);

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (!context) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
};

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(questionnaireReducer, initialState);

  // Load results from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('itsar_questionnaire_results');
    if (saved) {
      try {
        const results = JSON.parse(saved).map((item: any) => ({
          ...item,
          completedAt: new Date(item.completedAt),
        }));
        dispatch({ type: 'LOAD_RESULTS', payload: results });
      } catch (error) {
        console.error('Error loading questionnaire results:', error);
      }
    }
  }, []);

  // Save results to localStorage when they change
  useEffect(() => {
    if (state.results.length > 0) {
      localStorage.setItem('itsar_questionnaire_results', JSON.stringify(state.results));
    }
  }, [state.results]);

  const isQuestionnaireCompleted = (topicId: string, type: 'teacher' | 'subject' | 'coherence'): boolean => {
    return state.results.some(result => 
      result.topicId === topicId && result.type === type
    );
  };

  const getQuestionnaireResult = (topicId: string, type: 'teacher' | 'subject' | 'coherence'): QuestionnaireResult | null => {
    return state.results.find(result => 
      result.topicId === topicId && result.type === type
    ) || null;
  };

  const getTopicCompletionStats = (topicId: string) => {
    const completed = state.results.filter(result => result.topicId === topicId).length;
    return { completed, total: 3 }; // 3 questionari per materia
  };

  return (
    <QuestionnaireContext.Provider
      value={{
        state,
        dispatch,
        isQuestionnaireCompleted,
        getQuestionnaireResult,
        getTopicCompletionStats,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
};

export default QuestionnaireProvider;