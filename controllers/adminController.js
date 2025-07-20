const Admin = require("../models/admin_model");
const Reco = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AdminLogin=async (req,res)=>{
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).send("Invalid credentials");
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).send("Invalid credentials");
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return res.status(200).json({ token });
      } catch (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }
}
const productstobeapproved=async(req,res)=>{
    try {
    const users = await Reco.find({}, ["Products", "email"]);

    const allProducts = users.flatMap(user =>
      user.Products
        .filter(p => p.approved_string === "Pending")
        .map(p => ({
          ...p.toObject(),
          email: user.email // attaching seller email to each product
        }))
    );

    return res.status(200).json(allProducts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const ApproveProduct=async(req,res)=>{
    try {
    const { id } = req.params;
    const { email } = req.body;
    const user = await Reco.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const product = user.Products.id(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.approved_status = true;
    product.approved_string = "Approved";
    await user.save();

    return res.status(200).json({ message: "Product approved successfully", product });
  } catch (err) {
    console.error("Error approving product:", err);
    return res.status(500).json({ message: "Server Error" });
  }
}
const rejectproduct=async(req,res)=>{
    try {
    const { id } = req.params;
    const { email } = req.body;
    const user = await Reco.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = user.Products.id(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.approved_status = false;
    product.approved_string = "Rejected";
    await user.save();

    return res.status(200).json({ message: "Product rejected successfully" });
  } catch (err) {
    console.error("Error rejecting product:", err);
    return res.status(500).json({ message: "Server Error" });
  }
}

const AdminProfile=async(req,res)=>{
    try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).send("Admin not found");
    return res.status(200).json({ name: admin.name, email: admin.email });
  } catch (err) { 
    console.error(err);
  }
}
const createAdmin = async () => {
  try {
    const name = "Santosh Kumar Tyada";
    const email = "ktsantosh5@gmail.com";
    const password = "Santosh@1";
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();
    console.log("Admin created successfully.");
  } catch (err) {
    console.error("Error creating admin:", err);
  }
};
module.exports = {
  AdminLogin,
    productstobeapproved,
    ApproveProduct,
    rejectproduct,
    AdminProfile
};