import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import ProgressRing from './ProgressRing';
import { Shuffle, Folder, User, BarChart, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, resetAllQuestions, getFilteredQuestions } = useQuiz();
  const { userStats, topics } = state;

  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => {
    const topicStats = userStats.statsPerTopic[t.name];
    return topicStats && topicStats.done > 0;
  }).length;
  const overallProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  const unansweredQuestions = getFilteredQuestions('unanswered');
  const hasUnansweredQuestions = unansweredQuestions.length > 0;

  const handleResetQuestions = () => {
    resetAllQuestions();
  };

  return (
    <div className="min-h-screen bg-apple-light">
      {/* Header */}
      <header className="bg-apple-card shadow-apple-card px-apple-2x py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-apple-blue rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🧠</span>
          </div>
          <div>
            <h2 className="text-h2 font-semibold">Ciao, Studente!</h2>
            <p className="text-caption text-apple-secondary">Pronto per nuove sfide?</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-full hover:bg-apple-light transition-colors"
        >
          <User className="w-6 h-6 text-apple-secondary" />
        </button>
      </header>

      <div className="px-apple-2x py-6 space-y-8 pb-24">
        {/* Quick Stats */}
        <section>
          <h3 className="text-h3 font-medium mb-4">Le tue statistiche</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="apple-card p-4 text-center">
              <ProgressRing progress={userStats.overallAccuracy} size={60} color="#34C759">
                <span className="text-caption font-medium text-apple-text">
                  {Math.round(userStats.overallAccuracy)}%
                </span>
              </ProgressRing>
              <p className="text-small text-apple-secondary mt-2">Precisione</p>
            </div>
            
            <div className="apple-card p-4 text-center">
              <ProgressRing progress={overallProgress} size={60} color="#007AFF">
                <span className="text-caption font-medium text-apple-text">
                  {completedTopics}/{totalTopics}
                </span>
              </ProgressRing>
              <p className="text-small text-apple-secondary mt-2">Argomenti</p>
            </div>
            
            <div className="apple-card p-4 text-center">
              <ProgressRing progress={Math.min((userStats.currentStreak / 10) * 100, 100)} size={60} color="#FF9F0A">
                <span className="text-caption font-medium text-apple-text">
                  {userStats.currentStreak}
                </span>
              </ProgressRing>
              <p className="text-small text-apple-secondary mt-2">Streak</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-h3 font-medium mb-4">Inizia a studiare</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('quiz', { quizType: 'general' })}
              disabled={!hasUnansweredQuestions}
              className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-blue/10 rounded-apple flex items-center justify-center group-active:scale-95 transition-transform">
                  <Shuffle className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body sm:text-h3 font-medium">Quiz Generale</h4>
                  <p className="text-small text-apple-secondary">
                    {hasUnansweredQuestions ? `${unansweredQuestions.length} domande disponibili` : 'Tutte le domande completate'}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('topics')}
              className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-green/10 rounded-apple flex items-center justify-center group-active:scale-95 transition-transform">
                  <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-apple-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body sm:text-h3 font-medium">Per Argomento</h4>
                  <p className="text-small text-apple-secondary">{totalTopics} argomenti</p>
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        {userStats.totalQuizzes > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h3 font-medium">Attività recente</h3>
              <button 
                onClick={() => onNavigate('stats')}
                className="text-caption text-apple-blue font-medium"
              >
                Vedi tutto
              </button>
            </div>
            <div className="apple-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body font-medium">Quiz completati</p>
                  <p className="text-caption text-apple-secondary">{userStats.totalQuizzes} quiz totali</p>
                </div>
                <div className="text-right">
                  <p className="text-h3 font-semibold text-apple-blue">{userStats.correctAnswers}</p>
                  <p className="text-caption text-apple-secondary">risposte corrette</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reset Button */}
        {Object.keys(userStats.answeredQuestions).length > 0 && (
          <section>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full apple-card p-4 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 border border-red-200">
                  <div className="w-10 h-10 bg-red-100 rounded-apple flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-body font-medium text-red-700">Resetta domande completate</h4>
                    <p className="text-small text-red-600">Ricomincia da zero con tutte le domande</p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma reset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler resettare tutte le domande completate? Questa azione non può essere annullata e perderai tutti i progressi attuali.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetQuestions} className="bg-red-600 hover:bg-red-700">
                    Resetta tutto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-apple-card border-t border-apple-border">
        <div className="flex justify-around py-2">
          <button className="flex flex-col items-center p-2 text-apple-blue">
            <div className="w-6 h-6 mb-1">🏠</div>
            <span className="text-small font-medium">Home</span>
          </button>
          <button 
            onClick={() => onNavigate('stats')}
            className="flex flex-col items-center p-2 text-apple-secondary hover:text-apple-blue transition-colors"
          >
            <BarChart className="w-6 h-6 mb-1" />
            <span className="text-small">Statistiche</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
