const Notification = require("../../models/notification"); // Import Notification model
const AuctionParticipation = require("../../models/participateAuction");
const AuctionSession = require("../../models/auctionSession");
const Product = require("../../models/product");

module.exports.results = async (req, res) => {
  try {
    const { productId } = req.params;

    const auctionSession = await AuctionSession.find({ product: productId })
      .populate("product")
      .populate("seller")
      .populate("buyer");

    if (!auctionSession || auctionSession.length === 0) {
      return res.status(404).render("buyer/auctionResult", {
        message: "Auction session not found or no bids placed.",
        auctionSession,
        highestBid: null,
        winner: null,
        bidRanking: [],
      });
    }

    console.log("auctionSession", auctionSession);

    // Sort bids in descending order (highest to lowest)
    const bidRanking = auctionSession
      .sort((a, b) => b.bid - a.bid)
      .map((bid, index, arr) => {
        const rank = index > 0 && bid.bid === arr[index - 1].bid ? arr[index - 1].rank : index + 1;
        return {
          rank,
          bidder: `${bid.buyer.firstName ?? "Unknown"} ${bid.buyer.lastName ?? ""}`.trim(),
          image: bid.buyer.profilePicture || "default-profile.png",
          phone: bid.buyer.phoneNumber || "N/A",
          bidAmount: bid.bid,
          buyerId: bid.buyer?._id || null, // Ensure buyer ID is assigned properly
        };
      });

    const winner = bidRanking.length > 0 ? bidRanking[0] : null;

    if (winner && winner.buyerId) {
      // Check if a notification already exists to avoid duplicates
      const existingNotification = await Notification.findOne({
        user: winner.buyerId,
        product: auctionSession[0].product._id,  // Ensure the notification is specific to the product
      });
      

      if (!existingNotification) {
        const notification = new Notification({
          user: winner.buyerId,
          product: auctionSession[0].product._id,  // Store product reference
          message: `🎉 Congratulations! You won the auction for "${auctionSession[0].product.name}" with a bid of ₱${winner.bidAmount}. The product is ready for pickup. Contact the seller to complete the transaction.`,
          status: "unread",
          createdAt: new Date(),
        });
      
        await notification.save();
        console.log(`✅ Notification sent to buyer: ${winner.buyerId}`);
      } else {
        console.log(`⚠️ Notification already exists for buyer: ${winner.buyerId}`);
      }
      
    } else {
      console.log("❌ No valid winner found or buyer ID is missing.");
    }

    console.log("bidRanking", bidRanking);
    console.log("winner", winner);

    res.render("buyer/auctionResult", {
      auctionSession,
      highestBid: bidRanking,
      winner,
      bidRanking,
    });
  } catch (error) {
    console.error("❌ Error processing auction results:", error);
    res.status(500).render("buyer/auctionResult", {
      message: "An error occurred while fetching the auction result.",
      auctionSession: [],
      highestBid: null,
      winner: null,
      bidRanking: [],
    });
  }
};
module.exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.query.notification_id;
    await Notification.findByIdAndDelete(notificationId); // Delete instead of updating

    res.redirect("/buyer/index");
  } catch (error) {
    console.error("Error deleting notification:", error);
    req.flash("error", "Failed to remove notification.");
    res.redirect("/buyer/index");
  }
};

