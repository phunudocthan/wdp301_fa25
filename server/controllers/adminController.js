const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");

const REVENUE_STATUSES = ["confirmed", "shipped", "delivered"];
const ORDER_STATUS_KEYS = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "canceled",
  "refunded",
];

const asObjectId = (value) => {
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const buildSearchFilter = (searchTerm = "") => {
  const term = searchTerm.trim();
  if (!term) return undefined;

  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return {
    $or: [
      { name: regex },
      { email: regex },
      { phone: regex },
      { role: regex },
    ],
  };
};

const generateSequentialDates = (days) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - idx));
    return d;
  });
};

const generateSequentialMonths = (count) => {
  const current = new Date();
  current.setDate(1);
  current.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(current);
    d.setMonth(d.getMonth() - (count - 1 - idx));
    return d;
  });
};

const toDateKey = (date) => date.toISOString().slice(0, 10);
const toMonthKey = (date) =>
  `${date.getFullYear()}-${(`${date.getMonth() + 1}`).padStart(2, "0")}`;

const formatDateLabel = (date) =>
  date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

const formatMonthLabel = (date) =>
  date.toLocaleDateString("vi-VN", {
    month: "short",
    year: "numeric",
  });

const aggregateRevenueByDate = async ({ startDate, groupFormat }) => {
  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: REVENUE_STATUSES },
        paymentStatus: { $nin: ["failed", "refunded"] },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupFormat,
            date: "$createdAt",
          },
        },
        revenue: { $sum: "$total" },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const data = await Order.aggregate(pipeline);
  return data.reduce((acc, item) => {
    acc[item._id] = item.revenue;
    return acc;
  }, {});
};

exports.getOverviewStats = async (req, res) => {
  try {
    const monthDays = generateSequentialDates(30);
    const startDate = monthDays[0];

    const [revenueMap, orderAgg, userAgg] = await Promise.all([
      aggregateRevenueByDate({
        startDate,
        groupFormat: "%Y-%m-%d",
      }),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ["$status", REVENUE_STATUSES] },
                      {
                        $not: [
                          { $in: ["$paymentStatus", ["failed", "refunded"]] },
                        ],
                      },
                    ],
                  },
                  "$total",
                  0,
                ],
              },
            },
          },
        },
      ]),
      User.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const revenueTotal = Object.values(revenueMap).reduce(
      (acc, value) => acc + Number(value || 0),
      0
    );

    const orderTotals = orderAgg.reduce(
      (acc, entry) => {
        acc.orders += entry.count;
        acc.revenue += Number(entry.revenue || 0);
        acc.statusBreakdown[entry._id] = {
          count: entry.count,
          revenue: Number(entry.revenue || 0),
        };
        return acc;
      },
      { orders: 0, revenue: 0, statusBreakdown: {} }
    );

    const userTotals = userAgg.reduce(
      (acc, entry) => {
        const key = entry._id || "unknown";
        acc.byStatus[key] = entry.count;
        acc.total += entry.count;
        return acc;
      },
      { total: 0, byStatus: {} }
    );

    res.json({
      revenue: {
        last30Days: revenueTotal,
      },
      orders: orderTotals,
      users: userTotals,
    });
  } catch (error) {
    console.error("getOverviewStats error:", error);
    res.status(500).json({ message: "Failed to fetch overview stats" });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const weekDays = generateSequentialDates(7);
    const monthDays = generateSequentialDates(30);
    const yearMonths = generateSequentialMonths(12);

    const [weekMap, monthMap, yearMap] = await Promise.all([
      aggregateRevenueByDate({
        startDate: weekDays[0],
        groupFormat: "%Y-%m-%d",
      }),
      aggregateRevenueByDate({
        startDate: monthDays[0],
        groupFormat: "%Y-%m-%d",
      }),
      aggregateRevenueByDate({
        startDate: yearMonths[0],
        groupFormat: "%Y-%m",
      }),
    ]);

    const buildSeries = (dates, map, keyFn, labelFn) => {
      const labels = [];
      const data = [];
      let total = 0;

      dates.forEach((date) => {
        const key = keyFn(date);
        const value = Number(map[key] || 0);
        labels.push(labelFn(date));
        data.push(value);
        total += value;
      });

      return { labels, data, total };
    };

    res.json({
      week: buildSeries(weekDays, weekMap, toDateKey, formatDateLabel),
      month: buildSeries(monthDays, monthMap, toDateKey, formatDateLabel),
      year: buildSeries(yearMonths, yearMap, toMonthKey, formatMonthLabel),
    });
  } catch (error) {
    console.error("getRevenueStats error:", error);
    res.status(500).json({ message: "Failed to fetch revenue stats" });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", REVENUE_STATUSES] },
                    { $not: [{ $in: ["$paymentStatus", ["failed", "refunded"]] }] },
                  ],
                },
                "$total",
                0,
              ],
            },
          },
        },
      },
    ]);

    const totals = statusCounts.reduce(
      (acc, item) => {
        acc.orders += item.count;
        acc.revenue += Number(item.revenue || 0);
        return acc;
      },
      { orders: 0, revenue: 0 }
    );

    const statusBreakdown = ORDER_STATUS_KEYS.reduce((acc, key) => {
      acc[key] = { count: 0, revenue: 0 };
      return acc;
    }, {});

    statusCounts.forEach((item) => {
      const key = item._id;
      if (!statusBreakdown[key]) {
        statusBreakdown[key] = { count: 0, revenue: 0 };
      }
      statusBreakdown[key].count = item.count;
      statusBreakdown[key].revenue = Number(item.revenue || 0);
    });

    const recent = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email");

    res.json({
      totals,
      statusBreakdown,
      recent: recent.map((order) => ({
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        customer: order.userId
          ? {
              id: order.userId._id.toString(),
              name: order.userId.name,
              email: order.userId.email,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("getOrderStats error:", error);
    res.status(500).json({ message: "Failed to fetch order stats" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      role,
      status,
      search,
      sort = "-createdAt",
    } = req.query;

    const numericLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) Object.assign(filter, searchFilter);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort(sort)
        .skip(skip)
        .limit(numericLimit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit) || 1,
      },
    });
  } catch (error) {
    console.error("listUsers error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserDetail = async (req, res) => {
  try {
    const userId = asObjectId(req.params.id);
    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [stats] = await Order.aggregate([
      {
        $match: {
          userId,
        },
      },
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);

    const recentOrders = await Order.find({ userId })
      .select("orderNumber status total createdAt paymentStatus")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user,
      stats: stats
        ? {
            totalOrders: stats.totalOrders,
            totalSpent: stats.totalSpent,
            lastOrderAt: stats.lastOrderAt,
          }
        : {
            totalOrders: 0,
            totalSpent: 0,
            lastOrderAt: null,
          },
      recentOrders,
    });
  } catch (error) {
    console.error("getUserDetail error:", error);
    res.status(500).json({ message: "Failed to fetch user detail" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { action } = req.body || {};
    const userId = asObjectId(req.params.id);

    if (!action || !["block", "unblock"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user._id.equals(userId)) {
      return res
        .status(400)
        .json({ message: "You cannot modify your own status" });
    }

    const update =
      action === "block"
        ? { status: "locked", lockUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
        : { status: "active", lockUntil: null, failedLoginAttempts: 0 };

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: action === "block" ? "User locked" : "User unlocked",
      user,
    });
  } catch (error) {
    console.error("toggleUserStatus error:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
};
