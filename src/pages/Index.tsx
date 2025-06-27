import React, { useState, useEffect } from 'react';
import { QuizProvider } from '../contexts/QuizContext';
import SplashScreen from '../components/SplashScreen';
import LoginScreen from '../components/LoginScreen';
import Dashboard from '../components/Dashboard';
import TopicsList from '../components/TopicsList';
import QuizScreen from '../components/QuizScreen';
import StatsScreen from '../components/StatsScreen';
import ResultsScreen from '../components/ResultsScreen';
import ReviewScreen from '../components/ReviewScreen';

type Screen = 'splash' | 'login' | 'dashboard' | 'topics' | 'quiz' | 'stats' | 'results' | 'settings' | 'review';

interface NavigationParams {
  type?: 'general' | 'topic' | 'custom';
  topicId?: string;
  topicName?: string;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  quizType?: 'general' | 'topic';
  quizHistory?: any;
  questionIds?: string[];
  title?: string;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [navigationParams, setNavigationParams] = useState<NavigationParams>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('quizmaster_logged_in');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleNavigation = (screen: Screen, params?: NavigationParams) => {
    setCurrentScreen(screen);
    if (params) {
      setNavigationParams(params);
    }
  };

  const handleSplashComplete = () => {
    if (isLoggedIn) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleLogin = () => {
    localStorage.setItem('quizmaster_logged_in', 'true');
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigation} />;
      
      case 'topics':
        return <TopicsList onNavigate={handleNavigation} />;
      
      case 'quiz':
        return (
          <QuizScreen 
            onNavigate={handleNavigation}
            quizType={navigationParams.type || 'general'}
            topicId={navigationParams.topicId}
            topicName={navigationParams.topicName}
            questionIds={navigationParams.questionIds}
            title={navigationParams.title}
          />
        );
      
      case 'stats':
        return <StatsScreen onNavigate={handleNavigation} />;
      
      case 'results':
        return (
          <ResultsScreen
            onNavigate={handleNavigation}
            score={navigationParams.score || 0}
            correctAnswers={navigationParams.correctAnswers || 0}
            totalQuestions={navigationParams.totalQuestions || 0}
            quizType={navigationParams.quizType || 'general'}
            topicName={navigationParams.topicName}
            quizHistory={navigationParams.quizHistory}
          />
        );

      case 'review':
        return (
          <ReviewScreen
            onNavigate={handleNavigation}
            quizHistory={navigationParams.quizHistory}
          />
        );
      
      case 'settings':
        return <Dashboard onNavigate={handleNavigation} />;
      
      default:
        return <Dashboard onNavigate={handleNavigation} />;
    }
  };

  return (
    <QuizProvider>
      <div className="font-sf-pro">
        {renderCurrentScreen()}
      </div>
    </QuizProvider>
  );
};

export default Index;
