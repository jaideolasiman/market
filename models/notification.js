const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Buyer
  message: String,
  status: { type: String, default: "unread" }, // unread or read
  createdAt: { type: Date, default: Date.now },
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: "AuctionSession" }, // Ensure one notification per auction
  replies: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Buyer ID
      message: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// Ensure unique notifications per auction per user
notificationSchema.index({ user: 1, auctionId: 1 }, { unique: true });

module.exports = mongoose.model("Notification", notificationSchema);
