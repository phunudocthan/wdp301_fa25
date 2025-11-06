require("dotenv").config();
const mongoose = require("mongoose");
const Theme = require("./models/Theme");
const ThemeCharacter = require("./models/ThemeCharacter");

async function checkImagePaths() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected!\n");

    const themes = await Theme.find({}).lean();

    console.log("📊 THEMES:");
    themes.forEach((theme, i) => {
      console.log(`\n${i + 1}. ${theme.name}`);
      console.log(`   Banner path: ${theme.banner || "N/A"}`);
    });

    // Check characters
    const characters = await ThemeCharacter.find({}).lean();

    console.log("\n\n📊 CHARACTERS:");
    characters.forEach((char, i) => {
      console.log(`\n${i + 1}. ${char.name}`);
      console.log(`   Image path: ${char.image || "N/A"}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkImagePaths();
