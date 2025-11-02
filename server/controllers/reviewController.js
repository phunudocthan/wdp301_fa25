const Review = require("../models/Review");
const Lego = require("../models/Lego");

const createReview = async (req, res) => {
  try {
    const { legoId, rating, comment, images = [] } = req.body;
    if (!legoId || !rating) {
      return res.status(400).json({ message: "legoId and rating are required" });
    }

    // Ensure product exists
    const lego = await Lego.findById(legoId);
    if (!lego) return res.status(404).json({ message: "Product not found" });

    const reviewData = {
      legoId,
      userId: req.user._id,
      rating,
      comment,
      images,
    };

    const review = await Review.create(reviewData);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error("Create review error:", err);
    // Duplicate key errors were previously used to prevent multiple reviews per user/product.
    // Since multiple comments per user are now allowed, treat any error as a server error here.
    res.status(500).json({ message: err.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { legoId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    const search = req.query.q || null;

    const filter = { legoId };
    if (rating) filter.rating = rating;
    filter.status = { $ne: "hidden" };

    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .lean();

    // Add helpful counts and reply counts
    const mapped = reviews.map((r) => ({
      ...r,
      helpful: { up: (r.votes?.up || []).length, down: (r.votes?.down || []).length },
      replies: r.replies || [],
    }));

    res.json({ success: true, data: mapped, meta: { total, page, limit } });
  } catch (err) {
    console.error("Get product reviews error:", err);
    res.status(500).json({ message: err.message });
  }
};

const adminListReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const { legoId, userId, status, rating, q } = req.query;

    const filter = {};
    if (legoId) filter.legoId = legoId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (rating) filter.rating = parseInt(rating);
    if (q) filter.comment = { $regex: q, $options: "i" };

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name email")
      .populate("legoId", "name")
      .lean();

    res.json({ success: true, data: reviews, meta: { total, page, limit } });
  } catch (err) {
    console.error("Admin list reviews error:", err);
    res.status(500).json({ message: err.message });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Reply message required" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const reply = {
      userId: req.user._id,
      message,
      isAdmin: req.user.role === "admin",
      createdAt: new Date(),
    };

    review.replies.push(reply);
    await review.save();

    res.json({ success: true, data: review });
  } catch (err) {
    console.error("Reply to review error:", err);
    res.status(500).json({ message: err.message });
  }
};

const voteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    if (!['up', 'down'].includes(vote)) return res.status(400).json({ message: "Invalid vote" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });

    const userId = req.user._id.toString();

    // Remove from both arrays first
    review.votes.up = (review.votes.up || []).filter((u) => u.toString() !== userId);
    review.votes.down = (review.votes.down || []).filter((u) => u.toString() !== userId);

    if (vote === 'up') review.votes.up.push(req.user._id);
    else review.votes.down.push(req.user._id);

    await review.save();
    res.json({ success: true, data: { up: review.votes.up.length, down: review.votes.down.length } });
  } catch (err) {
    console.error("Vote review error:", err);
    res.status(500).json({ message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // visible|hidden|reported
    if (!['visible', 'hidden', 'reported'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.status = status;
    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    console.error('Update review status error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  adminListReviews,
  replyToReview,
  voteReview,
  updateStatus,
};
