const mongoose = require("mongoose");
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // 🟢 Tình trạng đơn hàng
    status: {
      type: String,
      enum: [
        "pending",    // Mới tạo
        "confirmed",  // Đã xác nhận
        "shipped",    // Đang giao
        "delivered",  // Đã giao
        "canceled",   // Hủy
        "refunded",   // Hoàn tiền
      ],
      default: "pending",
    },

    shippingAddress: {
      type: Schema.Types.Mixed,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "VNPay"],
      required: true,
    },

    // 🧾 Trạng thái thanh toán
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    // 🏦 Dữ liệu thanh toán từ VNPay
    paymentInfo: {
      vnp_TransactionNo: String,   // Mã giao dịch VNPay
      vnp_ResponseCode: String,    // Mã phản hồi
      vnp_BankCode: String,
      vnp_BankTranNo: String,
      vnp_PayDate: String,
    },

    paidAt: {
      type: Date, // Lưu thời gian thanh toán thành công
    },

    voucherId: {
      type: Schema.Types.ObjectId,
      ref: "Voucher",
    },
  },
  {
    timestamps: true,
  }
);

// 🧩 Index phục vụ truy vấn nhanh
OrderSchema.index({ status: 1 });
OrderSchema.index({ userId: 1, createdAt: -1 });

// 🧾 Tự động sinh mã đơn hàng ORD-YYYYMMDD-0001
OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const lastOrder = await this.constructor
      .findOne({
        orderNumber: new RegExp(`^ORD-${dateStr}-`),
      })
      .sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2], 10);
      sequence = lastSequence + 1;
    }

    this.orderNumber = `ORD-${dateStr}-${sequence
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", OrderSchema);
