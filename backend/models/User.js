const mongoose = require('mongoose'); 
const UserSchema = new mongoose.Schema({ 
email: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, 
mobile: { type: String, unique: true, sparse: true, trim: true }, 
password: { type: String, required: true }, 
createdAt: { type: Date, default: Date.now } 
}); 
module.exports = mongoose.model('User', UserSchema);
