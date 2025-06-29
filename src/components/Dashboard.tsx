import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import ProgressRing from './ProgressRing';
import {
  Shuffle,
  Folder,
  User,
  Timer,
  Zap,
  Award,
  BarChart,
  RotateCcw,
} from 'lucide-react';
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

/* ------------------------------------------------------------------ */
/* PROPS                                                              */
/* ------------------------------------------------------------------ */
interface DashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                          */
/* ------------------------------------------------------------------ */
const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, resetAllQuestions, getFilteredQuestions } = useQuiz();
  const { userStats, topics } = state;

  /* -------------------------------------------------------------- */
  /* Statistiche base                                               */
  /* -------------------------------------------------------------- */
  const totalTopics     = topics.length;
  const completedTopics = topics.filter((t) => {
    const ts = userStats.statsPerTopic[t.name];
    return ts && ts.done > 0;
  }).length;
  const overallProgress =
    totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  const unanswered    = getFilteredQuestions('unanswered');
  const hasUnanswered = unanswered.length > 0;

  /* -------------------------------------------------------------- */
  /* HANDLERS                                                       */
  /* -------------------------------------------------------------- */
  const handleResetQuestions = () => resetAllQuestions();

  /* -------------------------------------------------------------- */
  /* RENDER                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-apple-light">
      {/* ---------------------------------------------------------- */}
      {/* HEADER                                                    */}
      {/* ---------------------------------------------------------- */}
      <header className="bg-apple-card shadow-apple-card px-apple-2x py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-apple-blue rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🧠</span>
          </div>
          <div>
            <h2 className="text-h2 font-semibold">Ciao, Studente!</h2>
            <p className="text-caption text-apple-secondary">
              Pronto per nuove sfide?
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-full hover:bg-apple-light transition-colors"
        />
      </header>

      {/* ---------------------------------------------------------- */}
      {/* BODY                                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="px-apple-2x py-6 space-y-8 pb-24">
        {/* ------------------- QUICK-STATS ------------------------ */}
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
              <ProgressRing
                progress={Math.min((userStats.currentStreak / 10) * 100, 100)}
                size={60}
                color="#FF9F0A"
              >
                <span className="text-caption font-medium text-apple-text">
                  {userStats.currentStreak}
                </span>
              </ProgressRing>
              <p className="text-small text-apple-secondary mt-2">Streak</p>
            </div>
          </div>
        </section>

        {/* ------------------- QUICK-ACTIONS ---------------------- */}
        <section>
          <h3 className="text-h3 font-medium mb-4">Inizia a studiare</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* === QUIZ GENERALE ================================= */}
            <button
              onClick={() => onNavigate('quiz', { quizType: 'general' })}
              disabled={!hasUnanswered}
              className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-blue/10 rounded-apple flex items-center justify-center">
                  <Shuffle className="w-5 h-5 sm:w-6 sm:h-6 text-apple-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body sm:text-h3 font-medium">Quiz Generale</h4>
                  <p className="text-small text-apple-secondary">
                    {hasUnanswered
                      ? `${unanswered.length} domande disponibili`
                      : 'Tutte le domande completate'}
                  </p>
                </div>
              </div>
            </button>

            {/* === PER ARGOMENTO ================================= */}
            <button
              onClick={() => onNavigate('topics')}
              className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apple-green/10 rounded-apple flex items-center justify-center">
                  <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-apple-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body sm:text-h3 font-medium">Per Argomento</h4>
                  <p className="text-small text-apple-secondary">{totalTopics} argomenti</p>
                </div>
              </div>
            </button>

            {/* === QUIZ PER TE ================================== */}
            <button
              onClick={() => onNavigate('quiz', { quizType: 'forYou' })}
              className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group border-2 border-amber-400"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-200/10 rounded-apple flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-body sm:text-h3 font-medium">Quiz per Te</h4>
                  <p className="text-small text-apple-secondary">
                    30 domande ponderate secondo la tua precisione
                  </p>
                </div>
              </div>
            </button>

            {/* === SFIDA A TEMPO (popup) ======================== */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-apple flex items-center justify-center">
                      <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body sm:text-h3 font-medium">Sfida a Tempo</h4>
                      <p className="text-small text-apple-secondary">
                        10&nbsp;min • penalità&nbsp;-10&nbsp;s
                      </p>
                    </div>
                  </div>
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-extrabold text-amber-500 flex items-center space-x-2">
                    <span>⏱️</span>
                    <span>Sfida a Tempo</span>
                  </AlertDialogTitle>
                </AlertDialogHeader>

                <AlertDialogDescription asChild>
                  <ul className="mt-4 space-y-3 text-left">
                    <li className="flex items-start">
                      <span className="mr-2 text-xl">🕒</span>
                      <span>
                        Tempo totale: <strong className="text-blue-600">10 minuti</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-xl">❌</span>
                      <span>
                        Risposta errata: <strong className="text-red-600">−10 s</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-xl">🔥</span>
                      <span>
                        <strong className="text-green-600">+3</strong> corrette → <strong className="text-green-600">+10 s</strong>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-xl">💥</span>
                      <span>
                        <strong className="text-purple-600">+5</strong> corrette → <strong className="text-purple-600">Modalità Furia</strong> (0 penalità per 3 domande)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 text-xl">🏁</span>
                      <span>
                        Fine al termine del tempo o alla <strong className="text-indigo-600">30ª domanda</strong>
                      </span>
                    </li>
                  </ul>
                </AlertDialogDescription>

                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="text-gray-500 hover:text-gray-800">
                    Chiudi
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onNavigate('quiz', { quizType: 'timed' })}
                    className="ml-2 bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    🚀 Inizia ora!
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* === STREAK QUIZ (popup) ========================== */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-lime-100 rounded-apple flex items-center justify-center">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-lime-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body sm:text-h3 font-medium">Streak Quiz</h4>
                      <p className="text-small text-apple-secondary">Errore = game over</p>
                    </div>
                  </div>
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-extrabold text-lime-600 flex items-center space-x-2">
                    <span>⚡</span><span>Streak Quiz</span>
                  </AlertDialogTitle>
                </AlertDialogHeader>

                <AlertDialogDescription asChild>
                  <ul className="mt-4 space-y-3 text-left">
                    <li>Vai avanti finché non sbagli</li>
                    <li>Badge ogni 10 • 20 • 30 di fila</li>
                    <li>Interfaccia super rapida, niente progress-bar</li>
                  </ul>
                </AlertDialogDescription>

                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onNavigate('quiz', { quizType: 'streak' })}
                    className="bg-lime-600 hover:bg-lime-700 text-white"
                  >
                    🚀 Inizia!
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* === QUIZ INVERSI (popup) ========================= */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="apple-card p-4 sm:p-6 text-left hover:bg-gray-50 transition-colors apple-button group">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-apple flex items-center justify-center">
                      <Shuffle className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-body sm:text-h3 font-medium">Quiz Inversi</h4>
                      <p className="text-small text-apple-secondary">Indovina la domanda!</p>
                    </div>
                  </div>
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-extrabold text-sky-600 flex items-center space-x-2">
                    <span>🪞</span><span>Quiz Inversi</span>
                  </AlertDialogTitle>
                </AlertDialogHeader>

                <AlertDialogDescription asChild>
                  <ul className="mt-4 space-y-3 text-left">
                    <li>Vedi la <strong>risposta</strong>, scegli la domanda giusta</li>
                    <li>Perfetto per terminologia & definizioni</li>
                  </ul>
                </AlertDialogDescription>

                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel>Chiudi</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onNavigate('quiz', { quizType: 'reverse' })}
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    🚀 Inizia!
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </section>

        {/* ------------------- RECENT ACTIVITY ------------------- */}
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
                  <p className="text-caption text-apple-secondary">
                    {userStats.totalQuizzes} quiz totali
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-h3 font-semibold text-apple-blue">
                    {userStats.correctAnswers}
                  </p>
                  <p className="text-caption text-apple-secondary">risposte corrette</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ------------------- RESET BUTTON ---------------------- */}
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
                    <p className="text-small text-red-600">
                      Ricomincia da zero con tutte le domande
                    </p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Conferma reset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler resettare tutte le domande completate?
                    L’azione è irreversibile.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetQuestions}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Resetta tutto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* BOTTOM NAV                                                */}
      {/* ---------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0	bg-apple-card border-t border-apple-border">
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
          <button
            onClick={() => onNavigate('achievements')}
            className="flex flex-col items-center p-2 text-apple-secondary hover:text-apple-blue transition-colors"
          >
            <Award className="w-6 h-6 mb-1"/>
            <span className="text-small">Badge</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
