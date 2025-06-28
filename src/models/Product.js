const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    productIdentification: { type: String, required: true },
    materials: { type: String, required: true },
    design: { type: String, required: false },
    specifications: { type: String, required: false },
    lifecycle: { type: String, required: false },
    installation_maintenance: { type: String, required: false },
    composition: { type: String, required: false },
    microplastics: { type: String, required: false },
    env_impact: { type: String, required: false },
    repair_replace: { type: String, required: false },
    reuse_recycling: { type: String, required: false },
    maintenance: { type: String, required: false },
    warranty: { type: String, required: false },
    energy_recovery: { type: String, required: false },
    substance_of_concern: { type: String, required: false },
    image: {
        data: Buffer,
        contentType: String,
    }
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;