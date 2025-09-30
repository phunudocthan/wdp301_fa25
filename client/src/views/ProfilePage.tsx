import { useMemo } from "react";
import Profile from "../components/ProfileNew";
import { useAuth } from "../components/context/AuthContext";
import AdminProfile from "../pages/AdminProfile";
import "../styles/profile.scss";

const ProfilePage = () => {
  const { user, booted, updateUser } = useAuth();

  const profileUser = useMemo(() => user, [user]);

  if (!booted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* <Navbar user={profileUser} onLogout={logout} /> */}
      {profileUser ? (
        // <Profile user={profileUser} onUpdateUser={updateUser} />
        <AdminProfile/>
      ) : (
        <div className="profile-container">
          <div className="profile-card" style={{ textAlign: "center" }}>
            <div
              className="loading-spinner"
              style={{ margin: "2rem auto" }}
            ></div>
            <p>Đang tải thông tin profile...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
