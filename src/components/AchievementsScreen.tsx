// src/components/AchievementsScreen.tsx
import React from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { ALL_BADGES } from '../types/quiz';
import { ArrowLeft } from 'lucide-react';

interface Props { onNavigate: (screen:string)=>void }

const rarityColor: Record<string,string> = {
  common:     'bg-gray-200 text-gray-700',
  rare:       'bg-blue-200 text-blue-800',
  epic:       'bg-purple-200 text-purple-800',
  legendary:  'bg-yellow-200 text-yellow-800',
};

const AchievementsScreen: React.FC<Props> = ({ onNavigate }) => {
  const { state } = useQuiz();
  const { unlockedBadges } = state.userStats;

  /* gruppi per rarità */
  const grouped = ['common','rare','epic','legendary'].map(r => ({
    rarity: r,
    badges: ALL_BADGES.filter(b => b.rarity === r),
  }));

  return (
    <div className="min-h-screen bg-apple-light">
      <header className="bg-apple-card px-4 py-3 flex items-center space-x-3 shadow-apple-card">
        <button onClick={()=>onNavigate('dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-apple-light">
          <ArrowLeft className="w-5 h-5 text-apple-blue"/>
        </button>
        <h1 className="text-lg font-semibold">Badge & Obiettivi</h1>
      </header>

      <div className="p-4 space-y-8 pb-24">
        {grouped.map(group => (
          <section key={group.rarity}>
            <h2 className="mb-3 text-base font-medium capitalize">
              {group.rarity === 'common' ? 'Comuni' :
               group.rarity === 'rare'   ? 'Rari'   :
               group.rarity === 'epic'   ? 'Epici'  : 'Leggendari'}
            </h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {group.badges.map(b => {
                const unlocked = unlockedBadges.includes(b.id);
                return (
                  <div key={b.id}
                       className={`rounded-apple p-3 flex flex-col items-center justify-center text-center cursor-default
                           ${unlocked ? rarityColor[b.rarity] : 'bg-apple-card text-apple-secondary opacity-60'}`}>
                    <span className="text-3xl">{unlocked ? b.emoji : '❔'}</span>
                    <p className="text-xs font-semibold mt-1 truncate">{b.name}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default AchievementsScreen;
