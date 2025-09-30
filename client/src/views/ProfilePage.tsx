import { useMemo } from "react";
import Profile from "../components/ProfileNew";
import { useAuth } from "../components/context/AuthContext";
import "../styles/profile.scss";

const ProfilePage = () => {
  const { user, booted, updateUser } = useAuth();

  const profileUser = useMemo(() => user, [user]);

  if (!booted) {
    return null;
  }

  return (
    <div className="profile-page">
      {profileUser ? (
        <Profile user={profileUser} onUpdateUser={updateUser} />
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
