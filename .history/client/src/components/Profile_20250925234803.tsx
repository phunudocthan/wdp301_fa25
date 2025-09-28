import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Shield, CreditCard as Edit3, Save, X, Camera, Heart, Plus, Trash2
} from 'lucide-react';
import { updateProfile, getProfile, updateAvatar, changePassword } from '../api/user';
import type { User as UserType, UserRole, UserStatus, Address } from '../types/user';

const legoThemes = [
  'LEGO City', 'LEGO Creator', 'LEGO Technic', 'LEGO Friends',
  'LEGO Star Wars', 'LEGO Harry Potter', 'LEGO Architecture',
  'LEGO Ninjago', 'LEGO Duplo', 'LEGO Classic'
];

const roleLabels: Record<UserRole, string> = {
  customer: 'Khách hàng',
  seller: 'Người bán',
  admin: 'Quản trị viên'
};

const statusLabels: Record<UserStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  locked: 'Bị khóa'
};

const statusColors: Record<UserStatus, string> = {
  active: 'text-emerald-600 bg-emerald-50',
  inactive: 'text-amber-600 bg-amber-50',
  locked: 'text-rose-600 bg-rose-50'
};

type LocalUser = Omit<UserType, 'role' | 'status' | 'avatar' | 'email' | 'name' | 'address' | 'favoriteThemes'> & {
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
    name: user?.name || 'Người dùng',
    email: user?.email || 'unknown@example.com',
    avatar: user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
    role: user?.role || 'customer',
    status: user?.status || 'active',
    phone: user?.phone || '',
    address: user?.address || { street: '', city: '', state: '', postalCode: '', country: '' },
    favoriteThemes: user?.favoriteThemes || [],
    _id: user?._id,
    lastLogin: user?.lastLogin,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [newTheme, setNewTheme] = useState('');
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Lấy thông tin profile khi mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getProfile();
        const normalized: LocalUser = {
          name: profile?.name || 'Người dùng',
          email: profile?.email || 'unknown@example.com',
          avatar: profile?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
          role: profile?.role || 'customer',
          status: profile?.status || 'active',
          phone: profile?.phone || '',
          address: profile?.address || { street: '', city: '', state: '', postalCode: '', country: '' },
          favoriteThemes: profile?.favoriteThemes || [],
          _id: profile?._id,
          lastLogin: profile?.lastLogin,
          createdAt: profile?.createdAt,
          updatedAt: profile?.updatedAt,
        };
        setEditData(normalized);
        onUpdateUser(normalized);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Không thể lấy thông tin người dùng';
        setErrorMsg(message);
      }
    }
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // Cập nhật profile
  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const updatedUser = await updateProfile(editData);
      const normalized: LocalUser = {
        name: updatedUser?.name || 'Người dùng',
        email: updatedUser?.email || 'unknown@example.com',
        avatar: updatedUser?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
        role: updatedUser?.role || 'customer',
        status: updatedUser?.status || 'active',
        phone: updatedUser?.phone || '',
        address: updatedUser?.address || { street: '', city: '', state: '', postalCode: '', country: '' },
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
      const message = error instanceof Error ? error.message : 'Cập nhật thất bại';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('avatar', e.target.files[0]);
      setIsLoading(true);
      setErrorMsg('');
      try {
        const updatedUser = await updateAvatar(formData);
        const normalized: LocalUser = {
          name: updatedUser?.name || 'Người dùng',
          email: updatedUser?.email || 'unknown@example.com',
          avatar: updatedUser?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
          role: updatedUser?.role || 'customer',
          status: updatedUser?.status || 'active',
          phone: updatedUser?.phone || '',
          address: updatedUser?.address || { street: '', city: '', state: '', postalCode: '', country: '' },
          favoriteThemes: updatedUser?.favoriteThemes || [],
          _id: updatedUser?._id,
          lastLogin: updatedUser?.lastLogin,
          createdAt: updatedUser?.createdAt,
          updatedAt: updatedUser?.updatedAt,
        };
        setEditData(normalized);
        onUpdateUser(normalized);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Cập nhật avatar thất bại';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async () => {
    setPasswordMsg('');
    try {
      const res = await changePassword(passwords.oldPassword, passwords.newPassword);
      setPasswordMsg(res.msg);
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Đổi mật khẩu thất bại';
      setPasswordMsg(message);
    }
  };

  // Chủ đề yêu thích
  const addFavoriteTheme = () => {
    if (newTheme && !editData.favoriteThemes?.includes(newTheme)) {
      setEditData(prev => ({
        ...prev,
        favoriteThemes: [...(prev.favoriteThemes || []), newTheme]
      }));
      setNewTheme('');
    }
  };

  const removeFavoriteTheme = (themeToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      favoriteThemes: (prev.favoriteThemes || []).filter(theme => theme !== themeToRemove)
    }));
  };

  // Xử lý input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Hiển thị địa chỉ an toàn
  const renderAddress = (address?: UserType['address']) => {
    if (!address) return '';
    return [
      address.street,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pt-20">
      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 text-red-600 bg-red-50 rounded-lg px-4 py-2">
          {errorMsg}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative mb-4 md:mb-0">
              <img
                src={editData.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Camera className="h-4 w-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <div className="md:ml-6 text-center md:text-left text-white">
              <h1 className="text-2xl font-bold mb-1">{editData.name}</h1>
              <p className="text-white/90 mb-2">{editData.email}</p>
              <div className="flex items-center justify-center md:justify-start mb-2">
                <Shield className="h-4 w-4 mr-1" />
                <span className="text-sm text-white/80">
                  {roleLabels[editData.role]}
                </span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[editData.status]}`}>
                  {statusLabels[editData.status]}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="text-sm text-white/80">
                  Tham gia từ: {editData.createdAt ? new Date(editData.createdAt).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
            </div>
            <div className="md:ml-auto mt-4 md:mt-0">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-white transition-colors flex items-center shadow-lg"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center disabled:opacity-50 shadow-lg"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-700 transition-colors flex items-center shadow-lg"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-indigo-600" />
                Thông tin cá nhân
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{editData.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{editData.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Số điện thoại
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-gray-800 py-2">{editData.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Địa chỉ
                </label>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      name="address.street"
                      value={editData.address?.street || ''}
                      onChange={handleInputChange}
                      placeholder="Đường"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      name="address.city"
                      value={editData.address?.city || ''}
                      onChange={handleInputChange}
                      placeholder="Thành phố"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      name="address.state"
                      value={editData.address?.state || ''}
                      onChange={handleInputChange}
                      placeholder="Tỉnh/Thành"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      name="address.postalCode"
                      value={editData.address?.postalCode || ''}
                      onChange={handleInputChange}
                      placeholder="Mã bưu chính"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="text"
                      name="address.country"
                      value={editData.address?.country || ''}
                      onChange={handleInputChange}
                      placeholder="Quốc gia"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all md:col-span-2"
                    />
                  </div>
                ) : (
                  <p className="text-gray-800 py-2">
                    {renderAddress(editData.address)}
                  </p>
                )}
              </div>
            </div>

            {/* Favorite Themes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-rose-500" />
                Chủ đề yêu thích
              </h3>
              {isEditing && (
                <div className="flex space-x-2">
                  <select
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Chọn chủ đề...</option>
                    {legoThemes
                      .filter(theme => !(editData.favoriteThemes || []).includes(theme))
                      .map(theme => (
                        <option key={theme} value={theme}>{theme}</option>
                      ))
                    }
                  </select>
                  <button
                    onClick={addFavoriteTheme}
                    disabled={!newTheme}
                    className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(isEditing ? editData.favoriteThemes : user.favoriteThemes)?.map((theme) => (
                  <div
                    key={theme}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center shadow-sm"
                  >
                    {theme}
                    {isEditing && (
                      <button
                        onClick={() => removeFavoriteTheme(theme)}
                        className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {(!user.favoriteThemes || user.favoriteThemes.length === 0) && !isEditing && (
                <p className="text-gray-500 text-sm italic py-4">
                  Chưa có chủ đề yêu thích nào được thêm
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Đơn hàng đã mua</span>
              <span className="font-semibold text-indigo-600">12</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Sản phẩm yêu thích</span>
              <span className="font-semibold text-rose-600">8</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Điểm tích lũy</span>
              <span className="font-semibold text-amber-600">2,450</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Hoạt động gần đây</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 py-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Mua LEGO City Fire Station</p>
                <p className="text-xs text-gray-500">2 ngày trước</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 py-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Thêm vào yêu thích: Creator Expert</p>
                <p className="text-xs text-gray-500">5 ngày trước</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 py-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm text-gray-800">Đánh giá sản phẩm Technic</p>
                <p className="text-xs text-gray-500">1 tuần trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar and Password Change Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cập nhật avatar và mật khẩu</h3>
        {/* Avatar Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar
          </label>
          <div className="flex items-center">
            <img
              src={editData.avatar}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-2 border-gray-300 object-cover mr-4"
            />
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            )}
          </div>
        </div>
        {/* Password Change */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đổi mật khẩu
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="Mật khẩu cũ"
              value={passwords.oldPassword}
              onChange={e => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={passwords.newPassword}
              onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleChangePassword}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Đổi mật khẩu
          </button>
          {passwordMsg && <div className="mt-2 text-sm text-red-600">{passwordMsg}</div>}
        </div>
      </div>
    </div>
  );
};

export default Profile;