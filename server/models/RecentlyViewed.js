const mongoose = require("mongoose");

const RecentlyViewedItemSchema = new mongoose.Schema(
  {
    legoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lego",
      required: true,
    },
    views: {
      type: Number,
      default: 1,
    },
    lastViewed: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const RecentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [RecentlyViewedItemSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

RecentlyViewedSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

RecentlyViewedSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

RecentlyViewedSchema.index({ updatedAt: -1 });
RecentlyViewedSchema.index({ userId: 1 });

module.exports = mongoose.model("RecentlyViewed", RecentlyViewedSchema);
