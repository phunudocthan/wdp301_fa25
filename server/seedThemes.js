const mongoose = require("mongoose");
const Theme = require("./models/Theme");
const User = require("./models/User");
require("dotenv").config();

async function seedThemes() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/wdp301_fa25";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Tìm admin user để làm createdBy
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("❌ No admin user found. Please create an admin user first.");
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.username}`);

    // Xóa themes cũ (nếu có)
    await Theme.deleteMany({});
    console.log("🗑️  Cleared existing themes");

    // Tạo themes mẫu
    const sampleThemes = [
      {
        name: "Star Wars",
        description:
          "Journey to a galaxy far, far away with iconic Star Wars sets featuring legendary characters and epic battles.",
        banner: "/uploads/themes/banners/star-wars.jpg",
        layout: "modern",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Harry Potter",
        description:
          "Experience the magic of Hogwarts with enchanting Harry Potter sets that bring the wizarding world to life.",
        banner: "/uploads/themes/banners/harry-potter.jpg",
        layout: "classic",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Marvel Super Heroes",
        description:
          "Assemble your favorite Marvel heroes and villains with action-packed sets from the Marvel Universe.",
        banner: "/uploads/themes/banners/marvel.jpg",
        layout: "creative",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "City",
        description:
          "Build and explore a bustling LEGO City with vehicles, buildings, and everyday adventures.",
        banner: "/uploads/themes/banners/city.jpg",
        layout: "modern",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Ninjago",
        description:
          "Master the art of Spinjitzu with thrilling Ninjago sets featuring ninja warriors and epic battles.",
        banner: "/uploads/themes/banners/ninjago.jpg",
        layout: "minimal",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Friends",
        description:
          "Join the fun in Heartlake City with LEGO Friends sets celebrating friendship and adventure.",
        banner: "/uploads/themes/banners/friends.jpg",
        layout: "classic",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Technic",
        description:
          "Build advanced models with realistic functions using LEGO Technic engineering sets.",
        banner: "/uploads/themes/banners/technic.jpg",
        layout: "modern",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
      {
        name: "Creator",
        description:
          "Unleash your creativity with versatile Creator sets that can be built in multiple ways.",
        banner: "/uploads/themes/banners/creator.jpg",
        layout: "creative",
        isActive: true,
        isPublished: true,
        createdBy: adminUser._id,
      },
    ];

    // Insert themes
    const createdThemes = await Theme.insertMany(sampleThemes);
    console.log(`\n✅ Created ${createdThemes.length} themes:`);
    createdThemes.forEach((theme, index) => {
      console.log(
        `   ${index + 1}. ${theme.name} (ID: ${theme._id}) - Active: ${
          theme.isActive
        }`
      );
    });

    await mongoose.connection.close();
    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedThemes();
