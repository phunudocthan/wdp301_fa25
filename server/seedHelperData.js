const mongoose = require("mongoose");
const Theme = require("./models/Theme");
const AgeRange = require("./models/AgeRange");
const Difficulty = require("./models/Difficulty");
require("dotenv").config();

// Sample data
const themesData = [
  {
    name: "City",
    description: "Thành phố hiện đại với các tòa nhà và phương tiện",
  },
  {
    name: "Star Wars",
    description: "Vũ trụ Star Wars với các nhân vật và phi thuyền",
  },
  {
    name: "Creator",
    description: "Bộ sưu tập sáng tạo với nhiều mô hình đa dạng",
  },
  { name: "Technic", description: "Mô hình kỹ thuật cao với cơ chế phức tạp" },
  {
    name: "Friends",
    description: "Thế giới của những người bạn với nhiều hoạt động",
  },
  {
    name: "Ninjago",
    description: "Thế giới ninja với các trận chiến hành động",
  },
  { name: "Architecture", description: "Kiến trúc nổi tiếng thế giới" },
  { name: "Harry Potter", description: "Thế giới phù thủy Harry Potter" },
];

const ageRangesData = [
  { rangeLabel: "4-6 tuổi", minAge: 4, maxAge: 6 },
  { rangeLabel: "6-8 tuổi", minAge: 6, maxAge: 8 },
  { rangeLabel: "8-12 tuổi", minAge: 8, maxAge: 12 },
  { rangeLabel: "12-16 tuổi", minAge: 12, maxAge: 16 },
  { rangeLabel: "16+ tuổi", minAge: 16, maxAge: 99 },
];

const difficultiesData = [
  { label: "Dễ", level: 1 },
  { label: "Trung bình", level: 2 },
  { label: "Khó", level: 3 },
  { label: "Rất khó", level: 4 },
  { label: "Chuyên gia", level: 5 },
];

async function seedHelperData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "lego_ecommerce",
    });
    console.log("Connected to MongoDB");

    // Check and seed Themes
    const themeCount = await Theme.countDocuments();
    if (themeCount === 0) {
      await Theme.insertMany(themesData);
      console.log("✅ Themes seeded successfully");
    } else {
      console.log(`📦 ${themeCount} themes already exist`);
    }

    // Check and seed Age Ranges
    const ageRangeCount = await AgeRange.countDocuments();
    if (ageRangeCount === 0) {
      await AgeRange.insertMany(ageRangesData);
      console.log("✅ Age ranges seeded successfully");
    } else {
      console.log(`📦 ${ageRangeCount} age ranges already exist`);
    }

    // Check and seed Difficulties
    const difficultyCount = await Difficulty.countDocuments();
    if (difficultyCount === 0) {
      await Difficulty.insertMany(difficultiesData);
      console.log("✅ Difficulties seeded successfully");
    } else {
      console.log(`📦 ${difficultyCount} difficulties already exist`);
    }

    console.log("🎉 Helper data seeding completed");

    // Display current data
    const themes = await Theme.find();
    const ageRanges = await AgeRange.find();
    const difficulties = await Difficulty.find();

    console.log("\n📊 Current Data:");
    console.log(
      "Themes:",
      themes.map((t) => t.name)
    );
    console.log(
      "Age Ranges:",
      ageRanges.map((a) => a.rangeLabel)
    );
    console.log(
      "Difficulties:",
      difficulties.map((d) => `${d.label} (${d.level})`)
    );
  } catch (error) {
    console.error("❌ Error seeding helper data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

if (require.main === module) {
  seedHelperData();
}

module.exports = { seedHelperData };
