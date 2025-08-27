import { FC } from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { QuizProvider } from './contexts/QuizContext';
import { DailyQuizProvider } from './contexts/DailyQuizContext';
import { QuestionnaireProvider } from './contexts/QuestionnaireContext';

const queryClient = new QueryClient();

const App: FC = () => (
  <QueryClientProvider client={queryClient}>
    <QuizProvider>
      <DailyQuizProvider>
        <QuestionnaireProvider>
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* aggiungi qui altre route prima del catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>

          {/* toast / notifiche */}
          <Sonner />
          <Toaster />
        </QuestionnaireProvider>
      </DailyQuizProvider>
    </QuizProvider>
  </QueryClientProvider>
);

export default App;
