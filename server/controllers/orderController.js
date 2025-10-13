const Order = require("../models/Order");

// get product best sell
const getBestSellProducts = async (req, res) => {
    try {
        const bestSellProducts = await Order.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.legoId", totalSold: { $sum: "$items.quantity" } } },
            { $sort: { totalSold: -1 } },
            { $limit: 10 },
            { $lookup: {
                    from: "legos",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            { $project: { _id: 0, product: 1, totalSold: 1 } }
        ]);
        res.json(bestSellProducts);
    } catch (error) {
        console.error("❌ Error fetching best sell products:", error);
        res.status(500).json({ message: "Server error" });
    }
}   
