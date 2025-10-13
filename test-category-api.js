// Test script for Category API
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function testCategoryAPI() {
  try {
    console.log("🧪 Testing Category API...\n");

    // Test 1: Get categories (should work without auth for public endpoints)
    console.log("1. Testing GET /categories");
    try {
      const response = await axios.get(`${BASE_URL}/categories`);
      console.log("✅ GET /categories - Success");
      console.log(`   Status: ${response.status}`);
      console.log(
        `   Data structure: ${JSON.stringify(
          Object.keys(response.data),
          null,
          2
        )}`
      );
    } catch (error) {
      console.log("❌ GET /categories - Failed");
      console.log(
        `   Error: ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }

    // Test 2: Get category stats
    console.log("\n2. Testing GET /categories/stats");
    try {
      const response = await axios.get(`${BASE_URL}/categories/stats`);
      console.log("✅ GET /categories/stats - Success");
      console.log(`   Status: ${response.status}`);
      console.log(`   Stats: ${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      console.log("❌ GET /categories/stats - Failed");
      console.log(
        `   Error: ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }

    // Test 3: Get category tree
    console.log("\n3. Testing GET /categories/tree");
    try {
      const response = await axios.get(`${BASE_URL}/categories/tree`);
      console.log("✅ GET /categories/tree - Success");
      console.log(`   Status: ${response.status}`);
      console.log(
        `   Tree structure: ${JSON.stringify(
          Object.keys(response.data),
          null,
          2
        )}`
      );
    } catch (error) {
      console.log("❌ GET /categories/tree - Failed");
      console.log(
        `   Error: ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }

    console.log("\n🎉 Category API test completed!");
    console.log("\nNote: POST, PUT, DELETE operations require authentication.");
    console.log(
      "Please test those through the frontend after logging in as admin."
    );
  } catch (error) {
    console.error("💥 Unexpected error:", error.message);
  }
}

// Run the test
testCategoryAPI();
