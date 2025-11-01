const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const RecentlyViewed = require("../models/RecentlyViewed");
const Lego = require("../models/Lego");

const toIdString = (value) => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return String(value);
};

const addScore = (map, key, weight) => {
  if (!key) return;
  const current = map.get(key) || 0;
  map.set(key, current + weight);
};

const gatherLegoInfo = async (ids) => {
  if (!ids.length) return new Map();
  const docs = await Lego.find({ _id: { $in: ids } })
    .select("themeId categories price ageRangeId difficultyId")
    .lean();

  const infoMap = new Map();
  docs.forEach((doc) => infoMap.set(doc._id.toString(), doc));
  return infoMap;
};

const buildUserProfile = async (userId) => {
  const profile = {
    legoScores: new Map(),
    themeScores: new Map(),
    categoryScores: new Map(),
    ageRangeScores: new Map(),
    difficultyScores: new Map(),
    priceSamples: [],
  };

  if (!userId) {
    return profile;
  }

  const [recentDoc, cartDoc, orders] = await Promise.all([
    RecentlyViewed.findOne({ userId })
      .select("items.legoId items.views items.lastViewed")
      .lean(),
    Cart.findOne({ userId })
      .select("items.legoId items.price")
      .lean(),
    Order.find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("items.legoId items.price createdAt")
      .lean(),
  ]);

  const legoIdSet = new Set();

  const recentItemsSource = (() => {
    if (recentDoc?.items?.length) return recentDoc.items;
    if (Array.isArray(recentDoc?.legoIds) && recentDoc.legoIds.length) {
      return recentDoc.legoIds.map((id) => ({
        legoId: id,
        views: 1,
        lastViewed: recentDoc.updatedAt || new Date(),
      }));
    }
    return [];
  })();

  if (recentItemsSource.length) {
    recentItemsSource.forEach((item) => {
      if (item?.legoId) {
        legoIdSet.add(item.legoId.toString());
      }
    });
  }

  if (cartDoc?.items?.length) {
    cartDoc.items.forEach((item) => {
      if (item.legoId) legoIdSet.add(item.legoId.toString());
      if (item.price) profile.priceSamples.push(Number(item.price));
    });
  }

  if (orders?.length) {
    orders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.legoId) legoIdSet.add(item.legoId.toString());
        if (item.price) profile.priceSamples.push(Number(item.price));
      });
    });
  }

  const legoInfoMap = await gatherLegoInfo(Array.from(legoIdSet));

  // Recently viewed signals
  if (recentItemsSource.length) {
    const recentItems = [...recentItemsSource]
      .sort((a, b) => new Date(b.lastViewed) - new Date(a.lastViewed))
      .slice(0, 10);

    recentItems.forEach((item, index) => {
      const stringId = item.legoId?.toString();
      if (!stringId) return;
      const recencyBoost = Math.max(0, 10 - index);
      const viewBoost = Math.log((item.views || 1) + 1);
      const weight = 2 + recencyBoost + viewBoost;
      addScore(profile.legoScores, stringId, weight);

      const info = legoInfoMap.get(stringId);
      if (info) {
        addScore(profile.themeScores, toIdString(info.themeId), weight * 0.6);
        (info.categories || []).forEach((cat) =>
          addScore(profile.categoryScores, toIdString(cat), weight * 0.4)
        );
        addScore(profile.ageRangeScores, toIdString(info.ageRangeId), weight * 0.2);
        addScore(
          profile.difficultyScores,
          toIdString(info.difficultyId),
          weight * 0.2
        );
      }
    });
  }

  // Cart signals
  if (cartDoc?.items?.length) {
    cartDoc.items.forEach((item) => {
      const stringId = item.legoId?.toString();
      if (!stringId) return;
      const weight = 15;
      addScore(profile.legoScores, stringId, weight);

      const info = legoInfoMap.get(stringId);
      if (info) {
        addScore(profile.themeScores, toIdString(info.themeId), weight * 0.7);
        (info.categories || []).forEach((cat) =>
          addScore(profile.categoryScores, toIdString(cat), weight * 0.5)
        );
        addScore(profile.ageRangeScores, toIdString(info.ageRangeId), weight * 0.3);
        addScore(
          profile.difficultyScores,
          toIdString(info.difficultyId),
          weight * 0.3
        );
      }
    });
  }

  // Orders signals (less weight than cart)
  if (orders?.length) {
    orders.forEach((order, orderIndex) => {
      const recencyWeight = Math.max(1, 6 - orderIndex); // more recent -> higher
      order.items?.forEach((item) => {
        const stringId = item.legoId?.toString();
        if (!stringId) return;
        const weight = 4 * recencyWeight;
        addScore(profile.legoScores, stringId, weight);

        const info = legoInfoMap.get(stringId);
        if (info) {
          addScore(profile.themeScores, toIdString(info.themeId), weight * 0.6);
          (info.categories || []).forEach((cat) =>
            addScore(profile.categoryScores, toIdString(cat), weight * 0.4)
          );
          addScore(
            profile.ageRangeScores,
            toIdString(info.ageRangeId),
            weight * 0.2
          );
          addScore(
            profile.difficultyScores,
            toIdString(info.difficultyId),
            weight * 0.2
          );
        }
      });
    });
  }

  if (profile.priceSamples.length) {
    const total = profile.priceSamples.reduce((sum, value) => sum + value, 0);
    profile.avgPrice = total / profile.priceSamples.length;
  }

  return profile;
};

const scoreProduct = (product, profile, index, baseScore) => {
  let score = baseScore ?? 0;
  const productId = toIdString(product._id);

  score += profile.legoScores.get(productId) || 0;

  const themeId = toIdString(product.themeId);
  if (themeId) score += profile.themeScores.get(themeId) || 0;

  if (Array.isArray(product.categories)) {
    product.categories.forEach((cat) => {
      const catId = toIdString(cat);
      if (catId) score += profile.categoryScores.get(catId) || 0;
    });
  }

  const ageId = toIdString(product.ageRangeId);
  if (ageId) score += profile.ageRangeScores.get(ageId) || 0;

  const difficultyId = toIdString(product.difficultyId);
  if (difficultyId) score += profile.difficultyScores.get(difficultyId) || 0;

  if (profile.avgPrice && product.price != null) {
    const diff = Math.abs(Number(product.price) - profile.avgPrice);
    if (!Number.isNaN(diff)) {
      const closeness = Math.max(0, 1 - diff / Math.max(profile.avgPrice, 1));
      score += 5 * closeness;
    }
  }

  // Slight boost to original order to keep deterministic behaviour for equal scores
  return score + index * 0.0001;
};

const applyPersonalizedSorting = async (userId, products) => {
  if (!userId || !Array.isArray(products) || products.length === 0) {
    return {
      products,
      meta: { personalized: false },
    };
  }

  const profile = await buildUserProfile(userId);

  const scored = products.map((product, index) => ({
    product,
    score: scoreProduct(product, profile, index, 0),
  }));

  const maxScore = Math.max(...scored.map((item) => item.score));
  const isPersonalized = maxScore > 0;

  if (!isPersonalized) {
    return {
      products,
      meta: { personalized: false },
    };
  }

  scored.sort((a, b) => b.score - a.score);

  const sortedProducts = scored.map((item) => {
    if (item.product && typeof item.product === "object") {
      item.product.personalizationScore = Number(item.score.toFixed(2));
    }
    return item.product;
  });

  return {
    products: sortedProducts,
    meta: {
      personalized: true,
      strategy: "behaviour_score",
    },
  };
};

module.exports = {
  applyPersonalizedSorting,
};
