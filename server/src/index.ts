import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes";

// Load environment variables from the root .env file
dotenv.config();

const app = express();

const { PORT = 5000, NEXTAUTH_URL, MONGO_URI } = process.env;

// Connect to MongoDB
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("🚀 MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
  console.error("MONGO_URI is not defined in the .env file.");
}

// Essential Middleware
app.use(
  cors({
    origin: NEXTAUTH_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
// You can add other routes here if needed

// Start the server
app.listen(PORT, () =>
  console.log(`✅ Backend server running on http://localhost:${PORT}`)
);