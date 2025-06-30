const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    wallet: { type: String, required: true, unique: true },
    realName: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true, enum: ['manufacturer', 'retailer', 'pharmacy'] },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;