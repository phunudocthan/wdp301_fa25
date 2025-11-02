// models/Order.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    // 🧾 Mã đơn hàng hiển thị (ORD-YYYYMMDD-0001)
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
    },

    // 👤 Người đặt hàng
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📦 Danh sách sản phẩm trong đơn
    items: [
      {
        legoId: {
          type: Schema.Types.ObjectId,
          ref: "Lego",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        _id: false, // Không cần ObjectId riêng cho từng item
      },
    ],

    // 💰 Tổng tiền
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🚚 Trạng thái đơn hàng
    status: {
      type: String,
      enum: [
        "pending",    // Mới tạo
        "confirmed",  // Đã xác nhận
        "shipped",    // Đang giao
        "delivered",  // Đã giao
        "canceled",   // Đã hủy
        "refunded",   // Hoàn tiền
      ],
      default: "pending",
    },

    // 🏠 Địa chỉ giao hàng
    shippingAddress: {
      fullName: { type: String, trim: true },
      phone: { type: String, trim: true },
      street: { type: String, trim: true },
      ward: { type: String, trim: true },
      district: { type: String, trim: true },
      city: { type: String, trim: true },
      note: { type: String, trim: true },
      _id: false,
    },

    // 💳 Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPay"],
      required: true,
    },

    // 💰 Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    // 🏦 Dữ liệu thanh toán trả về từ VNPay
    paymentInfo: {
      vnp_TxnRef: String,         // Mã tham chiếu giao dịch
      vnp_TransactionNo: String,  // Mã giao dịch VNPay
      vnp_ResponseCode: String,   // Mã phản hồi (00 = success)
      vnp_BankCode: String,       // Mã ngân hàng
      vnp_BankTranNo: String,     // Mã giao dịch ngân hàng
      vnp_PayDate: String,        // Thời gian thanh toán (yyyyMMddHHmmss)
      _id: false,
    },

    // 🕓 Thời gian thanh toán thành công
    paidAt: {
      type: Date,
    },

    // 🎟️ Voucher áp dụng (nếu có)
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: "Voucher",
    },

    // 🔢 Mã tham chiếu VNPay để đối soát
    vnp_TxnRef: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt & updatedAt
  }
);

//
// 🔍 Index phục vụ truy vấn nhanh
//
OrderSchema.index({ status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

//
// 🧾 Middleware tự động sinh orderNumber: ORD-YYYYMMDD-0001
//
OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const lastOrder = await this.constructor
      .findOne({ orderNumber: new RegExp(`^ORD-${dateStr}-`) })
      .sort({ orderNumber: -1 })
      .lean();

    let sequence = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split("-");
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) sequence = lastSeq + 1;
    }

    this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
