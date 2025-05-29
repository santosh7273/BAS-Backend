// ✅ Your request is to correct and improve the current backend logic WITHOUT bcrypt
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define schemas
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  rollno: String,
  collgename: String,
  googledrivelink: String,
  description: String,
  dept: String,
  phoneno: String
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  Products: { type: [ProductSchema], default: [] }
});

const Reco = mongoose.model("Reco", userSchema);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access denied, no token provided");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).send("Invalid token");
  }
};

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exist = await Reco.findOne({ email });
    if (exist) return res.status(400).send("User already exists");

    const newUser = new Reco({ name, email, password });
    await newUser.save();
    return res.status(201).send("User registered successfully");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Reco.findOne({ email });
    if (!user || user.password !== password) return res.status(400).send("Invalid credentials");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Update Password
app.post("/updatepassword", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Reco.findOne({ email });
    if (!user) return res.status(400).send("User does not exist");
    user.password = password;
    await user.save();
    return res.status(200).send("Password updated successfully and redirecting you to login...");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Profile
app.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");
    return res.status(200).json({ name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Root
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Sell Product
app.post("/sellproduct", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    user.Products.push(req.body);
    await user.save();
    return res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Get All Products

// My Listings
app.get("/mylistings", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    // Add email field to each product
    const productsWithEmail = user.Products.map(product => ({
      ...product.toObject(),
      email: user.email
    }));

    return res.status(200).json(productsWithEmail);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});


// Get single product by ID (user's product)
app.get("/mylistings/:id", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    const product = user.Products.id(req.params.id);
    if (!product) return res.status(404).send("Product not found");
    return res.json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

// Update product by ID (user's product)
app.put("/mylistings/updateproduct/:id", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    const product = user.Products.id(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    Object.assign(product, req.body);
    await user.save();

    return res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});
app.delete("/mylistings/delete", authenticate, async (req, res) => {
  try {
    const { productId, password } = req.body;

    if (!productId || !password) {
      return res.status(400).json({ message: "Product ID and password are required" });
    }

    const user = await Reco.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Find the index of the product to remove
    const productIndex = user.Products.findIndex(p => p._id.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove product by index
    user.Products.splice(productIndex, 1);

    await user.save();

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
// Get All Products or Search by Name
app.get("/products", authenticate, async (req, res) => {
  try {
    const { name } = req.query;
    const users = await Reco.find({}, ["Products", "email"]);
    let allProducts = users.flatMap(user =>
      user.Products.map(p => ({ ...p.toObject(), email: user.email }))
    );

    // If name query param is provided, filter the products
    if (name) {
      const searchTerm = name.toLowerCase();
      allProducts = allProducts.filter(product =>
        product.name?.toLowerCase().includes(searchTerm)
      );
    }
    return res.status(200).json(allProducts);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));