const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true },
    identification: { type: String, required: true },
    materials: { type: [String], required: true },
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;