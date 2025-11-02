const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

const envResult = dotenv.config({ path: path.resolve(__dirname, ".env") });
if (envResult.error) {
  dotenv.config();
}

if (!process.env.MONGODB_URI) {
  console.error(
    "❌ Missing MONGODB_URI. Please check server/.env before running the catalog seed script."
  );
  process.exit(1);
}

const User = require("./models/User");
const Category = require("./models/Category");
const Theme = require("./models/Theme");
const AgeRange = require("./models/AgeRange");
const Difficulty = require("./models/Difficulty");
const Lego = require("./models/Lego");

const slugify = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getCategoryCache = () => {
  const cache = new Map();

  return {
    async get(slug) {
      if (!slug) return null;
      if (cache.has(slug)) {
        return cache.get(slug);
      }
      const existing = await Category.findOne({ slug });
      if (existing) {
        cache.set(slug, existing);
      }
      return existing;
    },
    set(slug, doc) {
      cache.set(slug, doc);
      return doc;
    },
  };
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.DB_NAME || "lego_ecommerce",
  });

  console.log("✅ Connected to MongoDB");

  const adminUser = await User.findOne({ role: "admin" }).sort({
    createdAt: 1,
  });
  if (!adminUser) {
    throw new Error("No admin user found. Please ensure at least one admin exists.");
  }

  const sellerUser =
    (await User.findOne({ role: "seller" }).sort({ createdAt: 1 })) || adminUser;

  const categoryCache = getCategoryCache();

  const categorySeeds = [
    {
      name: "Icons",
      slug: "icons",
      description: "Display-ready builds designed for adult LEGO fans.",
      order: 50,
      parentSlug: "themes",
    },
    {
      name: "Botanical Collection",
      slug: "icons-botanical",
      parentSlug: "icons",
      description: "Nature-inspired builds to showcase at home or in the office.",
      order: 51,
    },
    {
      name: "Vintage Vehicles",
      slug: "icons-vehicles",
      parentSlug: "icons",
      description: "Collector models of classic cars, bikes, and vans.",
      order: 52,
    },
    {
      name: "Ideas",
      slug: "ideas",
      parentSlug: "themes",
      description: "Fan-designed sets brought to life by LEGO designers.",
      order: 60,
    },
    {
      name: "Ideas Fan Favorites",
      slug: "ideas-fan-favorites",
      parentSlug: "ideas",
      description: "Community-loved builds that made it into production.",
      order: 61,
    },
    {
      name: "Architecture",
      slug: "architecture",
      parentSlug: "themes",
      description: "Celebrate architectural icons from around the world.",
      order: 70,
    },
    {
      name: "Architecture Skyline",
      slug: "architecture-skyline",
      parentSlug: "architecture",
      description: "Skyline collections featuring iconic landmarks.",
      order: 71,
    },
    {
      name: "Harry Potter",
      slug: "harry-potter",
      parentSlug: "themes",
      description: "Magical builds from the Wizarding World.",
      order: 80,
    },
    {
      name: "Hogwarts Collection",
      slug: "hogwarts-collection",
      parentSlug: "harry-potter",
      description: "Detailed recreations of Hogwarts castle and classrooms.",
      order: 81,
    },
    {
      name: "Wizarding World Locations",
      slug: "wizarding-world-locations",
      parentSlug: "harry-potter",
      description: "Build beloved locations from the Harry Potter saga.",
      order: 82,
    },
    {
      name: "Marvel",
      slug: "marvel",
      parentSlug: "themes",
      description: "Super hero action from across the Marvel universe.",
      order: 90,
    },
    {
      name: "Marvel Avengers",
      slug: "marvel-avengers",
      parentSlug: "marvel",
      description: "Assemble the Avengers with these action-packed sets.",
      order: 91,
    },
    {
      name: "Marvel Spider-Man",
      slug: "marvel-spider-man",
      parentSlug: "marvel",
      description: "Friendly neighborhood adventures with Spider-Man.",
      order: 92,
    },
    {
      name: "Friends",
      slug: "friends",
      parentSlug: "themes",
      description: "Colorful stories from Heartlake City.",
      order: 100,
    },
    {
      name: "Heartlake City",
      slug: "heartlake-city",
      parentSlug: "friends",
      description: "Vibrant locations and characters from LEGO Friends.",
      order: 101,
    },
    {
      name: "Seasonal Favorites",
      slug: "seasonal-favorites",
      description: "Limited-edition builds that celebrate the seasons.",
      order: 110,
    },
    {
      name: "Space Exploration",
      slug: "space-exploration",
      parentSlug: "themes",
      description: "NASA missions and original LEGO voyages into space.",
      order: 120,
    },
    {
      name: "Creator 3-in-1",
      slug: "creator-3-in-1",
      parentSlug: "themes",
      description: "Versatile sets that rebuild into multiple models.",
      order: 130,
    },
  ];

  const categoryResults = [];
  for (const category of categorySeeds) {
    const slug = category.slug || slugify(category.name);
    const parentDoc = category.parentSlug
      ? await categoryCache.get(category.parentSlug)
      : null;

    if (category.parentSlug && !parentDoc) {
      throw new Error(
        `Parent category "${category.parentSlug}" not found for "${slug}". Make sure parents are created first.`
      );
    }

    const existingDoc = await categoryCache.get(slug);

    const update = {
      $set: {
        name: category.name,
        description: category.description ?? "",
        image: category.image ?? null,
        order: category.order ?? 0,
        parentId: parentDoc ? parentDoc._id : null,
        isActive: category.isActive ?? true,
        slug,
      },
      $setOnInsert: {
        createdBy: adminUser._id,
      },
    };

    const resultDoc = await Category.findOneAndUpdate({ slug }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    if (!resultDoc) {
      throw new Error(`Failed to upsert category "${slug}".`);
    }

    categoryCache.set(slug, resultDoc);
    categoryResults.push({
      slug,
      inserted: !existingDoc,
    });
  }

  console.log(
    `📁 Categories processed: ${categoryResults.length} (${categoryResults.filter(
      (item) => item.inserted
    ).length} new)`
  );

  const themeSeeds = [
    {
      name: "Icons",
      description: "Challenging builds for display and storytelling.",
    },
    {
      name: "Ideas",
      description: "Fan submissions that became official LEGO sets.",
    },
    {
      name: "Architecture",
      description: "Celebrating iconic buildings and city skylines.",
    },
    {
      name: "Harry Potter",
      description: "Magic-filled builds from the Wizarding World.",
    },
    {
      name: "Marvel",
      description: "Bring Marvel super hero adventures to life.",
    },
    {
      name: "Friends",
      description: "Colorful adventures from Heartlake City.",
    },
    {
      name: "Space Exploration",
      description: "Real-world NASA missions and sci-fi journeys.",
    },
    {
      name: "Creator 3-in-1",
      description: "Multiple build options with every set.",
    },
    {
      name: "Seasonal",
      description: "Festive builds that celebrate the calendar.",
    },
  ];

  const themeMap = {};
  for (const theme of themeSeeds) {
    const result = await Theme.findOneAndUpdate(
      { name: theme.name },
      { $set: { description: theme.description ?? "" } },
      {
        upsert: true,
        new: true,
      }
    );

    themeMap[theme.name] = result;
  }

  const ageRangeSeeds = [
    { rangeLabel: "4-7", minAge: 4, maxAge: 7 },
    { rangeLabel: "6-12", minAge: 6, maxAge: 12 },
    { rangeLabel: "12+", minAge: 12, maxAge: 99 },
  ];

  const ageRangeMap = {};
  for (const seed of ageRangeSeeds) {
    const result = await AgeRange.findOneAndUpdate(
      { rangeLabel: seed.rangeLabel },
      { $set: { minAge: seed.minAge, maxAge: seed.maxAge } },
      {
        upsert: true,
        new: true,
      }
    );

    ageRangeMap[seed.rangeLabel] = result;
  }

  const difficultySeeds = [
    { label: "Beginner", level: 1 },
    { label: "Intermediate", level: 3 },
    { label: "Expert", level: 5 },
  ];

  const difficultyMap = {};
  for (const seed of difficultySeeds) {
    const result = await Difficulty.findOneAndUpdate(
      { label: seed.label },
      { $set: { level: seed.level } },
      {
        upsert: true,
        new: true,
      }
    );

    difficultyMap[seed.label] = result;
  }

  const legoSeeds = [
    {
      name: "Botanical Collection Orchid",
      theme: "Icons",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 608,
      price: 49.99,
      stock: 55,
      status: "active",
      images: ["https://example.com/images/icons-orchid.jpg"],
      categorySlugs: ["icons", "icons-botanical"],
    },
    {
      name: "Botanical Collection Bonsai Tree",
      theme: "Icons",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 878,
      price: 49.99,
      stock: 40,
      status: "active",
      images: ["https://example.com/images/icons-bonsai-tree.jpg"],
      categorySlugs: ["icons", "icons-botanical"],
    },
    {
      name: "Vintage Vespa 125",
      theme: "Icons",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 1106,
      price: 99.99,
      stock: 25,
      status: "active",
      images: ["https://example.com/images/icons-vespa-125.jpg"],
      categorySlugs: ["icons", "icons-vehicles"],
    },
    {
      name: "Back to the Future Time Machine",
      theme: "Icons",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 1872,
      price: 199.99,
      stock: 18,
      status: "active",
      images: ["https://example.com/images/icons-delorean.jpg"],
      categorySlugs: ["icons", "icons-vehicles"],
    },
    {
      name: "Hogwarts Castle and Grounds",
      theme: "Harry Potter",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 2660,
      price: 169.99,
      stock: 20,
      status: "active",
      images: ["https://example.com/images/hp-hogwarts-castle.jpg"],
      categorySlugs: ["harry-potter", "hogwarts-collection"],
    },
    {
      name: "Hogsmeade Village Visit",
      theme: "Harry Potter",
      ageRange: "6-12",
      difficulty: "Intermediate",
      pieces: 851,
      price: 89.99,
      stock: 35,
      status: "active",
      images: ["https://example.com/images/hp-hogsmeade-village.jpg"],
      categorySlugs: ["harry-potter", "wizarding-world-locations"],
    },
    {
      name: "Diagon Alley Iconic Shops",
      theme: "Harry Potter",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 5544,
      price: 449.99,
      stock: 10,
      status: "active",
      images: ["https://example.com/images/hp-diagon-alley.jpg"],
      categorySlugs: ["harry-potter", "wizarding-world-locations"],
    },
    {
      name: "Marvel Avengers Tower",
      theme: "Marvel",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 5201,
      price: 499.99,
      stock: 8,
      status: "active",
      images: ["https://example.com/images/marvel-avengers-tower.jpg"],
      categorySlugs: ["marvel", "marvel-avengers"],
    },
    {
      name: "Spider-Man Daily Bugle",
      theme: "Marvel",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 3772,
      price: 349.99,
      stock: 15,
      status: "active",
      images: ["https://example.com/images/marvel-daily-bugle.jpg"],
      categorySlugs: ["marvel", "marvel-spider-man"],
    },
    {
      name: "NASA Apollo Saturn V",
      theme: "Space Exploration",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 1969,
      price: 129.99,
      stock: 22,
      status: "active",
      images: ["https://example.com/images/space-saturn-v.jpg"],
      categorySlugs: ["space-exploration", "ideas-fan-favorites"],
    },
    {
      name: "Discovery Space Shuttle",
      theme: "Space Exploration",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 2354,
      price: 199.99,
      stock: 26,
      status: "active",
      images: ["https://example.com/images/space-discovery-shuttle.jpg"],
      categorySlugs: ["space-exploration"],
    },
    {
      name: "Great Pyramid of Giza",
      theme: "Architecture",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 1476,
      price: 139.99,
      stock: 28,
      status: "active",
      images: ["https://example.com/images/architecture-pyramid-giza.jpg"],
      categorySlugs: ["architecture"],
    },
    {
      name: "Singapore Skyline",
      theme: "Architecture",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 827,
      price: 59.99,
      stock: 40,
      status: "active",
      images: ["https://example.com/images/architecture-singapore-skyline.jpg"],
      categorySlugs: ["architecture", "architecture-skyline"],
    },
    {
      name: "Friends Friendship Treehouse",
      theme: "Friends",
      ageRange: "6-12",
      difficulty: "Intermediate",
      pieces: 1114,
      price: 79.99,
      stock: 32,
      status: "active",
      images: ["https://example.com/images/friends-friendship-treehouse.jpg"],
      categorySlugs: ["friends", "heartlake-city"],
    },
    {
      name: "Heartlake Downtown Diner",
      theme: "Friends",
      ageRange: "6-12",
      difficulty: "Beginner",
      pieces: 624,
      price: 59.99,
      stock: 38,
      status: "active",
      images: ["https://example.com/images/friends-downtown-diner.jpg"],
      categorySlugs: ["friends", "heartlake-city"],
    },
    {
      name: "Medieval Blacksmith",
      theme: "Ideas",
      ageRange: "12+",
      difficulty: "Expert",
      pieces: 2164,
      price: 179.99,
      stock: 17,
      status: "active",
      images: ["https://example.com/images/ideas-medieval-blacksmith.jpg"],
      categorySlugs: ["ideas", "ideas-fan-favorites"],
    },
    {
      name: "A-Frame Cabin",
      theme: "Ideas",
      ageRange: "12+",
      difficulty: "Intermediate",
      pieces: 2082,
      price: 199.99,
      stock: 19,
      status: "active",
      images: ["https://example.com/images/ideas-a-frame-cabin.jpg"],
      categorySlugs: ["ideas", "ideas-fan-favorites"],
    },
    {
      name: "Cozy House 3-in-1",
      theme: "Creator 3-in-1",
      ageRange: "6-12",
      difficulty: "Beginner",
      pieces: 808,
      price: 59.99,
      stock: 45,
      status: "active",
      images: ["https://example.com/images/creator-cozy-house.jpg"],
      categorySlugs: ["creator-3-in-1"],
    },
    {
      name: "Viking Ship and the Midgard Serpent",
      theme: "Creator 3-in-1",
      ageRange: "6-12",
      difficulty: "Intermediate",
      pieces: 1192,
      price: 119.99,
      stock: 24,
      status: "active",
      images: ["https://example.com/images/creator-viking-ship.jpg"],
      categorySlugs: ["creator-3-in-1"],
    },
    {
      name: "Seasonal Nutcracker",
      theme: "Seasonal",
      ageRange: "6-12",
      difficulty: "Beginner",
      pieces: 343,
      price: 39.99,
      stock: 50,
      status: "active",
      images: ["https://example.com/images/seasonal-nutcracker.jpg"],
      categorySlugs: ["seasonal-favorites"],
    },
  ];

  const categoryMap = {};
  const categorySlugsNeeded = new Set([
    ...categorySeeds.map((category) => category.slug || slugify(category.name)),
    ...legoSeeds.flatMap((product) => product.categorySlugs),
  ]);

  for (const slug of categorySlugsNeeded) {
    const doc = await categoryCache.get(slug);
    if (!doc) {
      throw new Error(
        `Missing category with slug "${slug}" while preparing product payloads.`
      );
    }
    categoryMap[slug] = doc;
  }

  const getCategoryId = (slug) => {
    const doc = categoryMap[slug];
    if (!doc) {
      throw new Error(
        `Category "${slug}" was not cached correctly.`
      );
    }
    return doc._id;
  };

  const legoResults = [];
  for (const product of legoSeeds) {
    const theme = themeMap[product.theme];
    if (!theme) {
      throw new Error(`Theme "${product.theme}" not found for product "${product.name}".`);
    }

    const ageRange = ageRangeMap[product.ageRange];
    if (!ageRange) {
      throw new Error(
        `Age range "${product.ageRange}" not found for product "${product.name}".`
      );
    }

    const difficulty = difficultyMap[product.difficulty];
    if (!difficulty) {
      throw new Error(
        `Difficulty "${product.difficulty}" not found for product "${product.name}".`
      );
    }

    const categoryIds = product.categorySlugs.map(getCategoryId);

    const update = {
      $set: {
        themeId: theme._id,
        ageRangeId: ageRange._id,
        difficultyId: difficulty._id,
        pieces: product.pieces,
        price: product.price,
        stock: product.stock,
        status: product.status,
        images: product.images,
        categories: categoryIds,
      },
      $setOnInsert: {
        createdBy: sellerUser._id,
      },
    };

    const existingDoc = await Lego.findOne({ name: product.name }).select("_id");

    const resultDoc = await Lego.findOneAndUpdate(
      { name: product.name },
      update,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!resultDoc) {
      throw new Error(`Failed to upsert product "${product.name}".`);
    }

    legoResults.push({
      name: resultDoc.name,
      inserted: !existingDoc,
    });
  }

  console.log(
    `🧱 Products processed: ${legoResults.length} (${legoResults.filter((item) => item.inserted).length
    } new)`
  );

  await mongoose.disconnect();
  console.log("🚀 Catalog seeding complete.");
};

run()
  .catch(async (error) => {
    console.error("❌ Failed to seed catalog additions:", error);
    await mongoose.disconnect();
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
