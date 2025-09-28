import React from 'react';
import Navbar from '../components/Navbar';
import Profile from '../components/Profile';
import { useAuthContext } from '../stores/AuthContext';

const ProfilePage: React.FC = () => {
  const { currentUser, handleLogout, updateUser } = useAuthContext();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar user={currentUser} onLogout={handleLogout} />
      {currentUser && <Profile user={currentUser} onUpdateUser={updateUser} />}
    </div>
  );
};

export default ProfilePage;


