import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CreditCard as Edit3,
  Save,
  X,
  Camera,
  Heart,
  Plus,
  Trash2,
} from "lucide-react";
import {
  updateProfile,
  getProfile,
  updateAvatar,
  changePassword,
} from "../api/user";
import type {
  User as UserType,
  UserRole,
  UserStatus,
  Address,
} from "../types/user";

const legoThemes = [
  "LEGO City",
  "LEGO Creator",
  "LEGO Technic",
  "LEGO Friends",
  "LEGO Star Wars",
  "LEGO Harry Potter",
  "LEGO Architecture",
  "LEGO Ninjago",
  "LEGO Duplo",
  "LEGO Classic",
];

const roleLabels: Record<UserRole, string> = {
  customer: "Khách hàng",
  seller: "Người bán",
  admin: "Quản trị viên",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
  locked: "Bị khóa",
};

type LocalUser = Omit<
  UserType,
  "role" | "status" | "avatar" | "email" | "name" | "address" | "favoriteThemes"
> & {
  role: UserRole;
  status: UserStatus;
  avatar: string;
  email: string;
  name: string;
  address: Address;
  favoriteThemes: string[];
};

interface ProfileProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<LocalUser>({
    name: user?.name || "Người dùng",
    email: user?.email || "unknown@example.com",
    avatar:
      user?.avatar ||
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    role: user?.role || "customer",
    status: user?.status || "active",
    phone: user?.phone || "",
    address: user?.address || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    favoriteThemes: user?.favoriteThemes || [],
    _id: user?._id,
    lastLogin: user?.lastLogin,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [newTheme, setNewTheme] = useState("");
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");

  const phoneRegex = /^0\d{9}$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getProfile();
        const normalized: LocalUser = {
          name: profile?.name || "Người dùng",
          email: profile?.email || "unknown@example.com",
          avatar:
            profile?.avatar ||
            "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
          role: profile?.role || "customer",
          status: profile?.status || "active",
          phone: profile?.phone || "",
          address: profile?.address || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          },
          favoriteThemes: profile?.favoriteThemes || [],
          _id: profile?._id,
          lastLogin: profile?.lastLogin,
          createdAt: profile?.createdAt,
          updatedAt: profile?.updatedAt,
        };
        setEditData(normalized);
        onUpdateUser(normalized);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể lấy thông tin người dùng";
        setErrorMsg(message);
      }
    }
    fetchProfile();
  }, [onUpdateUser]);

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg("");

    if (!phoneRegex.test(editData.phone || "")) {
      setErrorMsg("Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.");
      setIsLoading(false);
      return;
    }

    try {
      const updatedUser = await updateProfile(editData);
      const normalized: LocalUser = {
        name: updatedUser?.name || "Người dùng",
        email: updatedUser?.email || "unknown@example.com",
        avatar:
          updatedUser?.avatar ||
          "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        role: updatedUser?.role || "customer",
        status: updatedUser?.status || "active",
        phone: updatedUser?.phone || "",
        address: updatedUser?.address || {
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
        favoriteThemes: updatedUser?.favoriteThemes || [],
        _id: updatedUser?._id,
        lastLogin: updatedUser?.lastLogin,
        createdAt: updatedUser?.createdAt,
        updatedAt: updatedUser?.updatedAt,
      };
      setEditData(normalized);
      onUpdateUser(normalized);
      setIsEditing(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Cập nhật thất bại";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append("avatar", e.target.files[0]);
      setIsLoading(true);
      setErrorMsg("");
      try {
        const updatedUser = await updateAvatar(formData);
        const normalized: LocalUser = {
          name: updatedUser?.name || "Người dùng",
          email: updatedUser?.email || "unknown@example.com",
          avatar:
            updatedUser?.avatar ||
            "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
          role: updatedUser?.role || "customer",
          status: updatedUser?.status || "active",
          phone: updatedUser?.phone || "",
          address: updatedUser?.address || {
            street: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
          },
          favoriteThemes: updatedUser?.favoriteThemes || [],
          _id: updatedUser?._id,
          lastLogin: updatedUser?.lastLogin,
          createdAt: updatedUser?.createdAt,
          updatedAt: updatedUser?.updatedAt,
        };
        setEditData(normalized);
        onUpdateUser(normalized);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Cập nhật avatar thất bại";
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg("");

    if (!passwords.oldPassword || !passwords.newPassword) {
      setPasswordMsg("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới.");
      return;
    }

    if (passwords.oldPassword === passwords.newPassword) {
      setPasswordMsg("Mật khẩu mới không được trùng mật khẩu cũ.");
      return;
    }

    if (!strongPasswordRegex.test(passwords.newPassword)) {
      setPasswordMsg(
        "Mật khẩu mới phải ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt."
      );
      return;
    }

    try {
      const res = await changePassword(
        passwords.oldPassword,
        passwords.newPassword
      );
      setPasswordMsg(res.msg);
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
      setPasswordMsg(message);
    }
  };

  const addFavoriteTheme = () => {
    if (newTheme && !editData.favoriteThemes?.includes(newTheme)) {
      setEditData((prev) => ({
        ...prev,
        favoriteThemes: [...(prev.favoriteThemes || []), newTheme],
      }));
      setNewTheme("");
    }
  };

  const removeFavoriteTheme = (themeToRemove: string) => {
    setEditData((prev) => ({
      ...prev,
      favoriteThemes: (prev.favoriteThemes || []).filter(
        (theme) => theme !== themeToRemove
      ),
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setEditData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const renderAddress = (address?: UserType["address"]) => {
    if (!address) return "";
    return [address.street, address.city, address.state, address.country]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="profile-container">
      {errorMsg && <div className="error-message">{errorMsg}</div>}

      <div className="profile-header">
        <div className="profile-banner"></div>

        <div className="profile-info">
          <div className="profile-avatar">
            <img src={editData.avatar} alt="Profile" />
            {isEditing && (
              <label className="avatar-upload-btn" title="Thay đổi avatar">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  aria-label="Upload avatar"
                />
              </label>
            )}
          </div>

          <div className="profile-details">
            <h1>{editData.name}</h1>
            <p>{editData.email}</p>

            <div className="profile-badges">
              <div className="profile-badge role">
                <Shield className="h-4 w-4" />
                <span>{roleLabels[editData.role]}</span>
              </div>
              <div className="profile-badge status">
                <span>{statusLabels[editData.status]}</span>
              </div>
              <div className="profile-badge joined">
                <Calendar className="h-4 w-4" />
                <span>
                  Tham gia từ:{" "}
                  {editData.createdAt
                    ? new Date(editData.createdAt).toLocaleDateString("vi-VN")
                    : ""}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary"
                >
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary"
                  >
                    <X className="h-4 w-4" />
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header">
            <User className="card-icon" />
            <h3>Thông tin cá nhân</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Họ và tên</label>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nhập họ và tên"
              />
            ) : (
              <div className="form-input" style={{ background: "#f8f9fa" }}>
                {editData.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail
                className="h-4 w-4"
                style={{ display: "inline", marginRight: "0.5rem" }}
              />
              Email
            </label>
            <input
              type="email"
              value={editData.email}
              disabled
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone
                className="h-4 w-4"
                style={{ display: "inline", marginRight: "0.5rem" }}
              />
              Số điện thoại
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={editData.phone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div className="form-input" style={{ background: "#f8f9fa" }}>
                {editData.phone}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              <MapPin
                className="h-4 w-4"
                style={{ display: "inline", marginRight: "0.5rem" }}
              />
              Địa chỉ
            </label>
            {isEditing ? (
              <div className="form-grid">
                <input
                  type="text"
                  name="address.street"
                  value={editData.address?.street || ""}
                  onChange={handleInputChange}
                  placeholder="Đường"
                  className="form-input"
                />
                <input
                  type="text"
                  name="address.city"
                  value={editData.address?.city || ""}
                  onChange={handleInputChange}
                  placeholder="Thành phố"
                  className="form-input"
                />
                <input
                  type="text"
                  name="address.state"
                  value={editData.address?.state || ""}
                  onChange={handleInputChange}
                  placeholder="Tỉnh/Thành"
                  className="form-input"
                />
                <input
                  type="text"
                  name="address.postalCode"
                  value={editData.address?.postalCode || ""}
                  onChange={handleInputChange}
                  placeholder="Mã bưu chính"
                  className="form-input"
                />
              </div>
            ) : (
              <div className="form-input" style={{ background: "#f8f9fa" }}>
                {renderAddress(editData.address)}
              </div>
            )}
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <Heart className="card-icon" style={{ color: "#e91e63" }} />
            <h3>Chủ đề yêu thích</h3>
          </div>

          {isEditing && (
            <div className="theme-add">
              <select
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                className="theme-select"
              >
                <option value="">Chọn chủ đề...</option>
                {legoThemes
                  .filter(
                    (theme) => !(editData.favoriteThemes || []).includes(theme)
                  )
                  .map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
              </select>
              <button
                onClick={addFavoriteTheme}
                disabled={!newTheme}
                className="theme-add-btn"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="theme-tags">
            {(isEditing ? editData.favoriteThemes : user.favoriteThemes)?.map(
              (theme) => (
                <div key={theme} className="theme-tag">
                  {theme}
                  {isEditing && (
                    <button
                      onClick={() => removeFavoriteTheme(theme)}
                      className="theme-remove"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            )}
          </div>

          {(!user.favoriteThemes || user.favoriteThemes.length === 0) &&
            !isEditing && (
              <p
                style={{
                  color: "#718096",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                Chưa có chủ đề yêu thích nào được thêm
              </p>
            )}
        </div>
      </div>

      <div className="profile-content" style={{ marginTop: "2rem" }}>
        <div className="profile-card">
          <div className="card-header">
            <Edit3 className="card-icon" />
            <h3>Thống kê</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">12</div>
              <div className="stat-label">Đơn hàng</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">8</div>
              <div className="stat-label">Yêu thích</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2,450</div>
              <div className="stat-label">Điểm tích lũy</div>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <div className="card-header">
            <Calendar className="card-icon" />
            <h3>Hoạt động gần đây</h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot blue"></div>
              <div className="activity-content">
                <h4>Mua LEGO City Fire Station</h4>
                <p>2 ngày trước</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot green"></div>
              <div className="activity-content">
                <h4>Thêm vào yêu thích: Creator Expert</h4>
                <p>5 ngày trước</p>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot orange"></div>
              <div className="activity-content">
                <h4>Đánh giá sản phẩm Technic</h4>
                <p>1 tuần trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <Shield className="card-icon" />
          <h3>Bảo mật</h3>
        </div>

        <div className="password-section">
          <label className="form-label">Đổi mật khẩu</label>
          <div className="password-grid">
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={passwords.oldPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, oldPassword: e.target.value }))
              }
              className="form-input"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, newPassword: e.target.value }))
              }
              className="form-input"
            />
          </div>
          <button
            onClick={handleChangePassword}
            className="btn-primary"
            style={{ marginTop: "1rem" }}
          >
            Đổi mật khẩu
          </button>
          {passwordMsg && (
            <div
              className={
                passwordMsg.toLowerCase().includes("success")
                  ? "success-message"
                  : "error-message"
              }
            >
              {passwordMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
