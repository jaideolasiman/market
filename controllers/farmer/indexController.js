const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("../../models/user");
const Category = require("../../models/category");
const Product = require("../../models/product");
const upload = require("../../middlewares/uploads");
const Notification = require("../../models/notification");
const Order = require("../../models/order");
const AuctionSession = require("../../models/auctionSession");
const AuctionResult = require("../../models/auctionResult");
const AuctionParticipation = require("../../models/participateAuction");
const SITE_TITLE = "PAO";

module.exports.index = async (req, res) => {
  try {
    const userLogin = await User.findById(req.session.login);
    if (!userLogin) {
      req.flash("error", "Please log in first.");
      return res.redirect("/login");
    }

    const categories = await Category.find();

    // Fetch only the products added by the logged-in farmer and exclude rejected ones
    const products = await Product.find({
      seller: req.session.login,
      status: { $ne: "rejected" },
    });

    // Separate products by type
    const retailProducts = products.filter(
      (product) => product.productType === "retail"
    );
    const wholesaleProducts = products.filter(
      (product) => product.productType === "wholesale"
    );

    // Group products by category
    const groupedProducts = categories.map((category) => ({
      category,
      retailProducts: retailProducts.filter(
        (product) => product.category.toString() === category._id.toString()
      ),
      wholesaleProducts: wholesaleProducts.filter(
        (product) => product.category.toString() === category._id.toString()
      ),
    }));

    // ✅ If there's a notification ID in the query, update it to "read"
    if (req.query.notification_id) {
      await Notification.findByIdAndUpdate(req.query.notification_id, {
        status: "read",
      });
    }

    // Fetch unread notifications
    const notifications = await Notification.find({ user: req.session.login });

    res.render("farmer/index.ejs", {
      site_title: SITE_TITLE,
      title: "Home",
      session: req.session,
      categories,
      userLogin,
      groupedProducts,
      retailProducts,
      wholesaleProducts,
      messages: req.flash(),
      currentUrl: req.originalUrl,
      notifications,
    });
  } catch (error) {
    console.error("Error loading farmer dashboard:", error);
    req.flash("error", "Something went wrong.");
    res.redirect("/login");
  }
};

module.exports.addProduct = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("/farmer/index");
    }

    if (!req.file) {
      req.flash("error", "Please upload a product image.");
      return res.redirect("/farmer/index");
    }

    const {
      category,
      productType,
      name,
      minPrice,
      productInfo,
      auctionStart,
      auctionEnd,
      pickupAddress,
      wholesaleQuantity,
      wholesaleUnit,
    } = req.body;

    if (
      !category ||
      !productType ||
      !name ||
      !minPrice ||
      !productInfo ||
      !pickupAddress ||
      (productType === "wholesale" && (!wholesaleQuantity || !wholesaleUnit))
    ) {
      req.flash("error", "All fields, including pickup address and wholesale details, are required.");
      return res.redirect("/farmer/index");
    }

    try {
      const productImagePath = "/img/product/" + req.file.filename;

      // Create a new product with status "pending"
      const newProduct = new Product({
        category,
        productType,
        name,
        minPrice,
        productInfo,
        image: productImagePath,
        seller: req.session.login,
        pickupAddress,
        auctionStart: productType === "wholesale" ? auctionStart || null : null,
        auctionEnd: productType === "wholesale" ? auctionEnd || null : null,
        wholesaleQuantity: productType === "wholesale" ? wholesaleQuantity : null,
        wholesaleUnit: productType === "wholesale" ? wholesaleUnit : null,
        status: "pending", // ✅ Default status: pending approval
      });

      await newProduct.save();

      console.log("New product added, awaiting admin approval:", newProduct);

      req.flash(
        "success",
        `Product submitted for approval. Awaiting admin review.`
      );
      res.redirect("/farmer/index");
    } catch (error) {
      console.error("Error saving product:", error);
      req.flash("error", "Error saving product: " + error.message);
      res.redirect("/farmer/index");
    }
  });
};
module.exports.getBuyers = async (req, res) => {
  try {
    const farmerId = req.session.login; // ✅ Ensure farmer is logged in

    if (!farmerId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // ✅ Find orders where the product belongs to the logged-in farmer
    const orders = await Order.find({})
      .populate({
        path: "buyer",
        select: "firstName lastName phoneNumber", // ✅ Include phoneNumber
      })
      .populate({
        path: "product",
        select: "name seller",
      });

    // ✅ Filter orders where the seller (farmer) matches the logged-in farmer
    const filteredOrders = orders.filter(
      (order) => order.product.seller.toString() === farmerId
    );

    if (!filteredOrders.length) {
      return res.json([]); // Return empty array if no orders found
    }

    const buyerData = filteredOrders.map((order) => ({
      _id: order._id,
      buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      phoneNumber: order.buyer.phoneNumber, // ✅ Include phone number
      productName: order.product.name,
      quantity: order.quantity,
      status: order.status,
    }));

    res.json(buyerData);
  } catch (error) {
    console.error("Error fetching buyers:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.query.notification_id; // Use query param here
    const notification = await Notification.findById(notificationId);

    if (notification) {
      notification.status = "read"; // Update the status
      await notification.save();
    }

    // After marking as read, redirect back to the farmer dashboard
    res.redirect("/farmer/index");
  } catch (error) {
    console.error("Error updating notification status:", error);
    req.flash("error", "Failed to update notification.");
    res.redirect("/farmer/index");
  }
};

module.exports.getFarmerOrders = async (req, res) => {
  try {
    const farmerId = req.session.login; // Farmer's ID

    if (!farmerId) {
      return res.status(401).json({ error: "Unauthorized access." });
    }

    // Fetch orders where the product belongs to the farmer
    const orders = await Order.find({})
      .populate({
        path: "product",
        match: { seller: farmerId },
        select: "name seller status", // Ensure seller is included
      })
      .populate("buyer", "firstName lastName email phoneNumber"); // Fetch buyer details

    // Debugging output
    console.log(
      "Orders with populated buyer:",
      JSON.stringify(orders, null, 2)
    );

    // Filter out orders where product.seller does not match farmerId
    const farmerOrders = orders.filter(
      (order) =>
        order.product && order.product.seller.toString() === farmerId.toString()
    );

    // Map filtered orders to a clean format
    const ordersData = farmerOrders.map((order) => ({
      _id: order._id,
      buyerName: order.buyer
        ? `${order.buyer.firstName} ${order.buyer.lastName}`
        : "Unknown Buyer", // Fix missing name issue
      phoneNumber: order.phoneNumber || "No Phone",
      productName: order.product ? order.product.name : "Unknown Product",
      quantity: order.quantity,
      totalPrice: order.totalPrice, // ✅ Added total price
      status: order.status,
    }));

    res.json(ordersData);
  } catch (error) {
    console.error("Error fetching farmer orders:", error);
    res.status(500).json({ error: "Server error." });
  }
};

module.exports.processOrder = async (req, res) => {
  const { orderId, action } = req.body;

  try {
    const updatedStatus = action === "approve" ? "Approved" : "Rejected";

    // ✅ Find and update the order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: updatedStatus },
      { new: true }
    ).populate("product"); // Ensure we get the product details

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Ensure the order has a product before sending the notification
    if (!order.product) {
      return res
        .status(400)
        .json({ message: "Order does not have a valid product." });
    }

    // ✅ Create notification for the buyer if the order is approved
    if (updatedStatus === "Approved") {
      const notification = new Notification({
        user: order.buyer, // Buyer ID
        message: `Your order for '${order.product.name}' has been approved by the seller. Your order is ready to pick up.`,
        status: "unread",
      });

      await notification.save();
    }

    res.json({ message: `Order ${updatedStatus.toLowerCase()} successfully!` });
  } catch (error) {
    console.error("❌ Error processing order:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId; // Get the order ID from the form submission

    // Find the order by ID and delete it
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Optionally delete the associated product if needed
    // const product = await Product.findByIdAndDelete(order.product);

    console.log(`Order with ID: ${orderId} has been deleted.`); // Log for debugging

    // Redirect back to the manage orders page after deletion
    res.redirect("/admin/manageAuctions"); // Update with the correct route if needed
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports.showBuyers = async (req, res) => {
  try {
    const productId = req.query.productId;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Fetch orders for the given productId
    const orders = await Order.find({ product: productId }).populate(
      "buyer",
      "firstName lastName"
    );
    console.log("b", orders);
    // Extract buyer details
    const buyers = orders.map((order) => ({
      firstName: order.buyer ? order.buyer.firstName : "Unknown",
      lastName: order.buyer ? order.buyer.lastName : "Buyer",
    }));

    // Send JSON response instead of rendering a new page
    return res.json({ buyers });
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
module.exports.showParticipated = async (req, res) => {
  try {
    const orders = await AuctionParticipation.find({ product: req.query.productId })
    // "buyer",
    // "firstName lastName"

    console.log('asd', orders.length)
    console.log('asd', orders)

    const participated = orders.map((order) => ({
      firstName: order.buyer ? order.buyer.firstName : "Unknown",
      lastName: order.buyer ? order.buyer.lastName : "Buyer",
    }));

    if (!orders.length) {
      return res.status(404).json({ message: "No participated orders found." });
    }

    return res.json(participated);
  } catch (error) {
    console.error("Error fetching buyers:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports.getAuctionResults = async (req, res) => {
  try {
    const auctionResults = await AuctionSession.find({ "highestBid.bidder": { $ne: null } }) // Fetch only auctions with a winner
      .populate("highestBid.bidder", "firstName lastName profilePicture") // Populate winner details
      .populate("product", "name") // Populate product details
      .lean();

    const formattedResults = auctionResults.map(auction => {
      // Extract winner (Rank #1)
      const bidRanking = auction.bids
        ?.sort((a, b) => b.amount - a.amount) // Sort bids from highest to lowest
        .map((bid, index, arr) => ({
          rank: index > 0 && bid.amount === arr[index - 1].amount ? arr[index - 1].rank : index + 1, // Assign rank
          bidder: bid.bidder ? `${bid.bidder.firstName} ${bid.bidder.lastName}` : "Unknown",
          profilePicture: bid.bidder?.profilePicture || "/public/img/default-avatar.png",
          bidAmount: bid.amount,
        }));

      const winner = bidRanking?.[0] || null; // Get Rank #1

      return {
        _id: auction._id,
        winnerName: winner?.bidder || "Unknown",
        profilePicture: winner?.profilePicture || "/public/img/default-avatar.png",
        productName: auction.product?.name || "Unknown Product",
        winningBid: winner?.bidAmount || 0,
        status: auction.status || "Pending",
        rank: winner?.rank || 1, // Explicitly state Rank #1
      };
    });

    res.json(formattedResults); // Send JSON response
  } catch (error) {
    console.error("Error fetching auction results:", error);
    res.status(500).json({ error: "Server error fetching auction results" });
  }
};


module.exports.approveAuctionResult = async (req, res) => {
  const { resultId } = req.body;

  try {
    const resultAuction = await ResultAuction.findById(resultId)
      .populate("highestBid.bidder")
      .populate("product");

    if (!resultAuction) {
      return res.status(404).json({ message: "Auction result not found" });
    }

    if (resultAuction.auctionEnded) {
      return res.status(400).json({ message: "Auction already approved." });
    }

    // Update the result status to 'Approved'
    resultAuction.auctionEnded = true;
    await resultAuction.save();

    // Notify the winner
    const notification = new Notification({
      user: resultAuction.highestBid.bidder._id, // Buyer ID
      message: `Congratulations! Your auction bid for '${resultAuction.product.name}' has been approved. Please coordinate with the seller for payment.`,
      status: "unread",
    });

    await notification.save();

    res.json({ message: "Auction result approved successfully!" });
  } catch (error) {
    console.error("Error approving auction result:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
