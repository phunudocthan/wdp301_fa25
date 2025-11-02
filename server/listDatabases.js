const mongoose = require("mongoose");
require("dotenv").config();

async function listDatabases() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log("🔗 Connecting to MongoDB Atlas...");

    await mongoose.connect(mongoUri);
    console.log("✅ Connected!");

    // List all databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();

    console.log("\n📊 Available databases:");
    console.log("─".repeat(80));
    databases.forEach((db, index) => {
      console.log(
        `${index + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(
          2
        )} MB)`
      );
    });

    // Check current database
    const currentDb = mongoose.connection.db.databaseName;
    console.log("\n🎯 Current database:", currentDb);

    // List collections in current database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`\n📂 Collections in "${currentDb}":`);
    if (collections.length === 0) {
      console.log("   (empty)");
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    }

    await mongoose.connection.close();
    console.log("\n✅ Disconnected");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

listDatabases();
