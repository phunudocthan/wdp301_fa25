const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

const envResult = dotenv.config({ path: path.resolve(__dirname, ".env") });
if (envResult.error) {
  dotenv.config();
}

if (!process.env.MONGODB_URI) {
  console.error(
    "❌ Missing MONGODB_URI. Please check server/.env or add the variable before running the seed script."
  );
  process.exit(1);
}

const shouldReset =
  process.argv.includes("--reset") || process.env.SEED_RESET === "true";

const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Theme = require("./models/Theme");
const AgeRange = require("./models/AgeRange");
const Difficulty = require("./models/Difficulty");
const Category = require("./models/Category");
const Lego = require("./models/Lego");
const Order = require("./models/Order");
const Review = require("./models/Review");
const Gallery = require("./models/Gallery");
const Voucher = require("./models/Voucher");
const Cart = require("./models/Cart");
const ActivityLog = require("./models/ActivityLog");
const Notification = require("./models/Notification");
const Banner = require("./models/Banner");
const Wishlist = require("./models/Wishlist");
const RecentlyViewed = require("./models/RecentlyViewed");
const Setting = require("./models/Setting");
const ChatLog = require("./models/ChatLog");

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "lego_ecommerce",
    });

    if (!shouldReset) {
      const existingUser = await mongoose.connection.db
        .collection("users")
        .countDocuments();
      if (existingUser > 0) {
        console.log(
          "⚠️  Database already contains data. Pass --reset or set SEED_RESET=true to refresh with sample fixtures."
        );
        await mongoose.disconnect();
        return;
      }
    }

    if (shouldReset) {
      console.log("Resetting database...");
      await mongoose.connection.db.dropDatabase();
    }

    const hashedPassword = await bcrypt.hash('123456', 12);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@lego.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+84901234567',
        address: {
          street: '123 Nguyen Trai Street',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '700000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      },
      {
        name: 'John Seller',
        email: 'seller@lego.com',
        password: hashedPassword,
        role: 'seller',
        phone: '+84907654321',
        address: {
          street: '456 Le Loi Boulevard',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '700000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      },
      {
        name: 'Jane Customer',
        email: 'customer@lego.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+84912345678',
        address: {
          street: '789 Dong Khoi Street',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '700000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      },
      {
        name: 'Ethan Builder',
        email: 'ethan.builder@lego.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+84951231234',
        address: {
          street: '12 Tran Hung Dao',
          city: 'Da Nang',
          state: 'Da Nang',
          postalCode: '550000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      },
      {
        name: 'Mai Nguyen',
        email: 'mai.nguyen@lego.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+8488991122',
        address: {
          street: '90 Ly Thuong Kiet',
          city: 'Hanoi',
          state: 'Hanoi',
          postalCode: '100000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      },
      {
        name: 'Bao Tran',
        email: 'bao.tran@lego.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+84773344556',
        address: {
          street: '233 Vo Van Kiet',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '700000',
          country: 'Vietnam'
        },
        status: 'locked',
        isVerified: false,
        failedLoginAttempts: 2,
        lockUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        name: 'Support Agent',
        email: 'support@lego.com',
        password: hashedPassword,
        role: 'seller',
        phone: '+84771234567',
        address: {
          street: '45 Nguyen Hue',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          postalCode: '700000',
          country: 'Vietnam'
        },
        status: 'active',
        isVerified: true,
        failedLoginAttempts: 0
      }
    ]);

    const [admin, seller, customer] = users;

    const categoriesData = [
      {
        name: "New Releases",
        slug: "new-releases",
        description: "The newest LEGO sets just arrived.",
        order: 1,
      },
      {
        name: "Offers",
        slug: "offers",
        description: "Special deals and discounted LEGO sets.",
        order: 2,
      },
      {
        name: "Adults Welcome (18+)",
        slug: "adults-welcome",
        description: "Advanced builds designed specifically for adults.",
        order: 3,
      },
      {
        name: "Themes",
        slug: "themes",
        description: "Browse LEGO sets by theme.",
        order: 10,
      },
      {
        name: "Technic",
        slug: "technic",
        parentSlug: "themes",
        description: "Complex models with realistic functions.",
        order: 11,
      },
      {
        name: "Technic Vehicles",
        slug: "technic-vehicles",
        parentSlug: "technic",
        description: "Technic builds focused on vehicles.",
        order: 12,
      },
      {
        name: "Technic Supercars",
        slug: "technic-supercars",
        parentSlug: "technic-vehicles",
        description: "Flagship Technic supercar models.",
        order: 13,
      },
      {
        name: "Motor Sports",
        slug: "motor-sports",
        parentSlug: "technic-vehicles",
        description: "Racing-inspired Technic sets.",
        order: 14,
      },
      {
        name: "Star Wars",
        slug: "star-wars",
        parentSlug: "themes",
        description: "Iconic Star Wars ships and locations.",
        order: 20,
      },
      {
        name: "Star Wars Starships",
        slug: "star-wars-starships",
        parentSlug: "star-wars",
        description: "Star Wars starships for collectors.",
        order: 21,
      },
      {
        name: "Star Wars Locations",
        slug: "star-wars-locations",
        parentSlug: "star-wars",
        description: "Famous locations from Star Wars universe.",
        order: 22,
      },
      {
        name: "City",
        slug: "city",
        parentSlug: "themes",
        description: "Build your own LEGO city.",
        order: 30,
      },
      {
        name: "City Buildings",
        slug: "city-buildings",
        parentSlug: "city",
        description: "City buildings and services.",
        order: 31,
      },
      {
        name: "City Aircraft",
        slug: "city-aircraft",
        parentSlug: "city",
        description: "LEGO aircraft and airport sets.",
        order: 32,
      },
      {
        name: "City Wildlife",
        slug: "city-wildlife",
        parentSlug: "city",
        description: "Wildlife rescue and exploration sets.",
        order: 33,
      },
      {
        name: "Collections",
        slug: "collections",
        order: 40,
        description: "Curated LEGO collections.",
      },
      {
        name: "Ultimate Collector Series",
        slug: "ultimate-collector",
        parentSlug: "collections",
        description: "Ultimate Collector Series for serious fans.",
        order: 41,
      },
    ];

    const categoriesMap = {};
    for (const category of categoriesData) {
      const slug = category.slug || slugify(category.name);
      const parent =
        category.parentSlug && categoriesMap[category.parentSlug]
          ? categoriesMap[category.parentSlug]
          : null;

      if (category.parentSlug && !parent) {
        throw new Error(
          `Parent category "${category.parentSlug}" must be defined before "${slug}".`
        );
      }

      const doc = await Category.findOneAndUpdate(
        { slug },
        {
          name: category.name,
          description: category.description ?? "",
          image: category.image ?? null,
          order: category.order ?? 0,
          parentId: parent ? parent._id : null,
          createdBy: admin._id,
          isActive: category.isActive ?? true,
          slug,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      categoriesMap[slug] = doc;
    }

    const themes = await Theme.insertMany([
      { name: 'Star Wars', description: 'A galaxy far, far away...' },
      { name: 'City', description: 'Build your own metropolis' },
      { name: 'Technic', description: 'Advanced engineering builds' }
    ]);

    const ageRanges = await AgeRange.insertMany([
      { rangeLabel: '4-7', minAge: 4, maxAge: 7 },
      { rangeLabel: '6-12', minAge: 6, maxAge: 12 },
      { rangeLabel: '12+', minAge: 12, maxAge: 99 }
    ]);

    const difficulties = await Difficulty.insertMany([
      { label: 'Beginner', level: 1 },
      { label: 'Intermediate', level: 3 },
      { label: 'Expert', level: 5 }
    ]);

    const themeMap = Object.fromEntries(
      themes.map((theme) => [theme.name, theme])
    );
    const ageRangeMap = Object.fromEntries(
      ageRanges.map((range) => [range.rangeLabel, range])
    );
    const difficultyMap = Object.fromEntries(
      difficulties.map((diff) => [diff.label, diff])
    );

    const catId = (slug) => {
      const doc = categoriesMap[slug];
      if (!doc) {
        throw new Error(
          `Category with slug "${slug}" not found while seeding products.`
        );
      }
      return doc._id;
    };

    const legoPayload = [
      {
        name: "Millennium Falcon",
        themeId: themeMap["Star Wars"]._id,
        ageRangeId: ageRangeMap["12+"]._id,
        difficultyId: difficultyMap["Expert"]._id,
        pieces: 7541,
        price: 799.99,
        stock: 5,
        status: "active",
        images: ["https://example.com/millennium-falcon.jpg"],
        createdBy: seller._id,
        categories: [
          catId("star-wars"),
          catId("star-wars-starships"),
          catId("ultimate-collector"),
          catId("adults-welcome"),
        ],
      },
      {
        name: "Downtown Fire Station",
        themeId: themeMap["City"]._id,
        ageRangeId: ageRangeMap["6-12"]._id,
        difficultyId: difficultyMap["Intermediate"]._id,
        pieces: 908,
        price: 99.99,
        stock: 25,
        status: "active",
        images: ["https://example.com/fire-station.jpg"],
        createdBy: seller._id,
        categories: [catId("city"), catId("city-buildings")],
      },
      {
        name: "Technic Bugatti Chiron",
        themeId: themeMap["Technic"]._id,
        ageRangeId: ageRangeMap["12+"]._id,
        difficultyId: difficultyMap["Intermediate"]._id,
        pieces: 3599,
        price: 349.99,
        stock: 10,
        status: "pending",
        images: ["https://example.com/bugatti-chiron.jpg"],
        createdBy: seller._id,
        categories: [
          catId("technic"),
          catId("technic-supercars"),
          catId("adults-welcome"),
        ],
      },
      {
        name: "Razor Crest Transport",
        themeId: themeMap["Star Wars"]._id,
        ageRangeId: ageRangeMap["12+"]._id,
        difficultyId: difficultyMap["Intermediate"]._id,
        pieces: 1023,
        price: 139.99,
        stock: 18,
        status: "active",
        images: ["https://example.com/razor-crest.jpg"],
        createdBy: seller._id,
        categories: [catId("star-wars"), catId("star-wars-starships")],
      },
      {
        name: "Mos Eisley Cantina",
        themeId: themeMap["Star Wars"]._id,
        ageRangeId: ageRangeMap["12+"]._id,
        difficultyId: difficultyMap["Expert"]._id,
        pieces: 3187,
        price: 349.99,
        stock: 12,
        status: "active",
        images: ["https://example.com/mos-eisley.jpg"],
        createdBy: seller._id,
        categories: [
          catId("star-wars"),
          catId("star-wars-locations"),
          catId("adults-welcome"),
        ],
      },
      {
        name: "City Wildlife Rescue Camp",
        themeId: themeMap["City"]._id,
        ageRangeId: ageRangeMap["6-12"]._id,
        difficultyId: difficultyMap["Intermediate"]._id,
        pieces: 503,
        price: 119.99,
        stock: 30,
        status: "active",
        images: ["https://example.com/wildlife-camp.jpg"],
        createdBy: seller._id,
        categories: [catId("city"), catId("city-wildlife")],
      },
      {
        name: "Technic Ferrari Daytona SP3",
        themeId: themeMap["Technic"]._id,
        ageRangeId: ageRangeMap["12+"]._id,
        difficultyId: difficultyMap["Expert"]._id,
        pieces: 3778,
        price: 399.99,
        stock: 9,
        status: "active",
        images: ["https://example.com/ferrari-daytona.jpg"],
        createdBy: seller._id,
        categories: [
          catId("technic"),
          catId("technic-supercars"),
          catId("adults-welcome"),
        ],
      },
      {
        name: "Technic Monster Jam Megalodon",
        themeId: themeMap["Technic"]._id,
        ageRangeId: ageRangeMap["6-12"]._id,
        difficultyId: difficultyMap["Beginner"]._id,
        pieces: 260,
        price: 24.99,
        stock: 60,
        status: "active",
        images: ["https://example.com/monster-jam.jpg"],
        createdBy: seller._id,
        categories: [catId("technic"), catId("motor-sports")],
      },
      {
        name: "City Passenger Airplane",
        themeId: themeMap["City"]._id,
        ageRangeId: ageRangeMap["6-12"]._id,
        difficultyId: difficultyMap["Beginner"]._id,
        pieces: 669,
        price: 119.99,
        stock: 22,
        status: "active",
        images: ["https://example.com/passenger-plane.jpg"],
        createdBy: seller._id,
        categories: [catId("city"), catId("city-aircraft")],
      },
    ];

    const legos = await Lego.insertMany(legoPayload);

    const legoByName = (name) => {
      const doc = legos.find((item) => item.name === name);
      if (!doc) {
        throw new Error(`Seed lego "${name}" not found`);
      }
      return doc;
    };

    const millenniumFalcon = legoByName("Millennium Falcon");
    const fireStation = legoByName("Downtown Fire Station");
    const bugatti = legoByName("Technic Bugatti Chiron");
    const razorCrest = legoByName("Razor Crest Transport");
    const mosEisley = legoByName("Mos Eisley Cantina");
    const wildlifeCamp = legoByName("City Wildlife Rescue Camp");
    const ferrari = legoByName("Technic Ferrari Daytona SP3");
    const monsterJam = legoByName("Technic Monster Jam Megalodon");
    const passengerPlane = legoByName("City Passenger Airplane");

    const cartItems = [
      {
        legoId: fireStation._id,
        quantity: 2,
        price: fireStation.price,
      },
      {
        legoId: monsterJam._id,
        quantity: 1,
        price: monsterJam.price,
      },
    ];

    await Cart.create({
      userId: customer._id,
      items: cartItems
    });

    const vouchers = await Voucher.insertMany([
      {
        code: 'WELCOME10',
        discountPercent: 10,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
        status: 'active'
      },
      {
        code: 'SUMMER15',
        discountPercent: 15,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 50,
        status: 'active'
      }
    ]);

    const order = await Order.create({
      userId: customer._id,
      items: [
        {
          legoId: millenniumFalcon._id,
          quantity: 1,
          price: millenniumFalcon.price,
        },
      ],
      total: millenniumFalcon.price,
      status: 'confirmed',
      shippingAddress: {
        fullName: 'Jane Customer',
        phone: '+84912345678',
        street: '123 LEGO Street',
        ward: 'Ben Thanh Ward',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        note: 'Liên hệ trước khi giao.',
      },
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
      voucherId: vouchers[0]._id
    });

    const shippingAddressTemplate = {
      fullName: 'Sample Customer',
      phone: '+84900000000',
      street: '456 Sample Avenue',
      ward: 'Ward 7',
      district: 'District 3',
      city: 'Ho Chi Minh City',
      note: 'Giao giờ hành chính.',
    };

    const orderStatusConfigs = [
      { status: 'pending', paymentStatus: 'unpaid', count: 4, dayOffset: 1 },
      { status: 'confirmed', paymentStatus: 'paid', count: 4, dayOffset: 4 },
      { status: 'shipped', paymentStatus: 'paid', count: 4, dayOffset: 9 },
      { status: 'delivered', paymentStatus: 'paid', count: 5, dayOffset: 20 },
      { status: 'canceled', paymentStatus: 'failed', count: 3, dayOffset: 45 },
      { status: 'refunded', paymentStatus: 'refunded', count: 2, dayOffset: 75 }
    ];

    const extraOrders = [];
    orderStatusConfigs.forEach((config, configIndex) => {
      for (let i = 0; i < config.count; i += 1) {
        const lego = legos[(configIndex + i) % legos.length];
        const quantity = (i % 3) + 1;
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() - (config.dayOffset + i * 3));
        const total = Number((lego.price * quantity).toFixed(2));

        extraOrders.push({
          orderNumber: `ORD-SEED-${config.status.toUpperCase()}-${configIndex + 1}-${i + 1}`,
          userId: customer._id,
          items: [
            {
              legoId: lego._id,
              quantity,
              price: lego.price
            }
          ],
          total,
          status: config.status,
          paymentStatus: config.paymentStatus,
          paymentMethod: i % 2 === 0 ? 'COD' : 'VNPay',
          shippingAddress: shippingAddressTemplate,
          createdAt: baseDate,
          updatedAt: baseDate
        });
      }
    });

    if (extraOrders.length > 0) {
      await Order.insertMany(extraOrders);
    }

    const reviews = await Review.insertMany([
      {
        legoId: millenniumFalcon._id,
        userId: customer._id,
        rating: 5,
        comment: "Incredible build quality and attention to detail.",
        status: "visible",
      },
      {
        legoId: fireStation._id,
        userId: admin._id,
        rating: 4,
        comment: "Great set for younger builders.",
        status: "visible",
      },
    ]);

    await Gallery.insertMany([
      {
        userId: seller._id,
        legoId: millenniumFalcon._id,
        imageUrl: "https://example.com/gallery-falcon.jpg",
        caption: "Ultimate collector series display",
        likes: [customer._id],
        status: "visible",
      },
    ]);

    await Notification.insertMany([
      {
        userId: customer._id,
        category: 'order',
        title: 'Order confirmed',
        message: `Order ${order.orderNumber} confirmed`,
        link: `/orders/${order._id.toString()}`,
        type: 'order',
        status: 'unread',
        meta: {
          orderId: order._id,
          orderNumber: order.orderNumber,
        },
      },
      {
        userId: seller._id,
        category: 'product',
        title: 'Product review required',
        message: 'New product pending approval',
        type: 'system',
        status: 'read',
        meta: {
          productId: bugatti._id,
          productName: bugatti.name,
        },
      },
    ]);

    await Banner.insertMany([
      {
        title: 'New Arrivals',
        imageUrl: 'https://example.com/banner-new-arrivals.jpg',
        link: '/collections/new',
        status: 'active'
      },
      {
        title: 'Star Wars Sale',
        imageUrl: 'https://example.com/banner-star-wars.jpg',
        link: '/collections/star-wars',
        status: 'inactive'
      }
    ]);

    await Wishlist.create({
      userId: customer._id,
      legoIds: [millenniumFalcon._id, bugatti._id],
    });

    const recentlyViewedSeed = [
      { lego: passengerPlane, views: 5, hoursAgo: 1 },
      { lego: bugatti, views: 4, hoursAgo: 3 },
      { lego: razorCrest, views: 3, hoursAgo: 6 },
      { lego: fireStation, views: 2, hoursAgo: 12 },
      { lego: millenniumFalcon, views: 1, hoursAgo: 24 },
    ];

    await RecentlyViewed.create({
      userId: customer._id,
      items: recentlyViewedSeed.map((entry, index) => ({
        legoId: entry.lego._id,
        views: entry.views,
        lastViewed: new Date(
          Date.now() - (entry.hoursAgo ?? index * 4) * 60 * 60 * 1000
        ),
      })),
    });

    await Setting.insertMany([
      { key: 'siteName', value: 'LEGO Marketplace', updatedAt: new Date() },
      { key: 'supportEmail', value: 'support@lego.com', updatedAt: new Date() }
    ]);

    await ChatLog.create({
      userId: customer._id,
      title: new Date().toLocaleString('vi-VN', { hour12: false }),
      messages: [
        { sender: 'user', text: 'Hi, I need help with my order.', timestamp: new Date() },
        { sender: 'support', text: 'Sure, what can we assist you with?', timestamp: new Date() }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await ActivityLog.create({
      userId: customer._id,
      action: 'Order created',
      ip: '192.168.1.10',
      device: 'Chrome on Windows'
    });

    await Promise.all([
      User.createIndexes(),
      Theme.createIndexes(),
      AgeRange.createIndexes(),
      Difficulty.createIndexes(),
      Lego.createIndexes(),
      Order.createIndexes(),
      Review.createIndexes(),
      Gallery.createIndexes(),
      Voucher.createIndexes(),
      Cart.createIndexes(),
      ActivityLog.createIndexes(),
      Notification.createIndexes(),
      Banner.createIndexes(),
      Wishlist.createIndexes(),
      RecentlyViewed.createIndexes(),
      Setting.createIndexes(),
      ChatLog.createIndexes()
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

