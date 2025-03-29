const AuctionResult = require('../../models/auctionResult'); // Import AuctionResult model
const User = require('../../models/user');
const Product = require('../../models/product');


module.exports.index = async (req, res) => {
  try {
    // ✅ Ensure user is logged in
    if (!req.session.login) {
      console.log("User not logged in, redirecting to login.");
      return res.redirect('/login');
    }

    // ✅ Fetch logged-in user details
    const userLogin = await User.findById(req.session.login);
    console.log("Logged-in User:", userLogin);

    if (userLogin.role.toLowerCase() !== 'admin') {
      console.warn(`Access Denied: User ${userLogin.email} is not an Admin.`);
      return res.status(403).send('Access Denied: Admins only');
    }

    // ✅ Handle search query
    let searchAuction = req.query.searchAuction || '';

    // ✅ Query auction results with full related data
    const auctionResults = await AuctionResult.find()
  .populate({
    path: 'product',
    select: 'name image _id seller', // Ensure _id is selected
    populate: {
      path: 'seller',
      select: 'firstName lastName',
    }
  })
  .populate({
    path: 'highestBid',
    select: 'bidAmount bidder',
    populate: {
      path: 'bidder',
      select: 'firstName lastName phoneNumber'
    }
  })
  .populate({
    path: 'auctionSession',
    select: 'sessionName startTime endTime'
  })
  .lean();

  auctionResults.forEach(result => {
    console.log("Auction ID:", result._id);
    console.log("Highest Bid Object:", result.highestBid); 
    console.log("Winning Bid Amount:", result.highestBid?.bidAmount); 
});

// ✅ Ensure each auction result contains winner details
const formattedResults = auctionResults.map(result => ({
  ...result,
  winner: {
    name: result.winnerName,
    profile: result.winnerProfile,
    phone: result.winnerPhone,
  },
  winningBid: result.winningBid 
    ? `₱${result.winningBid.toLocaleString()}`
    : 'No Bids',
}));
// ✅ Debugging: Final output check
console.log("Final Auction Results:", formattedResults);

res.render('admin/manageAuctionsResult', {
  auctionResults: formattedResults, 
  userLogin,
  searchAuction,
  site_title: 'PAO',
  title: 'Manage Auction Results',
  session: req.session,
});


  } catch (error) {
    console.error('Error displaying Manage Auction Results:', error);
    res.status(500).render('500', {
      error: 'An error occurred while loading the Manage Auction Results page.',
    });
  }
};


module.exports.delete = async (req, res) => {
  try {
    const { auctionId } = req.body;

    if (!auctionId) {
      return res.status(400).json({ error: 'Auction ID is required' });
    }

    // Find and delete the auction result
    const deletedAuction = await AuctionResult.findByIdAndDelete(auctionId);

    if (!deletedAuction) {
      return res.status(404).json({ error: 'Auction result not found' });
    }

    req.flash('success', 'Auction result deleted successfully');
    res.redirect('/admin/manageAuctionResult'); // Redirect back to the auction results page
  } catch (error) {
    console.error('Error deleting auction result:', error);
    req.flash('error', 'Failed to delete auction result');
    res.status(500).redirect('/admin/manageAuctionResult');
  }
};