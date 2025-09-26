const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 1. View profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Update profile (cập nhật các trường hợp lệ)
exports.updateProfile = async (req, res) => {
  try {
    // Chỉ cho phép cập nhật các trường sau
    const { name, phone, address, avatar, status, role } = req.body;

    // Tạo object update chỉ chứa các trường hợp hợp lệ
    const updateFields = {};
    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (avatar) updateFields.avatar = avatar;
    if (address) updateFields.address = address;
    if (status) updateFields.status = status;
    if (role) updateFields.role = role;

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
    }).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Update avatar (chỉ cập nhật trường avatar)
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    const avatarUrl = `${req.protocol}://${req.get(
      'host'
    )}/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Change password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Old password is incorrect' });
    }

    // Không cho phép mật khẩu mới trùng mật khẩu cũ
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res
        .status(400)
        .json({ msg: 'New password must be different from old password' });
    }

    // Regex kiểm tra mật khẩu mạnh
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      });
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
