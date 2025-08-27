import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import QuestionnaireSection from './QuestionnaireSection';

interface QuestionnaireListScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const QuestionnaireListScreen: React.FC<QuestionnaireListScreenProps> = ({ onNavigate }) => {
  const { state } = useQuiz();

  return (
    <div className="min-h-screen bg-its-light">
      {/* Header */}
      <header className="bg-its-card shadow-its-card px-4 sm:px-6 py-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-its hover:bg-red-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-its-red" />
          </button>
          <img
            src="/ITSAR.png"
            alt="Logo ITS Angelo Rizzoli"
            className="w-12 h-9 sm:w-16 sm:h-12"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-h2 font-bold text-its-text">Questionari</h1>
            <p className="text-sm sm:text-body text-its-secondary">
              {state.user?.courseName ? `Corso: ${state.user.courseName}` : 'Valuta i tuoi corsi'}
            </p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="px-4 sm:px-6 py-6 space-y-8 pb-24">
        <QuestionnaireSection onNavigate={onNavigate} />
      </div>
    </div>
  );
};

export default QuestionnaireListScreen;