const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    productType: { type: String, required: true },
    name: { type: String, required: true },
    minPrice: { type: Number, required: true },
    productInfo: { type: String, required: true },
    image: { type: String, required: true }, // Storing the relative image path
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
    auctionStart: { type: Date, default: null }, // New field for auction start time
    auctionEnd: { type: Date, default: null }, // New field for auction end time
    pickupAddress: { type: String, required: true }, // New field for pickup address
    wholesaleQuantity: { type: Number, default: null }, // New field for wholesale quantity
    wholesaleUnit: { type: String, enum: ['kg', 'mt', 'sacks', 'ha', 'm2', 'head', 'liters', 'gallons', 'boxes', 'containers'], default: null } // New field for unit selection
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;