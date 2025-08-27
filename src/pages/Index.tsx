// src/pages/Index.tsx
import React from 'react';
import { useQuiz } from '../contexts/QuizContext';

import SplashScreen    from '../components/SplashScreen';
import LoginScreen     from '../components/LoginScreen';
import CourseSelectionScreen from '../components/CourseSelectionScreen';
import ProfileScreen   from '../components/ProfileScreen';
import Dashboard       from '../components/Dashboard';
import TopicsList      from '../components/TopicsList';
import QuizScreen      from '../components/QuizScreen';
import ResultsScreen   from '../components/ResultsScreen';
import StatsScreen     from '../components/StatsScreen';
import ReviewScreen    from '../components/ReviewScreen';
import AchievementsScreen from '../components/AchievementsScreen';
import DailyQuizScreen from '../components/DailyQuizScreen';
import DailyQuizHistoryScreen from '../components/DailyQuizHistoryScreen';
import QuestionnaireScreen from '../components/QuestionnaireScreen';
import QuestionnaireListScreen from '../components/QuestionnaireListScreen';

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
        return !state.isAuthenticated ? (
          <LoginScreen onLogin={() => handleNavigate('dashboard')} />
        ) : (
          handleNavigate('dashboard'), null
        );

      case 'course-selection':
        return state.isAuthenticated && !state.user?.selectedCourse ? (
          <CourseSelectionScreen onNavigate={handleNavigate} />
        ) : (
          handleNavigate('dashboard'), null
        );

      case 'dashboard':
        return state.isAuthenticated ? (
          <Dashboard onNavigate={handleNavigate} />
        ) : (
          handleNavigate('login'), null
        );

      case 'profile':
        return state.isAuthenticated ? (
          <ProfileScreen onNavigate={handleNavigate} />
        ) : (
          handleNavigate('login'), null
        );

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

      case 'questionnaires':
        return state.isAuthenticated ? (
          <QuestionnaireListScreen onNavigate={handleNavigate} />
        ) : (
          handleNavigate('login'), null
        );

      case 'daily-quiz':
        return state.isAuthenticated ? (
          <DailyQuizScreen 
            onNavigate={handleNavigate} 
            date={screenParams?.date || new Date().toISOString().split('T')[0]} 
          />
        ) : (
          handleNavigate('login'), null
        );

      case 'daily-quiz-history':
        return state.isAuthenticated ? (
          <DailyQuizHistoryScreen onNavigate={handleNavigate} />
        ) : (
          handleNavigate('login'), null
        );

      case 'questionnaire':
        return state.isAuthenticated ? (
          <QuestionnaireScreen 
            onNavigate={handleNavigate}
            topicId={screenParams?.topicId || ''}
            type={screenParams?.type || 'teacher'}
          />
        ) : (
          handleNavigate('login'), null
        );

      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return <div className="min-h-screen bg-its-light">{renderScreen()}</div>;
};

export default Index;
