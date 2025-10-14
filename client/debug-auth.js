// Debug authentication
console.log("🔍 Checking authentication status...");

const token = localStorage.getItem("token");
console.log("Token exists:", !!token);

if (token) {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("Token payload:", payload);
      console.log("User role:", payload.role);
      console.log("Token expires:", new Date(payload.exp * 1000));
      console.log("Current time:", new Date());
      console.log(
        "Token expired:",
        payload.exp < Math.floor(Date.now() / 1000)
      );
    }
  } catch (e) {
    console.log("Error decoding token:", e);
  }
} else {
  console.log("❌ No token found - user needs to login");
}
