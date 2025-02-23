//onst ResultAuction = require('../../models/auctionResult');
const AuctionParticipation = require("../../models/participateAuction"); // Import AuctionSession model
const AuctionSession = require("../../models/auctionSession"); // Import AuctionSession model
const Product = require("../../models/product"); // Import Product model (if needed)

module.exports.results = async (req, res) => {
  try {
    const { productId } = req.params;

    const auctionSession = await AuctionSession.find({
      product: productId,
    })
      .populate("product")
      .populate("seller")
      .populate("buyer"); // Ensure the buyer is populated

    if (!auctionSession) {
      return res.status(404).render("buyer/auctionResult", {
        message: "Auction session not found or no bids placed.",
        auctionSession,
        highestBid,
        winner,
        bidRanking,
      });
    }

    console.log("auctionSession", auctionSession);
    // Create the bidRanking array by sorting bids in descending order (highest to lowest)
    const bidRanking = auctionSession
      ? auctionSession
          .sort((a, b) => b.amount - a.amount) // Sorting bids in descending order (highest to lowest)
          .map((bid, index) => ({
            rank: index + 1,
            bidder: `${bid.buyer.firstName} ${bid.buyer.lastName}`, // The bidder is the buyer
            image: bid.buyer.profilePicture,
            phone: bid.buyer.phoneNumber,
            bidAmount: bid.bid,
          }))
      : []; // Default to an empty array if no bids exist
      const winner = bidRanking[0];
          console.log('bidRanking', bidRanking)
    // const resultAuction = new auctionResult({
    //   product: auctionSession.product,
    //   highestBid: {
    //     bidAmount: highestBid,
    //     bidder: winner._id,
    //   },
    //   auctionEnded: true,
    //   resultDate: new Date(),
    // });

    // try {
    //   await resultAuction.save();
    //   console.log("Auction result saved:", resultAuction);
    // } catch (err) {
    //   console.error("Error saving auction result:", err);
    // }

    // Pass the bidRanking data to the view
    res.render("buyer/auctionResult", {
      auctionSession,
      highestBid: bidRanking,
      winner,
      bidRanking, // Send the bidRanking to the view
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("buyer/auctionResult", {
      message: "An error occurred while fetching the auction result.",
      auctionSession: null,
      highestBid: [],
      winner: null,
      bidRanking: [],
    });
  }
};
