import React, { useState } from 'react';
import { useQuiz } from '../contexts/QuizContext';
import { useForm } from 'react-hook-form';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { User, Mail, BookOpen, ArrowLeft, Edit3, Save, X, LogOut } from 'lucide-react';

interface ProfileScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

interface ProfileForm {
  fullName: string;
  email: string;
  username: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { state, dispatch } = useQuiz();
  const { user, courses } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(user?.selectedCourse || '');

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
    }
  });

  const passwordForm = useForm<PasswordForm>();

  const handleSaveProfile = (data: ProfileForm) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
      }
    });
    setIsEditing(false);
  };

  const handleChangePassword = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      return;
    }
    // Simula cambio password
    setIsChangingPassword(false);
    passwordForm.reset();
  };

  const handleChangeCourse = () => {
    if (selectedCourse && selectedCourse !== user?.selectedCourse) {
      dispatch({ type: 'SELECT_COURSE', payload: selectedCourse });
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const currentCourse = courses.find(c => c.id === user?.selectedCourse);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-its-light to-red-50">
      {/* Header */}
      <header className="bg-its-card shadow-its-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-its hover:bg-red-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-its-red" />
            </button>
            <img
              src="/ITSAR.png"
              alt="Logo ITS Angelo Rizzoli"
              className="w-16 h-12"
            />
            <div>
              <h1 className="text-h2 font-bold text-its-text">Il mio Profilo</h1>
              <p className="text-body text-its-secondary">Gestisci le tue informazioni personali</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-its-red border-its-red hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="px-6 py-8 max-w-4xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-semibold text-its-text">Informazioni Personali</h2>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              size="sm"
            >
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditing ? 'Annulla' : 'Modifica'}
            </Button>
          </div>

          {isEditing ? (
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-its-text mb-2">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-its-secondary w-5 h-5" />
                    <Input
                      {...profileForm.register('fullName', { required: true })}
                      className="pl-10 its-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-small font-medium text-its-text mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-its-secondary w-5 h-5" />
                    <Input
                      {...profileForm.register('username', { required: true })}
                      className="pl-10 its-input"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-small font-medium text-its-text mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-its-secondary w-5 h-5" />
                    <Input
                      {...profileForm.register('email', { required: true })}
                      type="email"
                      className="pl-10 its-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="its-button-primary">
                  <Save className="w-4 h-4 mr-2" />
                  Salva Modifiche
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Annulla
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-small font-medium text-its-secondary mb-1">
                  Nome Completo
                </label>
                <p className="text-body text-its-text">{user.fullName}</p>
              </div>
              <div>
                <label className="block text-small font-medium text-its-secondary mb-1">
                  Username
                </label>
                <p className="text-body text-its-text">@{user.username}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-its-secondary mb-1">
                  Email
                </label>
                <p className="text-body text-its-text">{user.email}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Course Selection */}
        <Card className="p-6">
          <h2 className="text-h2 font-semibold text-its-text mb-6">Corso di Studi</h2>
          
          {currentCourse && (
            <div className="bg-gradient-to-r from-its-red/10 to-red-50 p-4 rounded-its mb-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-its-red" />
                <div>
                  <h3 className="text-h3 font-semibold text-its-text">{currentCourse.name}</h3>
                  <p className="text-small text-its-secondary">{currentCourse.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-small font-medium text-its-text">
              Cambia corso
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full its-input"
            >
              <option value="">Seleziona un corso...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {selectedCourse && selectedCourse !== user.selectedCourse && (
              <Button onClick={handleChangeCourse} className="its-button-primary">
                Cambia Corso
              </Button>
            )}
          </div>
        </Card>

        {/* Password Change */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-semibold text-its-text">Sicurezza</h2>
            <Button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              variant="outline"
              size="sm"
            >
              {isChangingPassword ? 'Annulla' : 'Cambia Password'}
            </Button>
          </div>

          {isChangingPassword ? (
            <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <div>
                <label className="block text-small font-medium text-its-text mb-2">
                  Password Attuale
                </label>
                <Input
                  {...passwordForm.register('currentPassword', { required: true })}
                  type="password"
                  className="its-input"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-its-text mb-2">
                  Nuova Password
                </label>
                <Input
                  {...passwordForm.register('newPassword', { required: true, minLength: 4 })}
                  type="password"
                  className="its-input"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-its-text mb-2">
                  Conferma Nuova Password
                </label>
                <Input
                  {...passwordForm.register('confirmPassword', { required: true })}
                  type="password"
                  className="its-input"
                />
              </div>
              <div className="flex space-x-3">
                <Button type="submit" className="its-button-primary">
                  Cambia Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChangingPassword(false)}
                >
                  Annulla
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-body text-its-secondary">
              La tua password è protetta. Clicca su "Cambia Password" per aggiornarla.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProfileScreen;