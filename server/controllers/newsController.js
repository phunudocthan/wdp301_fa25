const News = require('../models/News');

const createNews = async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      author: req.user ? req.user._id : req.body.author,
      images: req.body.images || [],
      tags: req.body.tags || [],
      isHighlighted: !!req.body.isHighlighted,
      status: req.body.status || 'published',
    };

    const news = new News(payload);
    await news.save();
    res.status(201).json({ message: 'News created', news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNews = async (req, res) => {
  try {
    const { id } = req.params;

    // Load existing news to check ownership
    const existing = await News.findById(id);
    if (!existing) return res.status(404).json({ message: 'News not found' });

    const user = req.user;
    const isAdminOrEmployee = user && (user.role === 'admin' || user.role === 'employee');
    const isAuthor = user && existing.author && existing.author.toString() === user._id.toString();

    if (!isAdminOrEmployee && !isAuthor) {
      return res.status(403).json({ message: 'Forbidden: insufficient role or not the author' });
    }

    const updates = { ...req.body };
    // Prevent clearing images unintentionally if not provided
    if (updates.images && Array.isArray(updates.images) && updates.images.length === 0) {
      // treat empty images as intentional clear; otherwise controller expects client to omit field
    }

    const news = await News.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: 'News updated', news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: 'News not found' });

    // Authorization: allow admins and employees, or the original author to archive
    const user = req.user;
    const isAdminOrEmployee = user && (user.role === 'admin' || user.role === 'employee');
    const isAuthor = user && news.author && news.author.toString() === user._id.toString();

    if (!isAdminOrEmployee && !isAuthor) {
      return res.status(403).json({ message: 'Forbidden: insufficient role or not the author' });
    }

    // Soft-delete: mark as archived instead of removing from DB
    news.status = 'archived';
    news.archivedAt = new Date();
    news.archivedBy = user ? user._id : undefined;
    await news.save();
    res.json({ message: 'News archived' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const restoreNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: 'News not found' });

    // Only admins or employees can restore archived news
    const user = req.user;
    if (!user || !(user.role === 'admin' || user.role === 'employee')) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }

    news.status = 'published';
    news.archivedAt = undefined;
    news.archivedBy = undefined;
    await news.save();
    res.json({ message: 'News restored', news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listNews = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 12, 100);
    const skip = (page - 1) * limit;

  // Allow optional status query (published, archived, draft). Default to published.
  const statusFilter = req.query.status || 'published';
  const filter = { status: statusFilter };
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.search) {
      const q = req.query.search;
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { excerpt: new RegExp(q, 'i') },
        { content: new RegExp(q, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
      News.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const newsDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findById(id).populate('author', 'name email');
    if (!news) return res.status(404).json({ message: 'News not found' });

    // If the news is archived, only admin/employee or the author may view it
    if (news.status === 'archived') {
      const user = req.user;
      const isAdminOrEmployee = user && (user.role === 'admin' || user.role === 'employee');
      const isAuthor = user && news.author && news.author._id && news.author._id.toString() === user._id.toString();
      if (!isAdminOrEmployee && !isAuthor) {
        return res.status(404).json({ message: 'News not found' });
      }
    }

    // increment views
    news.views = (news.views || 0) + 1;
    await news.save();

    res.json({ news });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const highlighted = async (req, res) => {
  try {
    const items = await News.find({ isHighlighted: true, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 5)
      .lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const trending = async (req, res) => {
  try {
    const items = await News.find({ status: 'published' })
      .sort({ views: -1, createdAt: -1 })
      .limit(parseInt(req.query.limit) || 6)
      .lean();
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createNews,
  updateNews,
  deleteNews,
  listNews,
  newsDetail,
  highlighted,
  trending,
  restoreNews,
};
