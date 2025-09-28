const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    }, // Không required vì Google login không cần password
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "Vietnam",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "locked"],
      default: "active",
    },
    lastLogin: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastVerificationEmailSent: {
      type: Date,
      default: null,
    },
    verificationEmailAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1 });

module.exports = mongoose.model("User", UserSchema);
