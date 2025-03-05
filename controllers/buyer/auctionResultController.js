//const ResultAuction = require('../../models/auctionResult');
const AuctionParticipation = require("../../models/participateAuction"); // Import AuctionSession model
const AuctionSession = require("../../models/auctionSession"); // Import AuctionSession model
const Product = require("../../models/product"); // Import Product model (if needed)

module.exports.results = async (req, res) => {
  try {
    const { productId } = req.params;

    const auctionSession = await AuctionSession.find({ product: productId })
      .populate("product")
      .populate("seller")
      .populate("buyer"); // Ensure the buyer is populated

    if (!auctionSession || auctionSession.length === 0) {
      return res.status(404).render("buyer/auctionResult", {
        message: "Auction session not found or no bids placed.",
        auctionSession,
        highestBid,
        winner,
        bidRanking,
      });
    }

    console.log("auctionSession", auctionSession);

    // Sort bids in descending order (highest to lowest)
    const bidRanking = auctionSession
    .sort((a, b) => b.bid - a.bid) // Sort bids in descending order
    .map((bid, index, arr) => {
        // Assign rank based on position & duplicate values
        const rank = index > 0 && bid.bid === arr[index - 1].bid 
            ? arr[index - 1].rank  // Keep same rank for tied bids
            : index + 1;

        return {
            rank: rank, 
            bidder: `${bid.buyer.firstName ?? 'Unknown'} ${bid.buyer.lastName ?? ''}`.trim(),
            image: bid.buyer.profilePicture || 'default-profile.png', // Fallback for missing images
            phone: bid.buyer.phoneNumber || 'N/A', // Fallback for missing phone number
            bidAmount: bid.bid,
        };
    });

    const winner = bidRanking.length > 0 ? bidRanking[0] : null;

    console.log("bidRanking", bidRanking);
    console.log("winner", winner);

    res.render("buyer/auctionResult", {
      auctionSession,
      highestBid: bidRanking, // Highest bid at index 0
      winner, // Winner is now correctly the highest bidder
      bidRanking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("buyer/auctionResult", {
      message: "An error occurred while fetching the auction result.",
      auctionSession,
      highestBid,
      winner,
      bidRanking,
    });
  }
};
