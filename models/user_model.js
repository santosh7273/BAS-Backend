const mongoose = require('mongoose');
const ProductSchema = require('./product_model'); // Importing ProductSchema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  Products: { type: [ProductSchema], default: [], required: true }
});
const Reco = mongoose.model("Reco", userSchema);
module.exports = Reco;