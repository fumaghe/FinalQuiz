
import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-its-light flex flex-col items-center justify-center px-its-2x">
      <div className="w-full max-w-sm">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          {/* App Icon */}
          <div className="w-20 h-20 bg-its-red rounded-its flex items-center justify-center mb-6 mx-auto shadow-its">
            <span className="text-3xl">🧠</span>
          </div>
          
          <h1 className="text-h1 text-its-text font-semibold mb-4">
            Benvenuto!
          </h1>
          
          <p className="text-h3 text-its-secondary leading-relaxed">
            Metti alla prova le tue conoscenze tecniche con quiz professionali
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={onLogin}
          className="w-full h-12 its-button-primary text-center font-medium mb-8 transition-transform active:scale-95"
        >
          Inizia i Quiz
        </button>

        {/* Footer Links */}
        <div className="flex justify-center space-x-6">
          <button className="text-caption text-its-red">
            Privacy Policy
          </button>
          <button className="text-caption text-its-red">
            Termini di Servizio
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
