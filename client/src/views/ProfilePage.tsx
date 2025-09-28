import { useMemo } from "react";
import Navbar from "../components/Navbar";
import Profile from "../components/Profile";
import { useAuth } from "../components/context/AuthContext";

const ProfilePage = () => {
  const { user, booted, logout, updateUser } = useAuth();

  const profileUser = useMemo(() => user, [user]);

  if (!booted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar user={profileUser} onLogout={logout} />
      {profileUser ? (
        <Profile user={profileUser} onUpdateUser={updateUser} />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin profile...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
