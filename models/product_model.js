const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rollno: { type: String, required: true },
  collegename: { type: String, required: true },
  googledrivelink: { type: String, required: true },
  description: { type: String, required: true },
  dept: { type: String, required: true },
  phoneno: { type: String, required: true },
  approved_status: { type: Boolean, default: false },
  approved_string: { type: String, default: "Pending" }
});
module.exports=ProductSchema;