// server.js

// Import dependencies
const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import roadmap templates from separate file
const { roadmaps, genericFallback } = require("./roadmapTemplates");

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: "*" }));

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve static files

// --------------------
// User Schema and Model
// --------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  savedRoadmaps: { type: [String], default: [] },
  savedJobs: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

// --------------------
// Endpoints
// --------------------

// Career Advice Endpoint
app.post("/career-advice", (req, res) => {
  const { careerGoal } = req.body;
  const normalizedGoal = careerGoal.toLowerCase().trim();
  const roadmap = roadmaps[normalizedGoal] || genericFallback;
  res.json({ success: true, roadmap });
});

// Job Search Endpoint
app.post("/job-search", async (req, res) => {
  const { careerGoal, location } = req.body;
  const queryText = location && location.trim() !== "" ? `${careerGoal} in ${location}` : careerGoal;
  const options = {
    method: "GET",
    url: "https://jsearch.p.rapidapi.com/search",
    params: { query: queryText, page: "1", num_pages: "1" },
    headers: {
      "X-RapidAPI-Key": process.env.JSEARCH_API_KEY,
      "X-RapidAPI-Host": process.env.JSEARCH_API_HOST
    }
  };

  try {
    const response = await axios.request(options);
    res.json({ success: true, jobs: response.data.data });
  } catch (error) {
    console.error("Error fetching jobs:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Job search API call failed" });
  }
});

// User Registration
app.post("/register", async (req, res) => {
  const { username, email, password, fullName } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, fullName });
    await user.save();
    res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ success: true, token, user: { username: user.username, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ success: false, error: "No token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(500).json({ success: false, error: "Failed to authenticate token" });
    req.userId = decoded.id;
    next();
  });
};

// Get User Profile (includes saved items)
app.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId, "-password");
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Save Roadmap Endpoint
app.post("/save-roadmap", verifyToken, async (req, res) => {
  const { roadmap } = req.body;
  try {
    await User.findByIdAndUpdate(req.userId, { $push: { savedRoadmaps: roadmap } });
    res.json({ success: true, message: "Roadmap saved" });
  } catch (err) {
    console.error("Save roadmap error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Save Job Endpoint
app.post("/save-job", verifyToken, async (req, res) => {
  const { job } = req.body;
  try {
    await User.findByIdAndUpdate(req.userId, { $push: { savedJobs: job } });
    res.json({ success: true, message: "Job results saved" });
  } catch (err) {
    console.error("Save job error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get Dashboard (saved items)
app.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, savedRoadmaps: user.savedRoadmaps, savedJobs: user.savedJobs });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Clear Dashboard (saved items)
app.post("/clear-dashboard", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $set: { savedRoadmaps: [], savedJobs: [] } });
    res.json({ success: true, message: "Dashboard cleared" });
  } catch (err) {
    console.error("Clear dashboard error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Start the Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
