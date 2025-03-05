const mongoose = require('mongoose');

const auctionResultSchema = new mongoose.Schema({
    auctionSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuctionSession', // Links to the auction session
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Links to the auctioned product
        required: true
    },
    highestBid: {
        bidAmount: {
            type: Number,
            required: true
        },
        bidder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Links to the winning bidder
            required: true
        }
    },
    auctionStartTime: {
        type: Date,
        required: true
    },
    auctionEndTime: {
        type: Date,
        required: true
    },
    auctionEnded: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending Approval', 'Approved', 'Rejected'],
        default: 'Pending Approval' // Default status until the farmer approves
    },
    resultDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('AuctionResult', auctionResultSchema);
