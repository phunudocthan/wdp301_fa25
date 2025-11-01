const mongoose = require("mongoose");

const ThemeCharacterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Character name is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Character image is required"],
    },
    themeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theme",
      required: [true, "Theme is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ThemeCharacterSchema.index({ themeId: 1, order: 1 });
ThemeCharacterSchema.index({ name: 1 });

module.exports = mongoose.model("ThemeCharacter", ThemeCharacterSchema);
