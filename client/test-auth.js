// Test authentication
console.log("🧪 Testing authentication...");

// Kiểm tra token
const token = localStorage.getItem("token");
if (!token) {
  console.log("❌ No token found! Please login first.");
  window.location.href = "/login";
} else {
  console.log("✅ Token found:", token.substring(0, 50) + "...");

  // Decode token để xem thông tin
  try {
    const parts = token.split(".");
    const payload = JSON.parse(atob(parts[1]));
    console.log("👤 User info:", {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      expires: new Date(payload.exp * 1000),
    });

    // Kiểm tra token có hết hạn không
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.log("❌ Token expired! Please login again.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else {
      console.log("✅ Token is valid");

      // Test API call
      fetch("/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          console.log("📡 API Response status:", response.status);
          if (response.status === 401) {
            console.log("❌ API returned 401 - Authentication failed");
          } else {
            console.log("✅ API call successful");
          }
          return response.json();
        })
        .then((data) => console.log("📄 API Response data:", data))
        .catch((error) => console.log("❌ API Error:", error));
    }
  } catch (e) {
    console.log("❌ Invalid token format:", e);
    localStorage.removeItem("token");
  }
}
