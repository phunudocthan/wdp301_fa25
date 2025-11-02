/**
 * Personalized Product Sorting Service
 *
 * Logic: Dựa trên lịch sử xem (RecentlyViewed) của user để:
 * 1. Phân tích categories mà user hay xem nhất
 * 2. Tính điểm ưu tiên cho mỗi product dựa trên:
 *    - Category match với preferences của user
 *    - Số lần user xem products trong category đó
 *    - Thời gian xem gần đây (recent views có trọng số cao hơn)
 * 3. Sort products theo điểm ưu tiên
 */

const RecentlyViewed = require("../models/RecentlyViewed");
const Lego = require("../models/Lego");

/**
 * Phân tích category preferences của user từ lịch sử xem
 * @param {String} userId - ID của user
 * @returns {Object} - { categoryScores: Map<categoryId, score>, totalViews: Number }
 */
async function analyzeCategoryPreferences(userId) {
  try {
    // Lấy lịch sử xem của user
    const recentlyViewed = await RecentlyViewed.findOne({ userId })
      .populate({
        path: "items.legoId",
        select: "categories",
        populate: {
          path: "categories",
          select: "_id name",
        },
      })
      .lean();

    if (!recentlyViewed || !recentlyViewed.items?.length) {
      return { categoryScores: new Map(), totalViews: 0, topCategories: [] };
    }

    // Map để lưu điểm của mỗi category
    const categoryScores = new Map();
    let totalViews = 0;

    // Xử lý từng item trong lịch sử
    recentlyViewed.items.forEach((item) => {
      if (!item.legoId?.categories) return;

      const views = item.views || 1;
      const lastViewed = new Date(item.lastViewed);
      const daysAgo =
        (Date.now() - lastViewed.getTime()) / (1000 * 60 * 60 * 24);

      // Time decay factor: views gần đây có trọng số cao hơn
      // Views trong 7 ngày: 100%, 14 ngày: 80%, 30 ngày: 50%, >30 ngày: 30%
      let timeDecayFactor = 1.0;
      if (daysAgo <= 7) {
        timeDecayFactor = 1.0;
      } else if (daysAgo <= 14) {
        timeDecayFactor = 0.8;
      } else if (daysAgo <= 30) {
        timeDecayFactor = 0.5;
      } else {
        timeDecayFactor = 0.3;
      }

      // Cộng điểm cho mỗi category
      item.legoId.categories.forEach((cat) => {
        const catId = cat._id.toString();
        const score = views * timeDecayFactor;

        if (categoryScores.has(catId)) {
          categoryScores.set(catId, categoryScores.get(catId) + score);
        } else {
          categoryScores.set(catId, score);
        }

        totalViews += views;
      });
    });

    // Lấy top 5 categories được user quan tâm nhất
    const topCategories = Array.from(categoryScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([catId, score]) => ({ categoryId: catId, score }));

    return { categoryScores, totalViews, topCategories };
  } catch (error) {
    console.error("❌ Error analyzing category preferences:", error);
    return { categoryScores: new Map(), totalViews: 0, topCategories: [] };
  }
}

/**
 * Tính điểm personalization cho một product
 * @param {Object} product - Product object
 * @param {Map} categoryScores - Map của category scores
 * @param {Number} maxScore - Điểm cao nhất trong categoryScores
 * @returns {Number} - Điểm từ 0-100
 */
function calculateProductScore(product, categoryScores, maxScore) {
  if (!product.categories || product.categories.length === 0) {
    return 0; // Không có category => không ưu tiên
  }

  let score = 0;

  // Kiểm tra từng category của product
  product.categories.forEach((cat) => {
    const catId = cat._id?.toString() || cat.toString();
    if (categoryScores.has(catId)) {
      const categoryScore = categoryScores.get(catId);
      // Normalize về scale 0-100
      score += (categoryScore / maxScore) * 100;
    }
  });

  // Nếu product có nhiều categories match => điểm cao hơn
  // Nhưng normalize lại để không vượt quá 100
  return Math.min(score, 100);
}

/**
 * Apply personalized sorting cho danh sách products
 * @param {String} userId - ID của user
 * @param {Array} products - Danh sách products cần sort
 * @returns {Object} - { products: sortedProducts, meta: sortingInfo }
 */
async function applyPersonalizedSorting(userId, products) {
  try {
    // Nếu không có products, return ngay
    if (!products || products.length === 0) {
      return {
        products: [],
        meta: {
          personalized: false,
          reason: "No products to sort",
        },
      };
    }

    // Phân tích preferences của user
    const { categoryScores, totalViews, topCategories } =
      await analyzeCategoryPreferences(userId);

    // Nếu user chưa xem sản phẩm nào => không personalize
    if (categoryScores.size === 0 || totalViews === 0) {
      return {
        products,
        meta: {
          personalized: false,
          reason: "User has no viewing history",
          totalViews: 0,
        },
      };
    }

    // Tìm max score để normalize
    const maxScore = Math.max(...Array.from(categoryScores.values()));

    // Tính điểm cho từng product
    const productsWithScores = products.map((product) => {
      const score = calculateProductScore(product, categoryScores, maxScore);
      return {
        product,
        score,
      };
    });

    // Sort theo điểm giảm dần, products có điểm cao nhất lên đầu
    productsWithScores.sort((a, b) => b.score - a.score);

    // Extract lại products sau khi sort
    const sortedProducts = productsWithScores.map((item) => item.product);

    // Return kèm metadata
    return {
      products: sortedProducts,
      meta: {
        personalized: true,
        totalViews,
        topCategories: topCategories.map((tc) => tc.categoryId),
        appliedAt: new Date().toISOString(),
        productsAffected: productsWithScores.filter((p) => p.score > 0).length,
      },
    };
  } catch (error) {
    console.error("❌ Error applying personalized sorting:", error);
    // Nếu có lỗi, return products gốc không sort
    return {
      products,
      meta: {
        personalized: false,
        reason: "Error occurred",
        error: error.message,
      },
    };
  }
}

/**
 * Get user's category preferences summary (for debugging/analytics)
 * @param {String} userId - ID của user
 * @returns {Object} - Preferences summary
 */
async function getUserPreferencesSummary(userId) {
  try {
    const { categoryScores, totalViews, topCategories } =
      await analyzeCategoryPreferences(userId);

    const preferences = await Promise.all(
      topCategories.map(async ({ categoryId, score }) => {
        const category = await require("../models/Category")
          .findById(categoryId)
          .select("name slug")
          .lean();
        return {
          category: category?.name || "Unknown",
          score: Math.round(score * 100) / 100,
          percentage: Math.round((score / totalViews) * 100),
        };
      })
    );

    return {
      success: true,
      data: {
        totalViews,
        preferences,
        lastAnalyzed: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Error getting user preferences summary:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  applyPersonalizedSorting,
  analyzeCategoryPreferences,
  calculateProductScore,
  getUserPreferencesSummary,
};
