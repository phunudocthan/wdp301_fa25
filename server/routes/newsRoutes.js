const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.get('/list', newsController.listNews);
router.get('/highlighted', newsController.highlighted);
router.get('/trending', newsController.trending);
router.get('/:id', newsController.newsDetail);

// Protected/admin for create/update/delete - reuse existing auth middleware
// Only admin and employee can create/update/delete
router.post('/', authMiddleware.requireAuth, authMiddleware.requireRole('admin', 'employee'), newsController.createNews);
// Allow updating: controller will enforce admin/employee or author ownership
router.put('/:id', authMiddleware.requireAuth, newsController.updateNews);
// Allow deleting when authenticated; controller will enforce admin/employee or author ownership
router.delete('/:id', authMiddleware.requireAuth, newsController.deleteNews);
// restore archived
router.post('/:id/restore', authMiddleware.requireAuth, authMiddleware.requireRole('admin', 'employee'), newsController.restoreNews);

module.exports = router;
