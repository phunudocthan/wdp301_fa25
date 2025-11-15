const mongoose = require("mongoose");

const ThemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Theme name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    banner: {
      type: String, // URL to banner image
    },
    layout: {
      type: String,
      enum: ["classic", "modern", "minimal", "creative"],
      default: "classic",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    previewUrl: {
      type: String,
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

// Virtual for theme characters
ThemeSchema.virtual("characters", {
  ref: "ThemeCharacter",
  localField: "_id",
  foreignField: "themeId",
});

// Index for faster queries
// `name` already has `unique: true` at the field level which creates an index,
// so avoid declaring the same single-field index again to prevent duplicate index warnings.
ThemeSchema.index({ createdAt: -1 });

// Include virtuals when converting to JSON
ThemeSchema.set("toJSON", { virtuals: true });
ThemeSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Theme", ThemeSchema);
