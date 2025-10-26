import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";
import authRoutes from "./routes/auth.js";
import capsuleRoutes from "./routes/capsule.js";
import sasRoutes from "./routes/sas.js";
import profileRoutes from "./routes/profile.js";

configDotenv();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

console.log("FRONTEND_URL:", FRONTEND_URL);

const allowedOrigins = [
  FRONTEND_URL,
  "https://htf-25-team-351.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors()); // handle preflight

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/capsules", capsuleRoutes);
app.use("/api/sas", sasRoutes);
app.use("/api/profile", profileRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const MONGODB_URI =
  process.env.MONGODB_URI_C || "mongodb://localhost:27017/CBIT_local";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// Simple proxy endpoints to avoid CORS when calling third-party API (memsky)
// Frontend should call /api/proxy/auth/* instead of calling memsky directly.
app.post("/api/proxy/auth/login", async (req, res) => {
  try {
    const remote = "https://memsky.azurewebsites.net/api/auth/login";
    const forwardRes = await fetch(remote, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // forward authorization if present
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body || {}),
    });

    const text = await forwardRes.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    res.status(forwardRes.status).send(parsed);
  } catch (err) {
    console.error("Proxy login error:", err);
    res.status(502).json({ error: "Proxy failed", details: String(err) });
  }
});

app.get("/api/proxy/auth/me", async (req, res) => {
  try {
    const remote = "https://memsky.azurewebsites.net/api/auth/me";
    const forwardRes = await fetch(remote, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
    });

    const text = await forwardRes.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    res.status(forwardRes.status).send(parsed);
  } catch (err) {
    console.error("Proxy me error:", err);
    res.status(502).json({ error: "Proxy failed", details: String(err) });
  }
});
