const mongoose = require("mongoose");

const { Schema } = mongoose;

const LegoSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    themeId: {
      type: Schema.Types.ObjectId,
      ref: "Theme",
      required: true,
    },
    ageRangeId: {
      type: Schema.Types.ObjectId,
      ref: "AgeRange",
      required: true,
    },
    difficultyId: {
      type: Schema.Types.ObjectId,
      ref: "Difficulty",
      required: true,
    },
    pieces: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

LegoSchema.index({ name: "text" });
LegoSchema.index({ themeId: 1 });
LegoSchema.index({ price: 1 });
LegoSchema.index({ categories: 1 });

module.exports = mongoose.model("Lego", LegoSchema);
