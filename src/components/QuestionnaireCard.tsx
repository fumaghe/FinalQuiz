import React from 'react';
import { CheckCircle, Star, User, BookOpen, Target } from 'lucide-react';
import { useQuestionnaire } from '../contexts/QuestionnaireContext';

interface QuestionnaireCardProps {
  topicId: string;
  topicName: string;
  type: 'teacher' | 'subject' | 'coherence';
  onStart: (topicId: string, type: 'teacher' | 'subject' | 'coherence') => void;
}

const QuestionnaireCard: React.FC<QuestionnaireCardProps> = ({
  topicId,
  topicName,
  type,
  onStart
}) => {
  const { isQuestionnaireCompleted, getQuestionnaireResult, state } = useQuestionnaire();
  
  const completed = isQuestionnaireCompleted(topicId, type);
  const result = getQuestionnaireResult(topicId, type);
  
  const template = state.templates.find(t => t.type === type);
  
  const getIcon = () => {
    switch (type) {
      case 'teacher':
        return <User className="w-6 h-6" />;
      case 'subject':
        return <BookOpen className="w-6 h-6" />;
      case 'coherence':
        return <Target className="w-6 h-6" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'teacher':
        return 'text-blue-600 bg-blue-100';
      case 'subject':
        return 'text-purple-600 bg-purple-100';
      case 'coherence':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-small font-medium text-its-text ml-2">
          {rating.toFixed(1)}/5
        </span>
      </div>
    );
  };

  return (
    <button
      onClick={() => !completed && onStart(topicId, type)}
      disabled={completed}
      className={`
        w-full p-4 rounded-its border-2 text-left transition-all duration-200
        ${completed 
          ? 'border-green-200 bg-green-50 cursor-default' 
          : 'border-gray-200 bg-white hover:border-its-red hover:shadow-md cursor-pointer its-button'
        }
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-its ${getColor()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body font-semibold text-its-text">
              {template?.title}
            </h4>
            <p className="text-small text-its-secondary mt-1">
              {topicName}
            </p>
          </div>
        </div>
        
        {completed && (
          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
        )}
      </div>

      <p className="text-small text-its-secondary mb-3 leading-relaxed">
        {template?.description}
      </p>

      {completed && result ? (
        <div>
          {renderRating(result.averageRating)}
          <p className="text-xs text-its-secondary mt-2">
            Completato il {new Date(result.completedAt).toLocaleDateString('it-IT')}
          </p>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-its-red">
          <span className="text-small font-medium">Compila questionario</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-2 h-2 bg-gray-300 rounded-full" />
            ))}
          </div>
        </div>
      )}
    </button>
  );
};

export default QuestionnaireCard;