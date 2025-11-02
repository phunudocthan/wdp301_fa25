// Quick test for Facebook routes
const http = require("http");

console.log("🧪 Testing Facebook OAuth Routes...\n");

// Test 1: Check /auth/facebook endpoint
console.log("Test 1: Checking /auth/facebook");
const options = {
  hostname: "localhost",
  port: 5000,
  path: "/auth/facebook",
  method: "GET",
  headers: {
    "User-Agent": "Node.js Test",
  },
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  if (res.statusCode === 302) {
    console.log("✅ Redirect detected (expected for OAuth)");
    console.log(`Location: ${res.headers.location}`);
  } else if (res.statusCode === 404) {
    console.log(
      "❌ Route not found - checking /api/auth/facebook instead...\n"
    );

    // Test 2: Check /api/auth/facebook endpoint
    const options2 = {
      ...options,
      path: "/api/auth/facebook",
    };

    const req2 = http.request(options2, (res2) => {
      console.log(`Status Code: ${res2.statusCode}`);

      if (res2.statusCode === 302) {
        console.log("✅ Route found at /api/auth/facebook");
        console.log(`Location: ${res2.headers.location}`);
      } else {
        console.log("❌ Route not found at /api/auth/facebook either");
      }
    });

    req2.on("error", (e) => {
      console.error(`❌ Error: ${e.message}`);
      console.log("\n⚠️  Make sure server is running on port 5000");
    });

    req2.end();
  } else {
    console.log(`Unexpected status: ${res.statusCode}`);
  }
});

req.on("error", (e) => {
  console.error(`❌ Error: ${e.message}`);
  console.log("\n⚠️  Make sure server is running on port 5000");
  console.log("💡 Run: cd server && npm start");
});

req.end();
