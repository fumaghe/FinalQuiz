// src/pages/Index.tsx
import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

import SplashScreen    from '../components/SplashScreen';
import LoginScreen     from '../components/LoginScreen';
import Dashboard       from '../components/Dashboard';
import TopicsList      from '../components/TopicsList';
import QuizScreen      from '../components/QuizScreen';
import ResultsScreen   from '../components/ResultsScreen';
import StatsScreen     from '../components/StatsScreen';
import ReviewScreen    from '../components/ReviewScreen';
import AchievementsScreen from '../components/AchievementsScreen'; // ← IMPORT

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
      case 'splash':
        return <SplashScreen onComplete={() => handleNavigate('login')} />;

      case 'login':
        return <LoginScreen onLogin={() => handleNavigate('dashboard')} />;

      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;

      case 'topics':
        return <TopicsList onNavigate={handleNavigate} />;

      case 'quiz': {
        const qt = screenParams?.quizType ?? screenParams?.type ?? 'general';
        return (
          <QuizScreen
            onNavigate={handleNavigate}
            quizType={qt}
            {...screenParams}
          />
        );
      }

      case 'results': {
        const {
          score,
          correctAnswers,
          totalQuestions,
          quizType,
          topicName,
          quizHistory,
          timeLeft,
          streakCount,
        } = screenParams;
        return (
          <ResultsScreen
            onNavigate={handleNavigate}
            score={score}
            correctAnswers={correctAnswers}
            totalQuestions={totalQuestions}
            quizType={quizType}
            topicName={topicName}
            quizHistory={quizHistory}
            timeTaken={timeLeft}      // rinominiamo timeLeft → timeTaken
            streakCount={streakCount}
          />
        );
      }

      case 'stats':
        return <StatsScreen onNavigate={handleNavigate} />;

      case 'review':
        return <ReviewScreen params={screenParams} onNavigate={handleNavigate} />;

      case 'achievements': // ← QUI
        return <AchievementsScreen onNavigate={handleNavigate} />;

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return <div className="min-h-screen bg-its-light">{renderScreen()}</div>;
};

export default Index;
