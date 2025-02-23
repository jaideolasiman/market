const mongoose = require('mongoose');

const auctionResultSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('auctionResult', auctionResultSchema);