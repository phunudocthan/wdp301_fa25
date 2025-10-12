// Lấy tất cả notification mà admin đã gửi (không phải notification nhận)
exports.adminListSentNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });
    const notifications = await Notification.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ notifications: notifications.map(formatNotification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Gửi notification cho user (admin là người tạo)
exports.adminCreateNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });

    const { message, title, category = "system", type, link, image, meta, userId } =
      req.body || {};

    if (!message?.trim()) return res.status(400).json({ msg: "Message is required" });
    if (!title?.trim()) return res.status(400).json({ msg: "Title is required" });

    const allowedCategories = ["promotion", "order", "product", "system", "engagement"];
    const allowedTypes = ["order", "system", "promotion", "product", "engagement"];

    const normalizedCategory = allowedCategories.includes(category) ? category : "system";
    const normalizedType = allowedTypes.includes(type) ? type : normalizedCategory;

    const Notification = require("../models/Notification");

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      category: normalizedCategory,
      type: normalizedType,
      link: link || "",
      image: image || "",
      meta: meta || {},
      createdBy: req.user.id,
      userId: userId || null, // nếu null => gửi cho tất cả
    });

    // Gửi realtime nếu có socket
    const io = req.app.get("io");
    const formatted = formatNotification(notification);
    if (io && formatted) {
      if (userId) {
        io.to(userId.toString()).emit("notification:new", formatted);
      } else {
        // Gửi cho tất cả user trừ admin
        const User = require("../models/User");
        const users = await User.find({ role: { $ne: "admin" } }, "_id");
        users.forEach((u) => io.to(u._id.toString()).emit("notification:new", formatted));
      }
    }

    res.status(201).json({ notification: formatted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sửa notification đã gửi (chỉ admin được sửa notification mình đã tạo)
exports.adminUpdateNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });
    const { notificationId } = req.params;
    const { message, title, category, type, link, image, meta } =
      req.body || {};
    const allowedCategories = [
      "promotion",
      "order",
      "product",
      "system",
      "engagement",
    ];
    const allowedTypes = [
      "order",
      "system",
      "promotion",
      "product",
      "engagement",
    ];
    const updateFields = {};
    if (message) updateFields.message = message.trim();
    if (title) updateFields.title = title.trim();
    if (category && allowedCategories.includes(category))
      updateFields.category = category;
    if (type && allowedTypes.includes(type)) updateFields.type = type;
    if (link !== undefined) updateFields.link = link;
    if (image !== undefined) updateFields.image = image;
    if (meta !== undefined) updateFields.meta = meta;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, createdBy: req.user.id },
      updateFields,
      { new: true }
    );
    if (!notification) {
      return res
        .status(404)
        .json({ msg: "Notification not found or not owned by admin" });
    }
    res.json({ notification: formatNotification(notification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa notification đã gửi (chỉ admin được xóa notification mình đã tạo)
exports.adminDeleteNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      createdBy: req.user.id,
    });
    if (!notification) {
      return res
        .status(404)
        .json({ msg: "Notification not found or not owned by admin" });
    }
    res.json({ msg: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const Notification = require("../models/Notification");

const formatNotification = (notification) => {
  if (!notification) return null;
  const obj = notification.toObject
    ? notification.toObject()
    : { ...notification };
  return {
    _id: obj._id?.toString?.() || obj._id,
    userId: obj.userId?.toString?.() || obj.userId,
    title: obj.title,
    message: obj.message,
    category: obj.category,
    type: obj.type,
    link: obj.link,
    image: obj.image,
    meta: obj.meta,
    status: obj.status,
    createdAt: obj.createdAt,
    createdBy: obj.createdBy?.toString?.() || obj.createdBy,
  };
};

exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications: notifications.map(formatNotification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createNotification = async (req, res) => {
  // Không cho phép customer tự tạo notification
  return res
    .status(403)
    .json({ msg: "Forbidden: customers cannot create notifications" });
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId },
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json({ notification: formatNotification(notification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotificationDetail = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({
      _id: notificationId,
    });
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ notification: formatNotification(notification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
