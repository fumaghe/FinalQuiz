
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'fade-in' | 'hold' | 'fade-out'>('fade-in');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('hold'), 800);
    const timer2 = setTimeout(() => setPhase('fade-out'), 1200);
    const timer3 = setTimeout(() => onComplete(), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div 
      className={`
        fixed inset-0 bg-its-red flex flex-col items-center justify-center z-50 transition-opacity duration-300
        ${phase === 'fade-in' ? 'opacity-0 animate-[fade-in_0.8s_ease-out_forwards]' : ''}
        ${phase === 'hold' ? 'opacity-100' : ''}
        ${phase === 'fade-out' ? 'opacity-100 animate-[fade-out_0.3s_ease-out_forwards]' : ''}
      `}
    >
      {/* Logo */}
      <img
        src="/ITSAR.png"
        alt="Logo ITS Angelo Rizzoli"
        className="w-32 mb-6"
      />

      {/* Title */}
      <h1 className="text-h1 text-white font-semibold tracking-tight">
        ITSApp
      </h1>

      {/* Subtitle */}
      <p className="text-body text-white/80 mt-2">
        Quiz Tecnici ITSAR
      </p>
    </div>
  );
};

export default SplashScreen;
