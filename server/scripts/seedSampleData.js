/**
 * Non-destructive sample data seeder intended for local/testing environments.
 * The script upserts documents so it can be executed multiple times safely.
 *
 * Usage:
 *    cd server
 *    node scripts/seedSampleData.js
 *
 * The script uses the standard server/.env configuration (MONGODB_URI + DB_NAME).
 * It will NOT drop the database.
 */

const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const User = require("../models/User");
const Theme = require("../models/Theme");
const AgeRange = require("../models/AgeRange");
const Difficulty = require("../models/Difficulty");
const Lego = require("../models/Lego");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

const logStep = (message) => console.log(`→ ${message}`);
const logSuccess = (message) => console.log(`✓ ${message}`);
const logInfo = (message) => console.log(message);
const logError = (message) => console.error(`✗ ${message}`);

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in server/.env");
  }

  await mongoose.connect(uri, {
    dbName: process.env.DB_NAME || "lego_ecommerce",
  });

  logSuccess(`Connected to MongoDB (${mongoose.connection.db.databaseName})`);
}

async function upsertUser(seed) {
  const hashedPassword = await bcrypt.hash(seed.password, 12);

  const update = {
    name: seed.name,
    role: seed.role,
    phone: seed.phone,
    address: seed.address,
    status: seed.status,
    isVerified: seed.isVerified,
    failedLoginAttempts: seed.failedLoginAttempts || 0,
    lockUntil: seed.lockUntil || null,
  };

  const doc = await User.findOneAndUpdate(
    { email: seed.email.toLowerCase() },
    {
      $set: update,
      $setOnInsert: {
        password: hashedPassword,
        email: seed.email.toLowerCase(),
        createdAt: seed.createdAt || new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return doc;
}

async function upsertSimple(model, matcher, payload) {
  return model
    .findOneAndUpdate(
      matcher,
      {
        $set: payload,
        $setOnInsert: { createdAt: payload.createdAt || new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    .lean();
}

async function upsertOrder(seed) {
  const { orderNumber, createdAt, updatedAt, ...rest } = seed;

  await Order.updateOne(
    { orderNumber },
    {
      $set: {
        ...rest,
      },
      $setOnInsert: {
        orderNumber,
        createdAt,
        updatedAt: updatedAt || createdAt,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function upsertNotification(seed) {
  const matcher = {
    title: seed.title,
    message: seed.message,
    userId: seed.userId || null,
  };

  await Notification.updateOne(
    matcher,
    {
      $set: {
        ...seed,
        createdAt: seed.createdAt || new Date(),
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

async function seedUsers() {
  logStep("Seeding users");

  const seeds = [
    {
      name: "System Admin",
      email: "admin@lego.com",
      password: "123456",
      role: "admin",
      phone: "+84900111222",
      address: {
        street: "123 Nguyen Trai",
        city: "Ho Chi Minh City",
        state: "Ho Chi Minh",
        postalCode: "700000",
        country: "Vietnam",
      },
      status: "active",
      isVerified: true,
    },
    {
      name: "Support Agent",
      email: "support@lego.com",
      password: "123456",
      role: "seller",
      phone: "+84977123456",
      address: {
        street: "45 Nguyen Hue",
        city: "Ho Chi Minh City",
        state: "Ho Chi Minh",
        postalCode: "700000",
        country: "Vietnam",
      },
      status: "active",
      isVerified: true,
    },
    {
      name: "John Seller",
      email: "seller@lego.com",
      password: "123456",
      role: "seller",
      phone: "+84977665544",
      address: {
        street: "456 Le Loi",
        city: "Ho Chi Minh City",
        state: "Ho Chi Minh",
        postalCode: "700000",
        country: "Vietnam",
      },
      status: "active",
      isVerified: true,
    },
    {
      name: "Alice Customer",
      email: "alice.customer@lego.com",
      password: "123456",
      role: "customer",
      phone: "+8488123123",
      address: {
        street: "27 Tran Hung Dao",
        city: "Da Nang",
        state: "Da Nang",
        postalCode: "550000",
        country: "Vietnam",
      },
      status: "active",
      isVerified: true,
    },
    {
      name: "Bao Tran",
      email: "bao.tran@lego.com",
      password: "123456",
      role: "customer",
      phone: "+84773344556",
      address: {
        street: "233 Vo Van Kiet",
        city: "Ho Chi Minh City",
        state: "Ho Chi Minh",
        postalCode: "700000",
        country: "Vietnam",
      },
      status: "locked",
      isVerified: false,
      failedLoginAttempts: 5,
      lockUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    {
      name: "Chris Explorer",
      email: "chris.explorer@lego.com",
      password: "123456",
      role: "customer",
      phone: "+84881112233",
      address: {
        street: "12 Phan Chu Trinh",
        city: "Hanoi",
        state: "Hanoi",
        postalCode: "100000",
        country: "Vietnam",
      },
      status: "inactive",
      isVerified: false,
    },
  ];

  const userMap = {};
  for (const seed of seeds) {
    const doc = await upsertUser(seed);
    userMap[seed.email.toLowerCase()] = doc;
  }

  logSuccess(`Seeded ${Object.keys(userMap).length} users`);
  return userMap;
}

async function seedTaxonomies() {
  logStep("Seeding taxonomy collections (themes, age ranges, difficulty)");

  const themeSeeds = [
    {
      name: "Star Wars",
      description: "Iconic saga builds and starships.",
    },
    {
      name: "City",
      description: "Urban adventures and emergency services.",
    },
    {
      name: "Technic",
      description: "Advanced engineering sets with moving parts.",
    },
    {
      name: "Friends",
      description: "Heartlake City stories and characters.",
    },
  ];

  const ageRangeSeeds = [
    { rangeLabel: "4-7", minAge: 4, maxAge: 7 },
    { rangeLabel: "6-12", minAge: 6, maxAge: 12 },
    { rangeLabel: "12+", minAge: 12, maxAge: 99 },
  ];

  const difficultySeeds = [
    { label: "Beginner", level: 1 },
    { label: "Intermediate", level: 3 },
    { label: "Expert", level: 5 },
  ];

  const themeMap = {};
  for (const seed of themeSeeds) {
    const doc = await upsertSimple(Theme, { name: seed.name }, seed);
    themeMap[seed.name] = doc;
  }

  const ageRangeMap = {};
  for (const seed of ageRangeSeeds) {
    const doc = await upsertSimple(AgeRange, { rangeLabel: seed.rangeLabel }, seed);
    ageRangeMap[seed.rangeLabel] = doc;
  }

  const difficultyMap = {};
  for (const seed of difficultySeeds) {
    const doc = await upsertSimple(Difficulty, { level: seed.level }, seed);
    difficultyMap[seed.label] = doc;
  }

  logSuccess("Seeded taxonomy collections");
  return { themeMap, ageRangeMap, difficultyMap };
}

async function seedLegos({ themeMap, ageRangeMap, difficultyMap, userMap }) {
  logStep("Seeding sample LEGO sets");

  const legoSeeds = [
    {
      name: "Millennium Falcon",
      theme: "Star Wars",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 7541,
      price: 799.99,
      stock: 4,
      status: "active",
      images: ["https://example.com/millennium-falcon.jpg"],
      createdBy: "seller@lego.com",
    },
    {
      name: "Downtown Fire Station",
      theme: "City",
      ageRange: "6-12",
      difficulty: "Intermediate",
      pieces: 908,
      price: 99.99,
      stock: 18,
      status: "active",
      images: ["https://example.com/downtown-fire-station.jpg"],
      createdBy: "support@lego.com",
    },
    {
      name: "Rescue Helicopter",
      theme: "Technic",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 2001,
      price: 189.99,
      stock: 11,
      status: "active",
      images: ["https://example.com/rescue-helicopter.jpg"],
      createdBy: "seller@lego.com",
    },
    {
      name: "Heartlake City Café",
      theme: "Friends",
      ageRange: "6-12",
      difficulty: "Beginner",
      pieces: 312,
      price: 54.99,
      stock: 25,
      status: "active",
      images: ["https://example.com/heartlake-cafe.jpg"],
      createdBy: "support@lego.com",
    },
  ];

  const legoMap = {};

  for (const seed of legoSeeds) {
    const doc = await upsertSimple(
      Lego,
      { name: seed.name },
      {
        name: seed.name,
        themeId: themeMap[seed.theme]._id,
        ageRangeId: ageRangeMap[seed.ageRange]._id,
        difficultyId: difficultyMap[seed.difficulty]._id,
        pieces: seed.pieces,
        price: seed.price,
        stock: seed.stock,
        status: seed.status,
        images: seed.images,
        createdBy: userMap[seed.createdBy]._id,
      }
    );
    legoMap[seed.name] = doc;
  }

  logSuccess(`Seeded ${Object.keys(legoMap).length} LEGO sets`);
  return legoMap;
}

function buildShippingAddress(base = {}) {
  return {
    name: base.name || "Sample Customer",
    phone: base.phone || "+84900000000",
    address: base.address || "456 Sample Avenue",
    city: base.city || "Ho Chi Minh City",
    postalCode: base.postalCode || "700000",
    country: base.country || "Vietnam",
  };
}

async function seedOrders({ userMap, legoMap }) {
  logStep("Seeding sample orders for analytics");

  const customerIds = [
    userMap["alice.customer@lego.com"]._id,
    userMap["bao.tran@lego.com"]._id,
    userMap["chris.explorer@lego.com"]._id,
  ];

  const legoList = Object.values(legoMap);

  const statusTemplates = [
    { status: "pending", paymentStatus: "unpaid", paymentMethod: "COD", count: 4, startOffset: 2 },
    { status: "confirmed", paymentStatus: "paid", paymentMethod: "VNPay", count: 4, startOffset: 6 },
    { status: "shipped", paymentStatus: "paid", paymentMethod: "VNPay", count: 4, startOffset: 12 },
    { status: "delivered", paymentStatus: "paid", paymentMethod: "COD", count: 5, startOffset: 25 },
    { status: "canceled", paymentStatus: "failed", paymentMethod: "VNPay", count: 3, startOffset: 45 },
    { status: "refunded", paymentStatus: "refunded", paymentMethod: "VNPay", count: 2, startOffset: 75 },
  ];

  const orders = [];
  let runningIndex = 1;

  statusTemplates.forEach((template, templateIndex) => {
    for (let i = 0; i < template.count; i += 1) {
      const customerId = customerIds[(templateIndex + i) % customerIds.length];
      const lego = legoList[(templateIndex + i) % legoList.length];
      const quantity = (i % 3) + 1;
      const baseDate = new Date();
      const createdAt = new Date(baseDate.getTime() - (template.startOffset + i * 3) * 24 * 60 * 60 * 1000);
      const orderNumber = `SEED-${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(runningIndex).padStart(4, "0")}`;

      orders.push({
        orderNumber,
        userId: customerId,
        items: [
          {
            legoId: lego._id,
            quantity,
            price: lego.price,
          },
        ],
        total: Number((lego.price * quantity).toFixed(2)),
        status: template.status,
        paymentStatus: template.paymentStatus,
        paymentMethod: template.paymentMethod,
        shippingAddress: buildShippingAddress({
          name: lego.name.includes("Café") ? "Mai Nguyen" : "Sample Customer",
        }),
        createdAt,
      });

      runningIndex += 1;
    }
  });

  for (const order of orders) {
    await upsertOrder(order);
  }

  logSuccess(`Seeded ${orders.length} orders`);
}

async function seedNotifications({ userMap }) {
  logStep("Seeding sample notifications");

  const notifications = [
    {
      title: "Maintenance window",
      message: "The admin dashboard will be under maintenance at 02:00 AM.",
      category: "system",
      type: "system",
      userId: userMap["admin@lego.com"]._id,
      createdBy: userMap["admin@lego.com"]._id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "New order awaiting confirmation",
      message: "You have new pending orders that require attention.",
      category: "order",
      type: "order",
      userId: userMap["seller@lego.com"]._id,
      createdBy: userMap["support@lego.com"]._id,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      title: "Top customer milestone",
      message: "Alice Customer has placed 10 orders. Consider sending a reward.",
      category: "engagement",
      type: "engagement",
      createdBy: userMap["admin@lego.com"]._id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const notification of notifications) {
    await upsertNotification(notification);
  }

  logSuccess(`Seeded ${notifications.length} notifications`);
}

async function runSeeder() {
  try {
    logInfo("Starting non-destructive sample data seeding...");
    await connectDatabase();

    const userMap = await seedUsers();
    const taxonomyMaps = await seedTaxonomies();
    const legoMap = await seedLegos({ ...taxonomyMaps, userMap });
    await seedOrders({ userMap, legoMap });
    await seedNotifications({ userMap });

    logSuccess("Sample data seeding completed 🎉");
  } catch (error) {
    logError(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    logInfo("Disconnected from MongoDB");
  }
}

if (require.main === module) {
  runSeeder();
}

module.exports = runSeeder;
