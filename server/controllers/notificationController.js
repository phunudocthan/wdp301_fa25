// Lấy tất cả notification mà admin đã gửi (không phải notification nhận)
exports.adminListSentNotifications = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });
    const showDeleted = req.query.showDeleted === 'true';
  const filter = { createdBy: req.user.id };
    if (!showDeleted) filter.deleted = { $ne: true };
    const notifications = await Notification.find(filter)
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

    const { message, title, category = "system", type, link, image, meta, userId, confirmBroadcast } =
      req.body || {};

    if (!message?.trim()) return res.status(400).json({ msg: "Message is required" });
    if (!title?.trim()) return res.status(400).json({ msg: "Title is required" });

    const allowedCategories = ["promotion", "order", "product", "system", "engagement"];
    const allowedTypes = ["order", "system", "promotion", "product", "engagement"];

    const normalizedCategory = allowedCategories.includes(category) ? category : "system";
    const normalizedType = allowedTypes.includes(type) ? type : normalizedCategory;

    const Notification = require("../models/Notification");

    // require explicit confirmation when admin is sending to all users
    if (!userId && !confirmBroadcast) {
      return res.status(400).json({ msg: "confirmBroadcast is required when sending to all users" });
    }

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
    // emit update to affected user(s)
    const io = req.app.get("io");
    const formatted = formatNotification(notification);
    if (io && formatted) {
      if (formatted.userId) {
        io.to(formatted.userId.toString()).emit("notification:updated", formatted);
      } else {
        // broadcast to non-admin users
        const User = require("../models/User");
        const users = await User.find({ role: { $ne: "admin" } }, "_id");
        users.forEach((u) => io.to(u._id.toString()).emit("notification:updated", formatted));
      }
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
    // soft-delete instead of hard delete
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, createdBy: req.user.id },
      { deleted: true, deletedAt: new Date(), deletedBy: req.user.id },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ msg: "Notification not found or not owned by admin" });
    }

    const io = req.app.get("io");
    const formatted = formatNotification(notification);
    if (io && formatted) {
      if (formatted.userId) {
        io.to(formatted.userId.toString()).emit("notification:deleted", { _id: formatted._id });
      } else {
        const User = require("../models/User");
        const users = await User.find({ role: { $ne: "admin" } }, "_id");
        users.forEach((u) => io.to(u._id.toString()).emit("notification:deleted", { _id: formatted._id }));
      }
    }

    res.json({ msg: "Notification soft-deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin restore previously soft-deleted notification
exports.adminRestoreNotification = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ msg: "Forbidden" });

    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, createdBy: req.user.id, deleted: true },
      { deleted: false, deletedAt: null, deletedBy: null },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ msg: "Notification not found or not owned by admin, or not deleted" });
    }

    const io = req.app.get("io");
    const formatted = formatNotification(notification);
    if (io && formatted) {
      if (formatted.userId) {
        io.to(formatted.userId.toString()).emit("notification:restored", formatted);
      } else {
        const User = require("../models/User");
        const users = await User.find({ role: { $ne: "admin" } }, "_id");
        users.forEach((u) => io.to(u._id.toString()).emit("notification:restored", formatted));
      }
    }

    res.json({ notification: formatNotification(notification) });
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
    // return only non-deleted notifications
    const notifications = await Notification.find({ deleted: { $ne: true } })
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
    const notification = await Notification.findOne({ _id: notificationId, deleted: { $ne: true } });
    if (!notification) {
      return res.status(404).json({ msg: "Notification not found" });
    }
    res.json({ notification: formatNotification(notification) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
