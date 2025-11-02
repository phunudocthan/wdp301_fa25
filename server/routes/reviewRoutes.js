const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Public: get reviews for a product
router.get('/product/:legoId', reviewController.getProductReviews);

// Authenticated: submit a review
router.post('/', requireAuth, reviewController.createReview);

// Authenticated users can vote on a review
router.post('/:id/vote', requireAuth, reviewController.voteReview);

// Admin: list and filter reviews
router.get('/admin/list', requireAuth, requireRole('admin'), reviewController.adminListReviews);

// Admin or staff: reply to a review
router.post('/:id/reply', requireAuth, requireRole('admin'), reviewController.replyToReview);

// Admin: update review status
router.patch('/:id/status', requireAuth, requireRole('admin'), reviewController.updateStatus);

module.exports = router;
