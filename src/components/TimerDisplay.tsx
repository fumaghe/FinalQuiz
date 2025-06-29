import React from 'react';

interface TimerDisplayProps {
  timeLeft: number;        // secondi rimanenti
  furyRemaining: number;   // domande senza penalità (0 = non in furia)
}

const format = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ timeLeft, furyRemaining }) => {
  const danger = timeLeft < 60;        // meno di 1 minuto
  const inFury = furyRemaining > 0;    // modalità furia attiva

  return (
    <div
      className={`fixed top-4 right-4 z-20 px-3 py-1 rounded-full text-sm font-semibold
        ${inFury ? 'bg-orange-500 text-white animate-pulse'
                 : danger  ? 'bg-red-600 text-white'
                           : 'bg-apple-blue text-white' }`}
    >
      {inFury ? '🔥 ' : ''}
      {format(timeLeft)}
    </div>
  );
};
