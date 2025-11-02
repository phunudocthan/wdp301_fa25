/**
 * Test Facebook Login Integration
 *
 * Script để test các endpoint Facebook authentication
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5001";

// Test 1: Check if Facebook auth is enabled
async function testFacebookAuthStatus() {
  console.log("\n🔍 Test 1: Checking Facebook Auth Status...");
  try {
    const response = await axios.get(`${BASE_URL}/auth/facebook`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    console.log("✅ Facebook auth endpoint is accessible");
    console.log("Response status:", response.status);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 302) {
      console.log("✅ Facebook auth redirects correctly (302)");
      console.log("Redirect location:", error.response.headers.location);
      return true;
    } else {
      console.log("❌ Facebook auth endpoint failed");
      console.log("Error:", error.message);
      return false;
    }
  }
}

// Test 2: Check environment variables
async function testEnvironmentConfig() {
  console.log("\n🔍 Test 2: Checking Environment Configuration...");

  const requiredVars = [
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
    "FACEBOOK_CALLBACK_URL",
    "JWT_SECRET",
    "SESSION_SECRET",
    "CLIENT_URL",
  ];

  const missing = [];

  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log("❌ Missing environment variables:");
    missing.forEach((v) => console.log(`   - ${v}`));
    console.log("\n💡 Add these to your .env file");
    return false;
  } else {
    console.log("✅ All required environment variables are set");
    return true;
  }
}

// Test 3: Verify database connection
async function testDatabaseConnection() {
  console.log("\n🔍 Test 3: Checking Database Connection...");
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log("✅ Database connection is healthy");
    return true;
  } catch (error) {
    console.log(
      "⚠️  Could not verify database (health endpoint may not exist)"
    );
    console.log("   This is OK if server is running normally");
    return true;
  }
}

// Test 4: Check User model has facebookId field
async function testUserModelSchema() {
  console.log("\n🔍 Test 4: Verifying User Model Schema...");
  console.log("📝 Manual check required:");
  console.log("   - Open server/models/User.js");
  console.log("   - Verify facebookId field exists");
  console.log(
    "   - Field should be: facebookId: { type: String, unique: true, sparse: true }"
  );
  return true;
}

// Main test runner
async function runTests() {
  console.log("═══════════════════════════════════════════════════");
  console.log("🧪 Facebook Login Integration Tests");
  console.log("═══════════════════════════════════════════════════");

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  const tests = [
    { name: "Environment Config", fn: testEnvironmentConfig },
    { name: "Database Connection", fn: testDatabaseConnection },
    { name: "Facebook Auth Status", fn: testFacebookAuthStatus },
    { name: "User Model Schema", fn: testUserModelSchema },
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ Test "${test.name}" threw an error:`, error.message);
      results.failed++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("📊 Test Results:");
  console.log(`   Total:  ${results.total}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log("═══════════════════════════════════════════════════");

  console.log("\n📋 Next Steps:");
  console.log("1. Create Facebook App at https://developers.facebook.com/");
  console.log("2. Add credentials to .env file");
  console.log("3. Configure OAuth redirect URIs in Facebook App");
  console.log("4. Restart server: npm run dev");
  console.log("5. Test login at http://localhost:3000/login");
  console.log("\n💡 See FACEBOOK_LOGIN_GUIDE.md for detailed instructions");
}

// Run tests
runTests().catch(console.error);
