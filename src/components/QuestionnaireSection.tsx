import React from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import { useQuiz } from '../contexts/QuizContext';
import { useQuestionnaire } from '../contexts/QuestionnaireContext';
import QuestionnaireCard from './QuestionnaireCard';

interface QuestionnaireSectionProps {
  onNavigate: (screen: string, params?: any) => void;
}

const QuestionnaireSection: React.FC<QuestionnaireSectionProps> = ({ onNavigate }) => {
  const { getTopicsForCourse, state } = useQuiz();
  const { getTopicCompletionStats } = useQuestionnaire();
  
  const topics = getTopicsForCourse();
  
  // Calculate overall completion stats
  const totalQuestionnaires = topics.length * 3; // 3 questionari per materia
  const completedQuestionnaires = topics.reduce((total, topic) => {
    const stats = getTopicCompletionStats(topic.id);
    return total + stats.completed;
  }, 0);

  const handleStartQuestionnaire = (topicId: string, type: 'teacher' | 'subject' | 'coherence') => {
    onNavigate('questionnaire', { topicId, type });
  };

  if (topics.length === 0) {
    return null; // Non mostrare se non ci sono materie per il corso
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <ClipboardList className="w-6 h-6 text-its-red" />
          <div>
            <h3 className="text-h2 font-semibold text-its-text">Questionari Valutativi</h3>
            <p className="text-small text-its-secondary">
              Valuta docenti, materie e coerenza del corso • {state.user?.courseName}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-h3 font-semibold text-its-text">
            {completedQuestionnaires}/{totalQuestionnaires}
          </div>
          <div className="text-small text-its-secondary">Completati</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-small text-its-secondary mb-2">
          <span>Progresso Questionari</span>
          <span>{Math.round((completedQuestionnaires / totalQuestionnaires) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-its-red to-its-red-dark h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedQuestionnaires / totalQuestionnaires) * 100}%` }}
          />
        </div>
      </div>

      {/* Topics Grid */}
      <div className="space-y-6">
        {topics.map((topic) => {
          const stats = getTopicCompletionStats(topic.id);
          
          return (
            <div key={topic.id} className="its-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{topic.icon}</div>
                  <div>
                    <h4 className="text-h3 font-semibold text-its-text capitalize">
                      {topic.name}
                    </h4>
                    <p className="text-small text-its-secondary">
                      {stats.completed}/{stats.total} questionari completati
                    </p>
                  </div>
                </div>
                
                {/* Topic completion indicator */}
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i <= stats.completed 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {stats.completed === stats.total && (
                    <span className="text-green-600 text-small font-medium">Completo</span>
                  )}
                </div>
              </div>

              {/* Questionnaire Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuestionnaireCard
                  topicId={topic.id}
                  topicName={topic.name}
                  type="teacher"
                  onStart={handleStartQuestionnaire}
                />
                <QuestionnaireCard
                  topicId={topic.id}
                  topicName={topic.name}
                  type="subject"
                  onStart={handleStartQuestionnaire}
                />
                <QuestionnaireCard
                  topicId={topic.id}
                  topicName={topic.name}
                  type="coherence"
                  onStart={handleStartQuestionnaire}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-6">
        <p className="text-small text-its-secondary">
          I questionari sono anonimi e aiutano a migliorare la qualità della formazione
        </p>
      </div>
    </section>
  );
};

export default QuestionnaireSection;