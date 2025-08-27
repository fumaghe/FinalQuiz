
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useQuiz, User } from '../contexts/QuizContext';
import { User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

interface LoginForm {
  username: string;
  password: string;
  fullName: string;
  email: string;
}

interface StoredUser extends User {
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { dispatch } = useQuiz();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  // Check if user exists in localStorage
  const checkUserExists = (username: string): StoredUser | null => {
    const users = JSON.parse(localStorage.getItem('itsar_users') || '{}');
    return users[username] || null;
  };

  // Save user to localStorage
  const saveUser = (user: User, password: string) => {
    const users = JSON.parse(localStorage.getItem('itsar_users') || '{}');
    users[user.username] = { ...user, password };
    localStorage.setItem('itsar_users', JSON.stringify(users));
  };

  // Verify password
  const verifyPassword = (username: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem('itsar_users') || '{}');
    const user = users[username];
    return user && user.password === password;
  };

  const onSubmit = (data: LoginForm) => {
    setLoginError('');
    
    if (isRegistering) {
      // Registration logic
      const existingUser = checkUserExists(data.username);
      if (existingUser) {
        setLoginError('Username già esistente. Scegli un altro username.');
        return;
      }

      const newUser: User = {
        id: `user_${Date.now()}`,
        username: data.username,
        fullName: data.fullName || data.username,
        email: data.email || `${data.username}@itsar.edu`,
        selectedCourse: '',
        courseName: '',
      };

      saveUser(newUser, data.password);
      dispatch({ type: 'LOGIN', payload: newUser });
      // Save user for course selection persistence
      localStorage.setItem('quizmaster_user', JSON.stringify(newUser));
    } else {
      // Login logic
      const existingUser = checkUserExists(data.username);
      if (!existingUser) {
        setLoginError('Username non trovato. Registrati per creare un nuovo account.');
        return;
      }

      if (!verifyPassword(data.username, data.password)) {
        setLoginError('Password errata. Riprova.');
        return;
      }

      // Remove password from user object before login
      const { password, ...userWithoutPassword } = existingUser;
      dispatch({ type: 'LOGIN', payload: userWithoutPassword as User });
      // Save user for course selection persistence
      localStorage.setItem('quizmaster_user', JSON.stringify(userWithoutPassword));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          {/* App Icon */}
          <div className="rounded-its flex items-center justify-center mb-6 mx-auto">
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-32 h-24"
            />
          </div>
          
          <h1 className="text-h1 text-its-text font-bold mb-2">
            Benvenuto in ITSApp!
          </h1>
          
          <p className="text-body text-its-secondary leading-relaxed">
            {isRegistering ? 'Crea il tuo account per iniziare' : 'Accedi per continuare con i quiz'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Message */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-its p-3 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-small text-red-700">{loginError}</p>
            </div>
          )}

          <div className="its-card p-6 space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-small font-medium text-its-text mb-2">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-its-secondary w-5 h-5" />
                  <Input
                    {...register('fullName', { required: isRegistering })}
                    placeholder="Mario Rossi"
                    className="pl-10 its-input"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-small text-its-red mt-1">Nome completo richiesto</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-small font-medium text-its-text mb-2">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-its-secondary w-5 h-5" />
                <Input
                  {...register('username', { required: true, minLength: 3 })}
                  placeholder="mario.rossi"
                  className="pl-10 its-input"
                />
              </div>
              {errors.username && (
                <p className="text-small text-its-red mt-1">Username richiesto (min. 3 caratteri)</p>
              )}
            </div>

            {isRegistering && (
              <div>
                <label className="block text-small font-medium text-its-text mb-2">
                  Email
                </label>
                <Input
                  {...register('email', { 
                    required: isRegistering,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                  })}
                  type="email"
                  placeholder="mario.rossi@student.itsar.edu"
                  className="its-input"
                />
                {errors.email && (
                  <p className="text-small text-its-red mt-1">Email valida richiesta</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-small font-medium text-its-text mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register('password', { required: true, minLength: 4 })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pr-10 its-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-its-secondary hover:text-its-text"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-small text-its-red mt-1">Password richiesta (min. 4 caratteri)</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full its-button-primary h-12">
            {isRegistering ? 'Registrati' : 'Accedi'}
          </Button>
        </form>

        {/* Toggle Registration */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-its-red hover:text-its-red-dark font-medium"
          >
            {isRegistering ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center space-x-6 mt-8">
          <button className="text-caption text-its-secondary hover:text-its-text">
            Privacy Policy
          </button>
          <button className="text-caption text-its-secondary hover:text-its-text">
            Termini di Servizio
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
