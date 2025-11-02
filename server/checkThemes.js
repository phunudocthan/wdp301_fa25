const mongoose = require("mongoose");
const Theme = require("./models/Theme");
require("dotenv").config();

async function checkThemes() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/wdp301_fa25";

    console.log(
      "🔗 Connecting to:",
      mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
    );
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const themes = await Theme.find({});
    console.log("\n📊 Total themes:", themes.length);
    console.log("─".repeat(80));

    if (themes.length === 0) {
      console.log("⚠️  No themes found in database!");
    } else {
      themes.forEach((theme, index) => {
        console.log(`\n${index + 1}. ${theme.name}`);
        console.log(`   ID: ${theme._id}`);
        console.log(`   isActive: ${theme.isActive ? "✅ TRUE" : "❌ FALSE"}`);
        console.log(
          `   isPublished: ${theme.isPublished ? "✅ TRUE" : "❌ FALSE"}`
        );
        console.log(
          `   Banner: ${theme.banner ? "✅ Has banner" : "❌ No banner"}`
        );
      });

      console.log("\n" + "─".repeat(80));
      const activeThemes = themes.filter((t) => t.isActive === true);
      console.log(`\n✅ Active themes: ${activeThemes.length}`);
      const publishedThemes = themes.filter((t) => t.isPublished === true);
      console.log(`📤 Published themes: ${publishedThemes.length}`);
    }

    await mongoose.connection.close();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkThemes();
