import React, { useState, useEffect, useRef } from "react";
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
  
} from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import {
  updateProfile,
  getProfile,
  updateAvatar,
  changePassword,
} from "../api/user";
import { useAuth } from "./context/AuthContext";
import type {
  User as UserType,
  UserRole,
  UserStatus,
  Address,
} from "../types/user";

const roleLabels: Record<UserRole, string> = {
  customer: "Khách hàng",
  seller: "Người bán",
  admin: "Quản trị viên",
  employee: "Nhân viên",
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
  user: UserType | null;
  onUpdateUser?: (user: UserType) => void;
}

const AdminProfileUI: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
  });
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
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const phoneRegex = /^0\d{9}$/;
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = user ? user : await getProfile();
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
        onUpdateUser?.(normalized as any);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Không thể lấy thông tin người dùng";
        setErrorMsg(message);
      }
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg("");

    if (!phoneRegex.test(editData.phone || "")) {
      setErrorMsg("Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số.");
      setIsLoading(false);
      return;
    }

    try {
      const updatedUser = await updateProfile(editData as any);
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
      onUpdateUser?.(normalized as any);
      setIsEditing(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Cập nhật thất bại";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const { updateUser } = useAuth();

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
        onUpdateUser?.(normalized as any);
        try {
          updateUser?.(normalized as any);
          try {
            localStorage.setItem("avatar", normalized.avatar || "");
            localStorage.setItem("name", normalized.name || "");
          } catch (err) {
            // ignore storage errors
          }
        } catch (err) {
          // ignore
        }
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
      const res = await changePassword(passwords.oldPassword, passwords.newPassword);
      setPasswordMsg(res.msg);
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
      setPasswordMsg(message);
    }
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

  const isAdmin = editData.role === "admin";

  const leftCardRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <div className="profile-container">
        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <div className="profile-header">
          <div className="profile-banner"></div>

          <div className="profile-info">
            <div className="profile-avatar" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowAvatarMenu((s) => !s)}
                aria-haspopup="true"
                aria-expanded={showAvatarMenu}
                style={{ background: "transparent", border: "none", padding: 0, cursor: 'pointer' }}
                title="Xem hoặc thay đổi ảnh đại diện"
              >
                <img src={editData.avatar} alt="Profile" style={{ display: "block" }} />
              </button>

              {showAvatarMenu && (
                <div
                  className="avatar-menu"
                  style={{
                    position: "absolute",
                    top: "110%",
                    left: 0,
                    background: "#fff",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    borderRadius: 8,
                    padding: "8px",
                    zIndex: 40,
                    minWidth: 160,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowAvatarModal(true);
                      setShowAvatarMenu(false);
                    }}
                    className="btn-link"
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Xem ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAvatarMenu(false);
                    }}
                    className="btn-link"
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer" }}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Thay đổi avatar</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                aria-label="Upload avatar"
              />
            </div>

            {showAvatarModal && (
              <div
                role="dialog"
                aria-modal="true"
                className="avatar-modal"
                style={{
                  position: "fixed",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 60,
                }}
                onClick={() => setShowAvatarModal(false)}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: 16,
                    borderRadius: 8,
                    maxWidth: "90%",
                    maxHeight: "90%",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={() => setShowAvatarModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }} aria-label="Đóng">
                      <X />
                    </button>
                  </div>
                  <img src={editData.avatar} alt="Avatar preview" style={{ display: "block", maxWidth: "80vw", maxHeight: "70vh", borderRadius: 8 }} />
                </div>
              </div>
            )}

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
                    Tham gia từ: {editData.createdAt ? new Date(editData.createdAt).toLocaleDateString("vi-VN") : ""}
                  </span>
                </div>
              </div>

              {!isAdmin && (
                <div className="profile-actions">
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="btn-primary">
                      <Edit3 className="h-4 w-4" /> Chỉnh sửa
                    </button>
                  ) : (
                    <>
                      <button onClick={handleSave} disabled={isLoading} className="btn-primary">
                        {isLoading ? <div className="loading-spinner"></div> : <Save className="h-4 w-4" />} Lưu
                      </button>
                      <button onClick={() => setIsEditing(false)} className="btn-secondary">
                        <X className="h-4 w-4" /> Hủy
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="profile-content">
            <div style={{ display: "flex", gap: 20, alignItems: "stretch", width: "100%", padding: '0 12px', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 320 }}>
                <div ref={leftCardRef} className="profile-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header">
                    <User className="card-icon" />
                    <h3>Thông tin quản trị viên</h3>
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
                    <label className="form-label">Email</label>
                    <div className="form-input" style={{ background: "#f8f9fa" }}>
                      {editData.email}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số điện thoại</label>
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

                  <div style={{ marginTop: 'auto' }} className="profile-actions">
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="btn-primary">
                        <Edit3 className="h-4 w-4" /> Chỉnh sửa
                      </button>
                    ) : (
                      <>
                        <button onClick={handleSave} disabled={isLoading} className="btn-primary">
                          {isLoading ? <div className="loading-spinner"></div> : <Save className="h-4 w-4" />} Lưu
                        </button>
                        <button onClick={() => setIsEditing(false)} className="btn-secondary">
                          <X className="h-4 w-4" /> Hủy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ flex: 2.2, minWidth: 360 }}>
                <div className="profile-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-header">
                    <Shield className="card-icon" />
                    <h3>Bảo mật</h3>
                  </div>

                  <div className="password-section" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label className="form-label">Đổi mật khẩu</label>
                    <div className="password-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <input
                          type={showPasswords.old ? "text" : "password"}
                          placeholder="Mật khẩu cũ"
                          value={passwords.oldPassword}
                          onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
                          className="form-input"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((p) => ({ ...p, old: !p.old }))}
                          className="eye-toggle"
                          aria-label="Toggle old password visibility"
                          style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}
                        >
                          {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="Mật khẩu mới"
                          value={passwords.newPassword}
                          onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                          className="form-input"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                          className="eye-toggle"
                          aria-label="Toggle new password visibility"
                          style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <button onClick={handleChangePassword} className="btn-primary" style={{ marginTop: "1rem" }}>
                        Đổi mật khẩu
                      </button>
                    </div>

                    {passwordMsg && (
                      <div className={passwordMsg.toLowerCase().includes("success") ? "success-message" : "error-message"}>
                        {passwordMsg}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                  <Mail className="h-4 w-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                  Email
                </label>
                <input type="email" value={editData.email} disabled className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Phone className="h-4 w-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input type="tel" name="phone" value={editData.phone} onChange={handleInputChange} className="form-input" placeholder="Nhập số điện thoại" />
                ) : (
                  <div className="form-input" style={{ background: "#f8f9fa" }}>{editData.phone}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin className="h-4 w-4" style={{ display: "inline", marginRight: "0.5rem" }} />
                  Địa chỉ
                </label>
                {isEditing ? (
                  <div className="form-grid">
                    <input type="text" name="address.street" value={editData.address?.street || ""} onChange={handleInputChange} placeholder="Đường" className="form-input" />
                    <input type="text" name="address.city" value={editData.address?.city || ""} onChange={handleInputChange} placeholder="Thành phố" className="form-input" />
                    <input type="text" name="address.state" value={editData.address?.state || ""} onChange={handleInputChange} placeholder="Tỉnh/Thành" className="form-input" />
                    <input type="text" name="address.postalCode" value={editData.address?.postalCode || ""} onChange={handleInputChange} placeholder="Mã bưu chính" className="form-input" />
                  </div>
                ) : (
                  <div className="form-input" style={{ background: "#f8f9fa" }}>{renderAddress(editData.address)}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {!isAdmin && (
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
          </div>
        )}

        {!isAdmin && (
          <div className="profile-card" style={{ marginTop: "2rem" }}>
            <div className="card-header">
              <Shield className="card-icon" />
              <h3>Bảo mật</h3>
            </div>

            <div className="password-section">
              <label className="form-label">Đổi mật khẩu</label>
              <div className="password-grid" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <input
                    type={showPasswords.old ? "text" : "password"}
                    placeholder="Mật khẩu cũ"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, oldPassword: e.target.value }))}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, old: !p.old }))} className="eye-toggle" aria-label="Toggle old password visibility" style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}>
                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <input type={showPasswords.new ? "text" : "password"} placeholder="Mật khẩu mới" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} className="form-input" style={{ flex: 1 }} />
                  <button type="button" onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))} className="eye-toggle" aria-label="Toggle new password visibility" style={{ background: 'transparent', border: 'none', padding: 6, cursor: 'pointer' }}>
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button onClick={handleChangePassword} className="btn-primary" style={{ marginTop: "1rem" }}>
                Đổi mật khẩu
              </button>

              {passwordMsg && (
                <div className={passwordMsg.toLowerCase().includes("success") ? "success-message" : "error-message"}>
                  {passwordMsg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProfileUI;
