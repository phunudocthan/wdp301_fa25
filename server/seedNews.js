const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });

const News = require('./models/News');
const User = require('./models/User');

async function seedNews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'lego_ecommerce',
    });

    console.log('Connected to MongoDB for news seeding');

    const existing = await News.countDocuments();
    if (existing > 0) {
      console.log(`Found ${existing} existing news documents. Skipping seed to avoid duplicates.`);
      return;
    }

    // Try to pick an admin or any user as author
    const author = await User.findOne({ role: { $in: ['admin', 'employee', 'seller', 'customer'] } });

    const now = new Date();
    const sample = [
      {
        title: 'Grand Opening: New LEGO Collection Arrives',
        excerpt: 'Explore the brand new sets added this season, featuring exclusive models and bundles.',
        content: 'We are thrilled to announce the arrival of our latest LEGO collection featuring limited edition sets, new themes, and exclusive packaging. Visit our store to see them in person or shop online.',
        author: author ? author._id : undefined,
        images: [],
        tags: ['collection', 'launch'],
        isHighlighted: true,
        status: 'published',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3)
      },
      {
        title: 'Tips for Building Large Models',
        excerpt: 'How to plan and manage big LEGO builds without losing your sanity.',
        content: 'Building large LEGO models can be intimidating. Start by sorting pieces, following sub-assemblies, and taking regular breaks. Here are practical tips to keep your project on track.',
        author: author ? author._id : undefined,
        tags: ['tips', 'building'],
        images: [],
        isHighlighted: false,
        status: 'published',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
      },
      {
        title: 'Employee Update: New Shipping Procedures',
        excerpt: 'Important changes to the packing and shipping workflow for all warehouse staff.',
        content: 'Starting next Monday, we will update the packing checklist and inspection steps. Employees must review the new SOP and complete the short training.',
        author: author ? author._id : undefined,
        tags: ['employee', 'operations'],
        images: [],
        isHighlighted: false,
        status: 'published',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)
      },
      {
        title: 'Top 10 Trending LEGO Sets',
        excerpt: 'The community favorites this month — see what others are buying.',
        content: 'From retro classics to the newest releases, these are the top-selling and most-viewed sets this month.',
        author: author ? author._id : undefined,
        tags: ['trending', 'top10'],
        images: [],
        isHighlighted: true,
        status: 'published',
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1)
      },
      {
        title: 'Maintenance Notice: Scheduled Downtime',
        excerpt: 'Planned maintenance window for database upgrades — brief downtime expected.',
        content: 'We will perform scheduled maintenance on our systems at 02:00 AM. The site may be briefly unavailable for up to 15 minutes. We apologize for the inconvenience.',
        author: author ? author._id : undefined,
        tags: ['maintenance', 'notice'],
        images: [],
        isHighlighted: false,
        status: 'published',
        createdAt: now
      }
    ];

    const inserted = await News.insertMany(sample);
    console.log(`Inserted ${inserted.length} news documents.`);
  } catch (err) {
    console.error('Error seeding news:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

if (require.main === module) {
  seedNews();
}

module.exports = seedNews;
