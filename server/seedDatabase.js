const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./models/User');
const Theme = require('./models/Theme');
const AgeRange = require('./models/AgeRange');
const Difficulty = require('./models/Difficulty');
const Lego = require('./models/Lego');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Gallery = require('./models/Gallery');
const Voucher = require('./models/Voucher');
const Cart = require('./models/Cart');
const ActivityLog = require('./models/ActivityLog');

const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'lego_ecommerce'
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Theme.deleteMany({}),
      AgeRange.deleteMany({}),
      Difficulty.deleteMany({}),
      Lego.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Gallery.deleteMany({}),
      Voucher.deleteMany({}),
      Cart.deleteMany({}),
      ActivityLog.deleteMany({})
    ]);

    // 1. Seed Users
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@lego.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+84901234567',
        status: 'active'
      },
      {
        name: 'John Seller',
        email: 'seller@lego.com',
        password: hashedPassword,
        role: 'seller',
        phone: '+84907654321',
        status: 'active'
      },
      {
        name: 'Jane Customer',
        email: 'customer@lego.com',
        password: hashedPassword,
        role: 'customer',
        phone: '+84912345678',
        status: 'active'
      },
      {
        name: 'Test User 1',
        email: 'test1@lego.com',
        password: hashedPassword,
        role: 'customer',
        status: 'active'
      },
      {
        name: 'Test User 2',
        email: 'test2@lego.com',
        password: hashedPassword,
        role: 'customer',
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 2. Seed Themes
    console.log('🎨 Seeding themes...');
    const themes = await Theme.insertMany([
      { name: 'Star Wars', description: 'A galaxy far, far away...' },
      { name: 'City', description: 'Build your own metropolis' },
      { name: 'Technic', description: 'Advanced building for older builders' },
      { name: 'Creator', description: 'Express your creativity' },
      { name: 'Friends', description: 'Friendship and adventure' },
      { name: 'Ninjago', description: 'Masters of Spinjitzu' },
      { name: 'Harry Potter', description: 'The magical world of Hogwarts' },
      { name: 'Architecture', description: 'Famous buildings and landmarks' }
    ]);
    console.log(`✅ Created ${themes.length} themes`);

    // 3. Seed Age Ranges
    console.log('👶 Seeding age ranges...');
    const ageRanges = await AgeRange.insertMany([
      { label: '4-7', minAge: 4, maxAge: 7, description: 'Perfect for young builders' },
      { label: '6-12', minAge: 6, maxAge: 12, description: 'Great for developing builders' },
      { label: '8-14', minAge: 8, maxAge: 14, description: 'For experienced young builders' },
      { label: '10-16', minAge: 10, maxAge: 16, description: 'Advanced building challenges' },
      { label: '12+', minAge: 12, maxAge: 99, description: 'For teens and adults' },
      { label: '16+', minAge: 16, maxAge: 99, description: 'Expert level building' },
      { label: '18+', minAge: 18, maxAge: 99, description: 'Adult collectors series' }
    ]);
    console.log(`✅ Created ${ageRanges.length} age ranges`);

    // 4. Seed Difficulties
    console.log('⚡ Seeding difficulties...');
    const difficulties = await Difficulty.insertMany([
      { label: 'Easy', description: 'Simple builds for beginners' },
      { label: 'Medium', description: 'Moderate complexity' },
      { label: 'Hard', description: 'Challenging builds' },
      { label: 'Expert', description: 'Master builder level' }
    ]);
    console.log(`✅ Created ${difficulties.length} difficulties`);

    // 5. Seed LEGO Products
    console.log('🧱 Seeding LEGO products...');
    const seller = users.find(u => u.role === 'seller');
    const admin = users.find(u => u.role === 'admin');
    
    const legos = await Lego.insertMany([
      {
        name: 'Millennium Falcon',
        slug: 'millennium-falcon',
        description: 'The fastest ship in the galaxy',
        themeId: themes.find(t => t.name === 'Star Wars')._id,
        ageRangeId: ageRanges.find(a => a.label === '16+')._id,
        difficultyId: difficulties.find(d => d.label === 'Expert')._id,
        pieces: 7541,
        price: 799.99,
        stock: 5,
        images: ['https://example.com/falcon1.jpg', 'https://example.com/falcon2.jpg'],
        sellerId: seller._id,
        status: 'active'
      },
      {
        name: 'Fire Station',
        slug: 'fire-station',
        description: 'Emergency services headquarters',
        themeId: themes.find(t => t.name === 'City')._id,
        ageRangeId: ageRanges.find(a => a.label === '6-12')._id,
        difficultyId: difficulties.find(d => d.label === 'Medium')._id,
        pieces: 509,
        price: 89.99,
        stock: 15,
        images: ['https://example.com/firestation1.jpg'],
        sellerId: seller._id,
        status: 'active'
      },
      {
        name: 'Bugatti Chiron',
        slug: 'bugatti-chiron',
        description: 'Legendary supercar in LEGO form',
        themeId: themes.find(t => t.name === 'Technic')._id,
        ageRangeId: ageRanges.find(a => a.label === '16+')._id,
        difficultyId: difficulties.find(d => d.label === 'Expert')._id,
        pieces: 3599,
        price: 349.99,
        stock: 8,
        images: ['https://example.com/bugatti1.jpg', 'https://example.com/bugatti2.jpg'],
        sellerId: admin._id,
        status: 'active'
      },
      {
        name: 'Hogwarts Castle',
        slug: 'hogwarts-castle',
        description: 'The magic castle from Harry Potter',
        themeId: themes.find(t => t.name === 'Harry Potter')._id,
        ageRangeId: ageRanges.find(a => a.label === '16+')._id,
        difficultyId: difficulties.find(d => d.label === 'Expert')._id,
        pieces: 6020,
        price: 469.99,
        stock: 3,
        images: ['https://example.com/hogwarts1.jpg'],
        sellerId: seller._id,
        status: 'active'
      },
      {
        name: 'Creator Car',
        slug: 'creator-car',
        description: '3-in-1 sports car',
        themeId: themes.find(t => t.name === 'Creator')._id,
        ageRangeId: ageRanges.find(a => a.label === '8-14')._id,
        difficultyId: difficulties.find(d => d.label === 'Medium')._id,
        pieces: 285,
        price: 29.99,
        stock: 25,
        images: ['https://example.com/creator1.jpg'],
        sellerId: seller._id,
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${legos.length} LEGO products`);

    // 6. Seed Vouchers
    console.log('🎫 Seeding vouchers...');
    const vouchers = await Voucher.insertMany([
      {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountPercent: 10,
        minOrderValue: 50,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit: 100,
        usedCount: 5,
        status: 'active',
        createdBy: admin._id
      },
      {
        code: 'BIGORDER20',
        description: '20% off for orders over $200',
        discountPercent: 20,
        minOrderValue: 200,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        usageLimit: 50,
        usedCount: 2,
        status: 'active',
        createdBy: admin._id
      }
    ]);
    console.log(`✅ Created ${vouchers.length} vouchers`);

    // 7. Seed Sample Order
    console.log('📦 Seeding sample order...');
    const customer = users.find(u => u.role === 'customer');
    const millennium = legos.find(l => l.slug === 'millennium-falcon');
    
    const orders = await Order.insertMany([
      {
        customerId: customer._id,
        items: [{
          legoId: millennium._id,
          title: millennium.name,
          quantity: 1,
          unitPrice: millennium.price,
          subtotal: millennium.price
        }],
        shippingAddress: {
          name: 'Jane Customer',
          phone: '+84912345678',
          addressLine1: '123 LEGO Street',
          addressLine2: 'Building Block District',
          city: 'Ho Chi Minh City',
          postcode: '70000',
          country: 'Vietnam'
        },
        totalPrice: millennium.price + 20, // +20 shipping
        shippingFee: 20,
        paymentMethod: 'COD',
        status: 'pending',
        sellerId: seller._id
      }
    ]);
    console.log(`✅ Created ${orders.length} orders`);

    // 8. Seed Reviews
    console.log('⭐ Seeding reviews...');
    const reviews = await Review.insertMany([
      {
        legoId: millennium._id,
        userId: customer._id,
        rating: 5,
        title: 'Amazing build!',
        comment: 'This is the best LEGO set I have ever built. Highly detailed and fun!',
        status: 'active'
      },
      {
        legoId: legos.find(l => l.slug === 'fire-station')._id,
        userId: users.find(u => u.email === 'test1@lego.com')._id,
        rating: 4,
        title: 'Great for kids',
        comment: 'My son loves this set. Good quality and reasonable price.',
        status: 'active'
      }
    ]);
    console.log(`✅ Created ${reviews.length} reviews`);

    // 9. Create database indexes
    console.log('📇 Creating database indexes...');
    await User.createIndexes();
    await Theme.createIndexes();
    await AgeRange.createIndexes();
    await Difficulty.createIndexes();
    await Lego.createIndexes();
    await Order.createIndexes();
    await Review.createIndexes();
    await Gallery.createIndexes();
    await Voucher.createIndexes();
    await Cart.createIndexes();
    await ActivityLog.createIndexes();
    console.log('✅ Database indexes created');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🎨 Themes: ${themes.length}`);
    console.log(`👶 Age Ranges: ${ageRanges.length}`);
    console.log(`⚡ Difficulties: ${difficulties.length}`);
    console.log(`🧱 LEGO Products: ${legos.length}`);
    console.log(`🎫 Vouchers: ${vouchers.length}`);
    console.log(`📦 Orders: ${orders.length}`);
    console.log(`⭐ Reviews: ${reviews.length}`);
    
    console.log('\n🔐 Test Accounts:');
    console.log('Admin: admin@lego.com / 123456');
    console.log('Seller: seller@lego.com / 123456');
    console.log('Customer: customer@lego.com / 123456');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
