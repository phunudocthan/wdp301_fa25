const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // nếu gửi cho tất cả user, có thể để null
    },
    category: {
      type: String,
      enum: ["promotion", "order", "product", "system", "engagement"],
      required: true,
      default: "system",
      description:
        "Chủ đề: khuyến mãi, đơn hàng, sản phẩm mới, hệ thống, tương tác khách hàng",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    meta: {
      type: Object,
      default: {},
    },
    type: {
      type: String,
      enum: ["order", "system", "promotion", "product", "engagement"],
      required: true,
      default: "system",
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    // soft-delete fields
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: false }
);

NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
