import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { GraduationCap, BookOpen, Brain, Database, BarChart3, Cloud } from 'lucide-react';

interface CourseSelectionScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const COURSE_ICONS: Record<string, React.ComponentType<any>> = {
  'data-science': Brain,
  'database-admin': Database,
  'business-intelligence': BarChart3,
  'cloud-engineer': Cloud,
  'full-stack-data': BookOpen,
  'ai-specialist': Brain,
};

const CourseSelectionScreen: React.FC<CourseSelectionScreenProps> = ({ onNavigate }) => {
  const { state, dispatch } = useQuiz();
  const { courses, user } = state;

  const handleSelectCourse = (courseId: string) => {
    dispatch({ type: 'SELECT_COURSE', payload: courseId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
      {/* Header */}
      <header className="bg-its-card shadow-its-card px-6 py-4">
        <div className="flex items-center space-x-3">
          <img
            src="/ITSAR.png"
            alt="Logo ITS Angelo Rizzoli"
            className="w-16 h-12"
          />
          <div>
            <h1 className="text-h2 font-bold text-its-text">Seleziona il tuo Corso</h1>
            <p className="text-body text-its-secondary">
              Ciao {user?.fullName || user?.username}! Scegli il percorso di studi più adatto a te.
            </p>
          </div>
        </div>
      </header>

      {/* Course Grid */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const IconComponent = COURSE_ICONS[course.id] || GraduationCap;
              
              return (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course.id)}
                  className="its-card p-6 text-left hover:shadow-lg hover:border-its-red transition-all duration-200 group its-button"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-its-red to-its-red-dark rounded-its flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-h3 font-semibold text-its-text mb-2 group-hover:text-its-red transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-small text-its-secondary mb-3 leading-relaxed">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {course.topics.slice(0, 4).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 bg-red-50 text-its-red rounded text-xs font-medium"
                          >
                            {topic.charAt(0).toUpperCase() + topic.slice(1)}
                          </span>
                        ))}
                        {course.topics.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-its-secondary rounded text-xs">
                            +{course.topics.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-its-card border-t border-red-200 px-6 py-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-small text-its-secondary">
            Potrai sempre cambiare corso successivamente dal tuo profilo
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseSelectionScreen;