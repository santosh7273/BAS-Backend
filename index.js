require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
app.use(cors());
app.use(express.json());
//hello world
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
// Define schemas
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rollno: { type: String, required: true },
  collegename: { type: String, required: true },
  googledrivelink: { type: String, required: true },
  description: { type: String, required: true },
  dept: { type: String, required: true },
  phoneno: { type: String, required: true }
});
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  Products: { type: [ProductSchema], default: [], required: true }
});
const Reco = mongoose.model("Reco", userSchema);
// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization; // no Bearer used
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
    const requiredFields = [
      "name", "price", "rollno", "collegename",
      "googledrivelink", "description", "dept", "phoneno"
    ];

    for (let field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

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


// My Listings
app.get("/mylistings", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

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

// Get single product by ID
app.get("/mylistings/:id", authenticate, async (req, res) => {
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
});

// Update product
app.put("/mylistings/updateproduct/:id", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = user.Products.id(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Explicitly update fields expected from frontend
    const {
      name,
      price,
      rollno,
      collegename,
      googledrivelink,
      description,
      dept,
      phoneno
    } = req.body;

    product.name = name ?? product.name;
    product.price = price ?? product.price;
    product.rollno = rollno ?? product.rollno;
    product.collegename = collegename ?? product.collegename;
    product.googledrivelink = googledrivelink ?? product.googledrivelink;
    product.description = description ?? product.description;
    product.dept = dept ?? product.dept;
    product.phoneno = phoneno ?? product.phoneno;

    await user.save();

    return res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});



// Delete product
app.delete("/mylistings/delete", authenticate, async (req, res) => {
  try {
    const { productId, password } = req.body;

    if (!productId || !password) {
      return res.status(400).json({ message: "Product ID and password are required" });
    }

    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const productIndex = user.Products.findIndex(p => p._id.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found" });
    }

    user.Products.splice(productIndex, 1);
    await user.save();

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all products (with optional search)
app.get("/products", authenticate, async (req, res) => {
  try {
    const { name } = req.query;
    const users = await Reco.find({}, ["Products", "email"]);

    let allProducts = users.flatMap(user =>
      user.Products.map(p => ({ ...p.toObject(), email: user.email }))
    );

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
