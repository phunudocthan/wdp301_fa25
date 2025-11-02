const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const { requireAuth } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const RecentlyViewed = require("../models/RecentlyViewed");
const Lego = require("../models/Lego");
const ChatLog = require("../models/ChatLog");

const router = express.Router();

// Load knowledge base for RAG
let knowledgeBase = null;
try {
  const kbPath = path.join(__dirname, "../data/knowledge_base.json");
  const kbData = fs.readFileSync(kbPath, "utf8");
  knowledgeBase = JSON.parse(kbData);
  console.log("[ai-chat] Knowledge base loaded successfully");
} catch (error) {
  console.warn("[ai-chat] Failed to load knowledge base:", error.message);
}
/**
paste hai dòng này vô file .env
GEMINI_API_KEY=AIzaSyCZtTSiUV4ac-PFRyJgXf8WPEelLcwzuk4
GEMINI_MODEL=gemini-2.5-flash-lite
**/
const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_STORED_MESSAGES = 100;
const HISTORY_LIMIT = 40;
const APP_ORIGIN = (process.env.CLIENT_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

const buildSystemInstruction = () =>
  [
    "You are LBot, an AI concierge for a LEGO e-commerce store.",
    "Always provide concise, friendly answers in the language of the customer's last message (Vietnamese or English).",
    "Explain order status, shipping, returns, catalogue questions, or product suggestions using the context you are given.",
    "If you lack information, admit it and show the customer how to find help (contact support, link to order history, etc.).",
    "IMPORTANT: When suggesting products, you MUST:",
    "1. Keep the EXACT original product names in English - DO NOT translate product names to Vietnamese",
    "2. Include the product ID in format [ID:product_id] right after the product name",
    "3. Format each suggestion as: **Product Name [ID:product_id]** - reason (price if available)",
    "4. Use markdown bold for product names to make them stand out",
    "5. Maximum 3 product suggestions per response",
    "6. PRIORITY: If you see '🔍 MATCHING PRODUCTS' section, suggest those products FIRST as they directly match what customer is asking for",
    "Never invent discounts or policies that are not provided in the context.",
  ].join(" ");

const buildContextPrompt = (context = {}, customer = {}) => {
  const lines = [];

  if (customer?.name || customer?.email) {
    lines.push(
      `Customer profile:\n- Name: ${customer.name ?? "Unknown"}\n- Email: ${
        customer.email ?? "Not provided"
      }`
    );
  }

  // ⭐ PRIORITY 1: Search results (dynamic search based on user query)
  // Show these FIRST so AI prioritizes matching products
  if (Array.isArray(context.searchResults) && context.searchResults.length) {
    const searchLines = context.searchResults.map((product) => {
      const id = product.id ? ` [ID:${product.id}]` : "";
      const details = [];

      if (product.price != null) {
        details.push(`${product.price} USD`);
      }

      if (product.theme) {
        details.push(product.theme);
      }

      if (product.pieces) {
        details.push(`${product.pieces} pieces`);
      }

      if (product.stock != null) {
        details.push(product.stock > 0 ? "in stock" : "out of stock");
      }

      let line = `• ${product.name ?? "Unnamed"}${id}`;
      if (details.length) {
        line += ` (${details.join("; ")})`;
      }

      if (product.description) {
        const snippet = product.description.slice(0, 100).trim();
        if (snippet) {
          line += `\n  ${snippet}${
            product.description.length > 100 ? "..." : ""
          }`;
        }
      }

      return line;
    });

    lines.push(
      `🔍 MATCHING PRODUCTS (found based on your question - PRIORITIZE THESE):\n${searchLines.join(
        "\n\n"
      )}`
    );
  }

  if (Array.isArray(context.orders) && context.orders.length > 0) {
    const orderSummaries = context.orders.slice(0, 5).map((order) => {
      let summary = `• Order ${order.code ?? order.id ?? "N/A"} — status: ${
        order.status ?? "unknown"
      }, placed ${order.placedAt ?? "N/A"}, total ${
        order.total ?? order.amount ?? "N/A"
      }`;

      // Add product IDs if available
      if (Array.isArray(order.items) && order.items.length > 0) {
        const productList = order.items
          .slice(0, 3)
          .map((item) => {
            const id = item.id ? ` [ID:${item.id}]` : "";
            return `${item.name ?? "Unknown"}${id}`;
          })
          .join(", ");
        summary += `\n  Products: ${productList}`;
      }

      return summary;
    });
    lines.push(
      `Recent order info (include ID when suggesting):\n${orderSummaries.join(
        "\n"
      )}`
    );
  }

  if (Array.isArray(context.recentSearches) && context.recentSearches.length) {
    lines.push(
      `Recent searches: ${context.recentSearches
        .slice(-5)
        .map((s) => `"${s}"`)
        .join(", ")}`
    );
  }

  if (Array.isArray(context.recentClicks) && context.recentClicks.length) {
    const clickSummaries = context.recentClicks.slice(0, 8).map((item) => {
      const label = item.name ?? item.title ?? "Unknown product";
      const id = item.id ? ` [ID:${item.id}]` : "";
      const detail = [];

      // Price
      if (item.price != null) {
        detail.push(`${item.price} USD`);
      }

      // Theme and tags
      if (Array.isArray(item.tags) && item.tags.length) {
        detail.push(item.tags.join(", "));
      } else if (item.theme) {
        detail.push(item.theme);
      }

      // Pieces count
      if (item.pieces) {
        detail.push(`${item.pieces} pieces`);
      }

      // View stats
      if (item.views && item.views > 1) {
        detail.push(`viewed ${item.views}x`);
      }

      // Stock availability
      if (item.stock != null) {
        detail.push(
          item.stock > 0 ? `in stock (${item.stock})` : "out of stock"
        );
      }

      // Description snippet for RAG
      let summary = detail.length
        ? `${label}${id} (${detail.join("; ")})`
        : `${label}${id}`;

      if (item.description) {
        const descSnippet = item.description.slice(0, 100).trim();
        if (descSnippet) {
          summary += `\n  Description: ${descSnippet}${
            item.description.length > 100 ? "..." : ""
          }`;
        }
      }

      return summary;
    });
    lines.push(
      `Recently viewed products (RAG - use these details when customer asks follow-up):\n${clickSummaries.join(
        "\n\n"
      )}`
    );
  }

  if (typeof context.cart === "object" && context.cart) {
    const { items = [], total } = context.cart;
    if (items.length > 0) {
      lines.push(
        [
          "Current cart contents (include ID when suggesting):",
          ...items.slice(0, 5).map((item) => {
            const id = item.id ? ` [ID:${item.id}]` : "";
            return `• ${item.name ?? "Unknown"}${id} ×${item.quantity ?? 1} – ${
              item.price ?? "N/A"
            }`;
          }),
          total ? `Cart total: ${total}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      );
    }
  }

  if (
    Array.isArray(context.featuredProducts) &&
    context.featuredProducts.length
  ) {
    const featuredLines = context.featuredProducts
      .slice(0, 6)
      .map((product) => {
        const id = product.id ? ` [ID:${product.id}]` : "";
        const details = [];

        if (product.price != null) {
          details.push(`${product.price} USD`);
        }

        if (Array.isArray(product.tags) && product.tags.length) {
          details.push(product.tags.join(", "));
        }

        if (product.pieces) {
          details.push(`${product.pieces} pieces`);
        }

        if (product.stock != null) {
          details.push(product.stock > 0 ? "available" : "out of stock");
        }

        let line = `• ${product.name ?? "Unnamed"}${id}`;
        if (details.length) {
          line += ` (${details.join("; ")})`;
        }

        if (product.description) {
          const snippet = product.description.slice(0, 80).trim();
          if (snippet) {
            line += `\n  ${snippet}${
              product.description.length > 80 ? "..." : ""
            }`;
          }
        }

        return line;
      });
    lines.push(
      `Featured/Popular products (prioritize these in suggestions):\n${featuredLines.join(
        "\n\n"
      )}`
    );
  }

  // Add previously discussed products section (from conversation history)
  if (
    Array.isArray(context.previouslyDiscussed) &&
    context.previouslyDiscussed.length
  ) {
    const discussedLines = context.previouslyDiscussed.map((product) => {
      const id = product.id ? ` [ID:${product.id}]` : "";
      const details = [];

      if (product.price != null) {
        details.push(`${product.price} USD`);
      }

      if (product.theme) {
        details.push(product.theme);
      }

      if (product.pieces) {
        details.push(`${product.pieces} pieces`);
      }

      if (product.stock != null) {
        details.push(product.stock > 0 ? "in stock" : "out of stock");
      }

      let line = `• ${product.name ?? "Unnamed"}${id}`;
      if (details.length) {
        line += ` (${details.join("; ")})`;
      }

      if (product.description) {
        const snippet = product.description.slice(0, 100).trim();
        if (snippet) {
          line += `\n  ${snippet}${
            product.description.length > 100 ? "..." : ""
          }`;
        }
      }

      return line;
    });

    lines.push(
      `Products mentioned in this conversation (use these when customer refers back):\n${discussedLines.join(
        "\n\n"
      )}`
    );
  }

  if (!lines.length) return "";

  const exampleFormat = [
    "",
    "IMPORTANT - Product Suggestion Format Example:",
    "When suggesting products, format your response like this:",
    "**LEGO Technic Bugatti Chiron [ID:507f1f77bcf86cd799439011]** - Perfect for car enthusiasts, features detailed engine (8,500 USD)",
    "**LEGO Creator Ferrari F40 [ID:507f1f77bcf86cd799439012]** - Classic sports car with authentic details (3,200 USD)",
    "",
  ];

  return `Use the following customer context when relevant:\n${lines.join(
    "\n"
  )}${exampleFormat.join("\n")}`;
};

const formatHistory = (messages = []) =>
  messages
    .slice(-20)
    .map((message) => {
      const roleLabel = message.role === "assistant" ? "Assistant" : "Customer";
      return `${roleLabel}: ${message.content}`;
    })
    .join("\n");

const extractProductIdsFromHistory = (messages = []) => {
  const ids = new Set();
  const idPattern = /\[ID:([a-f0-9]{24})\]/gi;

  messages.forEach((message) => {
    if (!message?.content) return;

    let match;
    while ((match = idPattern.exec(message.content)) !== null) {
      ids.add(match[1]);
    }
  });

  return Array.from(ids);
};

const searchKnowledgeBase = (userQuery) => {
  if (!knowledgeBase?.knowledgeBase?.categories) {
    return null;
  }

  const query = userQuery.toLowerCase();
  const results = [];
  const maxResults = 3;

  // Search through all categories and items
  for (const category of knowledgeBase.knowledgeBase.categories) {
    for (const item of category.items) {
      // Check if any keyword matches
      const keywordMatch = item.keywords?.some((keyword) =>
        query.includes(keyword.toLowerCase())
      );

      // Check if question matches
      const questionMatch =
        query.includes(item.question.toLowerCase()) ||
        item.question.toLowerCase().includes(query);

      if (keywordMatch || questionMatch) {
        results.push({
          category: category.name,
          question: item.question,
          answer: item.answer,
          relevance: keywordMatch ? 2 : 1, // Keyword match is more relevant
        });
      }
    }
  }

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, maxResults);
};

const buildKnowledgeContext = (userQuery) => {
  if (!knowledgeBase) return "";

  const searchResults = searchKnowledgeBase(userQuery);

  if (!searchResults || searchResults.length === 0) {
    return "";
  }

  const lines = [
    "=== KNOWLEDGE BASE (Use this information to answer customer questions) ===",
    "",
  ];

  searchResults.forEach((result, index) => {
    lines.push(`${index + 1}. [${result.category}] ${result.question}`);
    lines.push(`   Answer: ${result.answer}`);
    lines.push("");
  });

  // Add contact info
  const contact = knowledgeBase.knowledgeBase.contact_info;
  if (contact) {
    lines.push("Customer Support Contact:");
    lines.push(`- Hotline: ${contact.hotline} (24/7)`);
    lines.push(`- Phone/Zalo: ${contact.phone}`);
    lines.push(`- Email: ${contact.email}`);
    lines.push("");
  }

  lines.push("=== END KNOWLEDGE BASE ===");
  lines.push("");

  return lines.join("\n");
};

const normaliseModelName = (name) => {
  if (!name) return DEFAULT_MODEL;
  return name.startsWith("models/") ? name.slice("models/".length) : name;
};

const formatSessionTitle = (date = new Date()) =>
  date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });

const truncate = (value, limit = 120) =>
  typeof value === "string" && value.length > limit
    ? `${value.slice(0, limit).trim()}…`
    : value;

let genAI = null;
let model = null;

const initialiseModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[ai-chat] GEMINI_API_KEY not found. AI chat route disabled.");
    return;
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: normaliseModelName(process.env.GEMINI_MODEL) || DEFAULT_MODEL,
      systemInstruction: {
        role: "system",
        parts: [{ text: buildSystemInstruction() }],
      },
    });
  } catch (error) {
    console.error("[ai-chat] Failed to initialise Gemini client:", error);
    genAI = null;
    model = null;
  }
};

initialiseModel();

const attachUserOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return next();
    }

    if (user.status && user.status !== "active") {
      return next();
    }

    if (user.isLocked && user.lockUntil && user.lockUntil > Date.now()) {
      return next();
    }

    req.user = user;
  } catch (error) {
    console.warn("[ai-chat] Optional auth failed:", error.message);
  } finally {
    next();
  }
};

router.use(attachUserOptional);

const searchProductsByKeywords = async (query) => {
  if (!query || typeof query !== "string") return [];

  // Extract potential product keywords from user query
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  if (keywords.length === 0) return [];

  try {
    // Build regex patterns for each keyword
    const regexPatterns = keywords.map((keyword) => ({
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    }));

    // Search products matching any keyword
    const products = await Lego.find({
      status: "active",
      $or: regexPatterns,
    })
      .limit(10)
      .populate("themeId", "name")
      .select("name price themeId categories description pieces stock")
      .lean();

    return products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      theme: product.themeId?.name,
      description: product.description,
      pieces: product.pieces,
      stock: product.stock,
    }));
  } catch (error) {
    console.error("[ai-chat] Product search failed:", error);
    return [];
  }
};

const buildServerContext = async (user, userQuery = "") => {
  if (!user?._id) return {};

  try {
    const [orders, cart, recentlyViewed, featured] = await Promise.all([
      Order.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate({
          path: "items.legoId",
          select: "name price themeId categories",
          populate: { path: "themeId", select: "name" },
        })
        .lean(),
      Cart.findOne({ userId: user._id })
        .populate({
          path: "items.legoId",
          select: "name price themeId categories",
          populate: { path: "themeId", select: "name" },
        })
        .lean(),
      RecentlyViewed.findOne({ userId: user._id })
        .populate({
          path: "items.legoId",
          select: "name price themeId categories",
          populate: { path: "themeId", select: "name" },
        })
        .lean(),
      Lego.find({ status: "active" })
        .sort({ updatedAt: -1 })
        .limit(50)
        .populate("themeId", "name")
        .select("name price themeId categories description pieces stock")
        .lean(),
    ]);

    const mappedOrders = Array.isArray(orders)
      ? orders.map((order) => ({
          id: order._id.toString(),
          code:
            order.orderNumber ?? order._id.toString().slice(-8).toUpperCase(),
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          placedAt: order.createdAt,
          items: order.items?.map((item) => ({
            id: item.legoId?._id?.toString() ?? undefined,
            name: item.legoId?.name ?? "Unknown product",
            quantity: item.quantity,
            price: item.price,
            theme: item.legoId?.themeId?.name,
            tags: item.legoId?.themeId?.name
              ? [item.legoId.themeId.name]
              : undefined,
          })),
        }))
      : [];

    const mappedCart =
      cart && Array.isArray(cart.items) && cart.items.length
        ? {
            items: cart.items.map((item) => ({
              id: item.legoId?._id?.toString() ?? undefined,
              name: item.legoId?.name ?? "Unknown product",
              quantity: item.quantity,
              price: item.price,
              theme: item.legoId?.themeId?.name,
              tags: item.legoId?.themeId?.name
                ? [item.legoId.themeId.name]
                : undefined,
            })),
            total: cart.items.reduce(
              (sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 0),
              0
            ),
          }
        : undefined;

    let mappedRecent = [];

    if (Array.isArray(recentlyViewed?.items) && recentlyViewed.items.length) {
      mappedRecent = [...recentlyViewed.items]
        .sort(
          (a, b) =>
            new Date(b.lastViewed || 0).getTime() -
            new Date(a.lastViewed || 0).getTime()
        )
        .map((entry) => {
          const lego = entry?.legoId;
          const id =
            lego?._id?.toString() ??
            (typeof lego === "string" ? lego : undefined);
          if (!id) return null;

          const themeName = lego?.themeId?.name;
          const tags = [];
          if (themeName) tags.push(themeName);

          // Add more metadata for RAG
          if (Array.isArray(lego?.categories)) {
            lego.categories.forEach((cat) => {
              if (cat?.name) tags.push(cat.name);
            });
          }

          const candidate = {
            id,
            name: lego?.name ?? "Unknown product",
            price: lego?.price,
            theme: themeName,
            tags: tags.length > 0 ? tags : undefined,
            views: entry.views ?? 1,
            lastViewed: entry.lastViewed,
            description: lego?.description,
            pieces: lego?.pieces,
            stock: lego?.stock,
          };

          return candidate;
        })
        .filter(Boolean);
    } else if (
      Array.isArray(recentlyViewed?.legoIds) &&
      recentlyViewed.legoIds.length
    ) {
      const legacyIds = recentlyViewed.legoIds
        .map((item) => {
          if (!item) return null;
          if (item._id?.toString) return item._id.toString();
          if (item.toString) return item.toString();
          return null;
        })
        .filter(Boolean);

      if (legacyIds.length) {
        const legacyDocs = await Lego.find({ _id: { $in: legacyIds } })
          .select("name price themeId description pieces stock categories")
          .populate("themeId", "name")
          .lean();

        const legacyMap = new Map(
          legacyDocs.map((doc) => [doc._id.toString(), doc])
        );

        mappedRecent = legacyIds
          .map((id) => {
            const doc = legacyMap.get(id);
            if (!doc) return null;

            const themeName = doc.themeId?.name;
            const tags = [];
            if (themeName) tags.push(themeName);

            if (Array.isArray(doc?.categories)) {
              doc.categories.forEach((cat) => {
                if (cat?.name) tags.push(cat.name);
              });
            }

            const result = {
              id,
              name: doc.name,
              price: doc.price,
              theme: themeName,
              tags: tags.length > 0 ? tags : undefined,
              description: doc.description,
              pieces: doc.pieces,
              stock: doc.stock,
            };

            return result;
          })
          .filter(Boolean);
      }
    }
    const mappedFeatured = Array.isArray(featured)
      ? featured.map((lego) => {
          const tags = [];
          if (lego.themeId?.name) tags.push(lego.themeId.name);

          if (Array.isArray(lego.categories)) {
            lego.categories.forEach((cat) => {
              if (cat?.name) tags.push(cat.name);
            });
          }

          return {
            id: lego._id.toString(),
            name: lego.name,
            price: lego.price,
            tags: tags.length > 0 ? tags : undefined,
            description: lego.description,
            pieces: lego.pieces,
            stock: lego.stock,
          };
        })
      : [];

    // Dynamic product search based on user query
    let searchResults = [];
    if (userQuery) {
      searchResults = await searchProductsByKeywords(userQuery);
    }

    return {
      orders: mappedOrders,
      cart: mappedCart,
      recentClicks: mappedRecent,
      featuredProducts: mappedFeatured,
      searchResults: searchResults.length > 0 ? searchResults : undefined,
    };
  } catch (error) {
    console.error("[ai-chat] Failed to build server context:", error);
    return {};
  }
};

const mergeContext = (serverContext = {}, clientContext = {}) => {
  const merged = {};

  const mergeArray = (dataA = [], dataB = [], dedupeBy) => {
    const combined = [...dataA, ...dataB];
    if (!dedupeBy) return combined;
    const seen = new Set();
    return combined.filter((item) => {
      const key = item?.[dedupeBy] ?? JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const mergeObject = (primary, secondary) =>
    primary && secondary ? { ...secondary, ...primary } : primary ?? secondary;

  merged.orders = mergeArray(serverContext.orders, clientContext.orders, "id");
  merged.recentSearches = mergeArray(
    serverContext.recentSearches,
    clientContext.recentSearches
  ).filter(Boolean);
  merged.recentClicks = mergeArray(
    serverContext.recentClicks,
    clientContext.recentClicks,
    "id"
  );
  merged.featuredProducts = mergeArray(
    serverContext.featuredProducts,
    clientContext.featuredProducts,
    "id"
  );
  merged.cart = mergeObject(serverContext.cart, clientContext.cart);

  return merged;
};

const CAR_KEYWORDS = [
  "car",
  "xe",
  "ô tô",
  "oto",
  "ôto",
  "automobile",
  "vehicle",
  "racing",
  "race",
  "ferrari",
  "bugatti",
  "technic",
];

const containsKeyword = (text = "", keywords = []) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

const collectProductCandidates = (context = {}) => {
  const bucket = new Map();

  const pushProduct = (product = {}) => {
    if (!product || !product.name) return;
    const key = (product.id || product.name).toString().toLowerCase();
    if (bucket.has(key)) return;
    const tags = new Set();
    if (Array.isArray(product.tags)) {
      product.tags.forEach((tag) => {
        if (tag) tags.add(String(tag));
      });
    }
    if (product.theme) tags.add(String(product.theme));
    if (product.themeName) tags.add(String(product.themeName));
    bucket.set(key, {
      id: product.id,
      name: product.name,
      price: product.price,
      tags: Array.from(tags),
    });
  };

  const ingestList = (list = []) => {
    list.forEach((item) => pushProduct(item));
  };

  ingestList(context.featuredProducts);
  ingestList(context.recentClicks);

  if (context.cart?.items) {
    context.cart.items.forEach((item) =>
      pushProduct({
        id: item.id,
        name: item.name,
        price: item.price,
        tags: item.tags,
      })
    );
  }

  if (Array.isArray(context.orders)) {
    context.orders.forEach((order) => {
      order.items?.forEach((item) =>
        pushProduct({
          id: item.id,
          name: item.name,
          price: item.price,
          tags: item.tags,
          theme: item.theme,
        })
      );
    });
  }

  return Array.from(bucket.values());
};

const findCarSuggestions = (context = {}) => {
  const candidates = collectProductCandidates(context);
  return candidates.filter((candidate) => {
    const haystack = [candidate.name, ...(candidate.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return containsKeyword(haystack, CAR_KEYWORDS);
  });
};

const formatPrice = (value) => {
  if (value == null) return "Giá liên hệ";
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `${number.toLocaleString("vi-VN")} USD`;
};

const parseProductRecommendations = (text, context) => {
  const recommendations = [];

  // Pattern to match product suggestions with ID
  // Format: **Product Name [ID:product_id]** - reason (price)
  const patterns = [
    // Bold markdown with ID: **Product Name [ID:xxx]** - reason
    /\*\*([^\[]+)\s*\[ID:([^\]]+)\]\*\*\s*[-–—]\s*([^\n]+)/gi,
    // Plain text with ID: Product Name [ID:xxx] - reason
    /(?:^|\n)\d*\.?\s*([^\[]+)\s*\[ID:([^\]]+)\]\s*[-–—]\s*([^\n]+)/gi,
    // Fallback: Any [ID:xxx] pattern
    /([^\[]+)\s*\[ID:([^\]]+)\]([^\n]*)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const name = match[1].trim();
      const productId = match[2].trim();
      const details = match[3]?.trim() || "";

      if (name && productId) {
        // Try to find price in details
        const priceMatch = details.match(/(\d+[,.]?\d*)\s*(?:USD|VND|đ)/i);
        const price = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ""))
          : undefined;

        recommendations.push({
          id: productId,
          name,
          price,
          priceLabel: price ? formatPrice(price) : undefined,
          url: `${APP_ORIGIN}/product/${productId}`,
          details: details.replace(/\([^)]*\)/g, "").trim(), // Remove price parentheses
        });
      }
    }

    if (recommendations.length > 0) break; // If we found matches, stop trying other patterns
  }

  // If no structured recommendations found, try to match product IDs from context
  if (recommendations.length === 0 && context) {
    const productPool = collectProductCandidates(context);
    const idPattern = /\[ID:([^\]]+)\]/g;
    const foundIds = new Set();

    let match;
    while ((match = idPattern.exec(text)) !== null) {
      foundIds.add(match[1]);
    }

    foundIds.forEach((id) => {
      const product = productPool.find((p) => p.id === id);
      if (product) {
        recommendations.push({
          id: product.id,
          name: product.name,
          price: product.price,
          priceLabel: product.price ? formatPrice(product.price) : undefined,
          url: `${APP_ORIGIN}/product/${product.id}`,
          tags: product.tags,
        });
      }
    });
  }

  return recommendations.slice(0, 3); // Max 3 recommendations
};

const buildFallbackResponse = (userMessage, context) => {
  const userText = userMessage?.content ?? "";
  const carSuggestions = containsKeyword(userText, CAR_KEYWORDS)
    ? findCarSuggestions(context)
    : [];

  if (carSuggestions.length > 0) {
    const suggestions = carSuggestions.slice(0, 3).map((product, index) => {
      const detailParts = [];
      const priceLabel =
        product.price !== undefined ? formatPrice(product.price) : undefined;
      if (priceLabel) {
        detailParts.push(priceLabel);
      }
      if (product.tags?.length) {
        detailParts.push(product.tags.join(", "));
      }
      const detailText = detailParts.filter(Boolean).join(" • ");
      const url = product.id ? `${APP_ORIGIN}/product/${product.id}` : null;
      return {
        name: product.name,
        price: product.price,
        priceLabel,
        tags: product.tags,
        url,
        details: detailText,
        textLine:
          `${index + 1}. ${product.name}` +
          (detailText ? ` – ${detailText}` : "") +
          (url ? ` (${url})` : ""),
        htmlLine:
          `${index + 1}. ` +
          (url
            ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${product.name}</a>`
            : product.name) +
          (detailText ? ` – ${detailText}` : ""),
      };
    });

    const intro = "Mình có một vài gợi ý chủ đề xe dành cho bạn.";
    const outro = "Bạn muốn xem thêm thông tin sản phẩm nào không?";

    return {
      text: `${intro}\n${outro}`,
      html: `${intro}<br />${outro}`,
      reason: "FALLBACK_SUGGESTIONS",
      recommendations: suggestions.map(({ textLine, htmlLine, ...rest }) => ({
        ...rest,
      })),
    };
  }

  return {
    text: "Hiện mình đang không nhận được phản hồi từ Gemini. Bạn có thể thử hỏi lại hoặc mô tả cụ thể hơn nhé!",
    reason: "FALLBACK_GENERIC",
  };
};

const persistChatSession = async ({
  user,
  sessionId,
  userMessage,
  assistantText,
}) => {
  if (!user?._id) return null;

  const now = new Date();
  const userEntry = {
    sender: "user",
    text: userMessage.content,
    timestamp: userMessage.timestamp ? new Date(userMessage.timestamp) : now,
  };
  const assistantEntry = {
    sender: "assistant",
    text: assistantText,
    timestamp: now,
  };

  if (sessionId) {
    const existing = await ChatLog.findOneAndUpdate(
      { _id: sessionId, userId: user._id },
      {
        $set: { updatedAt: now },
        $push: {
          messages: {
            $each: [userEntry, assistantEntry],
            $slice: -MAX_STORED_MESSAGES,
          },
        },
      },
      { new: true }
    )
      .select("_id title createdAt updatedAt messages")
      .lean();

    if (existing) {
      return {
        id: existing._id.toString(),
        title: existing.title,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        messageCount: existing.messages?.length ?? 0,
      };
    }
  }

  const created = await ChatLog.create({
    userId: user._id,
    title: formatSessionTitle(now),
    messages: [userEntry, assistantEntry],
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: created._id.toString(),
    title: created.title,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    messageCount: 2,
  };
};

const mapSessionPreview = (log) => {
  const lastMessage = Array.isArray(log.messages)
    ? log.messages[log.messages.length - 1]
    : null;
  return {
    id: log._id.toString(),
    title: log.title,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
    messageCount: log.messages?.length ?? 0,
    lastMessagePreview: lastMessage ? truncate(lastMessage.text, 90) : null,
  };
};

const mapSessionDetail = (log) => ({
  id: log._id.toString(),
  title: log.title,
  createdAt: log.createdAt,
  updatedAt: log.updatedAt,
  messages: (log.messages ?? []).map((message, index) => ({
    id: `${log._id}-${index}`,
    role: message.sender === "assistant" ? "assistant" : "user",
    content: message.text,
    timestamp: message.timestamp,
  })),
});

router.post("/chat", async (req, res) => {
  if (!model) {
    return res
      .status(503)
      .json({ message: "AI chat is currently unavailable. Please try later." });
  }

  const {
    messages = [],
    context,
    customer,
    generationConfig,
    sessionId,
  } = req.body ?? {};

  const history = Array.isArray(messages)
    ? messages.filter((msg) => msg?.content)
    : [];

  if (!history.length) {
    return res
      .status(400)
      .json({ message: "Conversation history is required." });
  }

  const latestMessage = history.at(-1);
  if (!latestMessage || latestMessage.role !== "user") {
    return res
      .status(400)
      .json({ message: "The latest message must come from the user." });
  }

  // Load historical conversation from database if sessionId provided
  let dbHistory = [];
  if (sessionId && req.user) {
    try {
      const session = await ChatLog.findOne({
        _id: sessionId,
        userId: req.user._id,
      })
        .select("messages")
        .lean();

      if (session?.messages?.length) {
        // Convert DB messages to format compatible with current history
        dbHistory = session.messages.slice(-20).map((msg) => ({
          role: msg.sender === "assistant" ? "assistant" : "user",
          content: msg.text,
          timestamp: msg.timestamp,
        }));
      }
    } catch (error) {
      console.warn("[ai-chat] Failed to load session history:", error.message);
    }
  }

  const serverContext = req.user
    ? await buildServerContext(req.user, latestMessage.content)
    : {};
  const mergedContext = mergeContext(serverContext, context);
  const effectiveCustomer =
    customer ??
    (req.user
      ? {
          name: req.user.name ?? req.user.fullName ?? undefined,
          email: req.user.email,
        }
      : undefined);

  // Combine DB history with current session history for better context
  const fullHistory = [...dbHistory, ...history];
  const conversationLog = formatHistory(fullHistory.slice(0, -1));

  // Extract product IDs mentioned in conversation history (RAG enhancement)
  const mentionedProductIds = extractProductIdsFromHistory(fullHistory);
  if (mentionedProductIds.length > 0) {
    try {
      const mentionedProducts = await Lego.find({
        _id: { $in: mentionedProductIds },
      })
        .select("name price themeId description pieces stock")
        .populate("themeId", "name")
        .limit(10)
        .lean();

      if (mentionedProducts.length > 0) {
        // Add to context as "previously discussed products"
        if (!mergedContext.previouslyDiscussed) {
          mergedContext.previouslyDiscussed = [];
        }

        mergedContext.previouslyDiscussed = mentionedProducts.map(
          (product) => ({
            id: product._id.toString(),
            name: product.name,
            price: product.price,
            theme: product.themeId?.name,
            description: product.description,
            pieces: product.pieces,
            stock: product.stock,
          })
        );
      }
    } catch (error) {
      console.warn(
        "[ai-chat] Failed to load mentioned products:",
        error.message
      );
    }
  }

  const contextPrompt = buildContextPrompt(mergedContext, effectiveCustomer);

  // Search knowledge base for relevant information (RAG)
  const knowledgeContext = buildKnowledgeContext(latestMessage.content);

  const promptParts = [];

  // Add knowledge base context first (highest priority for FAQ questions)
  if (knowledgeContext) {
    promptParts.push({
      role: "user",
      parts: [{ text: knowledgeContext }],
    });
  }

  if (contextPrompt) {
    promptParts.push({
      role: "user",
      parts: [{ text: contextPrompt }],
    });
  }
  if (conversationLog) {
    promptParts.push({
      role: "user",
      parts: [
        {
          text:
            "Previous conversation history (use as reference):\n" +
            conversationLog +
            "\n\nRespond to the next customer question while keeping previous context and recommendations in mind. " +
            "If the customer is asking follow-up questions about products you mentioned before, reference those products by name and ID.",
        },
      ],
    });
  }

  // Add reminder before each user message
  const reminderText = [
    "CRITICAL REMINDER:",
    "- Keep ALL product names in ENGLISH exactly as provided",
    "- Do NOT translate product names to Vietnamese",
    "- Always include [ID:xxx] after product name when suggesting",
    "- Format: **Product Name [ID:xxx]** - reason (price)",
    "",
    "User question: " + latestMessage.content,
  ].join("\n");

  promptParts.push({
    role: "user",
    parts: [{ text: reminderText }],
  });

  try {
    const response = await model.generateContent({
      contents: promptParts,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 512,
        ...(generationConfig ?? {}),
      },
    });

    const candidate = response.response?.candidates?.[0] ?? {};
    let assistantText = response?.response?.text()?.trim();
    const metadata = {
      citations:
        candidate.groundingMetadata?.web?.filter(
          (item) => item?.title && item?.uri
        ) ?? [],
      finishReason: candidate.finishReason,
    };

    if (!assistantText) {
      const fallback = buildFallbackResponse(latestMessage, mergedContext);
      assistantText = fallback.text;
      metadata.finishReason = fallback.reason;
      metadata.fallback = true;
      if (fallback.html) {
        metadata.html = fallback.html;
      }
      if (fallback.recommendations) {
        metadata.recommendations = fallback.recommendations;
      }
    } else {
      // Parse product recommendations from Gemini's response
      const recommendations = parseProductRecommendations(
        assistantText,
        mergedContext
      );
      if (recommendations.length > 0) {
        metadata.recommendations = recommendations;
      }
    }

    const session = await persistChatSession({
      user: req.user,
      sessionId,
      userMessage: latestMessage,
      assistantText,
    });

    return res.json({
      reply: assistantText,
      metadata,
      session,
    });
  } catch (error) {
    console.error("[ai-chat] Gemini request failed:", error);
    const status = error.status ?? 500;
    return res.status(status).json({
      message:
        error.message ||
        "Unable to generate response at the moment. Please try again.",
    });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, HISTORY_LIMIT);

  const sessions = await ChatLog.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();

  return res.json({
    sessions: sessions.map(mapSessionPreview),
  });
});

router.get("/history/:sessionId", requireAuth, async (req, res) => {
  const session = await ChatLog.findOne({
    _id: req.params.sessionId,
    userId: req.user._id,
  }).lean();

  if (!session) {
    return res.status(404).json({ message: "Chat session not found" });
  }

  return res.json({
    session: mapSessionDetail(session),
  });
});

module.exports = router;
