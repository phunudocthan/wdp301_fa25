const express = require("express");
const Theme = require("../models/Theme");
const AgeRange = require("../models/AgeRange");
const Difficulty = require("../models/Difficulty");

const router = express.Router();

/**
 * @route   GET /api/helpers/themes
 * @desc    Lấy danh sách tất cả themes
 * @access  Public
 */
router.get("/themes", async (req, res) => {
  try {
    const themes = await Theme.find().sort({ name: 1 });
    res.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    console.error("Get themes error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách themes",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/helpers/age-ranges
 * @desc    Lấy danh sách tất cả age ranges
 * @access  Public
 */
router.get("/age-ranges", async (req, res) => {
  try {
    const ageRanges = await AgeRange.find().sort({ minAge: 1 });
    res.json({
      success: true,
      data: ageRanges,
    });
  } catch (error) {
    console.error("Get age ranges error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách độ tuổi",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/helpers/difficulties
 * @desc    Lấy danh sách tất cả difficulties
 * @access  Public
 */
router.get("/difficulties", async (req, res) => {
  try {
    const difficulties = await Difficulty.find().sort({ level: 1 });
    res.json({
      success: true,
      data: difficulties,
    });
  } catch (error) {
    console.error("Get difficulties error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách độ khó",
      error: error.message,
    });
  }
});

module.exports = router;
