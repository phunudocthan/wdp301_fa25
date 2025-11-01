// Script to create an employee test user
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function createEmployeeUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email: "employee@test.com" });
    if (existingEmployee) {
      console.log("⚠️ Employee user already exists");
      console.log("Email:", existingEmployee.email);
      console.log("Role:", existingEmployee.role);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("employee123", 10);

    // Create employee user
    const employee = await User.create({
      name: "Employee Test",
      username: "employeetest",
      email: "employee@test.com",
      password: hashedPassword,
      role: "employee",
      isActive: true,
    });

    console.log("✅ Employee user created successfully!");
    console.log("Email: employee@test.com");
    console.log("Password: employee123");
    console.log("Role:", employee.role);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating employee user:", error);
    process.exit(1);
  }
}

createEmployeeUser();
