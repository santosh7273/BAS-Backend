// Complete modified Express backend with corrections
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());
// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
// Schemas
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
});
const Admin = mongoose.model("Admin", AdminSchema);
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
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true },
  Products: { type: [ProductSchema], default: [], required: true }
});
const Reco = mongoose.model("Reco", userSchema);
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
// Middleware
const AdminAuthenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access denied, no token provided");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(400).send("Invalid token");
  }
};

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

// Routes
app.post("/admin_login", async (req, res) => {
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
});
// Route: GET /productstobeapproved
// Middleware: AdminAuthenticate (ensures only admin can access)
app.get("/productstobeapproved", AdminAuthenticate, async (req, res) => {
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
});


app.put("/approveproduct/:id", AdminAuthenticate, async (req, res) => {
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
});

app.put("/rejectproduct/:id", AdminAuthenticate, async (req, res) => {
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
});

app.post("/register", async (req, res) => {
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
});

app.post("/login", async (req, res) => {
  try {
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
});

app.post("/updatepassword", async (req, res) => {
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
});

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
app.get("/admin_profile", AdminAuthenticate, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).send("Admin not found");
    return res.status(200).json({ name: admin.name, email: admin.email });
  } catch (err) { 
    console.error(err);
  }});
app.post("/sellproduct", authenticate, async (req, res) => {
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
});

app.get("/mylistings", authenticate, async (req, res) => {
  try {
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).send("User not found");

    const productsWithEmail = user.Products.map(p => ({ ...p.toObject(), email: user.email }));
    return res.status(200).json(productsWithEmail);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
});

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

app.put("/mylistings/updateproduct/:id", authenticate, async (req, res) => {
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
});

app.delete("/mylistings/deleteproduct", authenticate, async (req, res) => {
  try {
    const { password,productId } = req.body;
    const user = await Reco.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });
    const product = user.Products.id(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    product.remove();
    await user.save();
    
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/products", authenticate, async (req, res) => {
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
});

// Root
app.get("/", (req, res) => {
  res.send("Hello world");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
