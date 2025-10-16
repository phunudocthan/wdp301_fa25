/**
 * It is not death that a man should fear, but he should fear never beginning to live. — Marcus Aurelius
 * Không phải cái chết là điều con người nên sợ, mà là sợ không bao giờ bắt đầu sống.
 */

/**
 * NON-DESTRUCTIVE seed script specifically for LEGO Categories.
 * This script ONLY adds categories without removing existing data.
 * 
 * Usage:
 *    cd server
 *    node scripts/seedCategories.js
 * 
 * The script uses the standard server/.env configuration.
 */

const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const Category = require("../models/Category");
const User = require("../models/User");

const logStep = (message) => console.log(`→ ${message}`);
const logSuccess = (message) => console.log(`✓ ${message}`);
const logError = (message) => console.error(`✗ ${message}`);

async function seedCategories() {
  try {
    // Connect to the database
    logStep("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "lego_ecommerce",
    });
    logSuccess(`Connected to MongoDB (${mongoose.connection.db.databaseName})`);

    // Find admin user to use as creator
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("Admin user not found in database. Run seedDatabase.js first.");
    }

    // Category data based on the LEGO navigation image
    const categories = [
      {
        name: "New",
        description: "The latest LEGO sets and products",
        image: "/uploads/categories/new.jpg",
        order: 1,
        createdBy: admin._id,
      },
      {
        name: "Exclusives",
        description: "Special and limited edition LEGO sets",
        image: "/uploads/categories/exclusives.jpg",
        order: 2,
        createdBy: admin._id,
      },
      {
        name: "Offers",
        description: "Special deals and discounted LEGO sets",
        image: "/uploads/categories/offers.jpg",
        order: 3,
        createdBy: admin._id,
      },
      {
        name: "All Sets",
        description: "Browse all available LEGO sets",
        image: "/uploads/categories/all-sets.jpg",
        order: 4,
        createdBy: admin._id,
      },
      {
        name: "18+",
        description: "LEGO sets designed for adults",
        image: "/uploads/categories/18plus.jpg",
        order: 5,
        createdBy: admin._id,
      },
      {
        name: "Custom Minifigures",
        description: "Design and create your own LEGO minifigures",
        image: "/uploads/categories/custom-minifigures.jpg",
        order: 6,
        createdBy: admin._id,
      },
      {
        name: "Gaming",
        description: "Video game themed LEGO sets",
        image: "/uploads/categories/gaming.jpg",
        order: 7,
        createdBy: admin._id,
      },
      {
        name: "LEGO Insiders",
        description: "Exclusive content for LEGO Insider members",
        image: "/uploads/categories/lego-insiders.jpg",
        order: 8,
        createdBy: admin._id,
      }
    ];

    logStep(`Adding ${categories.length} LEGO categories...`);

    // Track new and existing categories
    let newCount = 0;
    let existingCount = 0;

    // Use upsert by slug to avoid duplicates
    for (const category of categories) {
      // Generate slug from name for upsert matching
      const slug = category.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim("-");

      const result = await Category.findOneAndUpdate(
        { slug },
        { ...category, slug },
        { upsert: true, new: true }
      );

      if (result.isNew) {
        newCount++;
      } else {
        existingCount++;
      }
    }

    logSuccess(`Categories seeded successfully!`);
    console.log(`- ${newCount} new categories added`);
    console.log(`- ${existingCount} existing categories updated`);
    console.log(`- ${categories.length} total categories processed`);
    
    return { success: true };
  } catch (error) {
    logError(`Error seeding categories: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB");
    }
  }
}

// Run the seed function if script is executed directly
if (require.main === module) {
  seedCategories()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Unhandled error:", error);
      process.exit(1);
    });
}

module.exports = { seedCategories };