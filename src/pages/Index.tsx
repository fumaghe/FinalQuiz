import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

import SplashScreen from '../components/SplashScreen';
import LoginScreen  from '../components/LoginScreen';
import Dashboard    from '../components/Dashboard';
import TopicsList   from '../components/TopicsList';
import QuizScreen   from '../components/QuizScreen';
import ResultsScreen from '../components/ResultsScreen';
import StatsScreen  from '../components/StatsScreen';
import ReviewScreen from '../components/ReviewScreen';

/** Firma comune per la navigazione interna */
type NavigateFn = (screen: string, params?: any) => void;

const Index: React.FC = () => {
  const { state, dispatch } = useQuiz();

  /** Cambia schermata salvando eventuali parametri */
  const handleNavigate: NavigateFn = (screen, params) => {
    dispatch({ type: 'SET_CURRENT_SCREEN', payload: { screen, params } });
  };

  /** Scelta della view da renderizzare */
  const renderScreen = () => {
    const { currentScreen, screenParams } = state;

    switch (currentScreen) {
      /* Splash --------------------------------------------------- */
      case 'splash':
        return <SplashScreen onComplete={() => handleNavigate('login')} />;

      /* Login ---------------------------------------------------- */
      case 'login':
        return (
          <LoginScreen
            onLogin={() => handleNavigate('dashboard')}
          />
        );

      /* Dashboard ------------------------------------------------ */
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      /* Topics --------------------------------------------------- */
      case 'topics':
        return <TopicsList onNavigate={handleNavigate} />;

      /* Quiz ----------------------------------------------------- */
      case 'quiz': {
        /* accetta sia quizType che type per retro-compatibilità */
        const qt = screenParams?.quizType ?? screenParams?.type ?? 'general';
        return (
          <QuizScreen
            quizType={qt}
            {...screenParams}
            onNavigate={handleNavigate}
          />
        );
      }

      /* Results -------------------------------------------------- */
      case 'results':
        return (
          <ResultsScreen
            score={screenParams?.score}
            correctAnswers={screenParams?.correctAnswers}
            totalQuestions={screenParams?.totalQuestions}
            quizType={screenParams?.quizType ?? screenParams?.type}
            {...screenParams}
            onNavigate={handleNavigate}
          />
        );

      /* Stats ---------------------------------------------------- */
      case 'stats':
        return <StatsScreen onNavigate={handleNavigate} />;

      /* Review --------------------------------------------------- */
      case 'review':
        return (
          <ReviewScreen
            params={screenParams}
            onNavigate={handleNavigate}
          />
        );

      /* Default -------------------------------------------------- */
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-apple-light">
      {renderScreen()}
    </div>
  );
};

export default Index;
