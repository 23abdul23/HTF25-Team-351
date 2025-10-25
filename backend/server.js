import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { configDotenv } from "dotenv";
import auth from "./routes/auth.js";

configDotenv();

const app = express();

app.use(cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//route opened to allow direct frontend file transfer
import sasRoutes from "./routes/sas.js";
app.use("/api/sas", sasRoutes);

// Routes
app.use("/api/auth", auth);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
});

// MongoDB connection with better error handling
mongoose
  .connect(
    process.env.MONGODB_URI_C || "mongodb://localhost:27017/CBIT_local",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("Mongodb connected");
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("Mongodb error:", err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
