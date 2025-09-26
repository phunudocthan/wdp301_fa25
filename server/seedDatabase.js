const mongoose = require('mongoose');
require('dotenv').config();

const bcrypt = require('bcryptjs');

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
const Notification = require('./models/Notification');
const Banner = require('./models/Banner');
const Wishlist = require('./models/Wishlist');
const RecentlyViewed = require('./models/RecentlyViewed');
const Setting = require('./models/Setting');
const ChatLog = require('./models/ChatLog');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || 'lego_ecommerce'
    });

    console.log('Resetting database...');
    await mongoose.connection.db.dropDatabase();

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
        isEmailVerified: true,
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
        isEmailVerified: true,
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
        isEmailVerified: true,
        failedLoginAttempts: 0
      }
    ]);

    const [admin, seller, customer] = users;

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

    const legos = await Lego.insertMany([
      {
        name: 'Millennium Falcon',
        themeId: themes.find(t => t.name === 'Star Wars')._id,
        ageRangeId: ageRanges.find(r => r.rangeLabel === '12+')._id,
        difficultyId: difficulties.find(d => d.level === 5)._id,
        pieces: 7541,
        price: 799.99,
        stock: 5,
        status: 'active',
        images: ['https://example.com/millennium-falcon.jpg'],
        createdBy: seller._id
      },
      {
        name: 'Downtown Fire Station',
        themeId: themes.find(t => t.name === 'City')._id,
        ageRangeId: ageRanges.find(r => r.rangeLabel === '6-12')._id,
        difficultyId: difficulties.find(d => d.level === 3)._id,
        pieces: 908,
        price: 99.99,
        stock: 25,
        status: 'active',
        images: ['https://example.com/fire-station.jpg'],
        createdBy: seller._id
      },
      {
        name: 'Technic Bugatti Chiron',
        themeId: themes.find(t => t.name === 'Technic')._id,
        ageRangeId: ageRanges.find(r => r.rangeLabel === '12+')._id,
        difficultyId: difficulties.find(d => d.level === 3)._id,
        pieces: 3599,
        price: 349.99,
        stock: 10,
        status: 'pending',
        images: ['https://example.com/bugatti-chiron.jpg'],
        createdBy: seller._id
      }
    ]);

    await Cart.create({
      userId: customer._id,
      items: [
        {
          legoId: legos[1]._id,
          quantity: 2,
          price: legos[1].price
        }
      ]
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
          legoId: legos[0]._id,
          quantity: 1,
          price: legos[0].price
        }
      ],
      total: legos[0].price,
      status: 'confirmed',
      shippingAddress: {
        name: 'Jane Customer',
        phone: '+84912345678',
        address: '123 LEGO Street',
        city: 'Ho Chi Minh City',
        postalCode: '70000',
        country: 'Vietnam'
      },
      paymentMethod: 'COD',
      paymentStatus: 'unpaid',
      voucherId: vouchers[0]._id
    });

    const reviews = await Review.insertMany([
      {
        legoId: legos[0]._id,
        userId: customer._id,
        rating: 5,
        comment: 'Incredible build quality and attention to detail.',
        status: 'visible'
      },
      {
        legoId: legos[1]._id,
        userId: admin._id,
        rating: 4,
        comment: 'Great set for younger builders.',
        status: 'visible'
      }
    ]);

    await Gallery.insertMany([
      {
        userId: seller._id,
        legoId: legos[0]._id,
        imageUrl: 'https://example.com/gallery-falcon.jpg',
        caption: 'Ultimate collector series display',
        likes: [customer._id],
        status: 'visible'
      }
    ]);

    await Notification.insertMany([
      {
        userId: customer._id,
        message: `Order ${order.orderNumber} confirmed`,
        type: 'order',
        status: 'unread'
      },
      {
        userId: seller._id,
        message: 'New product pending approval',
        type: 'system',
        status: 'read'
      }
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
      legoIds: [legos[0]._id, legos[2]._id]
    });

    await RecentlyViewed.create({
      userId: customer._id,
      legoIds: [legos[1]._id, legos[0]._id]
    });

    await Setting.insertMany([
      { key: 'siteName', value: 'LEGO Marketplace', updatedAt: new Date() },
      { key: 'supportEmail', value: 'support@lego.com', updatedAt: new Date() }
    ]);

    await ChatLog.create({
      userId: customer._id,
      messages: [
        { sender: 'user', text: 'Hi, I need help with my order.', timestamp: new Date() },
        { sender: 'support', text: 'Sure, what can we assist you with?', timestamp: new Date() }
      ]
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
