const Reco= require('../models/user_model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Userprofile = async (req, res) => {
      try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");
    return res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const sellproduct=async (req, res) => {
    try {
    const { name, price, rollno, collegename, googledrivelink, description, dept, phoneno } = req.body;
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    const product = {
      name, price, rollno, collegename, googledrivelink,
      description, dept, phoneno,
      approved_status: false,
      approved_string: "Pending"
    };

    user.Products.push(product);
    await user.save();
    return res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const getallproducts=async(req,res)=>{
    try {
    const { name } = req.query;
    const users = await Reco.find({}, ["Products", "email"]);

   let allProducts = users.flatMap(user =>
  user.Products.map(p => ({ ...p.toObject(), email: user.email }))
);
    allProducts = allProducts.filter(p => p.approved_status === true);
    if (name) {
      const searchTerm = name.toLowerCase();
      allProducts = allProducts.filter(p => p.name?.toLowerCase().includes(searchTerm));
    }

    if (allProducts.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    return res.status(200).json(allProducts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
    }
const mylistings=async(req,res)=>{
    try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    const productsWithEmail = user.Products.map(p => ({ ...p.toObject(), email: user.email }));
    return res.status(200).json(productsWithEmail);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const getproductbyid=async(req,res)=>{
     try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    const product = user.Products.id(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const updateproduct=async(req,res)=>{
     try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = user.Products.id(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const updates = ["name", "price", "rollno", "collegename", "googledrivelink", "description", "dept", "phoneno"];
    updates.forEach(field => {
      if (req.body[field]) product[field] = req.body[field];
    });
    product.approved_status = false;
    product.approved_string = "Pending";
    await user.save();
    return res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ message: "Server Error" });
  }
}
const deleteproduct=async(req,res)=>{
      try {
        const { password } = req.body;
        const { productId } = req.params;
        const user = await Reco.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid password" });
    
        // Find the product within the user's products array
        const product = user.Products.id(productId);
    
        if (!product) return res.status(404).json({ message: "Product not found" });
    
        // --- CORRECTED LINE ---
        // Option 1: Using pull (recommended for removing by ID or object)
        user.Products.pull(productId); // Or user.Products.pull(product._id); or user.Products.pull(product);
    
        // Option 2: Filtering the array (another valid approach)
        // user.Products = user.Products.filter(p => p._id.toString() !== productId);
        // --- END CORRECTED LINE ---
    
        await user.save();
    
        return res.status(200).json({ message: "Product deleted successfully" });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
      }
    }
const login = async (req, res) => {try {
    const { email, password } = req.body;
    const user = await Reco.findOne({ email });
    if (!user) return res.status(400).send("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid credentials");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
}
const register=async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exist = await Reco.findOne({ email });
        if (exist) return res.status(400).send("User already exists");
    
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new Reco({ name, email, password: hashedPassword });
        await newUser.save();
        return res.status(201).send("User registered successfully");
      } catch (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }
    }
    const updatepassword=async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await Reco.findOne({ email });
            if (!user) return res.status(400).send("User does not exist");
        
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            return res.status(200).send("Password updated successfully");
          } catch (err) {
            console.error(err);
            return res.status(500).send("Server Error");
          }
        }
const createUser = async () => {
  try {
    const name = "Krishna";
    const email = "krishna12@gmail.com";
    const password = "Krishna@1";

    const existingUser = await Reco.findOne({ email });
    if (existingUser) {
      console.log("User already exists.");
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new Reco({
      name,
      email,
      password: hashedPassword,
      Products: [], // optional if default is set
    });

    await newUser.save();
    console.log("User created successfully.");
  } catch (err) {
    console.error("Error creating user:", err);
  }
};
module.exports = { Userprofile, sellproduct, getallproducts, mylistings, getproductbyid, updateproduct, deleteproduct, login, register, updatepassword };